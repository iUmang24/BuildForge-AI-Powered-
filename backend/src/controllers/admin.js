const pool = require("../config/db");
const { success, failure } = require("../utils/error");
const logger = require("../utils/logger");
const bcrypt = require("bcrypt");
const env = require("../config/env");
const { refreshCookieOptions } = require("../utils/cookies");
const { sendEmailTemplate } = require("../services/emailService");
const {
    generateAdminAccessToken,
    generateAdminRefreshToken,
    verifyAdminRefreshToken,
} = require("../utils/jwt");
const { imageToBase64Universal } = require("../utils/common");
const QRCode = require("qrcode");

const safePagination = (page, limit) => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, parseInt(limit) || 10);
    const offset = (pageNum - 1) * limitNum;

    return { pageNum, limitNum, offset };
};

const logAdminAction = async (
    adminId,
    action,
    entityType,
    entityId,
    metadata = {}
) => {
    try {
        await pool.query(
            `
      INSERT INTO admin_activity_logs
      (admin_id, action, entity_type, entity_id, metadata)
      VALUES (?, ?, ?, ?, ?)
      `,
            [adminId, action, entityType, entityId, JSON.stringify(metadata)]
        );
    } catch (err) {
        console.error("Admin log failed:", err.message);
    }
};


/* ================= ADMIN LOGIN ================= */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        logger.info("Admin login attempt:", email);

        if (!email || !password) {
            return failure(res, "A01", "Email and password required", null, 400);
        }

        const [rows] = await pool.query(
            "SELECT id, password_hash, role FROM admins WHERE email=? AND is_active=1",
            [email]
        );

        if (!rows.length) {
            return failure(res, "A02", "Invalid credentials", null, 401);
        }

        const match = await bcrypt.compare(password, rows[0].password_hash);
        if (!match) {
            return failure(res, "A02", "Invalid credentials", null, 401);
        }

        const payload = {
            admin_id: rows[0].id,
            role: rows[0].role
        };

        logger.auth("Admin login success | admin_id:", rows[0].id);

        const accessToken = generateAdminAccessToken(payload);
        const refreshToken = generateAdminRefreshToken(payload);

        res.cookie("admin_refresh_token", refreshToken, refreshCookieOptions);

        return success(res, "A00", "Login successful", {
            accessToken,
            expiresIn: 300
        });
    } catch (err) {
        logger.error("Admin login failed:", err.message);
        return failure(res, "A99", "Login failed", err.message, 500);
    }
};

/* ================= ADMIN REFRESH ================= */
exports.refreshToken = (req, res) => {
    try {
        const token = req.cookies.admin_refresh_token;

        if (!token) {
            return failure(res, "A03", "Refresh token missing", null, 401);
        }

        const decoded = verifyAdminRefreshToken(token);

        const newAccessToken = generateAdminAccessToken({
            admin_id: decoded.admin_id,
            role: decoded.role
        });

        return success(res, "A04", "Token refreshed", {
            accessToken: newAccessToken,
            expiresIn: 300
        });
    } catch (err) {
        return failure(res, "A05", "Refresh token expired", null, 401);
    }
};

/* ================= ADMIN LOGOUT ================= */
exports.logout = (req, res) => {
    res.clearCookie("admin_refresh_token", refreshCookieOptions);
    return success(res, "A06", "Logged out successfully");
};

/* ================= ADMIN PROFILE ================= */
exports.profile = async (req, res) => {
    try {
        const adminId = req.admin.admin_id;

        const [rows] = await pool.query(
            `
            SELECT
                id,
                email,
                role,
                created_at
            FROM admins
            WHERE id = ?
              AND is_active = 1
            `,
            [adminId]
        );

        if (!rows.length) {
            return failure(res, "A12", "Admin not found", null, 404);
        }

        return success(res, "A00", "Admin profile fetched", rows[0]);
    } catch (err) {
        logger.error("Admin profile error:", err.message);
        return failure(res, "A99", "Server error", err.message, 500);
    }
};

/* ================= GET FINAL WEEK SUBMISSIONS ================= */

