import { Request, Response } from 'express';
import { VehicleUseCase } from '../../../core/use-cases/VehicleUseCase';

/**
 * @swagger
 * tags:
 *   name: Vehicles
 *   description: Gestión de flota de vehículos
 */
export class VehicleController {
  constructor(private vehicleUseCase: VehicleUseCase) { }

  // RF-03: Agregar un vehículo
  /**
   * @swagger
   * /api/vehicles:
   *   post:
   *     summary: Agregar un vehículo al garaje (RF-03)
   *     tags: [Vehicles]
   *     security:
   *       - bearerAuth: []
   *     description: Permite registrar hasta 3 vehículos por usuario.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               tipo_vehiculo: { type: string }
   *               marca: { type: string }
   *               modelo: { type: string }
   *               año: { type: number }
   *               placa: { type: string }
   *     responses:
   *       201:
   *         description: Vehículo creado
   *       400:
   *         description: Límite de 3 vehículos excedido
   */
  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const vehicle = await this.vehicleUseCase.agregarVehiculo(userId, req.body);

      res.status(201).json({
        ok: true,
        data: vehicle
      });
    } catch (error: any) {
      res.status(400).json({
        ok: false,
        msg: error.message
      });
    }
  }

  // Regla 3: Marcar como activo
  /**
   * @swagger
   * /api/vehicles/{vehicleId}/activate:
   *   patch:
   *     summary: Marcar vehículo como activo para competir
   *     tags: [Vehicles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: vehicleId
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Vehículo activado (otros se desactivan)
   */
  async setActive(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { vehicleId } = req.params;

      await this.vehicleUseCase.marcarComoActivo(userId, vehicleId as string);

      res.status(200).json({
        ok: true,
        msg: "Vehículo activado correctamente"
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
   * /api/vehicles:
   *   get:
   *     summary: "Obtener todos los vehículos (RF-03)"
   *     tags: [Vehicles]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: "Lista de vehículos obtenida"
   */
  async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const vehicles = await this.vehicleUseCase.findByUserId(userId);
      res.status(200).json({ ok: true, data: vehicles });
    } catch (error: any) {
      res.status(400).json({ ok: false, msg: error.message });
    }
  }
}