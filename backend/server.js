const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const loginRoutes = require("./routes/loginRoutes");
const adminRoutes = require("./routes/adminRoutes");
const customerRoutes = require("./routes/customerRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const productRoutes = require("./routes/productRoutes");
const productionRoutes = require("./routes/productionRoutes");
const grnRoutes = require("./routes/grnRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const advancepayRoutes = require('./routes/advancepayRoutes');
const dispatchRoutes= require("./routes/dispatchRoutes");
const stockAdjustmentRoutes = require("./routes/stockcontrolRoutes");
const materialOrderRoutes = require("./routes/materialOrderRoutes");
const paysetoffRoutes = require("./routes/paysetoffRoutes");
const expencessRoutes = require("./routes/expencessRoutes");
const bankRoutes = require("./routes/bankRoutes");
const recRoutes = require("./routes/recRoutes");
const returnRoutes = require("./routes/returnRoutes");
const reportRoutes = require("./routes/reportRoutes");
const budgetRoutes = require("./routes/budgetRoute");
const dashboardRoutes = require("./routes/dashboardRoute");


const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());


app.use("/api/login", loginRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/products", productRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/grn", grnRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/advancepay", advancepayRoutes);
app.use("/api/dispatch" , dispatchRoutes);
app.use("/api/stockcontrol", stockAdjustmentRoutes);
app.use("/api/stock", stockAdjustmentRoutes);
app.use("/api/material-order", materialOrderRoutes);
app.use("/api/paysetoff", paysetoffRoutes);
app.use("/api/expencess", expencessRoutes);
app.use("/api/bank", bankRoutes);
app.use("/api/reconcile", recRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/dashboard", dashboardRoutes);





app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

