const pool = require("../config/db");
const bcrypt = require("bcrypt");
const env = require("../config/env");
const logger = require("../utils/logger");
const { success, failure } = require("../utils/error");
const { refreshCookieOptions } = require("../utils/cookies");
const { sendEmailTemplate } = require("../services/emailService");
const { verifySubmissionByWeek } = require("../services/submissionVerifier");
const { generatePDFfromHTML } = require("../services/pdfService");
const QRCode = require("qrcode");
const { addWorkingDays } = require("../utils/workingdate");
const { toTitleCase, imageToBase64Universal, isValidGithubRepo } = require("../utils/common");
const { GREAT_VIBES_FONT } = require("../utils/fonts");

const fs = require("fs");
const path = require("path");

const isVercel =
  process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;

const puppeteer = isVercel
  ? require("puppeteer-core")
  : require("puppeteer");

const chromium = isVercel
  ? require("@sparticuz/chromium")
  : null;

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");


exports.createStudent = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      state,
      university_id,
      college_id,
      project_id,
      github_username,
      source,
      custom_project_title,
      is_custom_project,
    } = req.body;

    /* ================= VALIDATION ================= */

    if (
      !full_name ||
      !email ||
      !github_username ||
      !password ||
      !state ||
      !college_id ||
      !project_id
    ) {
      return failure(res, "S01", "Required fields missing", null, 400);
    }

    /* ================= CHECK EXISTING ================= */

    const [existing] = await pool.query(
      "SELECT id FROM students WHERE email = ?",
      [email]
    );

    if (existing.length) {
      return failure(res, "S02", "Email already registered", null, 409);
    }

    /* ================= PASSWORD HASH ================= */

    const passwordHash = await bcrypt.hash(password, 10);

    /* ================= INSERT STUDENT ================= */

    const [studentResult] = await pool.query(
      `
      INSERT INTO students
      (
        full_name,
        email,
        password_hash,
        phone,
        state,
        university_id,
        college_id,
        program,
        year_of_study,
        source
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        full_name,
        email,
        passwordHash,
        phone || null,
        state,
        university_id || null,
        college_id,
        project_id,
        github_username || null,
        source || null,
      ]
    );

    const studentId = studentResult.insertId;

    /* ================= FETCH PROJECT ================= */

    const [[project]] = await pool.query(
      `
      SELECT id, duration_weeks
      FROM projects
      WHERE id = ? AND is_active = 1
      `,
      [project_id]
    );

    if (!project) {
      return failure(res, "S03", "Invalid project selected", null, 400);
    }

    /* ================= STUDENT → PROJECT ================= */

    await pool.query(
      `
      INSERT INTO student_projects
      (
        student_id,
        project_id,
        current_week,
        total_weeks,
        start_date,
        expected_end_date,
        status,
        custom_project_title,
        is_custom_project
      )
      VALUES
      (
        ?,
        ?,
        1,
        ?,
        CURDATE(),
        DATE_ADD(CURDATE(), INTERVAL ? WEEK),
        'active',?,?
      )
      `,
      [
        studentId,
        project_id,
        project.duration_weeks,
        project.duration_weeks,
        is_custom_project ? custom_project_title.trim() : null,
        is_custom_project ? 1 : 0,
      ]
    );

    /* ================= CREATE WEEK 1 TASK ================= */
    // 🔥 THIS IS THE KEY PART

    await pool.query(
      `
      INSERT INTO student_tasks
      (
        student_id,
        project_id,
        week_number,
        status,
        created_at
      )
      VALUES
        (?, ?, 1, 'open', NOW()),
        (?, ?, 2, 'locked', NOW()),
        (?, ?, 3, 'locked', NOW()),
        (?, ?, 4, 'locked', NOW()),
        (?, ?, 5, 'locked', NOW()),
        (?, ?, 6, 'locked', NOW()),
        (?, ?, 7, 'locked', NOW()),
        (?, ?, 8, 'locked', NOW())
      `,
      [
        studentId, project_id,
        studentId, project_id,
        studentId, project_id,
        studentId, project_id,
        studentId, project_id,
        studentId, project_id,
        studentId, project_id,
        studentId, project_id,
      ]
    );

    /* ================= SEND WELCOME EMAIL ================= */

    try {
      await sendEmailTemplate({
        to: email,
        templateKey: "welcome_email",
        from: process.env.EMAIL_USER,
        variables: {
          fullName: full_name,
          dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
        }
      });
    } catch (err) {
      console.error("Welcome email failed:", err.message);
    }

    /* ================= TOKENS ================= */

    const payload = { student_id: studentId };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie("refresh_token", refreshToken, refreshCookieOptions);

    return success(
      res,
      "S00",
      "Registration successful",
      {
        accessToken,
        expiresIn: 300,
      },
      200
    );

  } catch (err) {
    console.error(err);
    return failure(res, "S99", "Server error", err.message, 500);
  }
};


exports.profile = async (req, res) => {
  try {
    const studentId = req.user.student_id;

    const [[profile]] = await pool.query(
      `
      SELECT
        s.id,
        s.full_name,
        s.email,
        s.phone,
        s.whatsapp_number,
        s.gender,
        s.program,
        s.year_of_study,
        s.state,
        s.source,
        s.training_paid,       
        s.certificate_paid,
        s.is_active,
        s.created_at,

        c.name AS college_name,

        sp.current_week,
        sp.total_weeks,
        sp.status AS project_status,

        p.title AS project_title

      FROM students s
      LEFT JOIN colleges c ON c.id = s.college_id
      LEFT JOIN student_projects sp ON sp.student_id = s.id
      LEFT JOIN projects p ON p.id = sp.project_id
      WHERE s.id = ?
      LIMIT 1
      `,
      [studentId]
    );

    if (!profile) {
      return failure(res, "A06", "User not found", null, 404);
    }

    return success(res, "A00", "Profile fetched", profile);
  } catch (err) {
    console.error(err);
    return failure(res, "A99", "Failed to fetch profile", err.message, 500);
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info("Student login attempt:", email);

    if (!email || !password) {
      return failure(res, "A01", "Email and password required", null, 400);
    }

    const [rows] = await pool.query(
      "SELECT id, password_hash FROM students WHERE email = ? AND is_active = 1",
      [email]
    );

    if (!rows.length) {
      return failure(res, "A02", "Invalid credentials", null, 401);
    }

    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) {
      return failure(res, "A02", "Invalid credentials", null, 401);
    }

    const payload = { student_id: rows[0].id };
    logger.auth("Login success | student_id:", rows[0].id);

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token securely
    res.cookie("refresh_token", refreshToken, refreshCookieOptions);

    return success(res, "A00", "Login successful", {
      accessToken,
      expiresIn: 300,
    });
  } catch (err) {
    logger.error("Login failed:", err.message);
    return failure(res, "A99", "Login failed", err.message, 500);
  }
};

/* ================= REFRESH ================= */
exports.refreshToken = (req, res) => {
  try {
    logger.info("🔄 REFRESH HIT");

    logger.debug("Cookies received:", req.cookies);

    const token = req.cookies.refresh_token;

    if (!token) {
      logger.warn("❌ No refresh token cookie");
      return failure(res, "A03", "Refresh token missing", null, 401);
    }

    logger.debug("Refresh token (partial):", token.slice(0, 20));

    const decoded = verifyRefreshToken(token);

    const now = Math.floor(Date.now() / 1000);
    logger.info(
      "✅ Refresh token valid | student_id:",
      decoded.student_id,
      "| expires_in_sec:",
      decoded.exp - now
    );

    const newAccessToken = generateAccessToken({
      student_id: decoded.student_id,
    });

    return success(res, "A04", "Token refreshed", {
      accessToken: newAccessToken,
      expiresIn: 300,
    });
  } catch (err) {
    logger.error("❌ Refresh token verification failed:", err.message);
    return failure(res, "A05", "Refresh token expired", null, 401);
  }
};

/* ================= LOGOUT ================= */
exports.logout = (req, res) => {
  logger.warn("🚪 LOGOUT HIT");

  const isProd = process.env.APP_ENV === "production";

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });

  return success(res, "A06", "Logged out successfully");
};

/* ================= DASHBOARD ================= */
exports.dashboard = async (req, res) => {
  try {
    const studentId = req.user.student_id;

    const [[paymentStatus]] = await pool.query(
      `SELECT training_paid FROM students WHERE id=?`,
      [studentId]
    );

    if (!paymentStatus.training_paid) {
      await pool.query(
        `
    UPDATE student_tasks
    SET status='locked'
    WHERE student_id=? AND week_number >= 2
    `,
        [studentId]
      );
    }

    const [[header]] = await pool.query(
      `
      SELECT
        s.id AS student_id,
        s.full_name,
        CASE 
        WHEN sp.is_custom_project = 1 
        THEN sp.custom_project_title
        ELSE p.title
        END AS project_title,
        sp.current_week,
        sp.total_weeks
      FROM students s
      JOIN student_projects sp ON sp.student_id = s.id
      JOIN projects p ON p.id = sp.project_id
      WHERE s.id = ?
      `,
      [studentId]
    );



    const [[stats]] = await pool.query(
      `
      SELECT
        COUNT(CASE WHEN status = 'reviewed' THEN 1 END) AS completed_tasks,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) AS pending_review,
        IFNULL(ROUND(AVG(score), 1), 0) AS avg_score
      FROM student_tasks
      WHERE student_id = ?
      `,
      [studentId]
    );

    // const [[currentTask]] = await pool.query(
    //   `
    //   SELECT
    //     st.id AS student_task_id,
    //     st.week_number,
    //     st.status,
    //     pw.title,
    //     pw.description,
    //     DATE_ADD(
    //       sp.start_date,
    //       INTERVAL ((pw.week_number - 1) * 5 + pw.due_days) DAY
    //     ) AS due_date
    //   FROM student_tasks st
    //   JOIN project_weeks pw
    //     ON pw.project_id = st.project_id
    //   AND pw.week_number = st.week_number
    //   JOIN student_projects sp
    //     ON sp.student_id = st.student_id
    //   AND sp.project_id = st.project_id
    //   WHERE st.student_id = ?
    //     AND st.status IN ('open', 'rejected')
    //   ORDER BY st.week_number
    //   LIMIT 1;
    //   `,
    //   [studentId]
    // );

    const [[currentTask]] = await pool.query(
      `
      SELECT
  st.id AS student_task_id,
  st.week_number,
  st.status,
  pw.title,
  pw.description,
  pw.due_days,
  sp.start_date
FROM student_tasks st
JOIN project_weeks pw
  ON pw.project_id = st.project_id
  AND pw.week_number = st.week_number
JOIN student_projects sp
  ON sp.student_id = st.student_id
  AND sp.project_id = st.project_id
WHERE st.student_id = ?
  AND st.status IN ('open', 'rejected')
ORDER BY st.week_number
LIMIT 1;
      `,
      [studentId]
    );

    if (currentTask) {
      const workingDays =
        ((currentTask.week_number - 1) * (currentTask.due_days - 2)) +
        (currentTask.due_days - 2);

      currentTask.due_date = addWorkingDays(
        currentTask.start_date,
        workingDays
      );
    }

    // const [tasks] = await pool.query(
    //   `
    //   SELECT
    //     st.id AS student_task_id,
    //     st.week_number,
    //     st.status,
    //     st.score,
    //     pw.title,
    //     pw.description,
    //     DATE_ADD(
    //       sp.start_date,
    //       INTERVAL ((pw.week_number - 1) * 5 + pw.due_days) DAY
    //     ) AS due_date
    //   FROM student_tasks st
    //   JOIN project_weeks pw
    //     ON pw.project_id = st.project_id
    //   AND pw.week_number = st.week_number
    //   JOIN student_projects sp
    //     ON sp.student_id = st.student_id
    //   AND sp.project_id = st.project_id
    //   WHERE st.student_id = ?
    //   ORDER BY st.week_number;
    //   `,
    //   [studentId]
    // );

    const [tasks] = await pool.query(
      `
     SELECT
  st.id AS student_task_id,
  st.week_number,
  st.status,
  st.score,
  pw.title,
  pw.description,
  pw.due_days,
  sp.start_date
FROM student_tasks st
JOIN project_weeks pw
  ON pw.project_id = st.project_id
  AND pw.week_number = st.week_number
JOIN student_projects sp
  ON sp.student_id = st.student_id
  AND sp.project_id = st.project_id
WHERE st.student_id = ?
ORDER BY st.week_number;
      `,
      [studentId]
    );

    tasks.forEach(task => {
      const workingDays =
        ((task.week_number - 1) * (task.due_days - 2)) +
        (task.due_days - 2);

      task.due_date = addWorkingDays(
        task.start_date,
        workingDays
      );
    });

    return success(res, "D00", "Dashboard loaded", {
      header,
      stats,
      currentTask,
      tasks
    });

  } catch (err) {
    return failure(res, "D99", "Dashboard error", err.message, 500);
  }
};

