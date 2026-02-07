const express = require("express");
const router = express.Router();
const returnController = require("../controllers/returnController");

router.get("/products/search", returnController.searchProducts);

router.get("/customers/search", returnController.searchCustomers);
router.get("/suppliers/search", returnController.searchSuppliers);

router.get("/next-return-number", returnController.getNextReturnNumber);

router.post("/save", returnController.saveReturn);

router.get("/:returnNumber", returnController.getReturnDetails);


module.exports = router;