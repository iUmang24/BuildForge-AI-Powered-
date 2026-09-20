const express = require("express");
const router = express.Router();

const authAdmin = require("../middlewares/authAdmin");

const {
  getFinalWeekSubmissions,
  approveFinalSubmission,
  rejectFinalSubmission,
  login,
  refreshToken,
  logout,
  profile,
  getAllTickets,
  replyTicket,
  getTicketById,
  closeTicket,
  approveDirectCertificate,
  rejectDirectCertificate,
  getDirectCertificates,
  getStudents,
  toggleStudentActive,
  getColleges,
  createCollege,
  getProjects,
  createProject,
  getPricing,
  updatePricing,
  getCoupons,
  createCoupon,
  getAdminDashboard,
  getEmailTemplates,
  getEmailTemplateById,
  updateEmailTemplate,
  sendTestEmailTemplate,
  getAppSettings,
  createAppSetting,
  updateAppSetting,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/admin");

const adminController = require("../controllers/admin");

router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

router.get("/profile", authAdmin, profile);
router.get("/submissions", authAdmin, getFinalWeekSubmissions);
router.post("/submissions/:taskId/approve", authAdmin, approveFinalSubmission);
router.post("/submissions/:taskId/reject", authAdmin, rejectFinalSubmission);

/* ================= ADMIN ================= */

router.get("/support", authAdmin, getAllTickets);
router.get("/support/:ticketId", authAdmin, getTicketById);
router.post("/support/:ticketId/reply", authAdmin, replyTicket);
router.post("/support/:ticketId/close", authAdmin, closeTicket);
router.post("/direct-certificates/:requestId/approve", authAdmin, approveDirectCertificate);
router.post("/direct-certificates/:requestId/reject", authAdmin, rejectDirectCertificate);
router.get("/direct-certificates", authAdmin, getDirectCertificates);

router.get("/students", authAdmin, getStudents);
router.patch("/students/:id/toggle", authAdmin, toggleStudentActive);
router.get("/students/:id", authAdmin, adminController.getStudentProfile);

router.get("/colleges", authAdmin, getColleges);
router.post("/colleges", authAdmin, createCollege);
router.patch("/colleges/:id", authAdmin, adminController.updateCollege);

router.get("/projects", authAdmin, getProjects);
router.post("/projects", authAdmin, createProject);
router.patch("/projects/:id", authAdmin, adminController.updateProject);
router.delete("/projects/:id", authAdmin, adminController.deleteProject);

router.get("/pricing", authAdmin, getPricing);
router.post("/pricing", authAdmin, adminController.createPricing);
router.patch("/pricing/:id", authAdmin, updatePricing);
router.delete("/pricing/:id", authAdmin, adminController.deletePricing);

router.get("/coupons", authAdmin, getCoupons);
router.post("/coupons", authAdmin, createCoupon);
router.patch("/coupons/:id", authAdmin, adminController.updateCoupon);
router.delete("/coupons/:id", authAdmin, adminController.deleteCoupon);

router.get("/dashboard", authAdmin, getAdminDashboard);

/* EMAIL */
router.get("/email-templates", authAdmin, getEmailTemplates);
router.get("/email-templates/:id", authAdmin, getEmailTemplateById);
router.post("/email-templates", authAdmin, adminController.createEmailTemplate);
router.patch("/email-templates/:id", authAdmin, updateEmailTemplate);
router.post("/email-templates/:id/test", authAdmin, sendTestEmailTemplate);

/* APP SETTINGS */
router.get("/app-settings", authAdmin, getAppSettings);
router.post("/app-settings", authAdmin, createAppSetting);
router.patch("/app-settings/:id", authAdmin, updateAppSetting);

/* ANNOUNCEMENTS */
router.get("/announcements", authAdmin, getAnnouncements);
router.post("/announcements", authAdmin, createAnnouncement);
router.patch("/announcements/:id", authAdmin, updateAnnouncement);
router.delete("/announcements/:id", authAdmin, deleteAnnouncement);

router.get("/document-templates", authAdmin, adminController.getDocumentTemplates);
router.get("/document-templates/:id", authAdmin, adminController.getDocumentTemplateById);
router.patch("/document-templates/:id", authAdmin, adminController.updateDocumentTemplate);
router.post("/document-templates", authAdmin, adminController.createDocumentTemplate);

router.get("/project-weeks", authAdmin, adminController.getProjectWeeks);
router.patch( "/project-weeks/:week", authAdmin, adminController.updateProjectWeek );

module.exports = router;