exports.getFinalWeekSubmissions = async (req, res) => {
    try {
        const { status = "all", search = "", page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        let whereClause = `st.week_number = 8`;
        let params = [];

        if (status === "all") {
            whereClause += `
    AND st.status IN ('submitted', 'reviewed', 'rejected')
  `;
        } else {
            whereClause += ` AND st.status = ?`;
            params.push(status);
        }

        if (search) {
            whereClause += ` AND (s.full_name LIKE ? OR s.email LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        const [statsRows] = await pool.query(
            `
  SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN st.status='submitted' THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN st.status='reviewed' THEN 1 ELSE 0 END) AS approved,
    SUM(CASE WHEN st.status='rejected' THEN 1 ELSE 0 END) AS rejected
  FROM student_tasks st
  JOIN students s ON s.id = st.student_id
  JOIN projects p ON p.id = st.project_id
  LEFT JOIN colleges c ON c.id = s.college_id
  WHERE st.week_number = 8
    AND st.status IN ('submitted','reviewed','rejected')
  `
        );

        const stats = statsRows[0];

        const [rows] = await pool.query(
            `
      SELECT
        st.id AS student_task_id,
        st.status,
        st.submitted_at,
        st.reviewed_at,
        st.frontend_repo,
        st.backend_repo,
        st.frontend_live_url,
        st.backend_live_url,
        st.submission_notes,
        st.score,
        st.reviewer_feedback,

        s.id AS student_id,
        s.full_name,
        s.email,
        s.phone,
        s.state,
        s.training_paid,
        s.created_at AS enrolled_on,

        p.title AS program_name,
        c.name AS college_name

      FROM student_tasks st
      JOIN students s ON s.id = st.student_id
      JOIN projects p ON p.id = st.project_id
      LEFT JOIN colleges c ON c.id = s.college_id

      WHERE ${whereClause}
      ORDER BY st.submitted_at ASC
      LIMIT ? OFFSET ?
      `,
            [...params, Number(limit), Number(offset)]
        );

        return success(res, "A00", "Final submissions fetched", {
            rows,
            stats
        });
    } catch (err) {
        return failure(res, "A99", "Server error", err.message, 500);
    }
};

/* ================= APPROVE FINAL SUBMISSION ================= */

exports.approveFinalSubmission = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { score = 10, feedback = "Final project approved" } = req.body;

        // First get student info
        const [[task]] = await pool.query(
            `
      SELECT s.id AS student_id, s.email, s.full_name
      FROM student_tasks st
      JOIN students s ON s.id = st.student_id
      WHERE st.id=? AND st.week_number=8
      `,
            [taskId]
        );

        if (!task) {
            return failure(res, "A04", "Submission not found", null, 404);
        }

        const [result] = await pool.query(
            `
      UPDATE student_tasks
      SET
        status='reviewed',
        score=?,
        reviewer_feedback=?,
        reviewed_at=NOW()
      WHERE id=?
        AND week_number=8
        AND status='submitted'
      `,
            [score, feedback, taskId]
        );

        if (!result.affectedRows) {
            return failure(res, "A04", "Submission not found or already reviewed", null, 400);
        }

        // 3️⃣ 🔥 MARK PROJECT COMPLETED
        const [projectUpdate] = await pool.query(
            `
  UPDATE student_projects
  SET status='completed',
      updated_at=NOW()
  WHERE student_id=? 
    AND status != 'completed'
  `,
            [task.student_id]
        );

        if (!projectUpdate.affectedRows) {
            console.warn("Project status not updated for student:", task.student_id);
        }

        // 🔥 Send email (non-blocking)
        sendEmailTemplate({
            to: task.email,
            from: process.env.EMAIL_USER,
            templateKey: "final_approved",
            variables: {
                fullName: task.full_name,
                feedback,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
            }
        }).catch(err =>
            console.error("Approval email failed:", err.message)
        );

        return success(res, "A01", "Final submission approved");
    } catch (err) {
        return failure(res, "A99", "Server error", err.message, 500);
    }
};

/* ================= REJECT FINAL SUBMISSION ================= */

exports.rejectFinalSubmission = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { feedback } = req.body;

        if (!feedback) {
            return failure(res, "A05", "Feedback is required", null, 400);
        }

        // Get student info
        const [[task]] = await pool.query(
            `
      SELECT s.email, s.full_name
      FROM student_tasks st
      JOIN students s ON s.id = st.student_id
      WHERE st.id=? AND st.week_number=8
      `,
            [taskId]
        );

        if (!task) {
            return failure(res, "A06", "Submission not found", null, 404);
        }

        const [result] = await pool.query(
            `
      UPDATE student_tasks
      SET
        status='rejected',
        reviewer_feedback=?,
        reviewed_at=NOW()
      WHERE id=?
        AND week_number=8
        AND status='submitted'
      `,
            [feedback, taskId]
        );

        if (!result.affectedRows) {
            return failure(res, "A06", "Submission not found or already reviewed", null, 400);
        }

        // 🔥 Send email (non-blocking)
        sendEmailTemplate({
            to: task.email,
            from: process.env.EMAIL_USER,
            templateKey: "final_rejected",
            variables: {
                fullName: task.full_name,
                feedback,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
            }
        }).catch(err =>
            console.error("Rejection email failed:", err.message)
        );

        return success(res, "A02", "Final submission rejected");
    } catch (err) {
        return failure(res, "A99", "Server error", err.message, 500);
    }
};


/* ================= ADMIN: GET ALL TICKETS ================= */

exports.getAllTickets = async (req, res) => {
    try {
        const {
            status = "all",
            search = "",
            page = 1,
            limit = 10,
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClauses = [];
        let params = [];

        // 🔎 STATUS FILTER
        if (status !== "all") {
            whereClauses.push("t.status = ?");
            params.push(status);
        }

        // 🔎 SEARCH (name, email, subject)
        if (search) {
            whereClauses.push(
                "(s.full_name LIKE ? OR s.email LIKE ? OR t.subject LIKE ?)"
            );
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const where =
            whereClauses.length > 0
                ? "WHERE " + whereClauses.join(" AND ")
                : "";

        // 🔢 TOTAL COUNT
        const [[{ total }]] = await pool.query(
            `
      SELECT COUNT(*) as total
      FROM support_tickets t
      JOIN students s ON s.id = t.student_id
      ${where}
      `,
            params
        );

        // 📄 PAGINATED DATA
        const [rows] = await pool.query(
            `
      SELECT
        t.id,
        t.subject,
        t.status,
        t.created_at,
        s.full_name,
        s.email
      FROM support_tickets t
      JOIN students s ON s.id = t.student_id
      ${where}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
      `,
            [...params, parseInt(limit), offset]
        );

        return success(res, "SUP00", "Tickets fetched", {
            rows,
            total,
        });

    } catch (err) {
        return failure(
            res,
            "SUP99",
            "Failed to fetch tickets",
            err.message,
            500
        );
    }
};

/* ================= ADMIN: GET SINGLE TICKET (WITH CHAT) ================= */

exports.getTicketById = async (req, res) => {
    try {
        const { ticketId } = req.params;

        // 1️⃣ Ticket info
        const [[ticket]] = await pool.query(
            `
      SELECT
        t.id,
        t.subject,
        t.status,
        t.created_at,
        s.full_name,
        s.email
      FROM support_tickets t
      JOIN students s ON s.id = t.student_id
      WHERE t.id = ?
      `,
            [ticketId]
        );

        if (!ticket) {
            return failure(res, "SUP01", "Ticket not found", null, 404);
        }

        // 2️⃣ Messages
        const [messages] = await pool.query(
            `
      SELECT
        id,
        sender,
        message,
        created_at
      FROM support_messages
      WHERE ticket_id = ?
      ORDER BY created_at ASC
      `,
            [ticketId]
        );

        ticket.messages = messages;

        return success(res, "SUP00", "Ticket loaded", ticket);

    } catch (err) {
        return failure(res, "SUP99", "Failed to fetch ticket", err.message, 500);
    }
};


/* ================= ADMIN: REPLY ================= */

exports.replyTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { message } = req.body;

        if (!message || message.trim().length < 3) {
            return failure(res, "SUP02", "Reply too short", null, 400);
        }

        const [[ticket]] = await pool.query(
            `SELECT id FROM support_tickets WHERE id=?`,
            [ticketId]
        );

        if (!ticket) {
            return failure(res, "SUP03", "Ticket not found", null, 404);
        }

        await pool.query(
            `
      INSERT INTO support_messages
      (ticket_id, sender, message)
      VALUES (?, 'admin', ?)
      `,
            [ticketId, message.trim()]
        );

        // Keep ticket open
        await pool.query(
            `
      UPDATE support_tickets
      SET updated_at = NOW()
      WHERE id = ?
      `,
            [ticketId]
        );

        return success(res, "SUP04", "Reply sent");

    } catch (err) {
        return failure(res, "SUP99", "Reply failed", err.message, 500);
    }
};


/* ================= ADMIN: CLOSE TICKET ================= */

exports.closeTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;

        // 🔎 Get student info before closing
        const [[ticket]] = await pool.query(
            `
      SELECT t.subject, s.email, s.full_name
      FROM support_tickets t
      JOIN students s ON s.id = t.student_id
      WHERE t.id = ?
      `,
            [ticketId]
        );

        if (!ticket) {
            return failure(res, "SUP05", "Ticket not found", null, 404);
        }

        const [result] = await pool.query(
            `
      UPDATE support_tickets
      SET status='closed'
      WHERE id=?
      `,
            [ticketId]
        );

        if (!result.affectedRows) {
            return failure(res, "SUP05", "Ticket not found", null, 404);
        }

        // 🔥 Send email to student (non-blocking)
        sendEmailTemplate({
            to: ticket.email,
            from: process.env.EMAIL_USER,
            templateKey: "support_closed",
            variables: {
                fullName: ticket.full_name,
                subject: ticket.subject,
                dashboardUrl: `${process.env.FRONTEND_URL}/help`
            }
        }).catch(err =>
            console.error("Ticket closed email failed:", err.message)
        );

        return success(res, "SUP06", "Ticket closed");

    } catch (err) {
        return failure(res, "SUP99", "Close failed", err.message, 500);
    }
};

exports.getDirectCertificates = async (req, res) => {
    try {
        const { status = "all", search = "", page = 1, limit = 10 } = req.query;

        const offset = (page - 1) * limit;

        let whereClause = "";
        let params = [];

        /* ================= STATUS FILTER ================= */
        if (status === "all") {
            whereClause += `
                WHERE d.status IN ('pending','approved','rejected')
            `;
        } else {
            whereClause += ` WHERE d.status = ? `;
            params.push(status);
        }

        /* ================= SEARCH FILTER ================= */
        if (search) {
            whereClause += status === "all"
                ? ` AND (s.full_name LIKE ? OR s.email LIKE ?) `
                : ` AND (s.full_name LIKE ? OR s.email LIKE ?) `;
            params.push(`%${search}%`, `%${search}%`);
        }

        /* ================= STATS (LIKE WEEK 8) ================= */
        const [statsRows] = await pool.query(
            `
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) AS approved,
                SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) AS rejected
            FROM direct_certificate_requests
            WHERE status IN ('pending','approved','rejected')
            `
        );

        const stats = statsRows[0];

        /* ================= PAGINATED DATA ================= */
        const [rows] = await pool.query(
            `
            SELECT 
                d.id,
                d.project_name,
                d.github_link,
                d.start_date,
                d.end_date,
                d.status,
                d.admin_feedback,
                d.created_at,
                d.reviewed_at,

                s.id AS student_id,
                s.full_name,
                s.email,
                s.phone,
                s.state,
                s.created_at AS enrolled_on

            FROM direct_certificate_requests d
            JOIN students s ON s.id = d.student_id

            ${whereClause}
            ORDER BY d.created_at DESC
            LIMIT ? OFFSET ?
            `,
            [...params, Number(limit), Number(offset)]
        );

        return success(res, "DC00", "Direct certificate requests fetched", {
            rows,
            stats
        });

    } catch (err) {
        return failure(res, "DC99", "Server error", err.message, 500);
    }
};

exports.approveDirectCertificate = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { feedback } = req.body;
        const adminId = req.admin.admin_id;

        const [[request]] = await pool.query(
            `SELECT * FROM direct_certificate_requests WHERE id=?`,
            [requestId]
        );

        if (!request) {
            return failure(res, "DC04", "Request not found", null, 404);
        }

        // 1️⃣ Mark request approved
        await pool.query(
            `UPDATE direct_certificate_requests
       SET status='approved',
       admin_feedback=?,
           reviewed_by=?,
           reviewed_at=NOW()
       WHERE id=?`,
            [feedback, adminId, requestId]
        );

        // 2️⃣ Insert/Update student_projects
        await pool.query(
            `UPDATE student_projects
   SET project_id = 101,
       start_date = ?,
       expected_end_date = ?,
       custom_project_title = ?,
       is_custom_project = 1,
       updated_at = NOW()
   WHERE student_id = ?`,
            [
                request.start_date,
                request.end_date,
                request.project_name,
                request.student_id
            ]
        );

        // 2️⃣ Insert/Update student_projects
        await pool.query(
            `UPDATE student_tasks
   SET project_id = 101
   WHERE student_id = ?`,
            [
                request.student_id
            ]
        );

        const [[student]] = await pool.query(
            `SELECT full_name, email FROM students WHERE id=?`,
            [request.student_id]
        );

        // 🔥 Send approval email
        sendEmailTemplate({
            to: student.email,
            from: process.env.EMAIL_USER,
            templateKey: "direct_certificate_approved",
            variables: {
                fullName: student.full_name,
                projectName: request.project_name,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
            }
        }).catch(err =>
            console.error("Approval email failed:", err.message)
        );

        return success(res, "DC05", "Approved successfully");
    } catch (err) {
        return failure(res, "DC99", "Approval failed", err.message, 500);
    }
};

exports.rejectDirectCertificate = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { feedback } = req.body;
        const adminId = req.admin.admin_id;

        const [[request]] = await pool.query(
            `SELECT * FROM direct_certificate_requests WHERE id=?`,
            [requestId]
        );

        if (!request) {
            return failure(res, "DC04", "Request not found", null, 404);
        }

        await pool.query(
            `UPDATE direct_certificate_requests
       SET status='rejected',
           admin_feedback=?,
           reviewed_by=?,
           reviewed_at=NOW()
       WHERE id=?`,
            [feedback, adminId, requestId]
        );

        // Get student info
        const [[student]] = await pool.query(
            `SELECT full_name, email FROM students WHERE id=?`,
            [request.student_id]
        );

        // 🔥 Send rejection email
        sendEmailTemplate({
            to: student.email,
            from: process.env.EMAIL_USER,
            templateKey: "direct_certificate_rejected",
            variables: {
                fullName: student.full_name,
                projectName: request.project_name,
                feedback,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
            }
        }).catch(err =>
            console.error("Rejection email failed:", err.message)
        );

        return success(res, "DC06", "Rejected successfully");
    } catch (err) {
        return failure(res, "DC99", "Rejection failed", err.message, 500);
    }
};

exports.getStudents = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 10 } = req.query;
        const { pageNum, limitNum, offset } = safePagination(page, limit);

        let where = "";
        let params = [];

        if (search) {
            where = `WHERE s.full_name LIKE ? OR s.email LIKE ?`;
            params.push(`%${search}%`, `%${search}%`);
        }

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM students s ${where}`,
            params
        );

        const [rows] = await pool.query(
            `
      SELECT
        s.id,
        s.full_name,
        s.email,
        s.training_paid,
        s.certificate_paid,
        s.enrollment_type,
        s.is_active,
        s.created_at,
        c.name as college_name
      FROM students s
      LEFT JOIN colleges c ON c.id = s.college_id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
      `,
            [...params, limitNum, offset]
        );

        return success(res, "S00", "Students fetched", {
            rows,
            total,
        });
    } catch (err) {
        return failure(res, "S99", "Failed to fetch students", err.message, 500);
    }
};

