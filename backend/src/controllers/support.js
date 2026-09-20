const pool = require("../config/db");
const { success, failure } = require("../utils/error");
const { sendEmailTemplate } = require("../services/emailService");

/* ================= STUDENT: CREATE TICKET ================= */

exports.createTicket = async (req, res) => {
    try {
        const studentId = req.user.student_id;
        const { subject, message } = req.body;

        if (!subject || !message) {
            return failure(res, "SUP01", "Subject and message required", null, 400);
        }

        if (message.trim().length < 10) {
            return failure(res, "SUP02", "Message too short", null, 400);
        }

        // 🔎 Get student info (for email)
        const [[student]] = await pool.query(
            `SELECT full_name, email FROM students WHERE id=?`,
            [studentId]
        );

        // 1️⃣ Create ticket
        const [ticketResult] = await pool.query(
            `
      INSERT INTO support_tickets (student_id, subject)
      VALUES (?, ?)
      `,
            [studentId, subject.trim()]
        );

        const ticketId = ticketResult.insertId;



        // 2️⃣ Insert first message
        await pool.query(
            `
      INSERT INTO support_messages (ticket_id, sender, message)
      VALUES (?, 'student', ?)
      `,
            [ticketId, message.trim()]
        );

        // 3️⃣ Send Email (student + admin)
        try {
            // 1️⃣ Send email to student
            await sendEmailTemplate({
                to: student.email,
                from: process.env.EMAIL_USER,
                templateKey: "support_created_student",
                variables: {
                    fullName: student.full_name,
                    subject,
                    dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
                }
            });

            // 2️⃣ Send email to admin
            await sendEmailTemplate({
                to: process.env.EMAIL_USER,
                from: process.env.EMAIL_USER,
                templateKey: "support_created_admin",
                variables: {
                    fullName: student.full_name,
                    email: student.email,
                    subject,
                    message,
                    dashboardUrl: `${process.env.FRONTEND_URL}/admin/dashboard`
                }
            });

        } catch (err) {
            console.error("Support created email failed:", err.message);
        }

        return success(res, "SUP00", "Support ticket submitted");
    } catch (err) {
        console.error(err);
        return failure(res, "SUP99", "Failed to submit ticket", err.message, 500);
    }
};

/* ================= GET MY TICKETS ================= */

exports.getMyTickets = async (req, res) => {
    try {
        const studentId = req.user.student_id;

        // 1️⃣ Get tickets
        const [tickets] = await pool.query(
            `
      SELECT id, subject, status, created_at
      FROM support_tickets
      WHERE student_id=?
      ORDER BY created_at DESC
      `,
            [studentId]
        );

        if (!tickets.length) {
            return success(res, "SUP00", "Tickets fetched", []);
        }

        // 2️⃣ Get messages for those tickets
        const ticketIds = tickets.map(t => t.id);

        const [messages] = await pool.query(
            `
      SELECT ticket_id, sender, message, created_at
      FROM support_messages
      WHERE ticket_id IN (?)
      ORDER BY created_at ASC
      `,
            [ticketIds]
        );

        // 3️⃣ Group messages under tickets
        const formatted = tickets.map(ticket => ({
            ...ticket,
            messages: messages.filter(m => m.ticket_id === ticket.id)
        }));

        return success(res, "SUP00", "Tickets fetched", formatted);

    } catch (err) {
        console.error(err);
        return failure(res, "SUP99", "Failed to fetch tickets", err.message, 500);
    }
};

exports.replyToTicket = async (req, res) => {
    try {
        const studentId = req.user.student_id;
        const { ticketId } = req.params;
        const { message } = req.body;

        if (!message || message.trim().length < 2) {
            return failure(res, "SUP03", "Reply cannot be empty", null, 400);
        }

        // Validate ownership
        const [[ticket]] = await pool.query(
            `SELECT id FROM support_tickets WHERE id=? AND student_id=?`,
            [ticketId, studentId]
        );

        if (!ticket) {
            return failure(res, "SUP04", "Ticket not found", null, 404);
        }

        // // Get student info
        // const [[student]] = await pool.query(
        //     `SELECT full_name, email FROM students WHERE id=?`,
        //     [studentId]
        // );

        await pool.query(
            `
      INSERT INTO support_messages (ticket_id, sender, message)
      VALUES (?, 'student', ?)
      `,
            [ticketId, message.trim()]
        );

        // // Send email to admin
        // try {
        //     await sendSupportReplyEmail({
        //         email: student.email,
        //         fullName: student.full_name,
        //         subject: ticket.subject,
        //         message,
        //     });
        // } catch (err) {
        //     console.error("Support reply email failed:", err.message);
        // }

        return success(res, "SUP05", "Reply added");
    } catch (err) {
        console.error(err);
        return failure(res, "SUP99", "Reply failed", err.message, 500);
    }
};