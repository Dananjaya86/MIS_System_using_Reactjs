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

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

