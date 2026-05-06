export type TipoNotificacion = 'reto_recibido' | 'reto_aceptado' | 'reto_rechazado' | 'resultado' | 'rango_subido' | 'rango_disminuido';

export interface NotificationProps {
    id: string;
    user_id: string;
    tipo: TipoNotificacion;
    mensaje: string;
    leida: boolean;
    referencia_id: string | null;
    created_at: Date;
}

export class Notification {
    constructor(public props: NotificationProps) { }
    public marcarComoLeida() {
        this.props.leida = true;
    }
}