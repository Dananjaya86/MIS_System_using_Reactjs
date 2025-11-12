const express = require("express");
const router = express.Router();
const grnController = require("../controllers/grnController");

router.get("/new-number", grnController.getNextGrnNumber);
router.post("/save", grnController.saveGrn);
router.get("/suppliers", grnController.searchSuppliers);
router.get("/supplier/:code", grnController.getSupplierByCode);


router.get("/products", grnController.searchProducts);


module.exports = router;
