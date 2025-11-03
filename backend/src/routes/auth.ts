import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

router.post('/signup', (req, res) => void AuthController.signup(req, res));
router.post('/login', (req, res) => void AuthController.login(req, res));

export default router;

