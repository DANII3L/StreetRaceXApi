import { User, UserProps } from '../core/domain/entities/User';
import { Challenge, ChallengeProps } from '../core/domain/entities/Challenge';
import { Vehicle, VehicleProps } from '../core/domain/entities/Vehicle';
import { Notification, NotificationProps } from '../core/domain/entities/Notification';
import { CompetitionCategory } from '../core/domain/entities/CompetitionCategory';

const buildUser = (overrides: Partial<UserProps> = {}): User =>
  new User({
    id: 'user-1',
    username: 'piloto99',
    email: 'piloto@test.com',
    password_hash: 'hashed',
    foto_perfil: '',
    zona_localidad: 'El Centro',
    zona_ciudad: 'Medellín',
    zona_estado: 'Antioquia',
    zona_pais: 'Colombia',
    rango: 'D',
    categoria: 'cat-1',
    victorias: 0,
    derrotas: 0,
    retos_consecutivos: 0,
    estado: 'activo',
    puntos: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

const buildNotification = (overrides: Partial<NotificationProps> = {}): Notification =>
  new Notification({
    id: 'notif-1',
    user_id: 'user-1',
    tipo: 'reto_recibido',
    mensaje: 'Tienes un nuevo reto',
    leida: false,
    referencia_id: null,
    created_at: new Date(),
    ...overrides,
  });

describe('User', () => {
  it('arranca con victorias, derrotas y puntos en cero', () => {
    const user = buildUser();
    expect(user.props.victorias).toBe(0);
    expect(user.props.derrotas).toBe(0);
    expect(user.props.puntos).toBe(0);
  });

  it('suma 10 puntos y aumenta victorias al registrar una victoria', () => {
    const user = buildUser();
    user.registrarVictoria();
    expect(user.props.victorias).toBe(1);
    expect(user.props.puntos).toBe(10);
    expect(user.props.retos_consecutivos).toBe(1);
  });

  it('acumula victorias y puntos correctamente en múltiples victorias', () => {
    const user = buildUser();
    user.registrarVictoria();
    user.registrarVictoria();
    user.registrarVictoria();
    expect(user.props.victorias).toBe(3);
    expect(user.props.puntos).toBe(30);
    expect(user.props.retos_consecutivos).toBe(3);
  });

  it('resta 5 puntos y aumenta derrotas al registrar una derrota', () => {
    const user = buildUser({ puntos: 20 });
    user.registrarDerrota();
    expect(user.props.derrotas).toBe(1);
    expect(user.props.puntos).toBe(15);
  });

  it('no lleva los puntos a negativo si ya están en 0', () => {
    const user = buildUser({ puntos: 0 });
    user.registrarDerrota();
    expect(user.props.puntos).toBe(0);
  });

  it('reduce retos_consecutivos al perder, pero no por debajo de 0', () => {
    const user = buildUser({ retos_consecutivos: 2, puntos: 10 });
    user.registrarDerrota();
    expect(user.props.retos_consecutivos).toBe(1);
    user.registrarDerrota();
    user.registrarDerrota();
    expect(user.props.retos_consecutivos).toBe(0);
  });

  it('actualiza el rango correctamente', () => {
    const user = buildUser({ rango: 'D' });
    user.actualizarRango('B');
    expect(user.props.rango).toBe('B');
  });

  it('permite todos los rangos válidos del sistema', () => {
    const rangos = ['S', 'A', 'B', 'C', 'D'] as const;
    rangos.forEach(rango => {
      const user = buildUser();
      user.actualizarRango(rango);
      expect(user.props.rango).toBe(rango);
    });
  });
});

describe('Notification', () => {
  it('se crea como no leída por defecto', () => {
    const notif = buildNotification();
    expect(notif.props.leida).toBe(false);
  });

  it('cambia a leída al llamar marcarComoLeida', () => {
    const notif = buildNotification();
    notif.marcarComoLeida();
    expect(notif.props.leida).toBe(true);
  });

  it('se puede llamar marcarComoLeida más de una vez sin error', () => {
    const notif = buildNotification();
    notif.marcarComoLeida();
    notif.marcarComoLeida();
    expect(notif.props.leida).toBe(true);
  });

  it('guarda el mensaje y el tipo correctamente', () => {
    const notif = buildNotification({ tipo: 'rango_subido', mensaje: '¡Subiste de rango!' });
    expect(notif.props.tipo).toBe('rango_subido');
    expect(notif.props.mensaje).toBe('¡Subiste de rango!');
  });
});

describe('Vehicle', () => {
  it('almacena las propiedades del vehículo sin modificarlas', () => {
    const vehicle = new Vehicle({
      id: 'v-1',
      user_id: 'user-1',
      tipo_vehiculo: 'auto',
      marca: 'Toyota',
      modelo: 'Supra',
      año: 2020,
      color: 'Rojo',
      placa: 'ABC-123',
      foto: 'url',
      modificaciones: 'Turbo',
      activo: true,
      created_at: new Date(),
    });

    expect(vehicle.props.marca).toBe('Toyota');
    expect(vehicle.props.tipo_vehiculo).toBe('auto');
    expect(vehicle.props.activo).toBe(true);
  });

  it('acepta placa nula para monopatines eléctricos', () => {
    const vehicle = new Vehicle({
      id: 'v-2',
      user_id: 'user-1',
      tipo_vehiculo: 'monopatin_electrico',
      marca: 'Xiaomi',
      modelo: 'Pro 2',
      año: 2023,
      color: 'Negro',
      placa: null,
      foto: 'url',
      modificaciones: null,
      activo: false,
      created_at: new Date(),
    });

    expect(vehicle.props.placa).toBeNull();
  });
});

describe('Challenge', () => {
  it('se crea en estado pendiente con los pilotos correctos', () => {
    const challenge = new Challenge({
      id: 'ch-1',
      retador_id: 'user-1',
      retado_id: 'user-2',
      tipo_carrera: 'cuarto_milla',
      vehiculo_retador_id: 'v-1',
      vehiculo_retado_id: 'v-2',
      estado: 'pendiente',
      ganador_id: null,
      ubicacion_acordada: 'Autopista Sur',
      fecha_acordada: new Date(),
      notas: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    expect(challenge.props.estado).toBe('pendiente');
    expect(challenge.props.ganador_id).toBeNull();
    expect(challenge.props.retador_id).toBe('user-1');
  });
});

describe('CompetitionCategory', () => {
  it('almacena correctamente sus propiedades', () => {
    const cat = new CompetitionCategory({
      id: 'cat-1',
      nombre: 'Novato',
      descripcion: 'Categoría inicial',
      activo: true,
    });

    expect(cat.props.nombre).toBe('Novato');
    expect(cat.props.activo).toBe(true);
  });
});
