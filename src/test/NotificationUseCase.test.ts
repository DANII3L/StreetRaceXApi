import { NotificationUseCase } from '../core/use-cases/NotificationUseCase';
import { Notification } from '../core/domain/entities/Notification';

const buildNotification = (overrides = {}): Notification =>
  new Notification({
    id: 'notif-1',
    user_id: 'user-1',
    tipo: 'reto_recibido',
    mensaje: 'Tienes un reto nuevo',
    leida: false,
    referencia_id: 'ch-1',
    created_at: new Date(),
    ...overrides,
  });

const makeRepo = () => ({
  save: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  findByUserId: jest.fn(),
});

describe('NotificationUseCase - crearNotificacion', () => {
  it('persiste y devuelve una nueva notificación no leída', async () => {
    const repo = makeRepo();
    repo.save.mockResolvedValue(undefined);

    const useCase = new NotificationUseCase(repo as any);
    const result = await useCase.crearNotificacion('user-1', 'reto_recibido', '¡Te retaron!', 'ch-1');

    expect(result.props.leida).toBe(false);
    expect(result.props.tipo).toBe('reto_recibido');
    expect(result.props.mensaje).toBe('¡Te retaron!');
    expect(result.props.referencia_id).toBe('ch-1');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('crea la notificación sin referencia cuando no se pasa referenciaId', async () => {
    const repo = makeRepo();
    repo.save.mockResolvedValue(undefined);

    const useCase = new NotificationUseCase(repo as any);
    const result = await useCase.crearNotificacion('user-1', 'rango_subido', '¡Subiste de rango!');

    expect(result.props.referencia_id).toBeNull();
  });
});

describe('NotificationUseCase - marcarLeida', () => {
  it('marca la notificación como leída y la persiste', async () => {
    const repo = makeRepo();
    const notif = buildNotification();
    repo.findById.mockResolvedValue(notif);
    repo.update.mockResolvedValue(undefined);

    const useCase = new NotificationUseCase(repo as any);
    await useCase.marcarLeida('notif-1');

    expect(notif.props.leida).toBe(true);
    expect(repo.update).toHaveBeenCalledWith(notif);
  });

  it('no lanza error si la notificación no existe', async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);

    const useCase = new NotificationUseCase(repo as any);
    await expect(useCase.marcarLeida('no-existe')).resolves.not.toThrow();
    expect(repo.update).not.toHaveBeenCalled();
  });
});

describe('NotificationUseCase - obtenerPorUsuario', () => {
  it('retorna todas las notificaciones del usuario', async () => {
    const repo = makeRepo();
    const notificaciones = [
      buildNotification({ id: 'n-1' }),
      buildNotification({ id: 'n-2', tipo: 'resultado' }),
    ];
    repo.findByUserId.mockResolvedValue(notificaciones);

    const useCase = new NotificationUseCase(repo as any);
    const result = await useCase.obtenerPorUsuario('user-1');

    expect(result).toHaveLength(2);
    expect(repo.findByUserId).toHaveBeenCalledWith('user-1');
  });

  it('devuelve lista vacía si el usuario no tiene notificaciones', async () => {
    const repo = makeRepo();
    repo.findByUserId.mockResolvedValue([]);

    const useCase = new NotificationUseCase(repo as any);
    const result = await useCase.obtenerPorUsuario('user-sin-notifs');
    expect(result).toHaveLength(0);
  });
});
