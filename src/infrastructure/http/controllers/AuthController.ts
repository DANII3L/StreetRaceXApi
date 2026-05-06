import { Request, Response } from 'express';
import { AuthUseCase } from '../../../core/use-cases/AuthUseCase';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Gestión de autenticación y autorización
 */
export class AuthController {
  constructor(private authUseCase: AuthUseCase) { }

/**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: "Registro de nuevos usuarios (RF-01)"
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [username, email, password, zona_localidad, zona_ciudad, zona_estado, zona_pais]
   *             properties:
   *               username:
   *                 type: string
   *                 description: "Nombre de usuario único"
   *               email:
   *                 type: string
   *                 format: email
   *                 description: "Correo electrónico del usuario"
   *               password:
   *                 type: string
   *                 description: "Contraseña"
   *               foto_perfil:
   *                 type: string
   *                 description: "URL de la foto de perfil del usuario"
   *                 default: ""
   *               zona_localidad:
   *                 type: string
   *                 description: "Ciudad de la zona del usuario"
   *               zona_ciudad:
   *                 type: string
   *                 description: "Ciudad de la zona del usuario"
   *               zona_estado:
   *                 type: string
   *                 description: "Estado de la zona del usuario"
   *               zona_pais:
   *                 type: string
   *                 description: "País de la zona del usuario"
   *     responses:
   *       201:
   *         description: "Usuario registrado con éxito e inicializado en Rango D"
   *       400:
   *         description: "Error de validación: El usuario o correo ya existen"
   */
  async register(req: Request, res: Response) {
    try {
      const nuevoUsuario = await this.authUseCase.registrar(req.body);

      res.status(201).json({
        ok: true,
        message: "Usuario registrado con éxito",
        uid: nuevoUsuario.props.id
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
   * /api/auth/login:
   *   post:
   *     summary: Inicio de sesión y generación de JWT (RF-02)
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email: { type: string }
   *               password: { type: string }
   *     responses:
   *       200:
   *         description: Login exitoso, retorna token y datos básicos
   *       401:
   *         description: Credenciales inválidas
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const { token, user } = await this.authUseCase.login(email, password);

      res.status(200).json({
        ok: true,
        token,
        user: {
          id: user.props.id,
          username: user.props.username,
          rango: user.props.rango
        }
      });
    } catch (error: any) {
      res.status(401).json({
        ok: false,
        msg: error.message
      });
    }
  }
}