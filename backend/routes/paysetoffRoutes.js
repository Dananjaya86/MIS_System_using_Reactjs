const express = require("express");
const router = express.Router();
const controller = require("../controllers/paysetoffController");

router.get("/pending", controller.getPendingPayments);
router.get("/advance", controller.getAdvancePayments);
router.get("/advance/by-party", controller.getAdvanceByParty);
router.post("/save", controller.savePaymentSetoff);

module.exports = router;
