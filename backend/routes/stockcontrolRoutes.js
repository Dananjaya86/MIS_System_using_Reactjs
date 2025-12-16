const express = require("express");
const router = express.Router();
const controller = require("../controllers/stockcontrolController");

/* Popup product list */
router.get("/products", controller.getProducts);

/* Available stock */
router.get("/available/:code", controller.getAvailableStock);

/* Save adjustment */
router.post("/adjustment", controller.saveStockAdjustment);

/* Load adjustments (2nd grid) */
router.get("/adjustments", controller.getStockAdjustments);

/* Single adjustment for PDF */
router.get("/adjustment/:id", controller.getSingleAdjustment);



module.exports = router;
