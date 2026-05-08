import { Router } from 'express';
import { NotificationController } from '../http/controllers/NotificationController';
import { NotificationUseCase } from '../../core/use-cases/NotificationUseCase';
import { FirebaseNotificationRepository } from '../../infrastructure/database/repositories/FirebaseNotificationRepository';
import { checkAuth } from '../http/middlewares/auth.middleware';

const router = Router();

const notificationRepo = new FirebaseNotificationRepository();
const notificationUseCase = new NotificationUseCase(notificationRepo);
const notificationController = new NotificationController(notificationUseCase);

router.get('/', checkAuth, (req, res) => notificationController.getMyNotifications(req, res));
router.patch('/:id/read', checkAuth, (req, res) => notificationController.markAsRead(req, res));

export default router;