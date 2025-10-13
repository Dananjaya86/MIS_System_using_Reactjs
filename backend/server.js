const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const loginRoutes = require("./routes/loginRoutes");
const adminRoutes = require("./routes/adminRoutes");
const customerRoutes = require("./routes/customerRoutes");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/login", loginRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customers", customerRoutes);  

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

