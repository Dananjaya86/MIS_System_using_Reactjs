// controllers/loginController.js
const { poolPromise, sql } = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "rilawala158853mattegoda";

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username & password required" });
  }

  try {
    const pool = await poolPromise;

    // Fetch user and permissions
    const result = await pool
      .request()
      .input("username", sql.NVarChar(100), username.trim())
      .query(`
        SELECT 
          l.employeeNo, l.username, l.password, l.active,
          ISNULL(a.customer_details,0) AS customer_details,
          ISNULL(a.supplier_details,0) AS supplier_details,
          ISNULL(a.product_details,0) AS product_details,
          ISNULL(a.production,0) AS production,
          ISNULL(a.grn,0) AS grn,
          ISNULL(a.sale,0) AS sale,
          ISNULL(a.advance_payment,0) AS advance_payment,
          ISNULL(a.material_order,0) AS material_order,
          ISNULL(a.goods_dispatch_note,0) AS goods_dispatch_note,
          ISNULL(a.stock_control,0) AS stock_control,
          ISNULL(a.payment_setoff,0) AS payment_setoff,
          ISNULL(a.expenses,0) AS expenses,
          ISNULL(a.bank,0) AS bank,
          ISNULL(a.return_items,0) AS return_items,
          ISNULL(a.report,0) AS report,
          ISNULL(a.admin,0) AS admin
        FROM dbo.login_details l
        LEFT JOIN dbo.Admin_Panel a ON a.employeeNo = l.employeeNo
        WHERE l.username = @username AND l.active = 'Yes'
      `);

    if (result.recordset.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    const user = result.recordset[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    // Build permissions object
    const permissions = {
      CustomerDetails: !!user.customer_details,
      SupplierDetails: !!user.supplier_details,
      ProductDetails: !!user.product_details,
      Production: !!user.production,
      GRN: !!user.grn,
      Sales: !!user.sale,
      AdvancePayment: !!user.advance_payment,
      MeterialOrder: !!user.material_order,
      GoodsDispatchNote: !!user.goods_dispatch_note,
      StockControl: !!user.stock_control,
      PaymentSetoff: !!user.payment_setoff,
      Expenses: !!user.expenses,
      Bank: !!user.bank,
      Return: !!user.return_items,
      Reports: !!user.report,
      Admin: !!user.admin,
    };

    // Create JWT
    const token = jwt.sign(
      { employeeNo: user.employeeNo, username: user.username, permissions },
      JWT_SECRET,
      { expiresIn: "7h" }
    );

    return res.json({
      success: true,
      token,
      username: user.username,
      permissions,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};

module.exports = { login };
