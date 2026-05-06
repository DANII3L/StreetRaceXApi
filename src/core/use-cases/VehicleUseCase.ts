import { Vehicle } from "../domain/entities/Vehicle";
import { IVehicleRepository } from "../interfaces/repositories/IVehicleRepository";

export class VehicleUseCase {
  constructor(private vehicleRepository: IVehicleRepository) {}

  // RF-03: Agregar un vehículo
  async agregarVehiculo(userId: string, data: any): Promise<Vehicle> {
    // Regla 2: Máximo 3 vehículos
    const vehiculosActuales = await this.vehicleRepository.findByUserId(userId);
    if (vehiculosActuales.length >= 3) {
      throw new Error("No puedes registrar más de 3 vehículos");
    }

    const nuevoVehiculo = new Vehicle({
      id: crypto.randomUUID(),
      user_id: userId,
      tipo_vehiculo: data.tipo_vehiculo,
      marca: data.marca,
      modelo: data.modelo,
      año: data.año,
      color: data.color,
      placa: data.tipo_vehiculo === 'monopatin_electrico' ? null : data.placa,
      foto: data.foto,
      modificaciones: data.modificaciones || null,
      activo: vehiculosActuales.length === 0, // El primero es activo por defecto
      created_at: new Date()
    });

    await this.vehicleRepository.save(nuevoVehiculo);
    return nuevoVehiculo;
  }

  // Regla 3: Solo un vehículo activo a la vez
  async marcarComoActivo(userId: string, vehicleId: string): Promise<void> {
    const vehiculos = await this.vehicleRepository.findByUserId(userId);
    
    for (const v of vehiculos) {
      v.props.activo = (v.props.id === vehicleId); // Activa el seleccionado y desactiva los demás
      await this.vehicleRepository.update(v);
    }
  }

  async findByUserId(userId: string): Promise<Vehicle[]> {
    return await this.vehicleRepository.findByUserId(userId);
  }
}