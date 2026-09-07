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

// ============================================================
// FORGOT USERNAME
// ============================================================

const forgotUsername = async (req, res) => {
  const { employeeNo, idNo } = req.body;

  if (!employeeNo || !idNo) {
    return res.status(400).json({
      success: false,
      message: "Employee No and ID No are required",
    });
  }

  try {
    const pool = await poolPromise;

    const result = await pool
      .request()
      .input(
        "employeeNo",
        sql.VarChar(50),
        employeeNo.trim()
      )
      .input(
        "idNo",
        sql.VarChar(100),
        idNo.trim()
      )
      .query(`
        SELECT
          l.username,
          l.employeeNo
        FROM dbo.login_details l
        INNER JOIN dbo.Admin_Panel a
          ON a.employeeNo = l.employeeNo
        WHERE l.employeeNo = @employeeNo
          AND a.idNo = @idNo
          AND l.active = 'Yes'
          AND a.active = 'Yes'
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee details could not be verified",
      });
    }

    return res.json({
      success: true,
      username: result.recordset[0].username,
    });

  } catch (err) {
    console.error("Forgot username error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ============================================================
// FORGOT PASSWORD
// ============================================================

const forgotPassword = async (req, res) => {
  const {
    employeeNo,
    idNo,
    newPassword,
  } = req.body;

  if (!employeeNo || !idNo || !newPassword) {
    return res.status(400).json({
      success: false,
      message:
        "Employee No, ID No and new password are required",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message:
        "Password must contain at least 6 characters",
    });
  }

  try {
    const pool = await poolPromise;

    // --------------------------------------------------------
    // Verify employee
    // --------------------------------------------------------

    const verifyResult = await pool
      .request()
      .input(
        "employeeNo",
        sql.VarChar(50),
        employeeNo.trim()
      )
      .input(
        "idNo",
        sql.VarChar(100),
        idNo.trim()
      )
      .query(`
        SELECT l.employeeNo
        FROM dbo.login_details l
        INNER JOIN dbo.Admin_Panel a
          ON a.employeeNo = l.employeeNo
        WHERE l.employeeNo = @employeeNo
          AND a.idNo = @idNo
          AND l.active = 'Yes'
          AND a.active = 'Yes'
      `);

    if (verifyResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee details could not be verified",
      });
    }

    // --------------------------------------------------------
    // Hash new password
    // --------------------------------------------------------

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    // --------------------------------------------------------
    // Update password
    // --------------------------------------------------------

    await pool
      .request()
      .input(
        "employeeNo",
        sql.VarChar(50),
        employeeNo.trim()
      )
      .input(
        "password",
        sql.VarChar(255),
        hashedPassword
      )
      .query(`
        UPDATE dbo.login_details
        SET password = @password,
            active = 'Yes'
        WHERE employeeNo = @employeeNo
      `);

    return res.json({
      success: true,
      message: "Password reset successfully",
    });

  } catch (err) {
    console.error("Forgot password error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};




// ============================================================
// EXPORT
// ============================================================

module.exports = {
  login,
  forgotUsername,
  forgotPassword,
};


