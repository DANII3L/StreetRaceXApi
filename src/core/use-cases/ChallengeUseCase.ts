import { io, userSockets } from "../../infrastructure/http/app";
import { Challenge } from "../domain/entities/Challenge";
import { IChallengeRepository } from "../interfaces/repositories/IChallengeRepository";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { IVehicleRepository } from "../interfaces/repositories/IVehicleRepository";
import { INotificationRepository } from "../interfaces/repositories/INotificationRepository";
import { Notification, TipoNotificacion } from "../domain/entities/Notification";

export class ChallengeUseCase {
  constructor(
    private challengeRepository: IChallengeRepository,
    private userRepository: IUserRepository,
    private vehicleRepository: IVehicleRepository,
    private notificationRepository: INotificationRepository,
  ) { }

  // RF-04: Enviar un reto
  async enviarReto(retadorId: string, data: any): Promise<Challenge> {
    const { retado_id, tipo_carrera, ubicacion_acordada, fecha_acordada, notas } = data;

    // 1. Regla 12: Un piloto no puede retarse a sí mismo
    if (retadorId === retado_id) throw new Error("No puedes retarte a ti mismo");

    const retador = await this.userRepository.findById(retadorId);
    const retado = await this.userRepository.findById(retado_id);

    if (!retador || !retado) throw new Error("Uno de los pilotos no existe");

    // 3. Regla 6: Solo se pueden retar pilotos del mismo rango
    if (retador.props.rango !== retado.props.rango) {
      throw new Error("Solo puedes retar a pilotos de tu mismo rango competitivo");
    }

    // 4. Regla 7: Validar vehículos activos y que sean del mismo tipo
    const vehiculoRetador = await this.vehicleRepository.findActiveByUserId(retadorId);
    const vehiculoRetado = await this.vehicleRepository.findActiveByUserId(retado_id);

    if (!vehiculoRetador || !vehiculoRetado) {
      throw new Error("Ambos pilotos deben tener un vehículo activo para competir");
    }

    if (vehiculoRetador.props.tipo_vehiculo !== vehiculoRetado.props.tipo_vehiculo) {
      throw new Error("Los vehículos deben ser del mismo tipo (ej: auto vs auto)");
    }

    // 5. Regla 8: Verificar si ya existe un reto activo entre ellos
    const retoExistente = await this.challengeRepository.findActiveBetweenPlayers(retadorId, retado_id);
    if (retoExistente) {
      throw new Error("Ya existe un reto pendiente o en curso con este piloto");
    }

    const nuevoReto = new Challenge({
      id: crypto.randomUUID(),
      retador_id: retadorId,
      retado_id: retado_id,
      tipo_carrera,
      vehiculo_retador_id: vehiculoRetador.props.id,
      vehiculo_retado_id: vehiculoRetado.props.id,
      estado: 'pendiente',
      ganador_id: null,
      ubicacion_acordada,
      fecha_acordada: new Date(fecha_acordada),
      notas: notas || null,
      created_at: new Date(),
      updated_at: new Date()
    });

    await this.challengeRepository.save(nuevoReto);

    // Notificar al retado
    await this.notificationRepository.save(new Notification({
      id: crypto.randomUUID(),
      user_id: data.retado_id,
      tipo: 'reto_recibido',
      mensaje: `¡Has sido retado por ${retador.props.username}!`,
      leida: false,
      referencia_id: nuevoReto.props.id,
      created_at: new Date()
    }));

    return nuevoReto;
  }

  // Regla 9 y 10: Aceptar o rechazar reto
  async responderReto(retoId: string, userId: string, aceptar: boolean): Promise<Challenge> {
    const reto = await this.challengeRepository.findById(retoId);
    if (!reto) throw new Error("Reto no encontrado");

    if (reto.props.retado_id !== userId) throw new Error("No tienes permiso para responder a este reto");
    if (reto.props.estado !== 'pendiente') throw new Error("El reto ya no está pendiente");

    reto.props.estado = aceptar ? 'aceptado' : 'rechazado';
    reto.props.updated_at = new Date();

    await this.notificationRepository.save(new Notification({
      id: crypto.randomUUID(),
      user_id: userId,
      tipo: aceptar ? 'reto_aceptado' : 'reto_rechazado',
      mensaje: aceptar ? '¡Has aceptado el reto!' : '¡Has rechazado el reto!',
      leida: false,
      referencia_id: retoId,
      created_at: new Date()
    }));

    await this.challengeRepository.update(reto);
    return reto;
  }

