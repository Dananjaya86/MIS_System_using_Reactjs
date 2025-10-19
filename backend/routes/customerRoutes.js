// backend/routes/customerRoutes.js
const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customerController");

// ledger entry (client can post generic ledger entries)
router.post("/ledger", customerController.addLedgerEntry);

// next code
router.get("/nextcode", customerController.getNextCustomerCode);

// customers CRUD
router.get("/", customerController.getAllCustomers);
router.get("/:customer_code", customerController.getCustomerByCode);
router.post("/", customerController.addCustomer);
router.put("/:customer_code", customerController.updateCustomer);
router.delete("/:customer_code", customerController.deleteCustomer);

module.exports = router;


