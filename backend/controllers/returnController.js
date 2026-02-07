  const { poolPromise, sql } = require("../db");

  
  exports.searchProducts = async (req, res) => {
    try {
      const { q } = req.query;

      if (!q || q.trim() === "") {
        return res.json([]);
      }

      const pool = await poolPromise;

      const result = await pool.request()
        .input("q", sql.VarChar(100), `%${q}%`)
        .query(`
          SELECT TOP 20 product_code, product_name
          FROM Product_Details
          WHERE product_code LIKE @q
            OR product_name LIKE @q
          ORDER BY product_name
        `);

      res.json(result.recordset);
    } catch (error) {
      console.error("Product Search Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  exports.searchCustomers = async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || q.trim() === "") return res.json([]);

      const pool = await poolPromise;

      const result = await pool.request()
        .input("search", sql.VarChar(200), `%${q}%`)
        .query(`
          SELECT TOP 10
            customer_code AS code,
            name AS name
          FROM Customer_Details
          WHERE customer_code LIKE @search
            OR name LIKE @search
        `);

      res.json(result.recordset);
    } catch (err) {
      console.log("🔴 CUSTOMER SEARCH ERROR:", err.message);
      res.status(500).json({ error: err.message });
    }
  };

  
  exports.searchSuppliers = async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || q.trim() === "") return res.json([]);

      const pool = await poolPromise;

      const result = await pool.request()
        .input("search", sql.VarChar(200), `%${q}%`)
        .query(`
          SELECT TOP 10
            sup_code AS code,
            sup_name AS name
          FROM Supplier_Details
          WHERE sup_code LIKE @search
            OR sup_name LIKE @search
        `);

      res.json(result.recordset);
    } catch (err) {
      console.log("🔴 SUPPLIER SEARCH ERROR:", err.message);
      res.status(500).json({ error: err.message });
    }
  };

  exports.getNextReturnNumber = async (req, res) => {
    try {
      const pool = await poolPromise;

      const result = await pool.request().query(`
        SELECT TOP 1 return_number
        FROM Return_Details
        ORDER BY
          CAST(SUBSTRING(return_number, 4, LEN(return_number)) AS INT) DESC
      `);

      if (result.recordset.length === 0) {
        return res.json({ returnNumber: "RTN00001" });
      }

      const last = result.recordset[0].return_number; 
      const num = parseInt(last.replace("RTN", "")) + 1;
      const next = "RTN" + String(num).padStart(5, "0");

      res.json({ returnNumber: next });
    } catch (err) {
      console.error("Return number error:", err);
      res.status(500).json({ message: "Server error" });
    }
  };

  exports.saveReturn = async (req, res) => {
    try {
      const { returnNumber, returnType, username, rows } = req.body;

      const pool = await poolPromise;

      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        for (let row of rows) {
          await transaction.request()
            .input("return_number", sql.VarChar(100), returnNumber)
            .input("return_type", sql.VarChar(100), returnType)
            .input("product_code", sql.VarChar(100), row.productCode)
            .input("product_name", sql.VarChar(100), row.productName)
            .input("qty", sql.Float, row.qty)
            .input("amount", sql.Decimal(18,2), row.amount)
            .input("ref_no", sql.VarChar(100), row.dispatchNo)
            .input("return_date", sql.Date, row.returnDate)
            .input("reason", sql.VarChar(100), row.reason)
  .input("reason_other", sql.VarChar(100), row.reason_other)
            .input("remaks", sql.VarChar(sql.MAX), row.remark || "")
            .input("party_code", sql.VarChar(100), row.customerSupplierCode || "")
            .input("party_name", sql.VarChar(100), row.customerSupplierName || "")
            .input("user_name", sql.VarChar(100), username)
            .query(`
              INSERT INTO Return_Details (
                return_number, return_type, product_code, product_name,
                qty, amount, ref_no, return_date,
                reason, reason_other, remaks,
                party_code, party_name, user_name, real_date
              ) VALUES (
                @return_number, @return_type, @product_code, @product_name,
                @qty, @amount, @ref_no, @return_date,
                @reason, @reason_other, @remaks,
                @party_code, @party_name, @user_name, GETDATE()
              )
            `);
        }

        await transaction.commit();
        res.json({ message: "Saved successfully" });

      } catch (err) {
        await transaction.rollback();
        throw err;
      }

    } catch (err) {
      console.error("SAVE ERROR:", err);
      res.status(500).json({ message: "Save failed" });
    }
  };

  exports.getReturnDetails = async (req, res) => {
    try {
      const { returnNumber } = req.params;
      const pool = await poolPromise;

      const result = await pool.request()
        .input("returnNumber", sql.VarChar(100), returnNumber)
        .query(`
          SELECT *
          FROM Return_Details
          WHERE return_number = @returnNumber
        `);

      res.json(result.recordset);
    } catch (err) {
      console.error("Get Return Details Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  };