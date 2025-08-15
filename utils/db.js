// Database connection interface
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(process.env.DB_FILE);

module.exports = db;