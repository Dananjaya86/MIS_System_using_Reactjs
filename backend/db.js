require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env")
});
const sql = require("mssql");

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "1433"),

    options: {
        encrypt: true,
        trustServerCertificate: false
    },

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log("✅ Connected to Azure SQL Database");
        return pool;
    })
    .catch(err => {
        console.error("❌ Azure SQL Connection Failed:", err);
        throw err;
    });

module.exports = {
    sql,
    poolPromise
};