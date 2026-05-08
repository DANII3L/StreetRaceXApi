import { Router } from 'express';
import { AuthController } from '../http/controllers/AuthController';
import { AuthUseCase } from '../../core/use-cases/AuthUseCase';
import { FirebaseUserRepository } from '../../infrastructure/database/repositories/FirebaseUserRepository';
import { FirebaseCompetitionCategoryRepository } from '../../infrastructure/database/repositories/FirebaseCompetitionCategoryRepository';

const router = Router();

const userRepo = new FirebaseUserRepository();
const categoryRepo = new FirebaseCompetitionCategoryRepository();
const authUseCase = new AuthUseCase(userRepo, categoryRepo);
const authController = new AuthController(authUseCase);

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));

export default router;