const { poolPromise, sql } = require("../db");


async function generateOrderNo() {
  const pool = await poolPromise;
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");

  const prefix = `ORD${yy}${mm}`;

  const result = await pool
    .request()
    .input("prefix", sql.VarChar, `${prefix}%`)
    .query(`SELECT MAX(order_no) AS lastNo FROM [Order] WHERE order_no LIKE @prefix`);

  let nextSeq = 1;
  if (result.recordset[0].lastNo) {
    const last = result.recordset[0].lastNo;
    nextSeq = parseInt(last.slice(-5)) + 1;
  }

  return `${prefix}${String(nextSeq).padStart(5, "0")}`;
}


exports.getNewOrderNo = async (req, res) => {
  try {
    const orderNo = await generateOrderNo();
    res.json({ orderNo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getActiveSuppliers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT sup_code, sup_name
      FROM Supplier_Details
      WHERE active = 'Yes'
      ORDER BY sup_name
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.getProducts = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT product_code, product_name
    FROM Product_Details where goods_type='Raw Material'
    ORDER BY product_name
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};





exports.saveMaterialOrder = async (req, res) => {
  const {
    orderNo,
    supplierCode,
    supplierName,
    totalOrderAmount,
    advancePay,
    balanceToBePay,
    loginUser,
    orderDate,
    items,
  } = req.body;

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

   
    await transaction
      .request()
      .input("order_no", sql.VarChar, orderNo)
      .input("supplier_code", sql.VarChar, supplierCode)
      .input("supplier_name", sql.VarChar, supplierName)
      .input("total_order_amount", sql.Decimal(18, 2), totalOrderAmount)
      .input("advance_pay", sql.Decimal(18, 2), advancePay)
      .input("balance_to_be_pay", sql.Decimal(18, 2), balanceToBePay)
      .input("login_user", sql.VarChar, loginUser)
      .input("real_date", sql.DateTime, new Date())
      .input("date", sql.Date, orderDate)
      .query(`
        INSERT INTO [Order]
        (order_no, supplier_code, supplier_name, total_order_amount, advance_pay, balance_to_be_pay, login_user, real_date, date)
        VALUES (@order_no, @supplier_code, @supplier_name, @total_order_amount, @advance_pay, @balance_to_be_pay, @login_user, @real_date, @date)
      `);

    
    for (const row of items) {
      await transaction
        .request()
        .input("order_no", sql.VarChar, orderNo)
        .input("product_code", sql.VarChar, row.productCode)
        .input("product_name", sql.VarChar, row.productName)
        .input("available_stock", sql.Float, row.availableStock)
        .input("order_qty", sql.Float, row.orderQty)
        .input("amount", sql.Decimal(18, 2), row.amount)
        .query(`
          INSERT INTO Order_Details
          (order_no, product_code, product_name, available_stock, order_qty, amount)
          VALUES (@order_no, @product_code, @product_name, @available_stock, @order_qty, @amount)
        `);
    }

    await transaction.commit();
    res.json({ message: "Order saved successfully" });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ message: err.message });
  }
};



exports.getAdvancePayment = async (req, res) => {
  const { partyCode } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("partyCode", sql.VarChar(50), partyCode)
      .query(`
        SELECT advance_payment_amount
        FROM Advance_Payment_Details
        WHERE party_code = @partyCode
          AND status = 'Pending'
      `);

    const payments = result.recordset.map(r => parseFloat(r.advance_payment_amount));
    const sum = payments.reduce((acc, val) => acc + val, 0);

    res.json({ sum, breakdown: payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch advance payment" });
  }
};


exports.getProductStockAndPrice = async (req, res) => {
  const { productCode } = req.params;

  try {
    const pool = await poolPromise;

    
    const stockResult = await pool
      .request()
      .input("productCode", sql.VarChar(50), productCode)
      .query(`
        SELECT TOP 1 available_stock
        FROM Stock_Details
        WHERE product_code = @productCode
        ORDER BY real_date DESC
      `);

    const availableStock =
      stockResult.recordset.length > 0
        ? stockResult.recordset[0].available_stock
        : 0;

    
    const priceResult = await pool
      .request()
      .input("productCode", sql.VarChar(50), productCode)
      .query(`
        SELECT unit_cost
        FROM Product_Details
        WHERE product_code = @productCode
      `);

    const unitCost =
      priceResult.recordset.length > 0
        ? priceResult.recordset[0].unit_cost
        : 0;

    res.json({
      availableStock,
      unitCost,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stock and price" });
  }
};

exports.searchOrders = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT order_no, supplier_name, date
      FROM [Order]
      ORDER BY real_date DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error loading orders" });
  }
};

exports.getOrderByNo = async (req, res) => {
  const { orderNo } = req.params;

  try {
    const pool = await poolPromise;

    const orderRes = await pool.request()
      .input("orderNo", orderNo)
      .query(`SELECT * FROM [Order] WHERE order_no=@orderNo`);

    const detailsRes = await pool.request()
      .input("orderNo", orderNo)
      .query(`
        SELECT d.*, p.unit_cost
        FROM Order_Details d
        LEFT JOIN Product_Details p 
          ON d.product_code = p.product_code
        WHERE d.order_no=@orderNo
      `);

    const supplierRes = await pool.request()
      .input("sup", orderRes.recordset[0].supplier_code)
      .query(`
        SELECT * FROM Supplier_Details WHERE sup_code=@sup
      `);

    res.json({
      order: orderRes.recordset[0],
      details: detailsRes.recordset,
      supplier: supplierRes.recordset[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error loading order" });
  }
};

