const express = require("express");
const router = express.Router();
const recController = require("../controllers/recController");

router.get("/pending", recController.getPendingBankRows);

router.post("/save", recController.saveReconciliation);

router.get("/pending-statements", recController.getPendingBankStatements);

router.post("/delete-bank", recController.deleteBankStatement);



module.exports = router;
