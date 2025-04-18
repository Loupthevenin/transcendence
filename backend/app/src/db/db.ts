import Database from "better-sqlite3";
import { DB_PATH } from "../config";
import bcrypt from "bcrypt";

const db: Database.Database = new Database(DB_PATH);

db.exec("PRAGMA foreign_keys = ON;");

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

// Table ChatRooms
db.exec(`
	CREATE TABLE IF NOT EXISTS chat_rooms (
	  id INTEGER PRIMARY KEY AUTOINCREMENT,
	  user1_id INTEGER NOT NULL,
	  user2_id INTEGER NOT NULL,
	  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	  UNIQUE(user1_id, user2_id),
	  FOREIGN KEY (user1_id) REFERENCES users(id),
	  FOREIGN KEY (user2_id) REFERENCES users(id)
	);
  `);
  
  // Table Messages
  db.exec(`
	CREATE TABLE IF NOT EXISTS messages (
	  id INTEGER PRIMARY KEY AUTOINCREMENT,
	  room_id INTEGER NOT NULL,
	  sender_id INTEGER NOT NULL,
	  content TEXT NOT NULL,
	  type TEXT DEFAULT 'text',
	  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	  FOREIGN KEY (room_id) REFERENCES chat_rooms(id),
	  FOREIGN KEY (sender_id) REFERENCES users(id)
	);
  `);
  
  // Table Blocked Users
  db.exec(`
	CREATE TABLE IF NOT EXISTS blocked_users (
	  id INTEGER PRIMARY KEY AUTOINCREMENT,
	  blocker_id INTEGER NOT NULL,
	  blocked_id INTEGER NOT NULL,
	  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	  UNIQUE(blocker_id, blocked_id),
	  FOREIGN KEY (blocker_id) REFERENCES users(id),
	  FOREIGN KEY (blocked_id) REFERENCES users(id)
	);
  `);

// ⚡ Insère users de test immédiatement et synchro
const passwordPlain = "test";
const hashedPassword = bcrypt.hashSync(passwordPlain, 10); // HASH SYNC

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, email, password, is_verified)
  VALUES (@name, @email, @password, @is_verified)
`);

insertUser.run({
  name: "Alice",
  email: "alice@example.com",
  password: hashedPassword,
  is_verified: 1
});

insertUser.run({
  name: "Bob",
  email: "bob@example.com",
  password: hashedPassword,
  is_verified: 1
});

console.log("✅ Test users inserted!");

export default db;