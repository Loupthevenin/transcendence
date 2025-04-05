import Database from 'better-sqlite3';

const dbPath: string = process.env.DB_PATH as string;

const db: Database.Database = new Database(dbPath);

db.exec(`
	CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

export default db;
