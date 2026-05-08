import { Router } from 'express';
import { UserController } from '../http/controllers/UserController';
import { UserUseCase } from '../../core/use-cases/UserUseCase';
import { FirebaseUserRepository } from '../../infrastructure/database/repositories/FirebaseUserRepository';
import { checkAuth } from '../http/middlewares/auth.middleware';

const router = Router();

const userRepo = new FirebaseUserRepository();
const userUseCase = new UserUseCase(userRepo);
const userController = new UserController(userUseCase);

router.get('/me', checkAuth, (req, res) => userController.getMyProfile(req, res));
router.get('/discover', checkAuth, (req, res) => userController.discoverPilots(req, res));

export default router;