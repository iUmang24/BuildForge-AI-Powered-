const pool = require("../config/db");
const nodemailer = require("nodemailer");
const Handlebars = require("handlebars");
const logger = require("../utils/logger");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS
//   }
// });

const transporter = nodemailer.createTransport({
  host: "smtpout.secureserver.net",   // GoDaddy SMTP
  port: 465,
  secure: true, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,     // admin@buildforge.net.in
    pass: process.env.EMAIL_PASS      // GoDaddy email password
  }
});

exports.sendEmailTemplate = async ({
  to,
  templateKey,
  variables = {},
  from = process.env.EMAIL_USER,
  attachments = []
}) => {

  try {

    const [rows] = await pool.query(
      "SELECT subject, body FROM email_templates WHERE template_key = ? AND is_active = 1",
      [templateKey]
    );

    if (!rows.length) {
      logger.error(`Template not found: ${templateKey}`);
      return failure(null, "E01", "Email template not found");
    }

    const { subject, body } = rows[0];

    const compiledSubject = Handlebars.compile(subject);
    const compiledBody = Handlebars.compile(body);

    const finalSubject = compiledSubject(variables);
    const finalHtml = compiledBody(variables);

    await transporter.sendMail({
      to,
      from,
      subject: finalSubject,
      html: finalHtml,
      attachments
    });

    logger.info(`Email sent | Template: ${templateKey} | To: ${to}`);

    return {
      success: true,
      message: "Email sent successfully"
    };

  } catch (error) {

    logger.error(`Email failed | Template: ${templateKey} | Error: ${error.message}`);

    return {
      success: false,
      message: "Email sending failed",
      error: error.message
    };
  }
};

// exports.sendOtpEmail = async (email, otp, type) => {

//   let subject = "OTP Code";

//   if (type === "verify") subject = "Verify Your Email";
//   if (type === "reset") subject = "Password Reset OTP";
//   if (type === "login") subject = "Login OTP";

//   await transporter.sendMail({
//     to: email,
//     from: process.env.EMAIL_USER,
//     subject,
//     html: `
//       <h2>Your OTP: ${otp}</h2>
//       <p>This OTP expires in 5 minutes.</p>
//     `
//   });
// };


// exports.sendWelcomeEmail = async ({ email, fullName, projectTitle }) => {

//   await transporter.sendMail({
//     to: email,
//     from: process.env.EMAIL_USER,
//     subject: "🎉 Welcome to BuildForge Internship",

//     html: `
//       <div style="font-family:Arial;padding:20px">

//         <h2>Welcome ${fullName} 👋</h2>

//         <p>
//           Congratulations! Your registration for the internship has been successful.
//         </p>

//         // <p>
//         //   <strong>Selected Track:</strong> ${projectTitle}
//         // </p>

//         <p>
//           You can now login to your dashboard and start your internship journey.
//         </p>

//         <br/>

//         <a href="${process.env.FRONTEND_URL}/login"
//            style="
//             background:#6366f1;
//             color:white;
//             padding:12px 20px;
//             border-radius:6px;
//             text-decoration:none;
//             display:inline-block;
//            "
//         >
//           Go To Dashboard
//         </a>

//         <br/><br/>

//         <p style="font-size:12px;color:#777">
//           If you did not register, please ignore this email.
//         </p>

//       </div>
//     `
//   });
// };

// exports.sendFinalSubmissionEmail = async ({ email, fullName }) => {
//   /* ================= STUDENT EMAIL ================= */

//   await transporter.sendMail({
//     to: email,
//     from: process.env.EMAIL_USER,
//     subject: "Final Project Submitted – BuildForge",

//     html: `
//       <div style="font-family:Arial;padding:20px;line-height:1.6">

//         <h2>Congratulations ${fullName}! 🎉</h2>

//         <p>
//           Your <strong>final project (Week 8)</strong> has been successfully submitted.
//         </p>

//         <p>
//           Our team is now reviewing your submission.
//           This process may take up to <strong>24 hours</strong>.
//         </p>

