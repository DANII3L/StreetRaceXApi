import { IUserRepository } from '../interfaces/repositories/IUserRepository';
import { User } from '../domain/entities/User';

export class UserUseCase {
  constructor(private userRepository: IUserRepository) {}

  /**
   * RF-02: Obtener el perfil completo de un usuario
   */
  async obtenerPerfil(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    return user;
  }

  /**
   * RF-05: Descubrimiento de pilotos
   * Filtra por mismo rango, que no sea el mismo usuario y que estén activos.
   */
  async obtenerPilotosParaRetar(userId: string, rangoActual: string): Promise<User[]> {
    const pilotosCompatibles = await this.userRepository.findByRango(rangoActual);
    return pilotosCompatibles.filter(piloto => piloto.props.id !== userId);
  }

  /**
   * RF-02: Actualizar datos del perfil
   */
  async actualizarPerfil(userId: string, data: Partial<any>): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("Usuario no encontrado");

    const camposPermitidos = ['username', 'foto_perfil', 'zona_localidad', 'zona_ciudad'];
    
    Object.keys(data).forEach(key => {
      if (camposPermitidos.includes(key)) {
        (user.props as any)[key] = data[key];
      }
    });

    await this.userRepository.save(user);
  }
}