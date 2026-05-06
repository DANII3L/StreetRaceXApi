export type TipoVehiculo = 'auto' | 'moto' | 'monopatin_electrico';

export interface VehicleProps {
    id: string;
    user_id: string;
    tipo_vehiculo: TipoVehiculo;
    marca: string;
    modelo: string;
    año: number;
    color: string;
    placa: string | null;
    foto: string;
    modificaciones: string | null;
    activo: boolean;
    created_at: Date;
}

export class Vehicle {
    constructor(public props: VehicleProps) { }
}