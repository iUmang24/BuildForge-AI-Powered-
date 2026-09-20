const crypto = require("crypto");
const pool = require("../config/db");
const razorpay = require("../services/razorpay");
const { success, failure } = require("../utils/error");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { launchBrowser } = require("../utils/puppeteer");
const { generatePDFfromHTML } = require("../services/pdfService");

const { sendEmailTemplate } = require("../services/emailService");
const { imageToBase64Universal } = require("../utils/common");


async function safeSendSuccessEmail(payload) {
    try {
        const result = await sendEmailTemplate({
            to: payload.email,
            from: process.env.EMAIL_USER,
            templateKey: "payment_success",
            variables: {
                fullName: payload.fullName,
                plan: payload.plan,
                originalAmount: payload.originalAmount,
                discountAmount: payload.discountAmount,
                gstAmount: payload.gstAmount,
                finalPaid: payload.finalPaid,
                orderId: payload.orderId,
                paymentId: payload.paymentId,
                dashboardUrl: `${process.env.FRONTEND_URL}/payments`
            }
        });

        if (!result.success) {
            console.error("📧 Success email failed:", result.message);
        }

    } catch (err) {
        console.error("📧 Success email crashed:", err.message);
    }
}

async function safeSendFailureEmail(payload) {
    try {
        const result = await sendEmailTemplate({
            to: payload.email,
            from: process.env.EMAIL_USER,
            templateKey: "payment_failed",
            variables: {
                fullName: payload.fullName,
                plan: payload.plan,
                reason: payload.reason,
                orderId: payload.orderId,
                retryUrl: `${process.env.FRONTEND_URL}/payments`
            }
        });

        if (!result.success) {
            console.error("📧 Failure email failed:", result.message);
        }

    } catch (err) {
        console.error("📧 Failure email crashed:", err.message);
    }
}

/* ================= CREATE ORDER ================= */

