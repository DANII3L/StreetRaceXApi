import { Vehicle } from "../../domain/entities/Vehicle";

export interface IVehicleRepository {
  save(vehicle: Vehicle): Promise<void>;
  update(vehicle: Vehicle): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Vehicle | null>;
  findByUserId(user_id: string): Promise<Vehicle[]>;
  findActiveByUserId(user_id: string): Promise<Vehicle | null>;
}