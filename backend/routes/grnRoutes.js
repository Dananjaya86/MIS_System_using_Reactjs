const express = require("express");
const router = express.Router();
const grnController = require("../controllers/grnController");

router.get("/new-number", grnController.getNextGrnNumber);
router.get("/suppliers", grnController.searchSuppliers);
router.get("/suppliers/:code", grnController.getSupplierByCode);
router.get("/products", grnController.searchProducts);
router.get("/products/:code", grnController.getProductByCode);
router.post("/save", grnController.saveGrn);
router.post("/save-grid", grnController.saveGrnGrid);
router.get("/pdf/:grn_no", grnController.generateGrnPdf);
router.get("/search", grnController.searchGrns);
router.get("/last", grnController.getLastGrns);
router.get("/:grn_no", grnController.getGrnByNumber);
router.get("/pending/:supplier_code", grnController.getPendingPayment);

module.exports = router;
