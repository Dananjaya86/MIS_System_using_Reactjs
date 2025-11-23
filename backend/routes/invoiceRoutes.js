// backend/routes/invoiceRoutes.js
const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");

console.log("✅ invoiceRoutes loaded");

// invoice next
router.get("/invoice/next/:type", invoiceController.getNextInvoiceNo);

// products
router.get("/products/search", invoiceController.searchProducts);
router.get("/products/:code", invoiceController.getProductByCode);

// customers
router.get("/customers/search", invoiceController.searchCustomers);
router.get("/customers/details/:code", invoiceController.getCustomerByCode); // explicit details route
router.get("/customers/:code", invoiceController.getCustomerByCode); // keep simple route too

module.exports = router;