/* ================= TASK ================= */
exports.getStudentTaskDetail = async (req, res) => {
  try {
    const studentId = req.user.student_id;
    const { student_task_id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        st.id AS id,
        st.week_number AS week,
        st.status,
        st.score,
        st.reviewer_feedback as feedback,
        pw.title,
        pw.description,
        pw.full_description,
        pw.learning_objectives,
        pw.resources,
        pw.rubric,
        DATE_ADD(
          sp.start_date,
          INTERVAL ((pw.week_number - 1) * 7 + pw.due_days) DAY
        ) AS deadline,
        st.frontend_repo,
        st.backend_repo,
        st.frontend_live_url,
        st.backend_live_url,
        st.submission_notes
      FROM student_tasks st
      JOIN project_weeks pw
        ON pw.project_id = st.project_id
       AND pw.week_number = st.week_number
      JOIN student_projects sp
        ON sp.student_id = st.student_id
       AND sp.project_id = st.project_id
      WHERE st.id = ?
        AND st.student_id = ?
      LIMIT 1
      `,
      [student_task_id, studentId]
    );

    if (!rows.length) {
      return failure(res, "T01", "Task not found", null, 404);
    }

    const task = rows[0];

    // 🔒 PAYMENT CHECK FOR VIEWING TASK
    if (task.week >= 2) {
      const [[studentPayment]] = await pool.query(
        `SELECT training_paid FROM students WHERE id=?`,
        [studentId]
      );

      if (!studentPayment.training_paid) {
        return failure(
          res,
          "PAY02",
          "Payment required to access this task",
          null,
          403
        );
      }
    }

    return success(res, "T00", "Task loaded", {
      id: task.id,
      week: task.week,
      title: task.title,
      description: task.description,
      fullDescription: task.full_description,
      deadline: task.deadline,
      status: task.status,
      score: task.score,
      feedback: task.feedback,
      resources:
        typeof task.resources === "string"
          ? JSON.parse(task.resources || "[]")
          : task.resources || [],

      rubric:
        typeof task.rubric === "string"
          ? JSON.parse(task.rubric || "[]")
          : task.rubric || [],
      frontend_repo: task.frontend_repo,
      backend_repo: task.backend_repo,
      frontend_live_url: task.frontend_live_url,
      backend_live_url: task.backend_live_url,
      submission_notes: task.submission_notes,
    });

  } catch (err) {
    console.error(err);
    return failure(res, "T99", "Server error", err.message, 500);
  }
};

/* ================= SUBMIT TASK ================= */

exports.submitTask = async (req, res) => {
  try {
    const studentId = req.user.student_id;
    const { taskId } = req.params;

    const {
      frontend_repo,
      backend_repo,
      frontend_live_url,
      backend_live_url,
      submission_notes
    } = req.body;



    if (!frontend_repo && !backend_repo) {
      return failure(
        res,
        "S01",
        "At least one GitHub repository is required",
        null,
        400
      );
    }

    // 1️⃣ Fetch task
    const [[task]] = await pool.query(
      `
      SELECT st.*, pw.auto_unlock_next_week
      FROM student_tasks st
      JOIN project_weeks pw
        ON pw.project_id = st.project_id
       AND pw.week_number = st.week_number
      WHERE st.id = ? AND st.student_id = ?
      `,
      [taskId, studentId]
    );

    if (!task)
      return failure(res, "S02", "Task not found", null, 404);

    // 🔒 Payment check for Week 2+
    if (task.week_number >= 2) {
      const [[student]] = await pool.query(
        `SELECT training_paid FROM students WHERE id=?`,
        [studentId]
      );

      if (!student.training_paid) {
        return failure(
          res,
          "PAY01",
          "Please complete payment to continue training",
          null,
          403
        );
      }
    }

    if (!["open", "rejected", "submitted"].includes(task.status)) {
      return failure(
        res,
        "S02",
        "Task cannot be submitted at this stage",
        null,
        400
      );
    }

    // 2️⃣ Save submission
    await pool.query(
      `
      UPDATE student_tasks
      SET
        frontend_repo=?,
        backend_repo=?,
        frontend_live_url=?,
        backend_live_url=?,
        submission_notes=?
      WHERE id=?
      `,
      [
        frontend_repo,
        backend_repo,
        frontend_live_url,
        backend_live_url,
        submission_notes,
        taskId
      ]
    );

    const [[student]] = await pool.query(
      `
  SELECT
    year_of_study AS github_username,
    email,
  full_name,
    created_at
  FROM students
  WHERE id = ?
  `,
      [studentId]
    );

    // 🔒 GitHub repo must belong to student's username
    if (
      !isValidGithubRepo(frontend_repo, student.github_username) ||
      !isValidGithubRepo(backend_repo, student.github_username)
    ) {
      return failure(
        res,
        "S05",
        `GitHub repository must belong to your username: ${student.github_username}`,
        null,
        400
      );
    }

    // 3️⃣ AUTO VERIFY (ALL WEEKS)
    const verification = await verifySubmissionByWeek({
      weekNumber: task.week_number,
      frontendLink: frontend_repo,
      backendLink: backend_repo,
      frontendLiveUrl: frontend_live_url,
      backendLiveUrl: backend_live_url,
      studentGithubUsername: student.github_username,
      enrollmentDate: student.created_at
    });



    if (!verification.passed) {
      await pool.query(
        `
    UPDATE student_tasks
    SET
      status='rejected',
      reviewer_feedback=?,
      reviewed_at=NOW()
    WHERE id=?
    `,
        [verification.feedback, taskId]
      );

      return failure(res, "S04", verification.feedback, verification.feedback, 400);
    }

    /* ================= WEEK 8 → STOP HERE ================= */

    if (task.week_number === 8) {
      // ✅ VERIFIED but WAITING for ADMIN

      // ✅ PASS
      await pool.query(
        `
  UPDATE student_tasks
  SET
        status='submitted',
      submitted_at=NOW(),
    reviewer_feedback=?
  WHERE id=?
  `,
        [verification.feedback, taskId]
      );

      await pool.query(
        `
    UPDATE student_projects
    SET completed_at=NOW()
    WHERE student_id=?
      AND project_id=?
    `,
        [studentId, task.project_id]
      );

      /* 📧 SEND FINAL SUBMISSION EMAIL */
      try {
        await sendEmailTemplate({
          to: student.email,
          from: process.env.EMAIL_USER,
          templateKey: "final_submission_student",
          variables: {
            fullName: student.full_name,
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
          }
        });
        await sendEmailTemplate({
          to: process.env.EMAIL_USER,
          from: process.env.EMAIL_USER,
          templateKey: "final_submission_admin",
          variables: {
            fullName: student.full_name,
            adminUrl: `${process.env.FRONTEND_URL}/admin/dashboard`
          }
        });
      } catch (err) {
        console.error("Final submission email failed:", err.message);
        // ❗ Do NOT block success if email fails
      }

      return success(
        res,
        "S00",
        "Week 8 has been submitted for review. Please wait up to 24 hours. You will receive an email once verified."
      );
    }

    // ✅ PASS
    await pool.query(
      `
  UPDATE student_tasks
  SET
    status='reviewed',
    score=?,
    reviewer_feedback=?,
    reviewed_at=NOW()
  WHERE id=?
  `,
      [verification.score, verification.feedback, taskId]
    );

    // 🔓 UNLOCK NEXT WEEK
    if (task.auto_unlock_next_week) {
      await pool.query(
        `
    UPDATE student_tasks
    SET status='open'
    WHERE student_id=?
      AND project_id=?
      AND week_number=?
    `,
        [studentId, task.project_id, task.week_number + 1]
      );

      await pool.query(
        `
    UPDATE student_projects
    SET current_week=?
    WHERE student_id=?
      AND project_id=?
    `,
        [task.week_number + 1, studentId, task.project_id]
      );
    }

    return success(res, "S00", "Submission processed successfully");

  } catch (err) {
    console.error(err);
    return failure(res, "S99", "Server error", err.message, 500);
  }
};

exports.getDirectCertificateStatus = async (req, res) => {
  try {
    const studentId = req.user.student_id;

    const [[request]] = await pool.query(
      `
      SELECT 
        id,
        student_id,
        project_name,
        github_link,
        status,
        admin_feedback,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        created_at,
        reviewed_at
      FROM direct_certificate_requests
      WHERE student_id=?
      ORDER BY id DESC
      LIMIT 1
      `,
      [studentId]
    );

    return success(res, "DC10", "Status fetched", request || null);
  } catch (err) {
    return failure(res, "DC99", "Failed", err.message, 500);
  }
};

exports.submitDirectCertificate = async (req, res) => {
  try {
    const studentId = req.user.student_id;
    const { project_name, github_link, start_date, end_date } = req.body;

    if (!project_name || !github_link || !start_date || !end_date) {
      return failure(res, "DC01", "All fields are required", null, 400);
    }

    // basic github validation
    if (!github_link.startsWith("https://github.com/")) {
      return failure(res, "DC02", "Invalid GitHub URL", null, 400);
    }

    const [[existing]] = await pool.query(
      `SELECT id FROM direct_certificate_requests
   WHERE student_id=? AND status='pending'
   ORDER BY id DESC LIMIT 1`,
      [studentId]
    );

    if (existing) {
      return failure(res, "DC03", "You already have a pending request", null, 400);
    }

    await pool.query(
      `INSERT INTO direct_certificate_requests
       (student_id, project_name, github_link, start_date, end_date)
       VALUES (?, ?, ?, ?, ?)`,
      [studentId, project_name.trim(), github_link.trim(), start_date, end_date]
    );

    // 🔎 Get student details
    const [[student]] = await pool.query(
      `SELECT full_name, email FROM students WHERE id=?`,
      [studentId]
    );

    if (!student) {
      return failure(res, "DC04", "Student not found", null, 404);
    }

    // 🔥 SEND EMAIL TO ADMIN
    sendEmailTemplate({
      to: process.env.EMAIL_USER, // put admin email in .env
      from: process.env.EMAIL_USER,
      templateKey: "direct_certificate_submitted",
      variables: {
        fullName: student.full_name,
        email: student.email,
        projectName: project_name,
        dashboardUrl: `${process.env.FRONTEND_URL}/admin/direct-certificates`
      }
    }).catch(err =>
      console.error("Admin notification email failed:", err.message)
    );

    return success(res, "DC00", "Submitted for approval");
  } catch (err) {
    return failure(res, "DC99", "Submission failed", err.message, 500);
  }
};

exports.getStudentPayments = async (req, res) => {
  try {
    const studentId = req.user.student_id;

    const [payments] = await pool.query(
      `
      SELECT
        id,
   CASE 
          WHEN plan_duration = 'direct_certificate' 
          THEN 'Evaluation Certificate'
          ELSE plan_duration
        END AS plan_duration,
    original_amount,
    discount_amount,
    amount,
    extra_charges,
    final_paid,
    coupon_code,
    status,
    razorpay_order_id,
    razorpay_payment_id,
    failure_code,
    failure_message,
    created_at
      FROM payment_transactions
      WHERE student_id = ? and status != 'created'
      ORDER BY created_at DESC
      `,
      [studentId]
    );

    return success(res, "P00", "Payments fetched", payments);
  } catch (err) {
    return failure(res, "P99", "Failed to fetch payments", err.message, 500);
  }
};

exports.getCertificateStatus = async (req, res) => {
  try {
    const studentId = req.user.student_id;

    // 1️⃣ Fetch student + certificate_paid
    const [[student]] = await pool.query(
      `SELECT certificate_paid FROM students WHERE id=?`,
      [studentId]
    );

    // 2️⃣ Fetch certificate record (to check manual or normal)
    const [[certificate]] = await pool.query(
      `SELECT start_date, end_date, is_manual_issue
       FROM certificates
       WHERE student_id=? AND is_revoked=0`,
      [studentId]
    );

    // 3️⃣ If certificate exists and is DIRECT (manual)
    if (certificate && certificate.is_manual_issue === 1) {
      return success(res, "C03", "Certificate available", {
        status: "available",
        download_url: `/students/certificate/download`,
      });
    }

    // 4️⃣ Fetch Week 8 task (normal training flow)
    const [[week8]] = await pool.query(
      `
      SELECT status
      FROM student_tasks
      WHERE student_id = ?
        AND week_number = 8
      LIMIT 1
      `,
      [studentId]
    );

    if (!week8 || ["open", "locked"].includes(week8.status)) {
      return success(res, "C00", "Certificate locked", {
        status: "locked",
      });
    }

    if (week8.status === "submitted") {
      return success(res, "C01", "Under review", {
        status: "under_review",
      });
    }

    if (week8.status === "rejected") {
      return success(res, "C04", "Final project rejected", {
        status: "locked",
        message: "Your final project was rejected. Please resubmit.",
      });
    }

    // 5️⃣ Check payment
    if (!student.certificate_paid) {
      return success(res, "C02", "Payment required", {
        status: "payment_required",
      });
    }

    // 6️⃣ NEW VALIDATION 🔥
    // Only for NORMAL certificate
    if (certificate && certificate.is_manual_issue === 0) {
      const today = new Date();
      const endDate = new Date(certificate.end_date);

      // normalize time (avoid timezone issues)
      today.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);


      if (today < endDate) {
        const issueDate = new Date(endDate);
        issueDate.setDate(issueDate.getDate() + 1);

        return success(res, "C05", "Project not completed yet", {
          status: "locked",
          message: "Certificate will be available after internship end date.",
          issue_date: issueDate,
        });
      }
    }

    // 7️⃣ Available
    return success(res, "C03", "Certificate available", {
      status: "available",
      download_url: `/students/certificate/download`,
    });

  } catch (err) {
    console.error(err);
    return failure(res, "C99", "Certificate error", err.message, 500);
  }
};

function formatDateWithSuffix(date) {
  const d = new Date(date);

  const day = d.getDate();
  const year = d.getFullYear();
  const month = d.toLocaleString("en-IN", { month: "long" });

  // Suffix logic
  const getSuffix = (n) => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  return `${day}${getSuffix(day)} ${month} ${year}`;
}

exports.downloadCertificatePdf = async (req, res) => {
  try {
    const studentId = req.user.student_id;

    /* ================= VALIDATION ================= */

    const [[student]] = await pool.query(
      `SELECT full_name, program, certificate_paid, enrollment_type 
       FROM students WHERE id=?`,
      [studentId]
    );

    if (!student || !student.certificate_paid) {
      return failure(res, "C01", "Certificate not available", null, 403);
    }

    const templateKey =
      student.enrollment_type === "direct_certificate"
        ? "direct_certificate"
        : "certificate";

    /* ================= FETCH CERTIFICATE RECORD ================= */

    const [[certificate]] = await pool.query(
      `SELECT * FROM certificates 
       WHERE student_id=? AND is_revoked=0`,
      [studentId]
    );

    if (!certificate) {
      return failure(res, "C02", "Certificate not generated", null, 404);
    }

    /* ================= COMPANY ASSETS ================= */

    const [[company]] = await pool.query(
      `SELECT * FROM company_settings LIMIT 1`
    );

    /* ================= FETCH MANAGING DIRECTOR ================= */

    const [[managingDirector]] = await pool.query(`
  SELECT director_name, designation, signature_image
  FROM company_directors
  WHERE company_id = ?
  AND is_active = 1
  AND designation = 'Director'
  LIMIT 1
`, [company.id]);

    /* ================= QR GENERATION ================= */

    const verifyUrl = `${process.env.FRONTEND_URL}/verify/${certificate.verification_token}`;
    const qrCodeBase64 = await QRCode.toDataURL(verifyUrl);

    /* ================= LOAD TEMPLATE FROM DB ================= */

    const [[template]] = await pool.query(
      `SELECT html_content FROM document_templates
       WHERE template_key= ?
       AND is_active=1 LIMIT 1`,
      [templateKey]
    );

    if (!template) {
      return failure(res, "C03", "Certificate template missing", null, 500);
    }

    let html = template.html_content;

    const BASE_URL = process.env.FRONTEND_URL;
    const backgroundBase64 = await imageToBase64Universal("certificatebg.jpg");

    const leftLogoBase64 = company.product_logo
      ? await imageToBase64Universal(company.product_logo)
      : "";

    const rightLogoBase64 = company.parent_logo
      ? await imageToBase64Universal(company.parent_logo)
      : "";

    const signatureBase64 =
      managingDirector && managingDirector.signature_image
        ? await imageToBase64Universal(managingDirector.signature_image)
        : "";

    /* ================= LOAD FONT ================= */

    // const fontPath = path.resolve(
    //   __dirname,
    //   "../../public/fonts/GreatVibes-Regular.ttf"
    // );

    // const fontBase64 = fs.readFileSync(fontPath).toString("base64");

    // const fontDataUrl = `data:font/ttf;base64,${fontBase64}`;

    html = html
      // .replace("{{greatVibesFont}}", GREAT_VIBES_FONT)
      .replace("{{studentName}}", toTitleCase(student.full_name))
      .replace("{{program}}", certificate.program)
      .replace("{{startDate}}", formatDateWithSuffix(certificate.start_date))
      .replace("{{endDate}}", formatDateWithSuffix(certificate.end_date))
      .replace("{{issueDate}}", formatDateWithSuffix(certificate.issue_date))
      .replace("{{certificateId}}", certificate.certificate_id)
      .replace("{{qrCode}}", qrCodeBase64)

      // 🔥 IMAGES (LIKE INVOICE)
      .replace("{{backgroundImage}}", backgroundBase64)
      .replace("{{leftLogo}}", leftLogoBase64)
      .replace("{{rightLogo}}", rightLogoBase64)
      .replace("{{signatureImage}}", signatureBase64)
      .replace("{{signatoryName}}",
        managingDirector
          ? managingDirector.director_name
          : ""
      )
      .replace("{{designation}}",
        managingDirector
          ? managingDirector.designation
          : ""
      );

    /* ================= PDF GENERATION ================= */

    const pdf = await generatePDFfromHTML(html);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${certificate.certificate_id}.pdf`
    );

    return res.send(pdf);

  } catch (err) {
    console.error(err);
    return failure(res, "C99", "Certificate generation failed", err.message, 500);
  }
};

