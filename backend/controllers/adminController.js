const { poolPromise, sql } = require("../db");
const bcrypt = require("bcryptjs");

// Map DB permission column with frontend labels
const PERMISSION_MAP = [
  { col: "customer_details", label: "Customer Details" },
  { col: "supplier_details", label: "Supplier Details" },
  { col: "product_details", label: "Product Details" },
  { col: "production", label: "Production" },
  { col: "grn", label: "GRN" },
  { col: "sale", label: "Sale" },
  { col: "advance_payment", label: "Advance Payment" },
  { col: "material_order", label: "Material Order" },
  { col: "goods_dispatch_note", label: "Goods Dispatch Note" },
  { col: "stock_control", label: "Stock Control" },
  { col: "payment_setoff", label: "Payment Setoff" },
  { col: "expenses", label: "Expenses" },
  { col: "bank", label: "Bank" },
  { col: "return_items", label: "Return" },
  { col: "report", label: "Reports" }
];


function mapRowToFrontend(row) {
  const permissions = {};
  PERMISSION_MAP.forEach(p => { permissions[p.label] = !!row[p.col]; });

  return {
    employeeNo: row.employeeNo,
    idNo: row.idNo,
    firstName: row.firstName,
    lastName: row.lastName,
    callingName: row.callingName,
    address: row.address,
    phoneNumber: row.phoneNumber,
    gender: row.gender,
    birthday: row.birthday,
    position: row.position,
    active: row.active,
    username: row.username || "",
    login_user: row.login_user || "",
    date: row.date || null,
    permissions
  };
}

