import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { GenerationService } from '../services/generationService';
import { generationSchema } from '../validators/schemas';
import { ZodError } from 'zod';

export class GenerationsController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ message: 'Image file is required' });
        return;
      }

      // Validate request body
      const validatedData = generationSchema.parse(req.body);

      // Get image URL (in production this would be a full URL or CDN path)
      const imageUrl = `/uploads/${req.file.filename}`;

      // Create generation
      const generation = await GenerationService.create(
        req.userId,
        validatedData,
        imageUrl
      );

      res.status(201).json(generation);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      if (error instanceof Error) {
        if (error.message === 'Model overloaded') {
          res.status(503).json({ message: 'Model overloaded' });
          return;
        }
        res.status(500).json({ message: 'Internal server error' });
        return;
      }

      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static getRecent(req: AuthRequest, res: Response): void {
    try {
      if (!req.userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 5;
      const generations = GenerationService.getRecentGenerations(req.userId, limit);

      res.status(200).json(generations);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

