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
   *     tags:
   *       - Vehicles
   *     security:
   *       - bearerAuth: []
   *     description: Permite registrar hasta 3 vehículos por usuario.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user_id
   *               - tipo_vehiculo
   *               - marca
   *               - modelo
   *               - año
   *               - color
   *               - foto
   *               - activo
   *             properties:
   *               id:
   *                 type: string
   *                 format: uuid
   *                 description: Identificador único del vehículo
   *               user_id:
   *                 type: string
   *                 format: uuid
   *                 description: ID del piloto propietario del vehículo
   *               tipo_vehiculo:
   *                 type: string
   *                 enum:
   *                   - auto
   *                   - moto
   *                   - monopatin_electrico
   *                 description: Categoría de homologación del vehículo en la pista
   *               marca:
   *                 type: string
   *                 description: Fabricante del vehículo (ej. KTM, Mazda, Xiaomi)
   *               modelo:
   *                 type: string
   *                 description: Línea o modelo específico (ej. Duke 200, 3 NGP, Pro 2)
   *               año:
   *                 type: integer
   *                 description: Año de fabricación del modelo
   *               color:
   *                 type: string
   *                 description: Color principal de la carrocería o chasis
   *               placa:
   *                 type: string
   *                 nullable: true
   *                 description: Placa identificadora del vehículo o serial (nulo si aplica)
   *               modificaciones:
   *                 type: string
   *                 nullable: true
   *                 description: Detalles o lista de mejoras instaladas (nulo si está stock)
   *               activo:
   *                 type: boolean
   *                 description: Define si es el vehículo principal para emparejamientos y matchmaking
   *               created_at:
   *                 type: string
   *                 format: date-time
   *                 description: Fecha y hora de registro del vehículo en la plataforma
   *     responses:
   *       201:
   *         description: Vehículo creado correctamente
   *       400:
   *         description: Límite de 3 vehículos excedido o datos inválidos
   *       401:
   *         description: No autorizado
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
  *     summary: Obtener todos los vehículos (RF-03)
  *     tags:
  *       - Vehicles
  *     security:
  *       - bearerAuth: []
  *     responses:
  *       200:
  *         description: Lista de vehículos obtenida correctamente
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 ok:
  *                   type: boolean
  *                   example: true
  *                 data:
  *                   type: array
  *                   items:
  *                     type: object
  *                     properties:
  *                       id:
  *                         type: string
  *                         format: uuid
  *                         description: Identificador único del vehículo
  *                       user_id:
  *                         type: string
  *                         format: uuid
  *                         description: ID del piloto propietario del vehículo
  *                       tipo_vehiculo:
  *                         type: string
  *                         enum:
  *                           - auto
  *                           - moto
  *                           - monopatin_electrico
  *                         description: Categoría del vehículo
  *                       marca:
  *                         type: string
  *                         description: Marca del vehículo
  *                       modelo:
  *                         type: string
  *                         description: Modelo del vehículo
  *                       año:
  *                         type: integer
  *                         description: Año de fabricación
  *                       color:
  *                         type: string
  *                         description: Color del vehículo
  *                       placa:
  *                         type: string
  *                         nullable: true
  *                         description: Placa o serial del vehículo
  *                       modificaciones:
  *                         type: string
  *                         nullable: true
  *                         description: Modificaciones realizadas al vehículo
  *                       activo:
  *                         type: boolean
  *                         description: Indica si el vehículo está activo
  *                       created_at:
  *                         type: string
  *                         format: date-time
  *                         description: Fecha de creación del registro
  *       401:
  *         description: No autorizado
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