// GET 
exports.getAllAdmins = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT a.*, l.username
      FROM Admin_Panel a
      LEFT JOIN dbo.login_details l
        ON a.employeeNo = l.employeeNo AND l.active = 'Yes'
      WHERE a.active = 'Yes'
      ORDER BY a.date DESC, a.employeeNo
    `);
    const admins = result.recordset.map(mapRowToFrontend);
    res.json(admins);
  } catch (err) {
    console.error("Error fetching admins:", err);
    res.status(500).json({ error: "Error fetching admins" });
  }
};

// GET genarateemployee no
exports.generateEmployeeNo = async (req, res) => {
  try {
    const { lastName } = req.params;
    if (!lastName) return res.status(400).json({ error: "Last name required" });

    const pool = await poolPromise;
    const countRes = await pool.request().query("SELECT COUNT(*) AS count FROM Admin_Panel");
    const count = countRes.recordset[0].count || 0;
    const employeeNo = lastName.charAt(0).toUpperCase() + String(count + 1).padStart(4, "0");
    res.json({ employeeNo });
  } catch (err) {
    console.error("Error generating employeeNo:", err);
    res.status(500).json({ error: "Error generating EmployeeNo" });
  }
};


exports.getAdminById = async (req, res) => {
  try {
    const { employeeNo } = req.params;
    if (!employeeNo) return res.status(400).json({ error: "employeeNo required" });

    const pool = await poolPromise;
    const result = await pool.request()
      .input("employeeNo", sql.VarChar(50), employeeNo)
      .query(`
        SELECT a.*, l.username
        FROM Admin_Panel a
        LEFT JOIN dbo.login_details l
          ON a.employeeNo = l.employeeNo AND l.active='Yes'
        WHERE a.employeeNo = @employeeNo AND a.active='Yes'
      `);

    if (!result.recordset.length) return res.status(404).json({ error: "Admin not found" });
    res.json(mapRowToFrontend(result.recordset[0]));
  } catch (err) {
    console.error("Error fetching admin by id:", err);
    res.status(500).json({ error: "Error fetching admin" });
  }
};

// POST 
exports.addAdmin = async (req, res) => {
  try {
    const {
      lastName, firstName, idNo, callingName, address,
      phoneNumber, gender, birthday, position,
      username, password, permissions = {}
    } = req.body;

    if (!lastName || !username || !password)
      return res.status(400).json({ error: "Missing required fields" });

    const pool = await poolPromise;

    // Generate employeeNo
    const countRes = await pool.request().query("SELECT COUNT(*) AS count FROM Admin_Panel");
    const employeeNo = lastName.charAt(0).toUpperCase() + String(countRes.recordset[0].count + 1).padStart(4, "0");

    // Hash password 
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into Admin_Panel
    const reqAdmin = pool.request()
      .input("employeeNo", sql.VarChar(50), employeeNo)
      .input("idNo", sql.VarChar(100), idNo || "")
      .input("firstName", sql.VarChar(100), firstName || "")
      .input("lastName", sql.VarChar(100), lastName)
      .input("callingName", sql.VarChar(100), callingName || "")
      .input("address", sql.VarChar(500), address || "")
      .input("phoneNumber", sql.VarChar(50), phoneNumber || "")
      .input("gender", sql.VarChar(7), gender || "")
      .input("birthday", sql.Date, birthday || null)
      .input("position", sql.VarChar(100), position || "")
      .input("login_user", sql.VarChar(100), req.user?.username || "")
      .input("date", sql.DateTime, new Date())
      .input("active", sql.VarChar(3), "Yes");

    PERMISSION_MAP.forEach(p => reqAdmin.input(p.col, sql.Bit, permissions[p.label] ? 1 : 0));

    const permCols = PERMISSION_MAP.map(p => p.col).join(", ");
    const permParams = PERMISSION_MAP.map(p => "@" + p.col).join(",");

    const insertSql = `
      INSERT INTO Admin_Panel (
        employeeNo, idNo, firstName, lastName, callingName, address,
        phoneNumber, gender, birthday, position, login_user, date, active, ${permCols}
      ) VALUES (
        @employeeNo, @idNo, @firstName, @lastName, @callingName, @address,
        @phoneNumber, @gender, @birthday, @position, @login_user, @date, @active, ${permParams}
      )
    `;
    await reqAdmin.query(insertSql);

    // Insert into login_details
    await pool.request()
      .input("employeeNo", sql.VarChar(50), employeeNo)
      .input("username", sql.VarChar(100), username)
      .input("password", sql.VarChar(255), hashedPassword)
      .input("active", sql.VarChar(3), "Yes")
      .query(`INSERT INTO dbo.login_details (employeeNo, username, password, active) VALUES (@employeeNo, @username, @password, @active)`);

    res.json({ success: true, employeeNo });

  } catch (err) {
    console.error("Error adding admin:", err);
    res.status(500).json({ error: "Error adding admin" });
  }
};

// PUT 
exports.updateAdmin = async (req, res) => {
  try {
    const { employeeNo } = req.params;
    if (!employeeNo) return res.status(400).json({ error: "employeeNo required" });

    const {
      idNo, firstName, lastName, callingName, address,
      phoneNumber, gender, birthday, position,
      username, password, permissions = {}
    } = req.body;

    const pool = await poolPromise;
    const reqAdmin = pool.request()
      .input("employeeNo", sql.VarChar(50), employeeNo)
      .input("idNo", sql.VarChar(100), idNo || "")
      .input("firstName", sql.VarChar(100), firstName || "")
      .input("lastName", sql.VarChar(100), lastName)
      .input("callingName", sql.VarChar(100), callingName || "")
      .input("address", sql.VarChar(500), address || "")
      .input("phoneNumber", sql.VarChar(50), phoneNumber || "")
      .input("gender", sql.VarChar(7), gender || "")
      .input("birthday", sql.Date, birthday || null)
      .input("position", sql.VarChar(100), position || "")
      .input("login_user", sql.VarChar(100), req.user?.username || "")
      .input("date", sql.DateTime, new Date());

    PERMISSION_MAP.forEach(p => reqAdmin.input(p.col, sql.Bit, permissions[p.label] ? 1 : 0));
    const setPerms = PERMISSION_MAP.map(p => `${p.col}=@${p.col}`).join(", ");

    const updateSql = `
      UPDATE Admin_Panel SET
        idNo=@idNo,
        firstName=@firstName,
        lastName=@lastName,
        callingName=@callingName,
        address=@address,
        phoneNumber=@phoneNumber,
        gender=@gender,
        birthday=@birthday,
        position=@position,
        ${setPerms},
        login_user=@login_user,
        date=@date
      WHERE employeeNo=@employeeNo AND active='Yes'
    `;
    const result = await reqAdmin.query(updateSql);
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: "Admin not found or inactive" });

    // Update login_details
    if (username || password) {
      const loginReq = pool.request().input("employeeNo", sql.VarChar(50), employeeNo);
      if (username) loginReq.input("username", sql.VarChar(100), username);
      if (password) loginReq.input("password", sql.VarChar(255), await bcrypt.hash(password, 10));

      const setLoginFields = [];
      if (username) setLoginFields.push("username=@username");
      if (password) setLoginFields.push("password=@password");
      setLoginFields.push("active='Yes'");

      await loginReq.query(`
        IF EXISTS (SELECT 1 FROM dbo.login_details WHERE employeeNo=@employeeNo AND active='Yes')
          UPDATE dbo.login_details SET ${setLoginFields.join(", ")} WHERE employeeNo=@employeeNo
        ELSE
          INSERT INTO dbo.login_details (employeeNo, username, password, active)
          VALUES (@employeeNo, ${username ? "@username" : "NULL"}, ${password ? "@password" : "NULL"}, 'Yes')
      `);
    }

    res.json({ success: true, message: "Admin updated successfully" });

  } catch (err) {
    console.error("Error updating admin:", err);
    res.status(500).json({ error: "Error updating admin" });
  }
};

// DELETE 
exports.deleteAdmin = async (req, res) => {
  try {
    const { employeeNo } = req.params;
    if (!employeeNo) return res.status(400).json({ error: "employeeNo required" });

    const pool = await poolPromise;
    await pool.request()
      .input("employeeNo", sql.VarChar(50), employeeNo)
      .input("login_user", sql.VarChar(100), req.user?.username || "")
      .input("date", sql.DateTime, new Date())
      .query(`UPDATE Admin_Panel SET active='No', login_user=@login_user, date=@date WHERE employeeNo=@employeeNo AND active='Yes'`);

    await pool.request()
      .input("employeeNo", sql.VarChar(50), employeeNo)
      .query(`UPDATE dbo.login_details SET active='No' WHERE employeeNo=@employeeNo AND active='Yes'`);

    res.json({ success: true, message: "Admin deleted (soft) successfully" });

  } catch (err) {
    console.error("Error deleting admin:", err);
    res.status(500).json({ error: "Error deleting admin" });
  }
};
