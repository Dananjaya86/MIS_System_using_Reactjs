const express = require("express");
const router = express.Router();
const supplierController = require("../controllers/supplierController");

// Ledger
router.post("/ledger", supplierController.createLedgerEntry);

// Supplier Routes
router.get("/nextcode", supplierController.getNextSupplierCode);
router.get("/", supplierController.getAllSuppliers);
router.get("/:sup_code", supplierController.getSupplierByCode);
router.post("/", supplierController.addSupplier);
router.put("/:sup_code", supplierController.updateSupplier);
router.delete("/:sup_code", supplierController.deleteSupplier);

module.exports = router;
