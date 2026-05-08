import { Router } from 'express';
import { ChallengeController } from '../http/controllers/ChallengeController';
import { ChallengeUseCase } from '../../core/use-cases/ChallengeUseCase';
import { FirebaseChallengeRepository } from '../../infrastructure/database/repositories/FirebaseChallengeRepository';
import { FirebaseUserRepository } from '../../infrastructure/database/repositories/FirebaseUserRepository';
import { FirebaseVehicleRepository } from '../../infrastructure/database/repositories/FirebaseVehicleRepository';
import { FirebaseNotificationRepository } from '../../infrastructure/database/repositories/FirebaseNotificationRepository';
import { checkAuth } from '../http/middlewares/auth.middleware';

const router = Router();

const challengeRepo = new FirebaseChallengeRepository();
const userRepo = new FirebaseUserRepository();
const vehicleRepo = new FirebaseVehicleRepository();
const notificationRepo = new FirebaseNotificationRepository();

const challengeUseCase = new ChallengeUseCase(challengeRepo, userRepo, vehicleRepo, notificationRepo);
const challengeController = new ChallengeController(challengeUseCase);

router.post('/', checkAuth, (req, res) => challengeController.sendChallenge(req, res));
router.patch('/:challengeId/respond', checkAuth, (req, res) => challengeController.respondToChallenge(req, res));
router.post('/:challengeId/complete', checkAuth, (req, res) => challengeController.completeChallenge(req, res));
router.get('/history', checkAuth, (req, res) => challengeController.getHistory(req, res));

export default router;