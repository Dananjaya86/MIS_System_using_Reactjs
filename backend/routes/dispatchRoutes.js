// routes/dispatchRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/goodsDispatchController");

// generate new dispatch number
router.get("/newno", controller.generateDispatchNo);

// list products (popup). optional ?q= filter
router.get("/products", controller.getProducts);

// get single product by code
router.get("/products/:code", controller.getProductByCode);

// save many dispatch rows
router.post("/save", controller.saveDispatchNotes);

module.exports = router;
