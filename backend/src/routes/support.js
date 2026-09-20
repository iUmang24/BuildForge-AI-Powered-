const express = require("express");
const router = express.Router();

const support = require("../controllers/support");
const auth = require("../middlewares/auth");

/* ================= STUDENT ================= */

router.post("/", auth, support.createTicket);
router.get("/", auth, support.getMyTickets);
router.post("/:ticketId/reply", auth, support.replyToTicket);



module.exports = router;