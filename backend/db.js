const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false // Cần thiết cho Aiven MySQL
  }
});

// Test connection and initialize tables
const initDb = async () => {
    try {
        const connection = await pool.getConnection();
        console.log(`Connected to MySQL database: ${process.env.DB_NAME}`);
        
        // Create Users table (MySQL Syntax)
        const createUsersTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                phone VARCHAR(20) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await connection.query(createUsersTableQuery);
        console.log("Users table initialized successfully.");
        
        connection.release();
    } catch (err) {
        console.error("Error connecting to database:", err.message);
        console.error("Please check your .env file and ensure MySQL is running.");
    }
};

initDb();

module.exports = {
  // MySQL use ? instead of $1, $2
  query: async (sql, params) => {
      const [results] = await pool.execute(sql, params);
      return { rows: results, rowCount: results.length };
  },
};
