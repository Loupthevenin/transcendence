const path = require("path");
const Database = require("better-sqlite3");

const dbPath = process.env.DB_PATH;

const db = new Database(dbPath);

db.exec(`
	CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

module.exports = db;
