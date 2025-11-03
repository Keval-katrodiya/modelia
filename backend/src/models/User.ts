import db from '../db/database';

export interface User {
  id: number;
  email: string;
  password: string;
  created_at: string;
}

export interface CreateUserData {
  email: string;
  password: string;
}

export class UserModel {
  static create(data: CreateUserData): User {
    const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
    const result = stmt.run(data.email, data.password);
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
    return user;
  }

  static findByEmail(email: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as User | undefined;
  }

  static findById(id: number): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as User | undefined;
  }
}

