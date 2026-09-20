const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

const {
  createOrder,
  verifyPayment,
  previewPrice,
  downloadInvoicehtmlpdf,
  previewAllPrices,
  recoverPayment ,
} = require("../controllers/payment");

router.post("/create-order", auth, createOrder);
router.post("/verify", auth, verifyPayment);
router.post( "/preview", auth, previewPrice );
router.get("/:paymentId/invoice", auth, downloadInvoicehtmlpdf);
router.post("/preview-all", auth, previewAllPrices);
router.post("/recover", auth, recoverPayment);

module.exports = router;