exports.toggleStudentActive = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin.admin_id;

        const [[student]] = await pool.query(
            `SELECT is_active FROM students WHERE id=?`,
            [id]
        );

        if (!student) {
            return failure(res, "S01", "Student not found", null, 404);
        }

        const newStatus = student.is_active ? 0 : 1;

        await pool.query(
            `UPDATE students SET is_active=? WHERE id=?`,
            [newStatus, id]
        );

        await logAdminAction(
            adminId,
            "TOGGLE_STUDENT_ACTIVE",
            "student",
            id,
            { newStatus }
        );

        return success(res, "S02", "Student updated");
    } catch (err) {
        return failure(res, "S99", "Failed", err.message, 500);
    }
};

exports.getStudentProfile = async (req, res) => {
    try {
        const { id } = req.params;

        /* STUDENT */
        const [[student]] = await pool.query(`
      SELECT 
        s.id,
        s.full_name,
        s.email,
        s.phone,
        s.state,
        s.training_paid,
        s.certificate_paid,
        s.created_at,
        c.name AS college_name
      FROM students s
      LEFT JOIN colleges c ON c.id = s.college_id
      WHERE s.id = ?
    `, [id]);

        if (!student) {
            return failure(res, "S01", "Student not found", null, 404);
        }

        /* PROJECT */
        const [[project]] = await pool.query(`
      SELECT 
        sp.status,
        sp.start_date,
        sp.expected_end_date,
        p.title
      FROM student_projects sp
      LEFT JOIN projects p ON p.id = sp.project_id
      WHERE sp.student_id = ?
    `, [id]);

        /* TASKS */
        const [tasks] = await pool.query(`
      SELECT
        week_number,
        status,
        score,
        submitted_at
      FROM student_tasks
      WHERE student_id = ?
      ORDER BY week_number
    `, [id]);

        /* SUPPORT TICKETS */
        const [tickets] = await pool.query(`
      SELECT id, subject, status, created_at
      FROM support_tickets
      WHERE student_id = ?
      ORDER BY created_at DESC
    `, [id]);

        /* CERTIFICATES */
        const [certificates] = await pool.query(`
      SELECT id, program, issue_date
      FROM certificates
      WHERE student_id = ?
    `, [id]);

        /* PAYMENTS */
        const [payments] = await pool.query(`
      SELECT id, final_paid as amount, plan_duration as type, status, created_at
      FROM payment_transactions
      WHERE student_id = ?
      ORDER BY created_at DESC
    `, [id]);

        /* DIRECT CERTIFICATE */
        const [directRequests] = await pool.query(`
      SELECT id, project_name, status, created_at
      FROM direct_certificate_requests
      WHERE student_id = ?
      ORDER BY created_at DESC
    `, [id]);

        return success(res, "S02", "Student profile fetched", {
            student,
            project,
            tasks,
            tickets,
            certificates,
            payments,
            directRequests
        });

    } catch (err) {
        return failure(res, "S99", "Failed", err.message, 500);
    }
};

