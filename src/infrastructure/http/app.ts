import express from 'express';
import dotenv from 'dotenv';
import { checkAuth } from './middlewares/auth.middleware';

// Repositorios e Interfases
import { FirebaseCompetitionCategoryRepository } from '../database/repositories/FirebaseCompetitionCategoryRepository';
import { FirebaseVehicleRepository } from '../database/repositories/FirebaseVehicleRepository';
import { FirebaseChallengeRepository } from '../database/repositories/FirebaseChallengeRepository';

// Casos de Uso
import { AuthUseCase } from '../../core/use-cases/AuthUseCase';
import { VehicleUseCase } from '../../core/use-cases/VehicleUseCase';
import { ChallengeUseCase } from '../../core/use-cases/ChallengeUseCase';

// Controladores
import { AuthController } from './controllers/AuthController';
import { VehicleController } from './controllers/VehicleController';
import { ChallengeController } from './controllers/ChallengeController';

// Swagger
import { setupSwagger } from './swagger';

// Socket.io
import http from 'http';
import { Server } from 'socket.io';

// Users 
import { FirebaseUserRepository } from '../database/repositories/FirebaseUserRepository';
import { UserUseCase } from '../../core/use-cases/UserUseCase';
import { UserController } from './controllers/UserController';

// Middlewares
import { errorHandler } from './middlewares/error.handler';

// Notificaciones
import { FirebaseNotificationRepository } from '../database/repositories/FirebaseNotificationRepository';
import { NotificationUseCase } from '../../core/use-cases/NotificationUseCase';
import { NotificationController } from './controllers/NotificationController';

dotenv.config();
const app = express();
app.use(express.json());
setupSwagger(app);

// --- Configuración de Socket.io ---
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Almacén de sockets conectados (userId -> socketId)
const userSockets = new Map<string, string>();

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string;
    if (userId) userSockets.set(userId, socket.id);

    socket.on('disconnect', () => {
        userSockets.delete(userId);
    });
});

export { io, userSockets };

// --- Inyección de Dependencias de Notificaciones ---
const notificationRepo = new FirebaseNotificationRepository();
const notificationUseCase = new NotificationUseCase(notificationRepo);
const notificationController = new NotificationController(notificationUseCase);
// --- Inyección de Dependencias ---
const userRepo = new FirebaseUserRepository();
const categoryRepo = new FirebaseCompetitionCategoryRepository();

// --- Inyección de Dependencias de Auth ---
const authUseCase = new AuthUseCase(userRepo, categoryRepo);
const authController = new AuthController(authUseCase);

// --- Inyección de Dependencias de Vehiculos ---
const vehicleRepo = new FirebaseVehicleRepository();
const vehicleUseCase = new VehicleUseCase(vehicleRepo);
const vehicleController = new VehicleController(vehicleUseCase);

// --- Inyección de Dependencias de Retos ---
const challengeRepo = new FirebaseChallengeRepository();
const challengeUseCase = new ChallengeUseCase(challengeRepo, userRepo, vehicleRepo, notificationRepo);
const challengeController = new ChallengeController(challengeUseCase);

// --- Inyección de Dependencias de Users ---
const userUseCase = new UserUseCase(userRepo);
const userController = new UserController(userUseCase);

// --- Rutas Públicas (Auth) ---
app.post('/api/auth/register', (req, res) => authController.register(req, res));
app.post('/api/auth/login', (req, res) => authController.login(req, res));

// --- Rutas Protegidas (Vehículos) ---
// Agregar vehículo
app.post('/api/vehicles', checkAuth, (req, res) => vehicleController.create(req, res));
// Marcar como activo
app.patch('/api/vehicles/:vehicleId/activate', checkAuth, (req, res) => vehicleController.setActive(req, res));
// Obtener todos los vehículos
app.get('/api/vehicles', checkAuth, (req, res) => vehicleController.getAll(req, res));

// --- Rutas de Retos ---
// Enviar reto
app.post('/api/challenges', checkAuth, (req, res) => challengeController.sendChallenge(req, res));
// Responder a un reto
app.patch('/api/challenges/:challengeId/respond', checkAuth, (req, res) => challengeController.respondToChallenge(req, res));
// Finalizar reto
app.post('/api/challenges/:challengeId/complete', checkAuth, (req, res) => challengeController.completeChallenge(req, res));
// Obtener historial de retos
app.get('/api/challenges/history', checkAuth, (req, res) => challengeController.getHistory(req, res));

// --- Rutas de Users ---
app.get('/api/users/me', checkAuth, (req, res) => userController.getMyProfile(req, res));
app.get('/api/users/discover', checkAuth, (req, res) => userController.discoverPilots(req, res));

// --- Rutas de Notificaciones ---
app.get('/api/notifications', checkAuth, (req, res) => notificationController.getMyNotifications(req, res));
app.patch('/api/notifications/:id/read', checkAuth, (req, res) => notificationController.markAsRead(req, res));

app.use(errorHandler);

const PORT = process.env.PORT;

httpServer.listen(PORT, () => {
    console.log(` ------------------------------ API StreetRaceX corriendo en http://localhost:${PORT} ------------------------------`);
    console.log(` ------------------------------ Swagger disponible en http://localhost:${PORT}/api-docs ------------------------------`);
});