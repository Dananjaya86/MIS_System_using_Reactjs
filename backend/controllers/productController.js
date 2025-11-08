
const { poolPromise } = require("../db");


async function logActivity({ code, action, login_user }) {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("code", code)
      .input("action", action)
      .input("login_user", login_user || "admin")
      .input("date", new Date())
      .query(`
        INSERT INTO Login_Ledger (code, action, active, login_user, date)
        VALUES (@code, @action, 'Yes', @login_user, @date)
      `);
    console.log(`✅ Logged activity: ${action} - ${code} by ${login_user}`);
  } catch (err) {
    console.error("❌ logActivity error:", err.message);
  }
}


async function generateNextProductCode(goodsType) {
  const pool = await poolPromise;
  const prefix = goodsType === "Raw Material" ? "RM" : "FG";

  const result = await pool.request().query(`
    SELECT TOP 1 product_code
    FROM Product_Details
    WHERE product_code LIKE '${prefix}%'
    ORDER BY product_code DESC
  `);

  if (!result.recordset.length) return `${prefix}00001`;

  const last = result.recordset[0].product_code;
  const num = parseInt(last.replace(prefix, ""), 10) || 0;
  return `${prefix}${(num + 1).toString().padStart(5, "0")}`;
}


exports.getNextProductCode = async (req, res) => {
  try {
    const goodsType = req.params.type === "RM" ? "Raw Material" : "Finish Goods";
    const nextCode = await generateNextProductCode(goodsType);
    res.json({ success: true, nextCode });
  } catch (err) {
    console.error("getNextProductCode error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};


exports.getAllProducts = async (req, res) => {
  try {
    const login_user = req.query.user || "admin";
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM Product_Details
      WHERE active = 'Yes'
      ORDER BY product_code ASC
    `);

    
    await logActivity({ code: "PROD", action: "Visit", login_user });

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("getAllProducts error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};


exports.getProductByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const pool = await poolPromise;
    const result = await pool.request()
      .input("code", code)
      .query("SELECT * FROM Product_Details WHERE product_code = @code");

    if (!result.recordset.length)
      return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error("getProductByCode error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};


exports.createProduct = async (req, res) => {
  try {
    let {
      product_code,
      product_name,
      units,
      supplier_code,
      supplier_name,
      available_stock,
      unit_cost,
      qty,
      retail_price,
      whole_sale_price,
      goods_type,
      login_user,
      real_date
    } = req.body;

    
    available_stock = Number(available_stock) || 0;
    unit_cost = Number(unit_cost) || 0;
    qty = Number(qty) || 0;
    retail_price = Number(retail_price) || 0;
    whole_sale_price = Number(whole_sale_price) || 0;

    const pool = await poolPromise;

    
    await pool.request()
      .input("product_code", product_code)
      .input("product_name", product_name)
      .input("units", units)
      .input("supplier_code", supplier_code)
      .input("supplier_name", supplier_name)
      .input("available_stock", available_stock)
      .input("unit_cost", unit_cost)
      .input("qty", qty)
      .input("retail_price", retail_price)
      .input("whole_sale_price", whole_sale_price)
      .input("goods_type", goods_type)
      .input("user_name", login_user || "admin")
      .input("real_date", real_date ? new Date(real_date) : new Date())
      .query(`
        INSERT INTO Product_Details 
        (product_code, product_name, units, supplier_code, supplier_name, available_stock, 
         unit_cost, qty, retail_price, whole_sale_price, goods_type, user_name, real_date, active)
        VALUES 
        (@product_code, @product_name, @units, @supplier_code, @supplier_name, @available_stock, 
         @unit_cost, @qty, @retail_price, @whole_sale_price, @goods_type, @user_name, @real_date, 'Yes')
      `);

    
    try {
      await pool.request()
        .input("product_code", product_code)
        .input("unit_price", unit_cost)
        .input("date", real_date ? new Date(real_date) : new Date())
        .input("login_user", login_user || "admin")
        .query(`
          INSERT INTO Product_Price (product_code, unit_price, date, login_user)
          VALUES (@product_code, @unit_price, @date, @login_user)
        `);
    } catch (errPrice) {
      console.warn("product_price insert failed:", errPrice.message);
    }

    
    await logActivity({ code: product_code, action: "Save", login_user });

    res.json({ success: true, message: "Product saved successfully" });
  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};


exports.updateProduct = async (req, res) => {
  try {
    let {
      product_code,
      product_name,
      units,
      supplier_code,
      supplier_name,
      available_stock,
      unit_cost,
      qty,
      retail_price,
      whole_sale_price,
      goods_type,
      login_user,
      real_date
    } = req.body;

    available_stock = Number(available_stock) || 0;
    unit_cost = Number(unit_cost) || 0;
    qty = Number(qty) || 0;
    retail_price = Number(retail_price) || 0;
    whole_sale_price = Number(whole_sale_price) || 0;

    const pool = await poolPromise;

    await pool.request()
      .input("product_code", product_code)
      .input("product_name", product_name)
      .input("units", units)
      .input("supplier_code", supplier_code)
      .input("supplier_name", supplier_name)
      .input("available_stock", available_stock)
      .input("unit_cost", unit_cost)
      .input("qty", qty)
      .input("retail_price", retail_price)
      .input("whole_sale_price", whole_sale_price)
      .input("goods_type", goods_type)
      .input("user_name", login_user || "admin")
      .input("real_date", real_date ? new Date(real_date) : new Date())
      .query(`
        UPDATE Product_Details
        SET product_name=@product_name, units=@units, supplier_code=@supplier_code, supplier_name=@supplier_name,
            available_stock=@available_stock, unit_cost=@unit_cost, qty=@qty, 
            retail_price=@retail_price, whole_sale_price=@whole_sale_price, goods_type=@goods_type,
            user_name=@user_name, real_date=@real_date
        WHERE product_code=@product_code
      `);

    
    try {
      await pool.request()
        .input("product_code", product_code)
        .input("unit_price", unit_cost)
        .input("date", real_date ? new Date(real_date) : new Date())
        .input("login_user", login_user || "admin")
        .query(`
          INSERT INTO Product_Price (product_code, unit_price, date, login_user)
          VALUES (@product_code, @unit_price, @date, @login_user)
        `);
    } catch (errPrice) {
      console.warn("product_price insert (update) failed:", errPrice.message);
    }

    await logActivity({ code: product_code, action: "Edit", login_user });

    res.json({ success: true, message: "Product updated successfully" });
  } catch (err) {
    console.error("updateProduct error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};


exports.deleteProduct = async (req, res) => {
  try {
    
    const { code, login_user, real_date } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Missing product code" });

    const pool = await poolPromise;

    await pool.request()
      .input("code", code)
      .input("user_name", login_user || "admin")
      .input("real_date", real_date ? new Date(real_date) : new Date())
      .query(`
        UPDATE Product_Details 
        SET active = 'No', user_name=@user_name, real_date=@real_date
        WHERE product_code = @code
      `);

    await logActivity({ code, action: "Delete", login_user });

    res.json({ success: true, message: "Product marked as inactive" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};


exports.logPageVisit = async (req, res) => {
  try {
    const { login_user, real_date } = req.body;
    const pool = await poolPromise;
    await pool.request()
      .input("code", "PROD")
      .input("action", "Visit")
      .input("login_user", login_user || "admin")
      .input("date", real_date ? new Date(real_date) : new Date())
      .query(`
        INSERT INTO Login_Ledger (code, action, active, login_user, date)
        VALUES (@code, @action, 'Yes', @login_user, @date)
      `);
    res.json({ success: true, message: "Visit logged" });
  } catch (err) {
    console.error("logPageVisit error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};


exports.searchSuppliers = async (req, res) => {
  try {
    const q = req.query.q || "";
    const pool = await poolPromise;
    const result = await pool.request()
      .input("search", `%${q}%`)
      .query(`
        SELECT TOP 10 sup_code, sup_name
        FROM Supplier_Details
        WHERE active='Yes' AND (sup_code LIKE @search OR sup_name LIKE @search)
        ORDER BY sup_name
      `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("searchSuppliers error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};
