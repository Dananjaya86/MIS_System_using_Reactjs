const sql = require("mssql/msnodesqlv8");

const config = {
  server: "localhost\\SQLEXPRESS",   // instance name
  database: "Milkee_MIS_System",
  driver: "msnodesqlv8",
  options: {
    trustedConnection: true,
     encrypt: false
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("✅ Connected to SQL Server");
    return pool;
  })
  .catch(err => console.log("❌ DB Connection Failed:", err));

module.exports = {
  sql, poolPromise
};
