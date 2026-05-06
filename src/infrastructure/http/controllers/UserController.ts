import { Request, Response } from 'express';
import { UserUseCase } from '../../../core/use-cases/UserUseCase';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios
 */
export class UserController {
  constructor(private userUseCase: UserUseCase) {}

  /**
   * @swagger
   * /api/users/me:
   *   get:
   *     summary: "Obtener mi perfil y estadísticas (RF-02)"
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: "Información detallada del piloto obtenida"
   */
  async getMyProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const user = await this.userUseCase.obtenerPerfil(userId);
      
      res.status(200).json({
        ok: true,
        data: user
      });
    } catch (error: any) {
      res.status(400).json({
        ok: false,
        msg: error.message
      });
    }
  }

  /**
   * @swagger
   * /api/users/discover:
   *   get:
   *     summary: "Descubrimiento de pilotos para retar (RF-05)"
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: "Lista de posibles oponentes filtrada"
   */
  async discoverPilots(req: Request, res: Response) {
    try {
      const { id, rango } = (req as any).user;
      const pilots = await this.userUseCase.obtenerPilotosParaRetar(id, rango);
      
      res.status(200).json({
        ok: true,
        data: pilots
      });
    } catch (error: any) {
      res.status(400).json({
        ok: false,
        msg: error.message
      });
    }
  }
}