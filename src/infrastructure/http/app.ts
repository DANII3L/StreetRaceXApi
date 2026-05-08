import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { setupSwagger } from './swagger';
import { errorHandler } from './middlewares/error.handler';
import apiRoutes from '../routes';

dotenv.config();
const app = express();
app.use(express.json());

// --- Socket.io ---
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const userSockets = new Map<string, string>();
io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId as string;
    if (userId) userSockets.set(userId, socket.id);
    socket.on('disconnect', () => userSockets.delete(userId));
});

export { io, userSockets };
setupSwagger(app);
app.use('/api', apiRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(` ------------------------------ API StreetRaceX corriendo en http://localhost:${PORT} ------------------------------`);
    console.log(` ------------------------------ Swagger disponible en http://localhost:${PORT}/api-docs ------------------------------`);
});