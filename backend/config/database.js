const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'glimmer_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create pool without database first to create it if needed
const createPool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create database and then create the actual pool
const initDatabase = async () => {
  try {
    // Create database if it doesn't exist
    await createPool.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log(`Database ${dbConfig.database} created or already exists`);
    
    // Create the actual pool with database
    const pool = mysql.createPool(dbConfig);
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
    
    return pool;
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    console.log('Starting server without database...');
    return null;
  }
};

module.exports = initDatabase();