//         <br/>

//         <a href="${process.env.FRONTEND_URL}/dashboard"
//            style="background:#16a34a;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
//           View Dashboard
//         </a>

//       </div>
//     `
//   });


//   /* ================= ADMIN EMAIL ================= */

//   await transporter.sendMail({
//     to: process.env.EMAIL_USER,
//     from: process.env.EMAIL_USER,
//     subject: `Student ${fullName} submitted final project`,

//     html: `
//       <div style="font-family:Arial;padding:20px;line-height:1.6">

//         <h2>New Final Submission 🚀</h2>

//         <p>
//           <strong>${fullName}</strong> has submitted their final project (Week 8).
//         </p>

//         <p>
//           Please review the submission from the admin dashboard.
//         </p>

//         <a href="${process.env.FRONTEND_URL}/admin/submissions"
//            style="background:#2563eb;color:white;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
//           Review Now
//         </a>

//       </div>
//     `
//   });
// };

// exports.sendPaymentSuccessEmail = async ({
//   email,
//   fullName,
//   plan,
//   originalAmount,
//   discountAmount,
//   gstAmount,
//   finalPaid,
//   orderId,
//   paymentId,
// }) => {
//   await transporter.sendMail({
//     to: email,
//     from: process.env.EMAIL_USER,
//     subject: "✅ Payment Successful – BuildForge",

//     html: `
//       <div style="font-family:Arial;padding:20px;line-height:1.6">
//         <h2>Payment Successful 🎉</h2>

//         <p>Hi ${fullName},</p>

//         <p>Your payment for <strong>${plan.toUpperCase()}</strong> has been completed successfully.</p>

//         <table cellpadding="6" cellspacing="0">
//           <tr><td>Original Price</td><td>₹${originalAmount}</td></tr>
//           <tr><td>Discount</td><td>-₹${discountAmount}</td></tr>
//           <tr><td>GST</td><td>₹${gstAmount}</td></tr>
//           <tr><td><strong>Total Paid</strong></td><td><strong>₹${finalPaid}</strong></td></tr>
//         </table>

//         <p>
//           <strong>Order ID:</strong> ${orderId}<br/>
//           <strong>Payment ID:</strong> ${paymentId}
//         </p>

//         <br/>

//         <a href="${process.env.FRONTEND_URL}/payments"
//            style="
//             background:#16a34a;
//             color:white;
//             padding:12px 20px;
//             border-radius:6px;
//             text-decoration:none;
//             display:inline-block;
//            ">
//           Go to Dashboard
//         </a>

//         <br/><br/>

//         <p style="font-size:12px;color:#777">
//           Thank you for choosing BuildForge 🚀
//         </p>
//       </div>
//     `
//   });
// };


// exports.sendPaymentFailureEmail = async ({
//   email,
//   fullName,
//   plan,
//   reason,
//   orderId,
// }) => {
//   await transporter.sendMail({
//     to: email,
//     from: process.env.EMAIL_USER,
//     subject: "❌ Payment Failed – BuildForge",

//     html: `
//       <div style="font-family:Arial;padding:20px;line-height:1.6">
//         <h2>Payment Failed ❌</h2>

//         <p>Hi ${fullName},</p>

//         <p>
//           Unfortunately, your payment for <strong>${plan.toUpperCase()}</strong>
//           could not be completed.
//         </p>

//         <p>
//           <strong>Reason:</strong> ${reason}
//         </p>

//         <p>
//           <strong>Order ID:</strong> ${orderId}
//         </p>

//         <br/>

//         <a href="${process.env.FRONTEND_URL}/payments"
//            style="
//             background:#dc2626;
//             color:white;
//             padding:12px 20px;
//             border-radius:6px;
//             text-decoration:none;
//             display:inline-block;
//            ">
//           Try Again
//         </a>

//         <br/><br/>

//         <p style="font-size:12px;color:#777">
//           If the amount was deducted, it will be auto-refunded within 3–5 business days.
//         </p>
//       </div>
//     `
//   });
// };

