import db from '../db/database';

export interface Generation {
  id: number;
  user_id: number;
  prompt: string;
  style: string;
  image_url: string;
  status: string;
  created_at: string;
}

export interface CreateGenerationData {
  user_id: number;
  prompt: string;
  style: string;
  image_url: string;
  status?: string;
}

export class GenerationModel {
  static create(data: CreateGenerationData): Generation {
    const stmt = db.prepare(
      'INSERT INTO generations (user_id, prompt, style, image_url, status) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(
      data.user_id,
      data.prompt,
      data.style,
      data.image_url,
      data.status || 'completed'
    );
    
    const generation = db
      .prepare('SELECT * FROM generations WHERE id = ?')
      .get(result.lastInsertRowid) as Generation;
    return generation;
  }

  static findByUserId(userId: number, limit: number = 5): Generation[] {
    const stmt = db.prepare(
      'SELECT * FROM generations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    );
    return stmt.all(userId, limit) as Generation[];
  }

  static findById(id: number): Generation | undefined {
    const stmt = db.prepare('SELECT * FROM generations WHERE id = ?');
    return stmt.get(id) as Generation | undefined;
  }
}

