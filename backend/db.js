const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test connection and initialize tables
const initDb = async () => {
    try {
        const client = await pool.connect();
        console.log(`Connected to PostgreSQL database: ${process.env.DB_NAME}`);
        
        // Create Users table
        const createUsersTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                phone VARCHAR(20) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await client.query(createUsersTableQuery);
        console.log("Users table initialized successfully.");
        
        client.release();
    } catch (err) {
        console.error("Error connecting to database:", err.message);
        console.error("Please check your .env file and ensure PostgreSQL is running.");
    }
};

initDb();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
