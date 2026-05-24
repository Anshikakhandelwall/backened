import mysql  from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  // Railway uses MYSQLHOST etc., fallback to DB_HOST for local
  host:     process.env.MYSQLHOST     || process.env.DB_HOST,
  port:     parseInt(process.env.MYSQLPORT || process.env.DB_PORT || 3306),
  user:     process.env.MYSQLUSER     || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,

  // SSL required for Railway MySQL
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,

  waitForConnections: true,
  connectionLimit:    10,
});

const checkDBConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
};

checkDBConnection();

export default pool;