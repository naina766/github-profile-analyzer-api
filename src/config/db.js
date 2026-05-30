const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

/* ---------------- LOAD ENV ---------------- */
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

/* ---------------- DEBUG ENV ---------------- */
// console.log("✅ ENV CHECK:");
// console.log("DB_HOST:", process.env.DB_HOST);
// console.log("DB_PORT:", process.env.DB_PORT);
// console.log("DB_USER:", process.env.DB_USER);
// console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
// console.log("DB_NAME:", process.env.DB_NAME);

/* ---------------- DB CONFIG ---------------- */
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

let pool;

/* ---------------- INIT DATABASE ---------------- */
async function initDb() {
  const dbName =
    process.env.DB_NAME ||
    process.env.DB_DATABASE ||
    'github_analyzer';

  let connection;

  try {
    console.log(
      `🚀 Connecting to MySQL at ${dbConfig.host}:${dbConfig.port}...`
    );

    /* CONNECT WITHOUT DATABASE */
    connection = await mysql.createConnection(dbConfig);

    console.log(`✅ Connected to MySQL`);

    /* CREATE DATABASE */
    console.log(`📦 Ensuring database '${dbName}' exists...`);

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\``
    );

    console.log(`✅ Database ready`);

    await connection.end();

  } catch (err) {
    console.error(
      '❌ Failed to connect/create database:',
      err.message
    );

    if (connection) {
      await connection.end();
    }

    return;
  }

  /* ---------------- CREATE POOL ---------------- */
  pool = mysql.createPool({
    ...dbConfig,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    const testConn = await pool.getConnection();
    testConn.release();

    console.log('✅ Database pool established');
  } catch (err) {
    console.error('❌ Pool error:', err.message);
    return;
  }

  /* ---------------- RUN SCHEMA ---------------- */
  try {
    const schemaPath = path.join(__dirname, '../../sql/schema.sql');

    if (fs.existsSync(schemaPath)) {
      console.log('📄 Running schema.sql...');

      const schemaSql = fs.readFileSync(schemaPath, 'utf8');

      const statements = schemaSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        const upper = statement.toUpperCase();

        if (
          upper.startsWith('CREATE DATABASE') ||
          upper.startsWith('USE')
        ) {
          continue;
        }

        await pool.query(statement);
      }

      console.log('✅ Schema migration completed');
    } else {
      console.log('⚠️ schema.sql not found, skipping migration');
    }
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  }
}

/* ---------------- QUERY HELPER ---------------- */
function getPool() {
  if (!pool) {
    throw new Error(
      'Database pool not initialized. Call initDb() first.'
    );
  }

  return pool;
}

async function query(sql, params) {
  return getPool().query(sql, params);
}

/* ---------------- EXPORTS ---------------- */
module.exports = {
  initDb,
  getPool,
  query,
};

/* ---------------- TEST ---------------- */
initDb();