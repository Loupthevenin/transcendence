import Database from "better-sqlite3";

const dbPath: string = process.env.DB_PATH as string;

const db: Database.Database = new Database(dbPath);

db.exec(`
	CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	email TEST NOT NULL UNIQUE,
	password TEXT NOT NULL NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	require2FA BOOLEAN DEFAULT FALSE
)
`);

export default db;
