    const express = require("express");
    const router = express.Router();
    const controller = require("../controllers/materialOrderController");


    
    router.get("/new-order-no", controller.getNewOrderNo);

    
    router.get("/suppliers", controller.getActiveSuppliers);

    
    router.post("/save", controller.saveMaterialOrder);

    router.get("/products", controller.getProducts);

    
   router.get("/advance-payment/:partyCode", controller.getAdvancePayment);

   router.get("/product-info/:productCode", controller.getProductStockAndPrice);

   router.get("/search", controller.searchOrders);
   
   router.get("/:orderNo", controller.getOrderByNo);





    module.exports = router;
