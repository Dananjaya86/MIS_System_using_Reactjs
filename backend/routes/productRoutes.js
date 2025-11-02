const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

console.log("✅ productRoutes loaded");

router.get("/code/:type", productController.getNextProductCode);

router.get("/", productController.getAllProducts);

router.get("/:code", productController.getProductByCode);

router.post("/save", productController.createProduct);

router.put("/update", productController.updateProduct);

router.delete("/delete", productController.deleteProduct);

router.post("/visit", productController.logPageVisit);

router.get("/suppliers/search", productController.searchSuppliers);



module.exports = router;
