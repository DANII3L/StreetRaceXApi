import { Router } from 'express';
import { VehicleController } from '../http/controllers/VehicleController';
import { VehicleUseCase } from '../../core/use-cases/VehicleUseCase';
import { FirebaseVehicleRepository } from '../../infrastructure/database/repositories/FirebaseVehicleRepository';
import { checkAuth } from '../http/middlewares/auth.middleware';

const router = Router();

const vehicleRepo = new FirebaseVehicleRepository();
const vehicleUseCase = new VehicleUseCase(vehicleRepo);
const vehicleController = new VehicleController(vehicleUseCase);

router.post('/', checkAuth, (req, res) => vehicleController.create(req, res));
router.patch('/:vehicleId/activate', checkAuth, (req, res) => vehicleController.setActive(req, res));
router.get('/', checkAuth, (req, res) => vehicleController.getAll(req, res));

export default router;