exports.getColleges = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 10 } = req.query;

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const offset = (pageNum - 1) * limitNum;

        let where = "";
        let params = [];

        if (search) {
            where = `WHERE c.name LIKE ? OR c.city LIKE ?`;
            params.push(`%${search}%`, `%${search}%`);
        }

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM colleges c ${where}`,
            params
        );

        const [rows] = await pool.query(
            `
      SELECT c.*, u.name as university_name
      FROM colleges c
      LEFT JOIN universities u ON u.id = c.university_id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
      `,
            [...params, limitNum, offset]
        );

        return success(res, "C00", "Colleges fetched", {
            rows,
            total
        });

    } catch (err) {
        return failure(res, "C99", "Error", err.message, 500);
    }
};

exports.updateCollege = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            university_id,
            name,
            genders_accepted,
            campus_size,
            established_year,
            rating,
            courses,
            city,
            state,
            country,
            college_type
        } = req.body;

        const adminId = req.admin.admin_id;

        await pool.query(
            `
      UPDATE colleges
      SET
      university_id=?,
      name=?,
      genders_accepted=?,
      campus_size=?,
      established_year=?,
      rating=?,
      courses=?,
      city=?,
      state=?,
      country=?,
      college_type=?
      WHERE id=?
      `,
            [
                university_id,
                name,
                genders_accepted,
                campus_size,
                established_year,
                rating,
                courses,
                city,
                state,
                country,
                college_type,
                id
            ]
        );

        await logAdminAction(
            adminId,
            "UPDATE_COLLEGE",
            "college",
            id,
            { name }
        );

        return success(res, "C02", "College updated");

    } catch (err) {
        return failure(res, "C99", "Error", err.message, 500);
    }
};

exports.createCollege = async (req, res) => {
    try {

        const {
            university_id,
            name,
            genders_accepted,
            campus_size,
            established_year,
            rating,
            courses,
            city,
            state,
            country,
            college_type
        } = req.body;

        const adminId = req.admin.admin_id;

        const [result] = await pool.query(
            `
      INSERT INTO colleges
      (university_id,name,genders_accepted,campus_size,established_year,rating,courses,city,state,country,college_type)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
      `,
            [
                university_id,
                name,
                genders_accepted,
                campus_size,
                established_year,
                rating,
                courses,
                city,
                state,
                country,
                college_type
            ]
        );

        await logAdminAction(
            adminId,
            "CREATE_COLLEGE",
            "college",
            result.insertId,
            { name }
        );

        return success(res, "C01", "College created");

    } catch (err) {
        return failure(res, "C99", "Error", err.message, 500);
    }
};

exports.getProjects = async (req, res) => {
    try {

        const { search = "", page = 1, limit = 10 } = req.query;

        const pageNum = Number(page);
        const limitNum = Number(limit);
        const offset = (pageNum - 1) * limitNum;

        let where = "";
        let params = [];

        if (search) {
            where = `WHERE title LIKE ?`;
            params.push(`%${search}%`);
        }

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM projects ${where}`,
            params
        );

        const [rows] = await pool.query(
            `
      SELECT *
      FROM projects
      ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
            [...params, limitNum, offset]
        );

        return success(res, "P00", "Projects fetched", {
            rows,
            total
        });

    } catch (err) {
        return failure(res, "P99", "Error", err.message, 500);
    }
};

exports.createProject = async (req, res) => {

    try {

        const {
            title,
            description,
            duration_weeks,
            difficulty_level
        } = req.body;

        const adminId = req.admin.admin_id;

        if (!title) {
            return failure(res, "P02", "Project title required", null, 400);
        }

        const [result] = await pool.query(
            `
      INSERT INTO projects
      (title, description, duration_weeks, difficulty_level, is_active)
      VALUES (?, ?, ?, ?, 1)
      `,
            [
                title,
                description,
                duration_weeks,
                difficulty_level
            ]
        );

        await logAdminAction(
            adminId,
            "CREATE_PROJECT",
            "project",
            result.insertId,
            { title }
        );

        return success(res, "P01", "Project created");

    } catch (err) {
        return failure(res, "P99", "Error", err.message, 500);
    }

};

exports.updateProject = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            title,
            description,
            duration_weeks,
            difficulty_level,
            is_active
        } = req.body;

        const adminId = req.admin.admin_id;

        await pool.query(
            `
      UPDATE projects
      SET
      title=?,
      description=?,
      duration_weeks=?,
      difficulty_level=?,
      is_active=?,
      updated_at=NOW()
      WHERE id=?
      `,
            [
                title,
                description,
                duration_weeks,
                difficulty_level,
                is_active,
                id
            ]
        );

        await logAdminAction(
            adminId,
            "UPDATE_PROJECT",
            "project",
            id,
            { title }
        );

        return success(res, "P03", "Project updated");

    } catch (err) {
        return failure(res, "P99", "Error", err.message, 500);
    }

};

exports.deleteProject = async (req, res) => {

    try {

        const { id } = req.params;
        const adminId = req.admin.admin_id;

        await pool.query(
            `DELETE FROM projects WHERE id=?`,
            [id]
        );

        await logAdminAction(
            adminId,
            "DELETE_PROJECT",
            "project",
            id
        );

        return success(res, "P04", "Project deleted");

    } catch (err) {
        return failure(res, "P99", "Error", err.message, 500);
    }

};

exports.getPricing = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM pricing_plans`
        );

        return success(res, "PR00", "Pricing fetched", rows);
    } catch (err) {
        return failure(res, "PR99", "Error", err.message, 500);
    }
};

