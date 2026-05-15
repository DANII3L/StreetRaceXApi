import { ChallengeUseCase } from '../core/use-cases/ChallengeUseCase';
import { User } from '../core/domain/entities/User';
import { Vehicle } from '../core/domain/entities/Vehicle';
import { Challenge } from '../core/domain/entities/Challenge';

jest.mock('../infrastructure/http/app', () => ({
  io: { to: jest.fn().mockReturnThis(), emit: jest.fn() },
  userSockets: new Map(),
}));

const buildUser = (overrides = {}): User =>
  new User({
    id: 'user-1',
    username: 'piloto',
    email: 'p@race.com',
    password_hash: 'hash',
    foto_perfil: '',
    zona_localidad: 'Itagüí',
    zona_ciudad: 'Medellín',
    zona_estado: 'Antioquia',
    zona_pais: 'Colombia',
    rango: 'B',
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

const buildVehicle = (userId: string, tipo = 'auto', overrides = {}): Vehicle =>
  new Vehicle({
    id: `v-${userId}`,
    user_id: userId,
    tipo_vehiculo: tipo as any,
    marca: 'Honda',
    modelo: 'Civic',
    año: 2018,
    color: 'Azul',
    placa: 'TST-001',
    foto: 'url',
    modificaciones: null,
    activo: true,
    created_at: new Date(),
    ...overrides,
  });

const buildChallenge = (overrides = {}): Challenge =>
  new Challenge({
    id: 'ch-1',
    retador_id: 'user-1',
    retado_id: 'user-2',
    tipo_carrera: 'cuarto_milla',
    vehiculo_retador_id: 'v-user-1',
    vehiculo_retado_id: 'v-user-2',
    estado: 'pendiente',
    ganador_id: null,
    ubicacion_acordada: 'Autopista',
    fecha_acordada: new Date(),
    notas: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

const makeRepos = () => ({
  challengeRepo: {
    save: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    findActiveBetweenPlayers: jest.fn(),
    findAllByUserId: jest.fn(),
  },
  userRepo: {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findByRango: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  },
  vehicleRepo: {
    findByUserId: jest.fn(),
    findActiveByUserId: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
  },
  notificationRepo: {
    save: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    findByUserId: jest.fn(),
  },
});

const makeUseCase = (repos: ReturnType<typeof makeRepos>) =>
  new ChallengeUseCase(
    repos.challengeRepo as any,
    repos.userRepo as any,
    repos.vehicleRepo as any,
    repos.notificationRepo as any
  );

describe('ChallengeUseCase - enviarReto', () => {
  it('crea un reto válido entre dos pilotos del mismo rango con vehículos compatibles', async () => {
    const repos = makeRepos();
    const retador = buildUser({ id: 'user-1', rango: 'B' });
    const retado = buildUser({ id: 'user-2', rango: 'B' });

    repos.userRepo.findById.mockImplementation((id: string) =>
      Promise.resolve(id === 'user-1' ? retador : retado)
    );
    repos.vehicleRepo.findActiveByUserId.mockImplementation((id: string) =>
      Promise.resolve(buildVehicle(id, 'auto'))
    );
    repos.challengeRepo.findActiveBetweenPlayers.mockResolvedValue(null);
    repos.challengeRepo.save.mockResolvedValue(undefined);
    repos.notificationRepo.save.mockResolvedValue(undefined);

    const useCase = makeUseCase(repos);
    const result = await useCase.enviarReto('user-1', {
      retado_id: 'user-2',
      tipo_carrera: 'cuarto_milla',
      ubicacion_acordada: 'La Autopista',
      fecha_acordada: new Date(),
      notas: null,
    });

    expect(result.props.estado).toBe('pendiente');
    expect(result.props.retador_id).toBe('user-1');
    expect(result.props.retado_id).toBe('user-2');
    expect(repos.challengeRepo.save).toHaveBeenCalledTimes(1);
    expect(repos.notificationRepo.save).toHaveBeenCalledTimes(1);
  });

  it('impide que un piloto se rete a sí mismo', async () => {
    const repos = makeRepos();
    const useCase = makeUseCase(repos);

    await expect(
      useCase.enviarReto('user-1', { retado_id: 'user-1', tipo_carrera: 'vueltas', ubicacion_acordada: '', fecha_acordada: new Date() })
    ).rejects.toThrow('No puedes retarte a ti mismo');
  });

  it('rechaza el reto si los pilotos son de distinto rango', async () => {
    const repos = makeRepos();
    repos.userRepo.findById.mockImplementation((id: string) =>
      Promise.resolve(
        id === 'user-1'
          ? buildUser({ id: 'user-1', rango: 'A' })
          : buildUser({ id: 'user-2', rango: 'C' })
      )
    );

    const useCase = makeUseCase(repos);
    await expect(
      useCase.enviarReto('user-1', { retado_id: 'user-2', tipo_carrera: 'derrape', ubicacion_acordada: '', fecha_acordada: new Date() })
    ).rejects.toThrow('Solo puedes retar a pilotos de tu mismo rango competitivo');
  });

  it('rechaza el reto si algún piloto no tiene vehículo activo', async () => {
    const repos = makeRepos();
    repos.userRepo.findById.mockImplementation((id: string) =>
      Promise.resolve(buildUser({ id, rango: 'B' }))
    );
    repos.vehicleRepo.findActiveByUserId.mockResolvedValue(null);

    const useCase = makeUseCase(repos);
    await expect(
      useCase.enviarReto('user-1', { retado_id: 'user-2', tipo_carrera: 'cuarto_milla', ubicacion_acordada: '', fecha_acordada: new Date() })
    ).rejects.toThrow('Ambos pilotos deben tener un vehículo activo para competir');
  });

  it('rechaza el reto si los vehículos son de distinto tipo', async () => {
    const repos = makeRepos();
    repos.userRepo.findById.mockImplementation((id: string) =>
      Promise.resolve(buildUser({ id, rango: 'B' }))
    );
    repos.vehicleRepo.findActiveByUserId.mockImplementation((id: string) =>
      Promise.resolve(buildVehicle(id, id === 'user-1' ? 'auto' : 'moto'))
    );

    const useCase = makeUseCase(repos);
    await expect(
      useCase.enviarReto('user-1', { retado_id: 'user-2', tipo_carrera: 'cuarto_milla', ubicacion_acordada: '', fecha_acordada: new Date() })
    ).rejects.toThrow('Los vehículos deben ser del mismo tipo');
  });

  it('rechaza el reto si ya existe uno activo entre los mismos pilotos', async () => {
    const repos = makeRepos();
    repos.userRepo.findById.mockImplementation((id: string) =>
      Promise.resolve(buildUser({ id, rango: 'B' }))
    );
    repos.vehicleRepo.findActiveByUserId.mockImplementation((id: string) =>
      Promise.resolve(buildVehicle(id, 'auto'))
    );
    repos.challengeRepo.findActiveBetweenPlayers.mockResolvedValue(buildChallenge());

    const useCase = makeUseCase(repos);
    await expect(
      useCase.enviarReto('user-1', { retado_id: 'user-2', tipo_carrera: 'vueltas', ubicacion_acordada: '', fecha_acordada: new Date() })
    ).rejects.toThrow('Ya existe un reto pendiente o en curso con este piloto');
  });

  it('lanza error si alguno de los pilotos no existe', async () => {
    const repos = makeRepos();
    repos.userRepo.findById.mockResolvedValue(null);

    const useCase = makeUseCase(repos);
    await expect(
      useCase.enviarReto('user-1', { retado_id: 'user-2', tipo_carrera: 'vueltas', ubicacion_acordada: '', fecha_acordada: new Date() })
    ).rejects.toThrow('Uno de los pilotos no existe');
  });
});

describe('ChallengeUseCase - responderReto', () => {
  it('acepta el reto y cambia el estado a aceptado', async () => {
    const repos = makeRepos();
    const reto = buildChallenge({ retado_id: 'user-2', estado: 'pendiente' });
    repos.challengeRepo.findById.mockResolvedValue(reto);
    repos.challengeRepo.update.mockResolvedValue(undefined);
    repos.notificationRepo.save.mockResolvedValue(undefined);

    const useCase = makeUseCase(repos);
    const result = await useCase.responderReto('ch-1', 'user-2', true);

    expect(result.props.estado).toBe('aceptado');
  });

  it('rechaza el reto y cambia el estado a rechazado', async () => {
    const repos = makeRepos();
    const reto = buildChallenge({ retado_id: 'user-2', estado: 'pendiente' });
    repos.challengeRepo.findById.mockResolvedValue(reto);
    repos.challengeRepo.update.mockResolvedValue(undefined);
    repos.notificationRepo.save.mockResolvedValue(undefined);

    const useCase = makeUseCase(repos);
    const result = await useCase.responderReto('ch-1', 'user-2', false);

    expect(result.props.estado).toBe('rechazado');
  });

  it('no permite responder a un reto que no te pertenece', async () => {
    const repos = makeRepos();
    const reto = buildChallenge({ retado_id: 'user-2', estado: 'pendiente' });
    repos.challengeRepo.findById.mockResolvedValue(reto);

    const useCase = makeUseCase(repos);
    await expect(useCase.responderReto('ch-1', 'user-3', true)).rejects.toThrow(
      'No tienes permiso para responder a este reto'
    );
  });

  it('no permite responder a un reto que ya no está pendiente', async () => {
    const repos = makeRepos();
    const reto = buildChallenge({ retado_id: 'user-2', estado: 'aceptado' });
    repos.challengeRepo.findById.mockResolvedValue(reto);

    const useCase = makeUseCase(repos);
    await expect(useCase.responderReto('ch-1', 'user-2', true)).rejects.toThrow('El reto ya no está pendiente');
  });

  it('lanza error si el reto no existe', async () => {
    const repos = makeRepos();
    repos.challengeRepo.findById.mockResolvedValue(null);

    const useCase = makeUseCase(repos);
    await expect(useCase.responderReto('no-existe', 'user-2', true)).rejects.toThrow('Reto no encontrado');
  });
});

describe('ChallengeUseCase - completarReto', () => {
  it('registra el ganador y actualiza las estadísticas de ambos pilotos', async () => {
    const repos = makeRepos();
    const reto = buildChallenge({ estado: 'aceptado', retador_id: 'user-1', retado_id: 'user-2' });
    const ganador = buildUser({ id: 'user-1', puntos: 50 });
    const perdedor = buildUser({ id: 'user-2', puntos: 50 });

    repos.challengeRepo.findById.mockResolvedValue(reto);
    repos.userRepo.findById.mockImplementation((id: string) =>
      Promise.resolve(id === 'user-1' ? ganador : perdedor)
    );
    repos.challengeRepo.update.mockResolvedValue(undefined);
    repos.userRepo.update.mockResolvedValue(undefined);
    repos.notificationRepo.save.mockResolvedValue(undefined);

    const useCase = makeUseCase(repos);
    await useCase.completarReto('ch-1', 'user-1');

    expect(ganador.props.victorias).toBe(1);
    expect(ganador.props.puntos).toBe(60);
    expect(perdedor.props.derrotas).toBe(1);
    expect(perdedor.props.puntos).toBe(45);
    expect(reto.props.estado).toBe('completado');
    expect(reto.props.ganador_id).toBe('user-1');
  });

  it('sube de rango cuando los puntos superan el umbral', async () => {
    const repos = makeRepos();
    const reto = buildChallenge({ estado: 'aceptado', retador_id: 'user-1', retado_id: 'user-2' });
    const ganador = buildUser({ id: 'user-1', puntos: 95, rango: 'D' });
    const perdedor = buildUser({ id: 'user-2', puntos: 50 });

    repos.challengeRepo.findById.mockResolvedValue(reto);
    repos.userRepo.findById.mockImplementation((id: string) =>
      Promise.resolve(id === 'user-1' ? ganador : perdedor)
    );
    repos.challengeRepo.update.mockResolvedValue(undefined);
    repos.userRepo.update.mockResolvedValue(undefined);
    repos.notificationRepo.save.mockResolvedValue(undefined);

    const useCase = makeUseCase(repos);
    await useCase.completarReto('ch-1', 'user-1');

    expect(ganador.props.rango).toBe('C');
  });

  it('rechaza completar un reto que no está en estado aceptado', async () => {
    const repos = makeRepos();
    repos.challengeRepo.findById.mockResolvedValue(buildChallenge({ estado: 'pendiente' }));

    const useCase = makeUseCase(repos);
    await expect(useCase.completarReto('ch-1', 'user-1')).rejects.toThrow('Reto no válido para completar');
  });
});

describe('ChallengeUseCase - obtenerHistorial', () => {
  it('retorna todos los retos del usuario', async () => {
    const repos = makeRepos();
    const historial = [buildChallenge({ id: 'ch-1' }), buildChallenge({ id: 'ch-2' })];
    repos.challengeRepo.findAllByUserId.mockResolvedValue(historial);

    const useCase = makeUseCase(repos);
    const result = await useCase.obtenerHistorial('user-1');
    expect(result).toHaveLength(2);
  });
});
