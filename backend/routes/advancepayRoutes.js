const express = require("express");
const router = express.Router();
const advancepayController = require("../controllers/advancepayController");

router.get("/all", advancepayController.getAdvancePayments);

router.get("/search/customers", advancepayController.searchCustomers);
router.get("/search/suppliers", advancepayController.searchSuppliers);
// Get next Advance Payment ID
router.get("/next-id", advancepayController.getNextAdvancePayId);

// Save Advance Payment
router.post("/save", advancepayController.saveAdvancePayment);

router.put("/update-status/:id", advancepayController.cancelAdvancePayment);
   



module.exports = router;
