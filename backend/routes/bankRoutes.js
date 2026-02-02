const express = require("express");
const router = express.Router();
const bankController = require("../controllers/bankController");

console.log("BANK ROUTES FILE LOADED");

router.get("/accounts", bankController.getBankAccounts);
router.post("/save", bankController.saveBankTransactions);

router.post("/cheque/save", bankController.saveChequeReturn);
router.get("/cheque/list", bankController.getChequeReturns);

router.post("/return-setoff", bankController.saveReturnSetoff);

router.get("/bank/return-cheque/settled", bankController.getSettledSetoffCheques);

router.get("/bank/return-cheque/search", bankController.searchSetoffByCheque);




module.exports = router;