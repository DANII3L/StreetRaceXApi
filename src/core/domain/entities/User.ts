export type Rango = 'S' | 'A' | 'B' | 'C' | 'D';
export type EstadoUsuario = 'activo' | 'inactivo' | 'suspendido';

export interface UserProps {
    id: string;
    username: string;
    email: string;
    password_hash: string;
    foto_perfil: string;
    zona_localidad: string;
    zona_ciudad: string;
    zona_estado: string;
    zona_pais: string;
    rango: Rango;
    categoria: string;
    victorias: number;
    derrotas: number;
    retos_consecutivos: number;
    estado: EstadoUsuario;
    puntos: number;
    created_at: Date;
    updated_at: Date;
}

export class User {
    constructor(public props: UserProps) { }

    public registrarVictoria() {
        this.props.victorias++;
        this.props.retos_consecutivos++;
        this.props.puntos += 10;
    }

    public registrarDerrota() {
        this.props.derrotas++;
        if (this.props.retos_consecutivos > 0) {
            this.props.retos_consecutivos--;
        }
        if(this.props.puntos !== 0) this.props.puntos -= 5;
    }
    
    public actualizarRango(nuevoRango: Rango) {
        this.props.rango = nuevoRango;
    }
}