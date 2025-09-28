const { poolPromise, sql } = require("../db");

// mapping between DB column names and frontend permission labels
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

function rowToFrontend(row) {
  // Build permissions object expected by frontend
  const permissions = {};
  PERMISSION_MAP.forEach(p => {
    permissions[p.label] = !!row[p.col];
  });

  // keep other fields
  return {
    id: row.id !== undefined ? row.id : row.employeeNo, // use id if exists otherwise employeeNo for keying
    employeeNo: row.employeeNo,
    idNo: row.idNo,
    firstName: row.firstName,
    lastName: row.lastName,
    callingName: row.callingName,
    address: row.address,
    position: row.position,
    permissions
  };
}

// Add a new admin
exports.addAdmin = async (req, res) => {
  try {
    const {
      employeeNo, idNo, firstName, lastName, callingName, address, position, permissions = {}
    } = req.body;

    // require employeeNo numeric
    const empNo = parseInt(employeeNo, 10);
    if (Number.isNaN(empNo)) {
      return res.status(400).json({ error: "employeeNo must be a number" });
    }

    const pool = await poolPromise;

    const request = pool.request()
      .input("employeeNo", sql.Int, empNo)
      .input("idNo", sql.VarChar(100), idNo || "")
      .input("firstName", sql.VarChar(100), firstName || "")
      .input("lastName", sql.VarChar(100), lastName || "")
      .input("callingName", sql.VarChar(100), callingName || "")
      .input("address", sql.VarChar(500), address || "")
      .input("position", sql.VarChar(100), position || "");

    // add permission inputs
    PERMISSION_MAP.forEach(p => {
      const val = permissions[p.label] ? 1 : 0;
      request.input(p.col, sql.Bit, val);
    });

    await request.query(`
      INSERT INTO Admin_Panel
      (employeeNo, idNo, firstName, lastName, callingName, address, position,
        ${PERMISSION_MAP.map(p => p.col).join(", ")})
      VALUES
      (@employeeNo, @idNo, @firstName, @lastName, @callingName, @address, @position,
        ${PERMISSION_MAP.map(p => "@" + p.col).join(", ")})
    `);

    res.json({ message: "✅ Admin added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message || "Server error");
  }
};

// Get all admins
exports.getAdmins = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Admin_Panel ORDER BY employeeNo");
    const mapped = result.recordset.map(rowToFrontend);
    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message || "Server error");
  }
};

// Get admin by employeeNo
exports.getAdminById = async (req, res) => {
  try {
    const { employeeNo } = req.params;
    const empNo = parseInt(employeeNo, 10);
    if (Number.isNaN(empNo)) {
      return res.status(400).json({ error: "employeeNo must be a number" });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input("employeeNo", sql.Int, empNo)
      .query("SELECT * FROM Admin_Panel WHERE employeeNo = @employeeNo");

    if (!result.recordset || result.recordset.length === 0) {
      return res.json(null);
    }

    res.json(rowToFrontend(result.recordset[0]));
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message || "Server error");
  }
};

// Update admin (including permissions)
exports.updateAdmin = async (req, res) => {
  try {
    const {
      employeeNo, idNo, firstName, lastName, callingName, address, position, permissions = {}
    } = req.body;

    const empNo = parseInt(employeeNo, 10);
    if (Number.isNaN(empNo)) {
      return res.status(400).json({ error: "employeeNo must be a number" });
    }

    const pool = await poolPromise;
    const request = pool.request()
      .input("employeeNo", sql.Int, empNo)
      .input("idNo", sql.VarChar(100), idNo || "")
      .input("firstName", sql.VarChar(100), firstName || "")
      .input("lastName", sql.VarChar(100), lastName || "")
      .input("callingName", sql.VarChar(100), callingName || "")
      .input("address", sql.VarChar(500), address || "")
      .input("position", sql.VarChar(100), position || "");

    PERMISSION_MAP.forEach(p => {
      const val = permissions[p.label] ? 1 : 0;
      request.input(p.col, sql.Bit, val);
    });

    // Build SET clause for permissions + base fields
    const setFields = [
      "idNo = @idNo",
      "firstName = @firstName",
      "lastName = @lastName",
      "callingName = @callingName",
      "address = @address",
      "position = @position",
      ...PERMISSION_MAP.map(p => `${p.col} = @${p.col}`)
    ];

    const sqlQuery = `
      UPDATE [Admin_Panel]
      SET ${setFields.join(", ")}
      WHERE employeeNo = @employeeNo
    `;

    await request.query(sqlQuery);

    res.json({ message: "✅ Admin updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message || "Server error");
  }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    const { employeeNo } = req.params;
    const empNo = parseInt(employeeNo, 10);
    if (Number.isNaN(empNo)) {
      return res.status(400).json({ error: "employeeNo must be a number" });
    }

    const pool = await poolPromise;
    await pool.request()
      .input("employeeNo", sql.Int, empNo)
      .query("DELETE FROM [Admin_Panel] WHERE employeeNo = @employeeNo");

    res.json({ message: "✅ Admin deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message || "Server error");
  }
};
