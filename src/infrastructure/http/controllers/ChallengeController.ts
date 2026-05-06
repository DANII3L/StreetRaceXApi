import { Request, Response } from 'express';
import { ChallengeUseCase } from '../../../core/use-cases/ChallengeUseCase';

/**
 * @swagger
 * tags:
 *   name: Challenges
 *   description: "Lógica de retos y competencias"
 */
export class ChallengeController {
  constructor(private challengeUseCase: ChallengeUseCase) {}

  /**
   * @swagger
   * /api/challenges:
   *   post:
   *     summary: "Enviar un reto a otro piloto (RF-04)"
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     description: "Valida que sean del mismo rango y tengan vehículos activos del mismo tipo."
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               retado_id: { type: string }
   *               tipo_carrera: { type: string }
   *               ubicacion_acordada: { type: string }
   *               fecha_acordada: { type: string, format: date-time }
   *     responses:
   *       201:
   *         description: "Reto enviado exitosamente"
   *       400:
   *         description: "Error de validación (Rango, vehículo o auto-reto)"
   */
  async sendChallenge(req: Request, res: Response) {
    try {
      const retadorId = (req as any).user.id;
      const challenge = await this.challengeUseCase.enviarReto(retadorId, req.body);
      res.status(201).json({ ok: true, data: challenge });
    } catch (error: any) {
      res.status(400).json({ ok: false, msg: error.message });
    }
  }

  /**
   * @swagger
   * /api/challenges/{challengeId}/respond:
   *   patch:
   *     summary: "Aceptar o rechazar un reto recibido"
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: challengeId
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               aceptar: { type: boolean }
   *     responses:
   *       200:
   *         description: "Estado del reto actualizado"
   */
  async respondToChallenge(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { challengeId } = req.params as { challengeId: string };
      const { aceptar } = req.body as { aceptar: boolean };
      const challenge = await this.challengeUseCase.responderReto(challengeId, userId, aceptar);
      res.status(200).json({
        ok: true,
        msg: aceptar ? "Reto aceptado" : "Reto rechazado",
        data: challenge
      });
    } catch (error: any) {
      res.status(400).json({ ok: false, msg: error.message });
    }
  }

  /**
   * @swagger
   * /api/challenges/{challengeId}/complete:
   *   post:
   *     summary: "Registrar resultado final (Regla 11)"
   *     tags: [Challenges]
   *     security:
   *       - bearerAuth: []
   *     description: "Actualiza victorias/derrotas y rangos automáticamente."
   *     parameters:
   *       - in: path
   *         name: challengeId
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               ganadorId: { type: string }
   *     responses:
   *       200:
   *         description: "Reto completado y estadísticas actualizadas"
   */
  async completeChallenge(req: Request, res: Response) {
    try {
      const { challengeId } = req.params as { challengeId: string };
      const { ganadorId } = req.body as { ganadorId: string };
      await this.challengeUseCase.completarReto(challengeId, ganadorId);
      res.status(200).json({ ok: true, msg: "Resultado registrado" });
    } catch (error: any) {
      res.status(400).json({ ok: false, msg: error.message });
    }
  }

  /**
   * @swagger
   * /api/challenges/history:
   *    get:
   *      summary: "Obtener historial de retos del piloto (RF-06)"
   *      tags: [Challenges]
   *      security:
   *        - bearerAuth: []
   *      responses:
   *        200:
   *          description: "Lista de retos en los que ha participado el usuario"
   */
  async getHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const history = await this.challengeUseCase.obtenerHistorial(userId);
      res.status(200).json({ ok: true, data: history });
    } catch (error: any) {
      res.status(400).json({ ok: false, msg: error.message });
    }
  }
}