import Database, { Statement } from "better-sqlite3";
import { DB_PATH, NODE_ENV } from "../config";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

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
  avatar_url TEXT DEFAULT '/api/textures/avatar-default.svg'
)
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS match_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT NOT NULL UNIQUE,
  player_a_name TEXT NOT NULL,
  player_b_name TEXT NOT NULL,
  player_a_uuid TEXT NOT NULL,
  player_b_uuid TEXT NOT NULL,
  score_a INTEGER NOT NULL,
  score_b INTEGER NOT NULL,
  winner TEXT NOT NULL,
  mode TEXT NOT NULL,
  date DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

if (NODE_ENV === "development") {
  const passwordPlain: string = "test";
  const hashedPassword: string = bcrypt.hashSync(passwordPlain, 10); // HASH SYNC

  const insertUser: Statement = db.prepare(`
    INSERT OR IGNORE INTO users (uuid, name, email, password, is_verified)
    VALUES (@uuid, @name, @email, @password, @is_verified)
  `);

  insertUser.run({
    uuid: uuidv4(),  
    name: "Alice",
    email: "alice@example.com",
    password: hashedPassword,
    is_verified: 1
  });

  insertUser.run({
    uuid: uuidv4(),  
    name: "Bob",
    email: "bob@example.com",
    password: hashedPassword,
    is_verified: 1
  });

  insertUser.run({
    uuid: uuidv4(), 
    name: "Joe",
    email: "joe@example.com",
    password: hashedPassword,
    is_verified: 1
  });
}

export default db;
