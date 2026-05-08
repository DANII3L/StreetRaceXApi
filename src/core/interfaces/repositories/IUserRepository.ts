import { Rango, User } from "../../domain/entities/User";
import { TipoVehiculo } from "../../domain/entities/Vehicle";

export interface IUserRepository {
  save(user: User): Promise<void>;
  update(user: User, actualizarContrasena?: boolean): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findAvailableCompetitors(rango: Rango, tipo_vehiculo: TipoVehiculo, excludeId: string): Promise<User[]>;
  findByRango(rango: string): Promise<User[]>;
}