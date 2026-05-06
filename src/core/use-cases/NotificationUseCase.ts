import { Notification, TipoNotificacion } from "../domain/entities/Notification";
import { INotificationRepository } from "../interfaces/repositories/INotificationRepository";

export class NotificationUseCase {
  constructor(private notificationRepository: INotificationRepository) {}

  async crearNotificacion(
    userId: string, 
    tipo: TipoNotificacion, 
    mensaje: string, 
    referenciaId?: string
  ): Promise<Notification> {
    
    const nuevaNotificacion = new Notification({
      id: crypto.randomUUID(),
      user_id: userId,
      tipo,
      mensaje,
      leida: false,
      referencia_id: referenciaId || null,
      created_at: new Date()
    });

    await this.notificationRepository.save(nuevaNotificacion);
    return nuevaNotificacion;
  }

  // RF-06: Marcar como leída
  async marcarLeida(notificacionId: string): Promise<void> {
    const notificacion = await this.notificationRepository.findById(notificacionId);
    if (notificacion) {
      notificacion.marcarComoLeida();
      await this.notificationRepository.update(notificacion);
    }
  }

  // Obtener historial para el usuario
  async obtenerPorUsuario(userId: string): Promise<Notification[]> {
    return await this.notificationRepository.findByUserId(userId);
  }
}