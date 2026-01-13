const express = require("express");
const router = express.Router();
const controller = require("../controllers/expencessController");


router.get("/types", controller.getExpencessTypes);
router.post("/types", controller.addExpencessType);


router.get("/bank_accounts", controller.getBankAccounts);
router.post("/bank_accounts", controller.addBankAccount);

router.post("/details", controller.saveExpense);


module.exports = router;
