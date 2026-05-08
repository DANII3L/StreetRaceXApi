import { Router } from 'express';
import authRoutes from './auth.routes';
import vehicleRoutes from './vehicle.routes';
import challengeRoutes from './challenge.routes';
import userRoutes from './user.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/challenges', challengeRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);

export default router;