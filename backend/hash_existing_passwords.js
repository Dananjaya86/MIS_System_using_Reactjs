const { poolPromise, sql } = require("./db");
const bcrypt = require("bcryptjs");

async function hashPasswords() {
  try {
    const pool = await poolPromise;
    console.log("✅ Connected to SQL Server");

    const result = await pool.request().query(`
      SELECT employeeNo, password
      FROM dbo.login_details
      WHERE active = 'Yes'
    `);

    for (const user of result.recordset) {
      if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
        console.log(`✅ Already hashed: ${user.employeeNo}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(user.password.trim(), 10);

      await pool.request()
        .input("employeeNo", sql.VarChar(50), user.employeeNo)
        .input("password", sql.VarChar(255), hashedPassword)
        .query("UPDATE dbo.login_details SET password=@password WHERE employeeNo=@employeeNo");

      console.log(`🔐 Hashed password for ${user.employeeNo}`);
    }

    console.log("✅ All passwords hashed successfully!");
  } catch (err) {
    console.error("💥 Error hashing passwords:", err);
  } finally {
    process.exit();
  } 
}

hashPasswords();