exports.createPricing = async (req, res) => {
    try {

        const { plan_duration, mrp, gst_rate } = req.body;
        const adminId = req.admin.admin_id;

        const [result] = await pool.query(
            `
      INSERT INTO pricing_plans
      (plan_duration, mrp, gst_rate, is_active)
      VALUES (?, ?, ?, 1)
      `,
            [plan_duration, mrp, gst_rate]
        );

        await logAdminAction(
            adminId,
            "CREATE_PRICING",
            "pricing",
            result.insertId,
            { plan_duration }
        );

        return success(res, "PR02", "Pricing created");

    } catch (err) {
        return failure(res, "PR99", "Error", err.message, 500);
    }
};

exports.updatePricing = async (req, res) => {
    try {
        const { id } = req.params;
        const { mrp, gst_rate } = req.body;
        const adminId = req.admin.admin_id;

        await pool.query(
            `
      UPDATE pricing_plans
      SET mrp=?, gst_rate=?
      WHERE id=?
      `,
            [mrp, gst_rate, id]
        );

        await logAdminAction(
            adminId,
            "UPDATE_PRICING",
            "pricing",
            id,
            { mrp, gst_rate }
        );

        return success(res, "PR01", "Pricing updated");
    } catch (err) {
        return failure(res, "PR99", "Error", err.message, 500);
    }
};

