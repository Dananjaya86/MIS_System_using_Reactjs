const { poolPromise, sql } = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "rilawala158853mattegoda";

const login = async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password required" });
  }

  try {
    const pool = await poolPromise;

    console.log("🔍 Login attempt:", { username, password });

    const result = await pool.request()
      .input("username", sql.NVarChar(100), username.trim())
      .query(`
        SELECT employeeNo, username, password, active
        FROM dbo.login_details
        WHERE username=@username
      `);

    if (!result.recordset.length) {
      console.log("❌ Username not found:", username);
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const user = result.recordset[0];
    console.log("✅ Found user in DB:", user);

    // Check active "yes or no"
    if (user.active && user.active.toLowerCase() !== "yes") {
      console.log("❌ Inactive user:", username);
      return res.status(403).json({ success: false, message: "User inactive" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🧩 bcrypt.compare result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password mismatch for:", username);
      console.log("🔹 Entered password:", password);
      console.log("🔹 Stored hash:", user.password);
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    // JWT token get
    const token = jwt.sign(
      { username: user.username, employeeNo: user.employeeNo },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("✅ Login successful for:", username);

    return res.json({
      success: true,
      token,
      username: user.username,
      employeeNo: user.employeeNo,
      message: "Login successful"
    });

  } catch (err) {
    console.error("💥 Login error:", err);
    return res.status(500).json({ success: false, message: "Server error", details: err.message });
  }
};

module.exports = { login };