  // Regla 11: Registrar resultado y actualizar rangos
  async completarReto(retoId: string, ganadorId: string): Promise<void> {

    const reto = await this.challengeRepository.findById(retoId);

    if (!reto || reto.props.estado !== 'aceptado') throw new Error("Reto no válido para completar");
    
    const perdedorId = (ganadorId === reto.props.retador_id) ? reto.props.retado_id : reto.props.retador_id;

    const ganador = await this.userRepository.findById(ganadorId);
    const perdedor = await this.userRepository.findById(perdedorId);

    if (!ganador || !perdedor) throw new Error("No se ha encontrado alguno de los usuarios registrados.");

    reto.props.estado = 'completado';
    reto.props.ganador_id = ganadorId;
    await this.challengeRepository.update(reto);

    // 1. Registro de estadísticas y puntos (+10 / -5)
    ganador.registrarVictoria();
    perdedor.registrarDerrota();

    // 2. Validar rango
    this.verificarRango(ganador, true);
    this.verificarRango(perdedor, false);

    // 3. Persistir cambios en los usuarios
    await this.userRepository.update(ganador);
    await this.userRepository.update(perdedor);

    // 4. Notificar a ambos sobre el fin del reto
    this.notificarFinReto(ganadorId, perdedorId, retoId);
  }

  private verificarRango(user: any, ganador: boolean): void {
    const puntos = user.props.puntos;
    const rangoActual = user.props.rango;
    let nuevoRango = rangoActual;

    if (puntos >= 1000) nuevoRango = 'S';
    else if (puntos >= 600) nuevoRango = 'A';
    else if (puntos >= 300) nuevoRango = 'B';
    else if (puntos >= 100) nuevoRango = 'C';
    else nuevoRango = 'D';

    if (nuevoRango !== rangoActual) {
      const jerarquia = ['D', 'C', 'B', 'A', 'S'];
      const indiceActual = jerarquia.indexOf(rangoActual);
      const indiceNuevo = jerarquia.indexOf(nuevoRango);
  
      user.actualizarRango(nuevoRango);
  
      if (indiceNuevo > indiceActual) this.notificarRango(user.props.id, 'rango_subido', "¡Felicidades! Has subido de rango.");
      else this.notificarRango(user.props.id, 'rango_disminuido', "Lo lamentamos, has bajado de rango.");
    }
  }

  private notificarRango(userId: string, tipo: TipoNotificacion, mensaje: string): void {
    this.notificationRepository.save(new Notification({
      id: crypto.randomUUID(),
      user_id: userId,
      tipo: tipo,
      mensaje: mensaje,
      leida: false,
      referencia_id: null,
      created_at: new Date()
    }));
  }

  private notificarFinReto(ganadorId: string, perdedorId: string, retoId: string): void {
    this.notificationRepository.save(new Notification({
      id: crypto.randomUUID(),
      user_id: ganadorId,
      tipo: 'resultado',
      mensaje: "¡Felicidades! Has ganado el reto y +10 puntos.",
      leida: false,
      referencia_id: retoId,
      created_at: new Date()
    }));

    this.notificationRepository.save(new Notification({
      id: crypto.randomUUID(),
      user_id: perdedorId,
      tipo: 'resultado',
      mensaje: "Has perdido el reto. Se han descontado 5 puntos.",
      leida: false,
      referencia_id: retoId,
      created_at: new Date()
    }));
  }

  async obtenerHistorial(userId: string): Promise<Challenge[]> {
    return await this.challengeRepository.findAllByUserId(userId);
  }
}