exports.deletePricing = async (req, res) => {
    try {

        const { id } = req.params;
        const adminId = req.admin.admin_id;

        await pool.query(
            `DELETE FROM pricing_plans WHERE id=?`,
            [id]
        );

        await logAdminAction(
            adminId,
            "DELETE_PRICING",
            "pricing",
            id
        );

        return success(res, "PR03", "Pricing deleted");

    } catch (err) {
        return failure(res, "PR99", "Error", err.message, 500);
    }
};

exports.getCoupons = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM coupons ORDER BY created_at DESC`
        );

        return success(res, "CP00", "Coupons fetched", rows);
    } catch (err) {
        return failure(res, "CP99", "Error", err.message, 500);
    }
};


exports.createCoupon = async (req, res) => {
    try {
        const {
            code,
            discount_type,
            discount_value,
            usage_type,
            max_uses,
            expires_at
        } = req.body;

        const adminId = req.admin.admin_id;

        const [result] = await pool.query(
            `
      INSERT INTO coupons
      (code, discount_type, discount_value, usage_type, max_uses, is_active, expires_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
      `,
            [code, discount_type, discount_value, usage_type, max_uses, expires_at]
        );

        await logAdminAction(
            adminId,
            "CREATE_COUPON",
            "coupon",
            result.insertId,
            { code }
        );

        return success(res, "CP01", "Coupon created");
    } catch (err) {
        return failure(res, "CP99", "Error", err.message, 500);
    }
};

exports.updateCoupon = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            code,
            discount_type,
            discount_value,
            usage_type,
            max_uses,
            expires_at,
            is_active
        } = req.body;

        const adminId = req.admin.admin_id;

        await pool.query(
            `
      UPDATE coupons
      SET
      code=?,
      discount_type=?,
      discount_value=?,
      usage_type=?,
      max_uses=?,
      expires_at=?,
      is_active=?
      WHERE id=?
      `,
            [
                code,
                discount_type,
                discount_value,
                usage_type,
                max_uses,
                expires_at,
                is_active,
                id
            ]
        );

        await logAdminAction(
            adminId,
            "UPDATE_COUPON",
            "coupon",
            id,
            { code }
        );

        return success(res, "CP02", "Coupon updated");

    } catch (err) {
        return failure(res, "CP99", "Error", err.message, 500);
    }
};

exports.deleteCoupon = async (req, res) => {
    try {

        const { id } = req.params;
        const adminId = req.admin.admin_id;

        await pool.query(
            `DELETE FROM coupons WHERE id=?`,
            [id]
        );

        await logAdminAction(
            adminId,
            "DELETE_COUPON",
            "coupon",
            id
        );

        return success(res, "CP03", "Coupon deleted");

    } catch (err) {
        return failure(res, "CP99", "Error", err.message, 500);
    }
};


exports.getAdminDashboard = async (req, res) => {
    try {
        const [[students]] = await pool.query(
            `SELECT COUNT(*) as total FROM students`
        );

        const [[revenue]] = await pool.query(
            `SELECT 
    SUM(CASE WHEN plan_duration = 'training' THEN final_paid ELSE 0 END) AS training_revenue,
    SUM(CASE WHEN plan_duration = 'certificate' THEN final_paid ELSE 0 END) AS certificate_revenue,
    SUM(CASE WHEN plan_duration = 'direct_certificate' THEN final_paid ELSE 0 END) AS direct_certificate_revenue,
    SUM(final_paid) AS total_revenue
FROM payment_transactions
WHERE status = 'paid';`
        );

        const [[direct]] = await pool.query(
            `SELECT COUNT(*) as total FROM direct_certificate_requests`
        );

        return success(res, "D00", "Dashboard stats", {
            students: students.total,
            trainingRevenue: revenue.training_revenue || 0,
            certificateRevenue: revenue.certificate_revenue || 0,
            evaluationRevenue: revenue.direct_certificate_revenue || 0,
            totalRevenue: revenue.total_revenue || 0,
            directCertificates: direct.total
        });
    } catch (err) {
        return failure(res, "D99", "Error", err.message, 500);
    }
};


/* ================= EMAIL TEMPLATES ================= */

exports.getEmailTemplates = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 10 } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, parseInt(limit) || 10);
        const offset = (pageNum - 1) * limitNum;

        let where = "";
        let params = [];

        if (search) {
            where = `
        WHERE template_key LIKE ?
        OR subject LIKE ?
        OR description LIKE ?
      `;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Total count
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM email_templates ${where}`,
            params
        );

        // Paginated data
        const [rows] = await pool.query(
            `
      SELECT id, template_key, subject, description, is_active, updated_at
      FROM email_templates
      ${where}
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
      `,
            [...params, limitNum, offset]
        );

        return success(res, "ET00", "Email templates fetched", {
            rows,
            total,
            page: pageNum,
            limit: limitNum,
        });
    } catch (err) {
        return failure(res, "ET99", "Failed to fetch templates", err.message, 500);
    }
};

