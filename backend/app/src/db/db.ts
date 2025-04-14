import Database from "better-sqlite3";
import { DB_PATH } from "../config";

const db: Database.Database = new Database(DB_PATH);

db.exec(`
	CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	password TEXT NOT NULL NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	require2FA BOOLEAN DEFAULT FALSE,
	twofa_secret TEXT,
	is_verified BOOLEAN DEFAULT FALSE,
	avatar_url TEXT DEFAULT 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg'
)
`);

export default db;
