export type EstadoReto = 'pendiente' | 'aceptado' | 'rechazado' | 'en_curso' | 'completado' | 'cancelado';
export type TipoCarrera = 'cuarto_milla' | 'vueltas' | 'derrape';

export interface ChallengeProps {
    id: string;
    retador_id: string;
    retado_id: string;
    tipo_carrera: TipoCarrera;
    vehiculo_retador_id: string;
    vehiculo_retado_id: string;
    estado: EstadoReto;
    ganador_id: string | null;
    ubicacion_acordada: string;
    fecha_acordada: Date;
    notas: string | null;
    created_at: Date;
    updated_at: Date;
}

export class Challenge {
    constructor(public props: ChallengeProps) { }
}