// exports.sendFinalApprovedEmail = async ({
//   email,
//   fullName,
//   feedback,
// }) => {
//   await transporter.sendMail({
//     to: email,
//     from: process.env.EMAIL_USER,
//     subject: "🎓 Final Project Approved – BuildForge",

//     html: `
//       <div style="font-family:Arial;padding:20px;line-height:1.6">
//         <h2>Congratulations ${fullName}! 🎉</h2>

//         <p>
//           Your <strong>final project</strong> has been successfully approved by our review team.
//         </p>

//         <p>
//           Reviewer Feedback:
//         </p>

//         <div style="background:#f3f4f6;padding:12px;border-radius:6px;">
//           ${feedback}
//         </div>

//         <br/>

//         <p>
//           You may now proceed to download your internship certificate
//           from your dashboard.
//         </p>

//         <br/>

//         <a href="${process.env.FRONTEND_URL}/dashboard"
//            style="
//             background:#16a34a;
//             color:white;
//             padding:12px 20px;
//             border-radius:6px;
//             text-decoration:none;
//             display:inline-block;
//            ">
//           Go To Dashboard
//         </a>

//         <br/><br/>

//         <p style="font-size:12px;color:#777">
//           Congratulations on completing your internship 🚀
//         </p>
//       </div>
//     `
//   });
// };

// exports.sendFinalRejectedEmail = async ({
//   email,
//   fullName,
//   feedback,
// }) => {
//   await transporter.sendMail({
//     to: email,
//     from: process.env.EMAIL_USER,
//     subject: "Final Project Review Update – BuildForge",

//     html: `
//       <div style="font-family:Arial;padding:20px;line-height:1.6">
//         <h2>Project Review Update</h2>

//         <p>Hi ${fullName},</p>

//         <p>
//           Your final project has been reviewed.
//           Unfortunately, it requires some improvements before approval.
//         </p>

//         <p>
//           Reviewer Feedback:
//         </p>

//         <div style="background:#fef2f2;padding:12px;border-radius:6px;">
//           ${feedback}
//         </div>

//         <br/>

//         <p>
//           Please review the feedback carefully,
//           make necessary improvements, and resubmit your project.
//         </p>

//         <br/>

//         <a href="${process.env.FRONTEND_URL}/dashboard"
//            style="
//             background:#dc2626;
//             color:white;
//             padding:12px 20px;
//             border-radius:6px;
//             text-decoration:none;
//             display:inline-block;
//            ">
//           Go To Dashboard
//         </a>

//         <br/><br/>

//         <p style="font-size:12px;color:#777">
//           We're here to help you succeed 💪
//         </p>
//       </div>
//     `
//   });
// };

// exports.sendSupportCreatedEmail = async ({
//   email,
//   fullName,
//   subject,
//   message,
// }) => {
//   /* ================= STUDENT EMAIL ================= */

//   await transporter.sendMail({
//     to: email,
//     from: process.env.EMAIL_USER,
//     subject: "📩 Support Ticket Created – BuildForge",

//     html: `
//       <div style="font-family:Arial;padding:20px;line-height:1.6">
//         <h2>Hello ${fullName} 👋</h2>

//         <p>Your support ticket has been successfully created.</p>

//         <p><strong>Subject:</strong> ${subject}</p>

//         <p>Our team will respond shortly.</p>

//         <a href="${process.env.FRONTEND_URL}/dashboard/help"
//            style="background:#6366f1;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">
//           View Ticket
//         </a>
//       </div>
//     `,
//   });

//   /* ================= ADMIN EMAIL ================= */

//   await transporter.sendMail({
//     to: process.env.EMAIL_ADMIN, // admin email
//     from: process.env.EMAIL_USER,
//     subject: `New Support Ticket from ${fullName}`,

//     html: `
//       <div style="font-family:Arial;padding:20px;line-height:1.6">
//         <h2>New Support Ticket 🚀</h2>

