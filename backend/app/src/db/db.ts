import Database from "better-sqlite3";
import { DB_PATH } from "../config";

const db: Database.Database = new Database(DB_PATH);

db.exec(`
	CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	uuid TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	password TEXT,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	require2FA BOOLEAN DEFAULT FALSE,
	twofa_secret TEXT,
	is_verified BOOLEAN DEFAULT FALSE,
	google_id TEXT,
	avatar_url TEXT DEFAULT 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg'
)
`);

db.exec(`
		CREATE TABLE IF NOT EXISTS match_history (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		player_a_name TEXT NOT NULL,
		player_b_name TEXT NOT NULL,
		player_a_uuid TEXT NOT NULL,
		player_b_uuid TEXT NOT NULL,
		score_a INTEGER NOT NULL,
		score_b INTEGER NOT NULL,
		mode TEXT NOT NULL,
		date DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

export default db;