exports.getEmailTemplateById = async (req, res) => {
    try {
        const { id } = req.params;

        const [[template]] = await pool.query(
            `SELECT * FROM email_templates WHERE id=?`,
            [id]
        );

        if (!template) {
            return failure(res, "ET01", "Template not found", null, 404);
        }

        return success(res, "ET02", "Template loaded", template);
    } catch (err) {
        return failure(res, "ET99", "Error", err.message, 500);
    }
};

exports.createEmailTemplate = async (req, res) => {
    try {
        const { template_key, subject, description = "" } = req.body;
        const adminId = req.admin.admin_id;

        if (!template_key || !subject) {
            return failure(res, "ET06", "Template key & subject required", null, 400);
        }

        // Prevent duplicate key
        const [[existing]] = await pool.query(
            `SELECT id FROM email_templates WHERE template_key=?`,
            [template_key]
        );

        if (existing) {
            return failure(res, "ET07", "Template key already exists", null, 400);
        }

        const [result] = await pool.query(
            `
      INSERT INTO email_templates
      (template_key, subject, body, description, is_active)
      VALUES (?, ?, '', ?, 1)
      `,
            [template_key, subject, description]
        );

        await logAdminAction(
            adminId,
            "CREATE_EMAIL_TEMPLATE",
            "email_template",
            result.insertId,
            { template_key }
        );

        return success(res, "ET08", "Template created");
    } catch (err) {
        return failure(res, "ET99", "Create failed", err.message, 500);
    }
};


exports.updateEmailTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, body, description, is_active } = req.body;
        const adminId = req.admin.admin_id;

        if (!subject || !body) {
            return failure(res, "ET09", "Subject & body required", null, 400);
        }

        const [result] = await pool.query(
            `
      UPDATE email_templates
      SET subject=?,
          body=?,
          description=?,
          is_active=?,
          updated_at=NOW()
      WHERE id=?
      `,
            [subject, body, description, is_active ? 1 : 0, id]
        );

        if (!result.affectedRows) {
            return failure(res, "ET01", "Template not found", null, 404);
        }

        await logAdminAction(
            adminId,
            "UPDATE_EMAIL_TEMPLATE",
            "email_template",
            id,
            { subject }
        );

        return success(res, "ET03", "Template updated");
    } catch (err) {
        return failure(res, "ET99", "Update failed", err.message, 500);
    }
};

exports.sendTestEmailTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { testEmail } = req.body;

        if (!testEmail) {
            return failure(res, "ET10", "Test email required", null, 400);
        }

        const [[template]] = await pool.query(
            `SELECT * FROM email_templates WHERE id=?`,
            [id]
        );

        if (!template) {
            return failure(res, "ET04", "Template not found", null, 404);
        }

        await sendEmailTemplate({
            to: testEmail,
            from: process.env.EMAIL_USER,
            templateKey: template.template_key,
            variables: {
                fullName: "Test User",
                dashboardUrl: process.env.FRONTEND_URL,
            },
        });

        return success(res, "ET05", "Test email sent");
    } catch (err) {
        return failure(res, "ET99", "Test email failed", err.message, 500);
    }
};

/* ================= APP SETTINGS ================= */

exports.getAppSettings = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM app_settings ORDER BY setting_key ASC`
        );

        return success(res, "AS00", "Settings fetched", rows);
    } catch (err) {
        return failure(res, "AS99", "Failed to fetch settings", err.message, 500);
    }
};

exports.updateAppSetting = async (req, res) => {
    try {
        const { id } = req.params;
        const { setting_value } = req.body;
        const adminId = req.admin.admin_id;

        await pool.query(
            `
      UPDATE app_settings
      SET setting_value=?, updated_at=NOW()
      WHERE id=?
      `,
            [setting_value, id]
        );

        await logAdminAction(
            adminId,
            "UPDATE_APP_SETTING",
            "app_setting",
            id,
            { setting_value }
        );

        return success(res, "AS01", "Setting updated");
    } catch (err) {
        return failure(res, "AS99", "Update failed", err.message, 500);
    }
};

exports.createAppSetting = async (req, res) => {
    try {
        const { setting_key, setting_value } = req.body;
        const adminId = req.admin.admin_id;

        const [result] = await pool.query(
            `
      INSERT INTO app_settings (setting_key, setting_value)
      VALUES (?, ?)
      `,
            [setting_key, setting_value]
        );

        await logAdminAction(
            adminId,
            "CREATE_APP_SETTING",
            "app_setting",
            result.insertId,
            { setting_key }
        );

        return success(res, "AS02", "Setting created");
    } catch (err) {
        return failure(res, "AS99", "Failed", err.message, 500);
    }
};

/* ================= ANNOUNCEMENTS ================= */

exports.getAnnouncements = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM announcements ORDER BY created_at DESC`
        );

        return success(res, "AN00", "Announcements fetched", rows);
    } catch (err) {
        return failure(res, "AN99", "Error", err.message, 500);
    }
};


exports.createAnnouncement = async (req, res) => {
    try {
        const { title, message, expires_at, is_active = 1 } = req.body;
        const adminId = req.admin.admin_id;

        const [result] = await pool.query(
            `
      INSERT INTO announcements (title, message, is_active, expires_at)
      VALUES (?, ?, ?, ?)
      `,
            [title, message, is_active, expires_at]
        );

        await logAdminAction(
            adminId,
            "CREATE_ANNOUNCEMENT",
            "announcement",
            result.insertId,
            { title }
        );

        return success(res, "AN01", "Announcement created");
    } catch (err) {
        return failure(res, "AN99", "Failed", err.message, 500);
    }
};

