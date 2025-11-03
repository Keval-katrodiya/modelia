import { Router } from 'express';
import { GenerationsController } from '../controllers/generationsController';
import { authMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// All generation routes require authentication
router.use(authMiddleware);

router.post(
  '/',
  upload.single('image'),
  (req, res) => void GenerationsController.create(req, res)
);

router.get('/', (req, res) => GenerationsController.getRecent(req, res));

export default router;

