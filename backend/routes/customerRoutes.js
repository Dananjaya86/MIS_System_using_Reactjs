const express = require("express");
const customerController = require("../controllers/customerController");

const router = express.Router();

router.get("/nextcode", customerController.getNextCustomerCode);
router.get("/", customerController.getAllCustomers);
router.get("/:customer_code", customerController.getCustomerByCode);
router.post("/", customerController.addCustomer);
router.put("/:customer_code", customerController.updateCustomer);
router.delete("/:customer_code", customerController.deleteCustomer);

module.exports = router;