exports.updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message, expires_at, is_active } = req.body;
        const adminId = req.admin.admin_id;

        await pool.query(
            `
      UPDATE announcements
      SET title=?,
          message=?,
          expires_at=?,
          is_active=?
      WHERE id=?
      `,
            [title, message, expires_at, is_active, id]
        );

        await logAdminAction(
            adminId,
            "UPDATE_ANNOUNCEMENT",
            "announcement",
            id,
            { title }
        );

        return success(res, "AN02", "Announcement updated");
    } catch (err) {
        return failure(res, "AN99", "Update failed", err.message, 500);
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin.admin_id;

        await pool.query(
            `DELETE FROM announcements WHERE id=?`,
            [id]
        );

        await logAdminAction(
            adminId,
            "DELETE_ANNOUNCEMENT",
            "announcement",
            id
        );

        return success(res, "AN03", "Announcement deleted");
    } catch (err) {
        return failure(res, "AN99", "Delete failed", err.message, 500);
    }
};


/* ================= DOCUMENT TEMPLATES LIST ================= */

exports.getDocumentTemplates = async (req, res) => {
    try {
        const { search = "", page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let where = "";
        let params = [];

        if (search) {
            where = "WHERE template_key LIKE ?";
            params.push(`%${search}%`);
        }

        const [[{ total }]] = await pool.query(
            `
      SELECT COUNT(*) as total
      FROM document_templates
      ${where}
      `,
            params
        );

        const [rows] = await pool.query(
            `
      SELECT id, template_key, is_active, updated_at
      FROM document_templates
      ${where}
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
      `,
            [...params, Number(limit), Number(offset)]
        );

        return success(res, "DT00", "Document templates fetched", {
            rows,
            total,
        });
    } catch (err) {
        return failure(res, "DT99", "Failed to fetch templates", err.message, 500);
    }
};


exports.getDocumentTemplateById = async (req, res) => {
    try {
        const { id } = req.params;

        /* ================= TEMPLATE ================= */

        const [[template]] = await pool.query(
            `SELECT * FROM document_templates WHERE id=?`,
            [id]
        );

        if (!template) {
            return failure(res, "DT01", "Template not found", null, 404);
        }

        /* ================= COMPANY SETTINGS ================= */

        const [[company]] = await pool.query(
            `SELECT product_logo, parent_logo 
       FROM company_settings 
       LIMIT 1`
        );

        /* ================= DIRECTOR ================= */

        const [[director]] = await pool.query(
            `SELECT director_name, designation, signature_image
       FROM company_directors
       WHERE designation='Managing Director'
       AND is_active=1
       LIMIT 1`
        );

        /* ================= IMAGE → BASE64 ================= */

        const backgroundBase64 = await imageToBase64Universal("certificatebg.jpg");

        const leftLogoBase64 = company?.product_logo
            ? await imageToBase64Universal(company.product_logo)
            : "";

        const rightLogoBase64 = company?.parent_logo
            ? await imageToBase64Universal(company.parent_logo)
            : "";

        const signatureBase64 = director?.signature_image
            ? await imageToBase64Universal(director.signature_image)
            : "";

        const qrCodeBase64 = await QRCode.toDataURL("dummy");

        /* ================= RESPONSE ================= */

        return success(res, "DT02", "Template loaded", {
            ...template,
            backgroundImage: backgroundBase64,
            product_logo: leftLogoBase64,
            parent_logo: rightLogoBase64,
            signature_image: signatureBase64,
            signatory_name: director?.director_name || "",
            designation: director?.designation || "",
            qrCode:qrCodeBase64,
        });

    } catch (err) {
        return failure(res, "DT99", "Error", err.message, 500);
    }
};


exports.updateDocumentTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { html_content, is_active } = req.body;
        const adminId = req.admin.admin_id;

        await pool.query(
            `
      UPDATE document_templates
      SET html_content=?,
          is_active=?,
          updated_at=NOW()
      WHERE id=?
      `,
            [html_content, is_active, id]
        );

        await logAdminAction(
            adminId,
            "UPDATE_DOCUMENT_TEMPLATE",
            "document_template",
            id,
            { id }
        );

        return success(res, "DT03", "Template updated");
    } catch (err) {
        return failure(res, "DT99", "Update failed", err.message, 500);
    }
};


exports.createDocumentTemplate = async (req, res) => {
    try {
        const { template_key, html_content } = req.body;

        const [result] = await pool.query(
            `
      INSERT INTO document_templates
      (template_key, html_content, is_active)
      VALUES (?, ?, 1)
      `,
            [template_key, html_content]
        );

        return success(res, "DT04", "Template created", {
            id: result.insertId,
        });
    } catch (err) {
        return failure(res, "DT99", "Create failed", err.message, 500);
    }
};

exports.getProjectWeeks = async (req, res) => {
    try {

        const [rows] = await pool.query(`
      SELECT *
        FROM project_weeks
        WHERE id IN (
            SELECT MIN(id)
            FROM project_weeks
            GROUP BY week_number
        )
        ORDER BY week_number ASC;
    `);

        return success(res, "PW00", "Weeks fetched", rows);

    } catch (err) {
        return failure(res, "PW99", "Error", err.message, 500);
    }
};

exports.updateProjectWeek = async (req, res) => {
    try {

        const { week } = req.params;

        const {
            title,
            description,
            full_description,
            learning_objectives,
            resources,
            rubric,
            due_days,
            max_score
        } = req.body;

        await pool.query(`
      UPDATE project_weeks
      SET
      title=?,
      description=?,
      full_description=?,
      learning_objectives=?,
      resources=?,
      rubric=?,
      due_days=?,
      max_score=?,
      updated_at=NOW()
      WHERE week_number=?
    `, [
            title,
            description,
            full_description,
            learning_objectives,
            resources,
            rubric,
            due_days,
            max_score,
            week
        ]);

        return success(res, "PW01", "Week updated");

    } catch (err) {
        return failure(res, "PW99", "Error", err.message, 500);
    }
};