exports.createOrder = async (req, res) => {
    try {
        const studentId = req.user.student_id;
        const { plan, coupon_code, manual_start_date, manual_end_date } = req.body; // "training" | "certificate"

        if (plan === "training") {
            const [[paid]] = await pool.query(
                `SELECT training_paid FROM students WHERE id=?`,
                [studentId]
            );

            if (paid.training_paid) {
                return failure(
                    res,
                    "P04",
                    "Training already paid",
                    null,
                    400
                );
            }
        }

        if (plan === "certificate") {
            const [[project]] = await pool.query(
                `SELECT status FROM student_projects WHERE student_id=?`,
                [studentId]
            );

            if (project.status !== "completed") {
                return failure(
                    res,
                    "P06",
                    "Complete training before certificate payment",
                    null,
                    400
                );
            }
        }

        if (plan === "direct_certificate") {
            const [[student]] = await pool.query(
                `SELECT certificate_paid FROM students WHERE id=?`,
                [studentId]
            );

            if (student.certificate_paid) {
                return failure(
                    res,
                    "P10",
                    "Certificate already purchased",
                    null,
                    400
                );
            }
        }

        /* ================= BASE PRICE ================= */

        const [[pricing]] = await pool.query(
            `
  SELECT mrp, gst_rate
  FROM pricing_plans
  WHERE plan_duration=? AND is_active=1
  `,
            [plan]
        );

        if (!pricing) {
            return failure(res, "P07", "Pricing not configured", null, 500);
        }

        const finalMRP = Number(pricing.mrp);
        const GST_RATE = Number(pricing.gst_rate) / 100;

        const originalBase = finalMRP / (1 + GST_RATE);

        let discountAmount = 0;
        let coupon = null;

        /* ================= COUPON VALIDATION ================= */

        if (coupon_code) {
            const [[c]] = await pool.query(
                `
        SELECT *
        FROM coupons
        WHERE code=? AND is_active=1
          AND (expires_at IS NULL OR expires_at > NOW())
        `,
                [coupon_code]
            );

            if (!c) {
                return failure(res, "CP01", "Invalid or expired coupon", null, 400);
            }

            // per-user usage
            const [[used]] = await pool.query(
                `SELECT id FROM coupon_usages WHERE coupon_id=? AND student_id=?`,
                [c.id, studentId]
            );

            if (used) {
                return failure(res, "CP02", "Coupon already used by you", null, 400);
            }

            // global usage
            if (c.usage_type === "once" && c.used_count >= 1) {
                return failure(res, "CP03", "Coupon already used", null, 400);
            }

            if (c.max_uses && c.used_count >= c.max_uses) {
                return failure(res, "CP04", "Coupon usage limit reached", null, 400);
            }

            // calculate discount
            if (c.discount_type === "percent") {
                discountAmount = (originalBase * c.discount_value) / 100;
            } else {
                discountAmount = c.discount_value;
            }

            discountAmount = Math.min(discountAmount, originalBase);
            coupon = c;
        }

        /* ================= FINAL CALCULATION ================= */

        const discountedBaseRaw = originalBase - discountAmount;
        const gstAmountRaw = discountedBaseRaw * GST_RATE;

        // round values only for storage/display
        const discountedBase = Number(discountedBaseRaw.toFixed(2));
        const gstAmount = Number(gstAmountRaw.toFixed(2));

        // calculate final from rounded parts
        let finalPayable = Number((discountedBase + gstAmount).toFixed(2));

        // 🔥 IMPORTANT FIX
        // if no coupon → keep exact MRP
        if (!coupon_code) {
            finalPayable = Number(finalMRP.toFixed(2));
        }

        /* ================= RAZORPAY ORDER ================= */

        const order = await razorpay.orders.create({
            amount: Math.round(finalPayable * 100), // Razorpay needs paise
            currency: "INR",
            receipt: `student_${studentId}_${plan}`,
        });


        /* ================= SAVE TRANSACTION ================= */

        const [result] = await pool.query(
            `
      INSERT INTO payment_transactions
      (
        student_id,
        original_amount,
        discount_amount,
        amount,
        extra_charges,
        final_paid,
        coupon_code,
        razorpay_order_id,
        status,
        plan_duration,
  manual_start_date,
  manual_end_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'created', ?, ?, ?)
      `,
            [
                studentId,
                finalMRP,
                discountAmount,
                discountedBase,
                gstAmount,
                finalPayable,
                coupon_code || null,
                order.id,
                plan,
                plan === "direct_certificate" ? manual_start_date : null,
                plan === "direct_certificate" ? manual_end_date : null,
            ]
        );

        return success(res, "P00", "Order created", {
            orderId: order.id,
            originalAmount: finalMRP,
            baseAmount: discountedBase,
            gstAmount,
            discountAmount,
            finalAmount: finalPayable,
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (err) {
        console.error(err);
        return failure(res, "P99", "Failed to create order", err.message, 500);
    }
};

/* ================= VERIFY PAYMENT ================= */

exports.verifyPayment = async (req, res) => {
    const studentId = req.user.student_id;

    try {

        /* ================= START TRANSACTION (ADDED) ================= */
        await pool.query("START TRANSACTION");

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;



        // ---------- FETCH PAYMENT ----------
        const [[payment]] = await pool.query(
            `
            SELECT *
            FROM payment_transactions
            WHERE razorpay_order_id=? AND student_id=?
            `,
            [razorpay_order_id, studentId]
        );

        if (!payment) {
            await pool.query("ROLLBACK");
            return failure(res, "P03", "Payment record not found", null, 404);
        }

        /* ================= IDEMPOTENCY CHECK (ADDED) ================= */
        if (payment.status === "paid") {
            await pool.query("COMMIT");
            return success(res, "P00", "Payment already verified");
        }

        // ---------- VERIFY SIGNATURE ----------
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        // ---------- INVALID SIGNATURE ----------
        if (expectedSignature !== razorpay_signature) {
            await pool.query(
                `
                UPDATE payment_transactions
                SET status='failed',
                    failure_message='Invalid signature'
                WHERE id=?
                `,
                [payment.id]
            );

            await pool.query("COMMIT");

            // 🔔 EMAIL (NON-BLOCKING)
            const [[student]] = await pool.query(
                `SELECT full_name, email FROM students WHERE id=?`,
                [studentId]
            );

            safeSendFailureEmail({
                email: student.email,
                fullName: student.full_name,
                plan: payment.plan_duration,
                reason: "Invalid payment signature",
                orderId: razorpay_order_id,
            });

            return failure(res, "P02", "Payment verification failed", null, 400);
        }

        // ---------- MARK PAYMENT SUCCESS ----------
        await pool.query(
            `
            UPDATE payment_transactions
            SET status='paid',
                razorpay_payment_id=?,
                razorpay_signature=?
            WHERE id=?
            `,
            [razorpay_payment_id, razorpay_signature, payment.id]
        );

        // ---------- BUSINESS LOGIC ----------
        if (payment.plan_duration === "training") {
            await pool.query(
                `UPDATE students SET training_paid=1 WHERE id=?`,
                [studentId]
            );

            await pool.query(
                `
                UPDATE student_tasks
                SET status='open'
                WHERE student_id=? AND week_number=2
                `,
                [studentId]
            );
        }

        /* ================= CERTIFICATE PURCHASE ================= */

        if (
            payment.plan_duration === "certificate" ||
            payment.plan_duration === "direct_certificate"
        ) {

            // If direct_certificate → mark both paid
            if (payment.plan_duration === "direct_certificate") {


                const [[request]] = await pool.query(
                    `SELECT *
     FROM direct_certificate_requests
     WHERE student_id=?
     ORDER BY id DESC
     LIMIT 1`,
                    [studentId]
                );

                if (!request || request.status !== "approved") {
                    await pool.query("ROLLBACK");
                    return failure(res, "DC07", "Project not approved yet", null, 400);
                }


                await pool.query(
                    `UPDATE student_projects
   SET project_id = 101,
       is_custom_project = 1,
       current_week=8,
       status='completed',
       completed_at = NOW(),
       custom_project_title = ?
   WHERE student_id = ?
   ORDER BY id DESC
   LIMIT 1`,
                    [request.project_name, studentId]
                );
                await pool.query(
                    `UPDATE students 
             SET training_paid=1,
                 certificate_paid=1,
                 enrollment_type='direct_certificate'
             WHERE id=?`,
                    [studentId]
                );

                await pool.query(
                    `UPDATE student_tasks
             SET status='reviewed',
                 score=10
             WHERE student_id=?`,
                    [studentId]
                );

            } else {
                await pool.query(
                    `UPDATE students 
             SET certificate_paid=1
             WHERE id=?`,
                    [studentId]
                );
            }

            /* ================= CREATE CERTIFICATE RECORD ================= */

            // const [[student]] = await pool.query(
            //     `SELECT s.program, p.title FROM students s join projects p on p.id = s.program WHERE s.id=?`,
            //     [studentId]
            // );

            const [[projectInfo]] = await pool.query(
                `
            SELECT 
                CASE 
                WHEN sp.is_custom_project = 1 
                THEN sp.custom_project_title
                ELSE p.title
                END AS final_title
            FROM student_projects sp
            JOIN projects p ON p.id = sp.project_id
            WHERE sp.student_id=?
            ORDER BY sp.id DESC
            LIMIT 1
            `,
                [studentId]
            );

            const projectTitle = projectInfo.final_title;

            // 🔹 Get project dates
            const [[project]] = await pool.query(
                `SELECT start_date, completed_at, expected_end_date
   FROM student_projects
   WHERE student_id=? AND status='completed'
   ORDER BY id DESC LIMIT 1`,
                [studentId]
            );

            const [[scoreRow]] = await pool.query(
                `SELECT ROUND(AVG(score),1) as final_score
         FROM student_tasks
         WHERE student_id=? AND status='reviewed'`,
                [studentId]
            );

            const token = crypto.randomUUID();

            /* ================= FINANCIAL YEAR ================= */

            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;

            let fyStart, fyEnd;

            if (month >= 4) {
                fyStart = year;
                fyEnd = year + 1;
            } else {
                fyStart = year - 1;
                fyEnd = year;
            }

            const financialYear = `${fyStart}-${String(fyEnd).slice(2)}`;

            const certificateId =
                `CERT/${financialYear}/${String(studentId).padStart(5, "0")}`;

            const [[existingCert]] = await pool.query(
                `SELECT id FROM certificates WHERE student_id=?`,
                [studentId]
            );

            // 🔥 Issue date = expected_end_date + 1 day
            if (!existingCert) {
                if (payment.plan_duration === "direct_certificate") {


                    await pool.query(
                        `INSERT INTO certificates
      (student_id, certificate_id, program,
       start_date, end_date, issue_date,
       final_score, verification_token,
       is_manual_issue)
       VALUES (?, ?, ?, ?, ?, 
         DATE_ADD(?, INTERVAL 1 DAY),
         ?, ?, 1
       )`,
                        [
                            studentId,
                            certificateId,
                            projectTitle,
                            project.start_date,
                            project.expected_end_date,
                            project.expected_end_date,
                            null,
                            token
                        ]
                    );

                } else {

                    await pool.query(
                        `INSERT INTO certificates
      (student_id, certificate_id, program,
       start_date, end_date, issue_date,
       final_score, verification_token,
       is_manual_issue)
       VALUES (?, ?, ?, ?, ?, 
         DATE_ADD(?, INTERVAL 1 DAY),
         ?, ?, 0
       )`,
                        [
                            studentId,
                            certificateId,
                            projectTitle,
                            project.start_date,
                            project.expected_end_date,
                            project.expected_end_date,
                            scoreRow.final_score || 0,
                            token
                        ]
                    );

                }
            }
        }

        // ---------- COUPON USAGE ----------
        if (payment.coupon_code) {
            const [[coupon]] = await pool.query(
                `SELECT id FROM coupons WHERE code=?`,
                [payment.coupon_code]
            );

            if (coupon) {
                await pool.query(
                    `
                    INSERT INTO coupon_usages (coupon_id, student_id, payment_id)
                    VALUES (?, ?, ?)
                    `,
                    [coupon.id, studentId, payment.id]
                );

                await pool.query(
                    `
                    UPDATE coupons
                    SET used_count = used_count + 1
                    WHERE id=?
                    `,
                    [coupon.id]
                );
            }
        }

        /* ================= COMMIT (ADDED) ================= */
        await pool.query("COMMIT");

        // ---------- SUCCESS EMAIL (NON-BLOCKING) ----------
        const [[student]] = await pool.query(
            `SELECT full_name, email FROM students WHERE id=?`,
            [studentId]
        );

        if (payment.plan_duration === "training") {
            safeSendOfferLetterEmail({
                studentId,
                templateKey: "offer_letter"
            });
        }

        if (payment.plan_duration === "direct_certificate") {
            safeSendOfferLetterEmail({
                studentId,
                templateKey: "offer_letter_direct"
            });
        }

        safeSendSuccessEmail({
            email: student.email,
            fullName: student.full_name,
            plan: payment.plan_duration,
            originalAmount: payment.original_amount,
            discountAmount: payment.discount_amount,
            gstAmount: payment.extra_charges,
            finalPaid: payment.final_paid,
            orderId: payment.razorpay_order_id,
            paymentId: razorpay_payment_id,
        });

        return success(res, "P00", "Payment verified successfully");
    } catch (err) {

        /* ================= ROLLBACK (ADDED) ================= */
        await pool.query("ROLLBACK");

        console.error("❌ Payment verification error:", err);

        return failure(
            res,
            "P99",
            "Payment verification failed",
            err.message,
            500
        );
    }
};

exports.recoverPayment = async (req, res) => {

    const studentId = req.user.student_id;
    const { plan } = req.body;

    try {

        const [[payment]] = await pool.query(
            `
            SELECT *
            FROM payment_transactions
            WHERE student_id=? AND plan_duration=?
            ORDER BY id DESC
            LIMIT 1
            `,
            [studentId, plan]
        );

        if (!payment) {
            return failure(res, "P03", "No payment found");
        }

        if (payment.status === "paid") {
            return success(res, "P00", "Payment already verified");
        }

        // fetch payment from Razorpay
        const razorpayPayment = await razorpay.payments.fetch(
            payment.razorpay_payment_id
        );

        if (razorpayPayment.status !== "captured") {
            return failure(res, "P04", "Payment not captured yet");
        }

        // call existing verification logic
        req.body = {
            razorpay_order_id: payment.razorpay_order_id,
            razorpay_payment_id: payment.razorpay_payment_id,
            razorpay_signature: payment.razorpay_signature
        };

        return exports.verifyPayment(req, res);

    } catch (err) {

        console.error("Recover payment error:", err);

        return failure(
            res,
            "P99",
            "Recovery failed",
            err.message,
            500
        );
    }
};

async function safeSendOfferLetterEmail({ studentId, templateKey }) {
    try {

        /* 1️⃣ Get student */
        const [[student]] = await pool.query(
            `SELECT full_name, email FROM students WHERE id=?`,
            [studentId]
        );

        if (!student) return;

        /* 2️⃣ Get project info */
        const [[project]] = await pool.query(
            `
      SELECT 
        CASE 
          WHEN sp.is_custom_project = 1 
          THEN sp.custom_project_title
          ELSE p.title
        END AS title,
        p.duration_weeks,
        sp.start_date
      FROM student_projects sp
      JOIN projects p ON p.id = sp.project_id
      WHERE sp.student_id=?
      ORDER BY sp.id DESC
      LIMIT 1
      `,
            [studentId]
        );

        /* 3️⃣ Get company info */
        const [[company]] = await pool.query(
            `SELECT * FROM company_settings LIMIT 1`
        );

        /* 4️⃣ Get director */
        const [[managingDirector]] = await pool.query(`
          SELECT director_name, designation, signature_image
          FROM company_directors
          WHERE company_id = ?
          AND is_active = 1
          AND designation = 'Director'
          LIMIT 1
        `, [company.id]);

        /* 5️⃣ Load Offer Letter Template */
        const [[template]] = await pool.query(
            `
      SELECT html_content
      FROM document_templates
      WHERE template_key=?
      AND is_active=1
      LIMIT 1
      `, [templateKey]
        );

        if (!template) return;

        const BASE_URL = process.env.FRONTEND_URL;

        const productLogoBase64 = company.product_logo
            ? await imageToBase64Universal(company.product_logo)
            : "";

        const parentLogoBase64 = company.parent_logo
            ? await imageToBase64Universal(company.parent_logo)
            : "";

        const sealBase64 = company.company_seal
            ? await imageToBase64Universal(company.company_seal)
            : "";

        const signatureBase64 =
            managingDirector && managingDirector.signature_image
                ? await imageToBase64Universal(managingDirector.signature_image)
                : "";

        let html = template.html_content;

        html = html
            .replace("{{productLogo}}", productLogoBase64)
            .replace("{{parentLogo}}", parentLogoBase64)
            .replace("{{companySeal}}", sealBase64)
            .replace("{{productName}}", company.product_name)
            .replace("{{studentName}}", student.full_name)
            .replace("{{program}}", project.title)
            .replace("{{duration}}", project.duration_weeks)
            .replace("{{startDate}}", project.start_date)
            .replace("{{date}}", new Date().toLocaleDateString())
            .replace("{{signatureImage}}", signatureBase64)
            .replace("{{signatoryName}}",
                managingDirector ? managingDirector.director_name : ""
            )
            .replace("{{designation}}",
                managingDirector ? managingDirector.designation : ""
            );

        /* 6️⃣ Generate PDF */
        const pdf = await generatePDFfromHTML(html);

        /* 7️⃣ Send Email With Attachment */
        await sendEmailTemplate({
            to: student.email,
            templateKey: templateKey,
            variables: {
                fullName: student.full_name,
                companyName: company.product_name
            },
            attachments: [
                {
                    filename: "Offer-Letter.pdf",
                    content: pdf
                }
            ]
        });

    } catch (err) {
        console.error("Offer letter email failed:", err.message);
        // 🔥 DO NOT THROW
    }
}

exports.previewPrice = async (req, res) => {
    try {
        const studentId = req.user.student_id;
        const { plan, coupon_code } = req.body;

        /* ================= BASE MRP ================= */

        const [[pricing]] = await pool.query(
            `
  SELECT mrp, gst_rate
  FROM pricing_plans
  WHERE plan_duration=? AND is_active=1
  `,
            [plan]
        );

        if (!pricing) {
            return failure(res, "P07", "Pricing not configured", null, 500);
        }

        // Always round at the very end
        const finalMRP = Number(pricing.mrp);
        const GST_RATE = Number(pricing.gst_rate) / 100;

        // remove GST from MRP (without rounding yet)
        const originalBase = finalMRP / (1 + GST_RATE);

        let discountAmount = 0;

        /* ================= COUPON VALIDATION ================= */

        if (coupon_code) {
            const [[coupon]] = await pool.query(
                `
    SELECT *
    FROM coupons
    WHERE code=? AND is_active=1
      AND (expires_at IS NULL OR expires_at > NOW())
    `,
                [coupon_code]
            );

            if (!coupon) {
                return failure(res, "CP01", "Invalid or expired coupon", null, 400);
            }

            if (coupon.discount_type === "percent") {
                discountAmount = (originalBase * coupon.discount_value) / 100;
            } else {
                discountAmount = coupon.discount_value;
            }

            discountAmount = Math.min(discountAmount, originalBase);
        }

        /* ================= FINAL CALC ================= */

        // calculate discounted base WITHOUT rounding yet
        const discountedBaseRaw = originalBase - discountAmount;

        // GST on discounted base
        const gstAmountRaw = discountedBaseRaw * GST_RATE;

        // final amount (IMPORTANT: round only here)
        const finalAmount = Number(
            (discountedBaseRaw + gstAmountRaw).toFixed(2)
        );

        // Now round display values
        const discountedBase = Number(discountedBaseRaw.toFixed(2));
        const gstAmount = Number(gstAmountRaw.toFixed(2));
        discountAmount = Number(discountAmount.toFixed(2));

        // 🔥 CRITICAL FIX:
        // If no coupon → force exact MRP
        const payable =
            !coupon_code
                ? Number(finalMRP.toFixed(2))
                : finalAmount;

        return success(res, "P00", "Price preview", {
            originalAmount: finalMRP,
            baseAmount: discountedBase,
            gstAmount,
            discountAmount,
            finalAmount: payable,
        });
    } catch (err) {
        console.error(err);
        return failure(res, "P99", "Preview failed", err.message, 500);
    }
};

exports.previewAllPrices = async (req, res) => {
    try {
        const { coupon_code } = req.body;

        const plans = ["training", "certificate", "direct_certificate"];

        const results = {};

        for (const plan of plans) {
            try {
                results[plan] = await calculatePrice(plan, coupon_code);
            } catch (err) {
                results[plan] = null;
            }
        }

        return success(res, "P00", "All price previews", results);

    } catch (err) {
        return failure(res, "P99", "Preview failed", err.message, 500);
    }
};


exports.previewPrice = async (req, res) => {
    try {
        const studentId = req.user.student_id;
        const { plan, coupon_code } = req.body;

        /* ================= BASE MRP ================= */

        const [[pricing]] = await pool.query(
            `
  SELECT mrp, gst_rate
  FROM pricing_plans
  WHERE plan_duration=? AND is_active=1
  `,
            [plan]
        );

        if (!pricing) {
            return failure(res, "P07", "Pricing not configured", null, 500);
        }

        // Always round at the very end
        const finalMRP = Number(pricing.mrp);
        const GST_RATE = Number(pricing.gst_rate) / 100;

        // remove GST from MRP (without rounding yet)
        const originalBase = finalMRP / (1 + GST_RATE);

        let discountAmount = 0;

        /* ================= COUPON VALIDATION ================= */

        if (coupon_code) {
            const [[coupon]] = await pool.query(
                `
    SELECT *
    FROM coupons
    WHERE code=? AND is_active=1
      AND (expires_at IS NULL OR expires_at > NOW())
    `,
                [coupon_code]
            );

            if (!coupon) {
                return failure(res, "CP01", "Invalid or expired coupon", null, 400);
            }

            if (coupon.discount_type === "percent") {
                discountAmount = (originalBase * coupon.discount_value) / 100;
            } else {
                discountAmount = coupon.discount_value;
            }

            discountAmount = Math.min(discountAmount, originalBase);
        }

        /* ================= FINAL CALC ================= */

        // calculate discounted base WITHOUT rounding yet
        const discountedBaseRaw = originalBase - discountAmount;

        // GST on discounted base
        const gstAmountRaw = discountedBaseRaw * GST_RATE;

        // final amount (IMPORTANT: round only here)
        const finalAmount = Number(
            (discountedBaseRaw + gstAmountRaw).toFixed(2)
        );

        // Now round display values
        const discountedBase = Number(discountedBaseRaw.toFixed(2));
        const gstAmount = Number(gstAmountRaw.toFixed(2));
        discountAmount = Number(discountAmount.toFixed(2));

        // 🔥 CRITICAL FIX:
        // If no coupon → force exact MRP
        const payable =
            !coupon_code
                ? Number(finalMRP.toFixed(2))
                : finalAmount;

        return success(res, "P00", "Price preview", {
            originalAmount: finalMRP,
            baseAmount: discountedBase,
            gstAmount,
            discountAmount,
            finalAmount: payable,
        });
    } catch (err) {
        console.error(err);
        return failure(res, "P99", "Preview failed", err.message, 500);
    }
};

exports.downloadInvoicehtmlpdf = async (req, res) => {
    try {
        const studentId = req.user.student_id;
        const { paymentId } = req.params;
        const BASE_URL = process.env.FRONTEND_URL;

        const [[p]] = await pool.query(
            `
      SELECT pt.*, s.full_name, s.email
      FROM payment_transactions pt
      JOIN students s ON s.id = pt.student_id
      WHERE pt.id=? AND pt.student_id=? AND pt.status='paid'
      `,
            [paymentId, studentId]
        );

        if (!p) {
            return failure(res, "P08", "Invoice not found", null, 404);
        }

        // ---------- COMPANY ----------
        const [[company]] = await pool.query(`
  SELECT *
  FROM company_settings
  LIMIT 1
`);

        if (!company) {
            return failure(res, "P11", "Company settings missing", null, 500);
        }

        // ---------- DIRECTORS ----------
        const [directors] = await pool.query(`
  SELECT director_name, designation, signature_image
  FROM company_directors
  WHERE company_id = ?
  AND is_active = 1
  AND show_on_invoice = 1
  ORDER BY display_order ASC
`, [company.id]);

        //         let directorsHtml = "";

        //         if (directors.length > 0) {
        //             const directorBlocks = await Promise.all(
        //                 directors.map(async (d) => {
        //                     const signatureBase64 = await imageToBase64Universal(d.signature_image);

        //                     return `
        //         <div style="text-align:center;">
        //           <img src="${signatureBase64}" style="height:60px;" /><br/>
        //           <strong>${d.director_name}</strong><br/>
        //           ${d.designation}
        //         </div>
        //       `;
        //                 })
        //             );

        //             directorsHtml = `
        //     <div style="display:flex; justify-content:flex-end; gap:40px;">
        //       ${directorBlocks.join("")}
        //     </div>
        //   `;
        //         }
        let directorsHtml = "";

        if (directors.length > 0) {
            const d = directors[0];

            const signatureBase64 = await imageToBase64Universal(
                d.signature_image
            );

            directorsHtml = `
                <div style="text-align:right;">
                <img src="${signatureBase64}" style="height:60px;" /><br/>
                <strong>${d.director_name}</strong><br/>
                ${d.designation}
                </div>
            `;
        }

        // ---------- CALCULATIONS ----------
        const cgst = (p.extra_charges / 2).toFixed(2);
        const sgst = (p.extra_charges / 2).toFixed(2);
        const discount =
            Number(p.original_amount) - Number(p.amount);

        // ---------- LOAD HTML ----------
        // ---------- LOAD TEMPLATE FROM DB ----------
        const [[template]] = await pool.query(
            `
  SELECT html_content
  FROM document_templates
  WHERE template_key = 'gst_invoice'
  AND is_active = 1
  LIMIT 1
  `
        );

        if (!template) {
            return failure(res, "P10", "Invoice template not configured", null, 500);
        }

        let html = template.html_content;

        const productLogo = await imageToBase64Universal(company.product_logo);
        const parentLogo = await imageToBase64Universal(company.parent_logo);
        const companySeal = await imageToBase64Universal(company.company_seal);

        html = html
            .replace("{{invoiceNo}}", `INV-${p.id}`)
            .replace("{{date}}", new Date(p.created_at).toLocaleDateString())
            .replace("{{name}}", p.full_name)
            .replace("{{email}}", p.email)
            .replace(
                "{{plan}}",
                p.plan_duration === "direct_certificate"
                    ? "EVALUATION CERTIFICATE"
                    : p.plan_duration.toUpperCase()
            )
            .replace("{{originalAmount}}", Number(p.original_amount).toFixed(2))
            .replace("{{originalAmount}}", Number(p.original_amount).toFixed(2))
            .replace("{{subtotal}}", Number(p.amount).toFixed(2))
            .replace("{{cgst}}", cgst)
            .replace("{{sgst}}", sgst)
            .replace("{{total}}", Number(p.final_paid).toFixed(2))
            // 🔥 COMPANY
            .replace("{{companyName}}", company.legal_company_name)
            .replace("{{productName}}", company.product_name)
            .replace("{{registeredAddress}}", company.registered_address)
            .replace("{{gstin}}", company.gstin)
            .replace("{{hsn}}", company.hsn)
            // 🔥 FIXED IMAGE URLS
            .replace("{{productLogo}}", productLogo)
            .replace("{{parentLogo}}", parentLogo)
            .replace("{{companySeal}}", companySeal)

            // 🔥 DIRECTORS
            .replace("{{directorsBlock}}", directorsHtml)
            .replace(
                "{{discountRow}}",
                p.coupon_code
                    ? `<tr>
              <td colspan="4" class="right">Discount (${p.coupon_code})</td>
              <td class="right">-${Number(p.discount_amount).toFixed(2)}</td>
            </tr>`
                    : ""
            );

        // ---------- PDF (LAMBDA SAFE) ----------
        const pdf = await generatePDFfromHTML(html);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=invoice_${p.id}.pdf`
        );

        res.send(pdf);
    } catch (err) {
        console.error(err);
        return failure(res, "P99", "Invoice generation failed", err.message, 500);
    }
};