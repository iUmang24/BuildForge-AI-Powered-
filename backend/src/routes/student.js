const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student");
const auth = require("../middlewares/auth");
const restrictAccess = require("../middlewares/restrictAccess");

router.post("/", restrictAccess, studentController.createStudent);
router.post("/login", restrictAccess, studentController.login);
// router.post("/",  studentController.createStudent);
// router.post("/login",  studentController.login);
router.post("/refresh", studentController.refreshToken);
router.post("/logout", studentController.logout);
router.post("/college-request", studentController.requestCollege);
router.get("/verify/:token", studentController.verifyCertificate);

// 🔐 PROTECTED
router.get("/profile", auth, studentController.profile);
router.get( "/dashboard", auth, studentController.dashboard );
router.get( "/tasks/:student_task_id", auth, studentController.getStudentTaskDetail );
router.post( "/tasks/:taskId/submit", auth, studentController.submitTask );
router.get( "/payments", auth, studentController.getStudentPayments );
router.get("/certificate", auth, studentController.getCertificateStatus);
router.get("/certificate/download", auth, studentController.downloadCertificatePdf);
router.post("/feedback", auth, studentController.sendFeedback);
router.get( "/announcements", auth, studentController.getActiveAnnouncements );
router.get( "/directcertstatus", auth, studentController.getDirectCertificateStatus ); 
router.post( "/directcertsubmit", auth, studentController.submitDirectCertificate );


module.exports = router;