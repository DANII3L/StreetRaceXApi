import { Request, Response } from 'express';
import { NotificationUseCase } from '../../../core/use-cases/NotificationUseCase';

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestión de notificaciones
 */
export class NotificationController {
  constructor(private notificationUseCase: NotificationUseCase) {}

    /**
   * @swagger
   * /api/notifications:
   *   get:
   *     summary: "Obtener mis notificaciones (RF-06)"
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: "Lista de notificaciones obtenida"
   */
  async getMyNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const notifications = await this.notificationUseCase.obtenerPorUsuario(userId);
      res.status(200).json({ ok: true, data: notifications });
    } catch (error: any) {
      res.status(400).json({ ok: false, msg: error.message });
    }
  }

   /**
   * @swagger
   * /api/notifications/{id}/read:
   *   patch:
   *     summary: "Marcar como leída (RF-06)"
   *     tags: [Notifications]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: "Notificación marcada como leída"
   */
  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params as { id: string };
      await this.notificationUseCase.marcarLeida(id);
      res.status(200).json({ ok: true, msg: "Leída" });
    } catch (error: any) {
      res.status(400).json({ ok: false, msg: error.message });
    }
  }
}