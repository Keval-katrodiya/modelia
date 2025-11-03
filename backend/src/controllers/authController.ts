import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { signupSchema, loginSchema } from '../validators/schemas';
import { ZodError } from 'zod';

export class AuthController {
  static async signup(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = signupSchema.parse(req.body);
      const result = await AuthService.signup(validatedData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }
      
      if (error instanceof Error) {
        if (error.message === 'Email already registered') {
          res.status(409).json({ message: error.message });
          return;
        }
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await AuthService.login(validatedData);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }
      
      if (error instanceof Error) {
        if (error.message === 'Invalid credentials') {
          res.status(401).json({ message: error.message });
          return;
        }
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
      
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

