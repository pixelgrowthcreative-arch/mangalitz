require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// biar tetap bisa pakai: const [rows] = await db.query()
module.exports = {
  query: async (text, params) => {
    const result = await pool.query(text, params);
    return [result.rows];
  }
};
