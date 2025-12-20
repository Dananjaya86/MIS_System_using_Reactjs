const { poolPromise, sql } = require("../db");

/* ---------------------------------------------------
    Product popup (code + name)
--------------------------------------------------- */
exports.getProducts = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT product_code, product_name
      FROM Product_Details
      ORDER BY product_name
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------------------------------------------
    Available stock by product code (LATEST)
--------------------------------------------------- */
exports.getAvailableStock = async (req, res) => {
  try {
    const { code } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("code", sql.VarChar, code)
      .query(`
        SELECT TOP 1 available_stock
        FROM Stock_Details
        WHERE product_code = @code
        ORDER BY real_date DESC
      `);

    res.json(result.recordset[0] || { available_stock: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------------------------------------------
    Save stock adjustment + UPDATE STOCK_DETAILS
--------------------------------------------------- */
exports.saveStockAdjustment = async (req, res) => {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    // ✅ Convert all incoming values to correct types
    const product_code   = req.body.product_code;
    const product_name   = req.body.product_name;
    const available_stock = parseFloat(req.body.available_stock) || 0;  // old stock
    const physical_stock  = parseFloat(req.body.physical_stock)  || 0;  // final stock
    const adjustment_in   = parseFloat(req.body.adjustment_in)   || 0;
    const adjustment_out  = parseFloat(req.body.adjustment_out)  || 0;
    const differance      = parseFloat(req.body.differance)      || 0;
    const remarks         = req.body.remarks || "";
    const login_user      = req.body.login_user || "Unknown";

    /* -------- VALIDATION -------- */
    if (!product_code || !product_name) {
      return res.status(400).json({ message: "Product required" });
    }

    await transaction.begin();

    /* ---------------------------------------------------
        Save Stock Adjustment (HISTORY)
    --------------------------------------------------- */
    await transaction.request()
      .input("product_code", sql.VarChar, product_code)
      .input("product_name", sql.VarChar, product_name)
      .input("available_stock", sql.Float, available_stock)
      .input("physical_stock", sql.Float, physical_stock)
      .input("adjustment_in", sql.Float, adjustment_in)
      .input("adjustment_out", sql.Float, adjustment_out)
      .input("differance", sql.Float, differance)
      .input("remarks", sql.VarChar, remarks)
      .input("login_user", sql.VarChar, login_user)
      .query(`
        INSERT INTO Stock_Adjustment
        (
          product_code, product_name, available_stock,
          physical_stock, adjustment_in, adjustment_out,
          differance, remarks, login_user, real_date
        )
        VALUES
        (
          @product_code, @product_name, @available_stock,
          @physical_stock, @adjustment_in, @adjustment_out,
          @differance, @remarks, @login_user, GETDATE()
        )
      `);

    /* ---------------------------------------------------
        Get CURRENT available stock
    --------------------------------------------------- */
    const currentStock = await transaction.request()
      .input("product_code", sql.VarChar, product_code)
      .query(`
        SELECT TOP 1 available_stock
        FROM Stock_Details
        WHERE product_code = @product_code
        ORDER BY real_date DESC
      `);

    let currentAvailable = 0;
    if (currentStock.recordset.length > 0) {
      currentAvailable = parseFloat(currentStock.recordset[0].available_stock) || 0;
    }

    /* ---------------------------------------------------
      Calculate stock movement (stock_in / stock_out)
    --------------------------------------------------- */
    let stockIn = 0;
let stockOut = 0;

if (physical_stock > available_stock) {
  stockIn = physical_stock - available_stock;
} 
else if (physical_stock < available_stock) {
  stockOut = available_stock - physical_stock;
}


    /* ---------------------------------------------------
       Insert into Stock_Details 
    --------------------------------------------------- */
   await transaction.request()
  .input("product_code", sql.VarChar, product_code)
  .input("product_name", sql.VarChar, product_name)
  .input("stock_in", sql.Float, stockIn)
  .input("stock_out", sql.Float, stockOut)
  .input("available_stock", sql.Float, physical_stock)
  .input("login_user", sql.VarChar, login_user)
  .query(`
    INSERT INTO Stock_Details
    (
      product_code,
      product_name,
      stock_in,
      stock_out,
      available_stock,
      login_user,
      real_date
    )
    VALUES
    (
      @product_code,
      @product_name,
      @stock_in,
      @stock_out,
      @available_stock,
      @login_user,
      GETDATE()
    )
  `);


    await transaction.commit();

    res.json({ message: "Stock adjustment & stock updated successfully" });

  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ message: err.message });
  }
};

/* ---------------------------------------------------
   Load saved adjustments (2nd grid)
--------------------------------------------------- */
exports.getStockAdjustments = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT *
      FROM Stock_Adjustment
      ORDER BY real_date DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------------------------------------------------
   Get single adjustment (PDF / View)
--------------------------------------------------- */
exports.getSingleAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    const result = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        SELECT *
        FROM Stock_Adjustment
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Adjustment not found" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

