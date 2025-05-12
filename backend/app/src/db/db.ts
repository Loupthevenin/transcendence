import Database, { Statement } from "better-sqlite3";
import { DB_PATH, NODE_ENV } from "../config";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { RoomType } from "../game/room";

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
    avatar_url TEXT DEFAULT '/api/textures/avatar-default.svg'
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    player_a_uuid TEXT NOT NULL,
    player_b_uuid TEXT NOT NULL,
    score_a INTEGER NOT NULL,
    score_b INTEGER NOT NULL,
    winner TEXT NOT NULL,
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

if (NODE_ENV === "development") {
  const passwordPlain: string = "test";
  const hashedPassword: string = bcrypt.hashSync(passwordPlain, 10); // HASH SYNC

  const insertUser: Statement = db.prepare(`
    INSERT OR IGNORE INTO users (uuid, name, email, password, is_verified)
    VALUES (@uuid, @name, @email, @password, @is_verified)
  `);

  ["Alice", "Bob", "Joe", "Patrick", "Marc", "Peter"]
  .forEach((name: string) => {
    insertUser.run({
      uuid: uuidv4(),  
      name,
      email: `${name.toLocaleLowerCase()}@example.com`,
      password: hashedPassword,
      is_verified: 1
    });
  });
}

export default db;

export function saveMatchData(
  match_uuid: string,
  player_a_uuid: string,
  player_b_uuid: string,
  score_a: number,
  score_b: number,
  winner: "A" | "B" | "draw",
  mode: RoomType
): void {
  db.prepare(`
    INSERT INTO match_history (
      uuid, player_a_uuid, player_b_uuid, score_a, score_b, winner, mode
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    match_uuid,
    player_a_uuid,
    player_b_uuid,
    score_a,
    score_b,
    winner,
    RoomType[mode],
  );
}