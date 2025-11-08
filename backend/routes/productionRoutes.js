const express = require("express");
const router = express.Router();
const controller = require("../controllers/productionController");

router.get("/finish-goods", controller.getFinishGoods);
router.get("/raw-materials", controller.getRawMaterials);
router.get("/generate-batch", controller.generateBatchNo);
router.post("/save", controller.saveProduction);
router.put("/edit", controller.editProduction);
router.post("/delete", controller.deleteProduction);

module.exports = router;