exports.verifyCertificate = async (req, res) => {
  try {
    const { token } = req.params;

    const [[cert]] = await pool.query(
      `
      SELECT 
        c.*, 
        s.full_name
      FROM certificates c
      JOIN students s ON s.id = c.student_id
      WHERE c.verification_token=? 
        AND c.is_revoked=0
      `,
      [token]
    );

    if (!cert) {
      return res.status(404).json({
        valid: false,
        message: "Certificate not found or revoked",
      });
    }

    return res.json({
      valid: true,
      studentName: toTitleCase(cert.full_name),
      program: cert.program,
      issueDate: formatDateWithSuffix(cert.issue_date),
      certificateId: cert.certificate_id,
      score: cert.final_score,
      isManual: Boolean(cert.is_manual_issue),
    });

  } catch (err) {
    console.error("Certificate verification error:", err);

    return res.status(500).json({
      valid: false,
      message: "Verification failed",
    });
  }
};

/* ================= STUDENT: SEND FEEDBACK ================= */

exports.sendFeedback = async (req, res) => {
  try {
    const studentId = req.user.student_id;
    const { message } = req.body;

    if (!message || message.trim().length < 10) {
      return failure(res, "FB01", "Feedback must be at least 10 characters", null, 400);
    }

    // Get student info
    const [[student]] = await pool.query(
      `SELECT full_name, email FROM students WHERE id=?`,
      [studentId]
    );

    if (!student) {
      return failure(res, "FB02", "Student not found", null, 404);
    }

    // 🔥 Send Email (non-blocking)
    sendEmailTemplate({
      to: process.env.EMAIL_USER, // company email
      from: process.env.EMAIL_USER,
      templateKey: "student_feedback",
      variables: {
        studentName: student.full_name,
        studentEmail: student.email,
        message: message.trim(),
      }
    }).catch(err =>
      console.error("Feedback email failed:", err.message)
    );

    return success(res, "FB00", "Feedback sent successfully");
  } catch (err) {
    return failure(res, "FB99", "Failed to send feedback", err.message, 500);
  }
};

exports.requestCollege = async (req, res) => {
  try {
    const { state, college } = req.body;

    if (!college) {
      return failure(res, "CR01", "Missing data", null, 400);
    }

    await sendEmailTemplate({
      to: process.env.EMAIL_USER,
      templateKey: "college_request",
      variables: {
        state,
        college
      },
      from: process.env.EMAIL_USER
    });

    logger.info("College request email sent");

    return success(res, "CR00", "Request sent");
  } catch (err) {
    logger.error("College request error:", err.message);
    return failure(res, "CR99", "Failed to send request", err.message, 500);
  }
};

exports.getActiveAnnouncements = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, title, message
      FROM announcements
      WHERE is_active = 1
      AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
    `);

    return success(res, "AN00", "Announcements fetched", rows);

  } catch (err) {
    return failure(res, "AN99", "Failed to fetch announcements", err.message, 500);
  }
};