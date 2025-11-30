   
    const express = require("express");
    const router = express.Router();
    const invoiceController = require("../controllers/invoiceController");

   
    router.get("/customers", invoiceController.getAllCustomers);


    router.get("/customers/payment-info/:code", invoiceController.getCustomerPaymentInfo);

    router.get("/customers/:code", invoiceController.getCustomerByCode);

    router.get("/products", invoiceController.getAllProducts);

   
    router.get("/products/:code", invoiceController.getProductByCode);

   
 
    router.get("/invoice/generate", invoiceController.generateInvoiceNumber);

   
    router.get("/search", invoiceController.searchInvoices);

    router.get("/details/:invoiceNo", invoiceController.getInvoiceDetails);

    
    router.post("/invoice/save", invoiceController.saveInvoice);

    // invoiceRoutes.js
    router.get("/invoice/pdf/:invoiceNo", invoiceController.generateInvoicePdf);
    router.get("/invoice/print/:invoiceNo", invoiceController.generateInvoicePdf);














    module.exports = router;