//         <p><strong>Student:</strong> ${fullName}</p>
//         <p><strong>Email:</strong> ${email}</p>
//         <p><strong>Subject:</strong> ${subject}</p>

//         <p><strong>Message:</strong></p>

//         <div style="background:#f3f4f6;padding:12px;border-radius:6px;">
//           ${message}
//         </div>

//         <br/>

//         <a href="${process.env.FRONTEND_URL}/admin/support"
//            style="background:#2563eb;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">
//           View in Admin Panel
//         </a>
//       </div>
//     `,
//   });
// };

// exports.sendSupportStudentReplyEmail = async ({
//   studentName,
//   subject,
//   message,
// }) => {
//   await transporter.sendMail({
//     to: process.env.EMAIL_ADMIN, // admin email
//     from: process.env.EMAIL_USER,
//     subject: `New Support Reply from ${studentName}`,

//     html: `
//       <div style="font-family:Arial;padding:20px">
//         <h3>New Student Reply</h3>

//         <p><strong>Subject:</strong> ${subject}</p>

//         <div style="background:#f3f4f6;padding:10px;border-radius:6px;">
//           ${message}
//         </div>

//         <br/>

//         <a href="${process.env.FRONTEND_URL}/admin/support"
//            style="background:#2563eb;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">
//           View in Admin Panel
//         </a>
//       </div>
//     `,
//   });
// };

// exports.sendSupportAdminReplyEmail = async ({
//   email,
//   fullName,
//   subject,
//   message,
// }) => {
//   await transporter.sendMail({
//     to: email,
//     from: process.env.EMAIL_ADMIN,
//     subject: "💬 Support Team Replied – BuildForge",

//     html: `
//       <div style="font-family:Arial;padding:20px">
//         <h3>Hello ${fullName},</h3>

//         <p>We replied to your ticket:</p>

//         <p><strong>${subject}</strong></p>

//         <div style="background:#f3f4f6;padding:10px;border-radius:6px;">
//           ${message}
//         </div>

//         <br/>

//         <a href="${process.env.FRONTEND_URL}/dashboard/help"
//            style="background:#16a34a;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">
//           View Reply
//         </a>
//       </div>
//     `,
//   });
// };

// exports.sendSupportClosedEmail = async ({
//   email,
//   fullName,
//   subject,
// }) => {
//   await transporter.sendMail({
//     to: email,
//     from: process.env.EMAIL_ADMIN,
//     subject: `✅ Support Ticket Closed – ${subject}`,

//     html: `
//       <div style="font-family:Arial;padding:20px;line-height:1.6">
//         <h2>Hello ${fullName}</h2>

//         <p>Your support ticket has been marked as <strong>closed</strong>.</p>

//         <p><strong>Subject:</strong> ${subject}</p>

//         <p>If you still need help, you can create a new support request anytime.</p>

//         <a href="${process.env.FRONTEND_URL}/dashboard/help"
//            style="background:#16a34a;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">
//           Go To Help Center
//         </a>
//       </div>
//     `,
//   });
// };

// exports.sendStudentFeedbackEmail = async ({
//   studentName,
//   studentEmail,
//   message,
// }) => {
//   await transporter.sendMail({
//     to: process.env.EMAIL_USER, // company email
//     from: process.env.EMAIL_USER,
//     subject: `📢 New Student Feedback – ${studentName}`,

//     html: `
//       <div style="font-family:Arial;padding:20px;line-height:1.6">
//         <h2>New Feedback Received</h2>

//         <p><strong>Student Name:</strong> ${studentName}</p>
//         <p><strong>Student Email:</strong> ${studentEmail}</p>

//         <hr/>

//         <p><strong>Feedback Message:</strong></p>

//         <div style="background:#f3f4f6;padding:12px;border-radius:6px;">
//           ${message}
//         </div>

//         <br/>
//         <p style="font-size:12px;color:#777">
//           This email was generated automatically from BuildForge platform.
//         </p>
//       </div>
//     `,
//   });
// };