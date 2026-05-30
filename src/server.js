require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    // 1. Initialise connection pool and run SQL table migrations
    await db.initDb();
    
    // 2. Open server listener
    app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`  GITSCOPE PROFILE ANALYZER API RUNNING            `);
      console.log(`  URL: http://localhost:${PORT}                    `);
      console.log(`  Swagger documentation: http://localhost:${PORT}/api-docs`);
      console.log(`  Environment: ${ENV}                             `);
      console.log(`  Database Status: ONLINE                          `);
      console.log(`==================================================\n`);
    });
  } catch (error) {
    console.error(`\n[CRITICAL ERROR] Database initialization failed: ${error.message}`);
    console.log('\n--------------------------------------------------');
    console.log('TROUBLESHOOTING ACTIONS REQUIRED:');
    console.log('1. Make sure your MySQL Server service is running.');
    console.log('2. Check your database settings in the local .env file.');
    console.log('3. Ensure the configured database user has CREATE permissions.');
    console.log('--------------------------------------------------\n');
    
    // Start Express server in degraded mode
    app.listen(PORT, () => {
      console.log(`\n==================================================`);
      console.log(`  WARNING: SERVER RUNNING IN DEGRADED MODE (DB DOWN)`);
      console.log(`  URL: http://localhost:${PORT}                    `);
      console.log(`  Swagger documentation: http://localhost:${PORT}/api-docs`);
      console.log(`  Environment: ${ENV}                             `);
      console.log(`  Database Status: OFFLINE                        `);
      console.log(`==================================================\n`);
    });
  }
}

startServer();
