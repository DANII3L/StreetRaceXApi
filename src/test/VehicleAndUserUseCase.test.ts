import { VehicleUseCase } from '../core/use-cases/VehicleUseCase';
import { UserUseCase } from '../core/use-cases/UserUseCase';
import { Vehicle } from '../core/domain/entities/Vehicle';
import { User } from '../core/domain/entities/User';

const buildVehicle = (overrides = {}): Vehicle =>
  new Vehicle({
    id: 'v-1',
    user_id: 'user-1',
    tipo_vehiculo: 'auto',
    marca: 'Nissan',
    modelo: 'Skyline',
    año: 1999,
    color: 'Plata',
    placa: 'XYZ-001',
    foto: 'url',
    modificaciones: null,
    activo: true,
    created_at: new Date(),
    ...overrides,
  });

const buildUser = (overrides = {}): User =>
  new User({
    id: 'user-1',
    username: 'drift_king',
    email: 'drift@race.com',
    password_hash: 'hash',
    foto_perfil: '',
    zona_localidad: 'Envigado',
    zona_ciudad: 'Medellín',
    zona_estado: 'Antioquia',
    zona_pais: 'Colombia',
    rango: 'C',
    categoria: 'cat-1',
    victorias: 5,
    derrotas: 2,
    retos_consecutivos: 3,
    estado: 'activo',
    puntos: 100,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

const makeVehicleRepo = () => ({
  findByUserId: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findActiveByUserId: jest.fn(),
});

const makeUserRepo = () => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findByRango: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
});

describe('VehicleUseCase - agregarVehiculo', () => {
  it('registra el primer vehículo y lo marca como activo por defecto', async () => {
    const repo = makeVehicleRepo();
    repo.findByUserId.mockResolvedValue([]);
    repo.save.mockResolvedValue(undefined);

    const useCase = new VehicleUseCase(repo as any);
    const result = await useCase.agregarVehiculo('user-1', {
      tipo_vehiculo: 'auto',
      marca: 'Toyota',
      modelo: 'AE86',
      año: 1986,
      color: 'Blanco',
      placa: 'TRU-086',
      foto: 'url',
    });

    expect(result.props.activo).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('el segundo vehículo se registra como inactivo', async () => {
    const repo = makeVehicleRepo();
    repo.findByUserId.mockResolvedValue([buildVehicle()]);
    repo.save.mockResolvedValue(undefined);

    const useCase = new VehicleUseCase(repo as any);
    const result = await useCase.agregarVehiculo('user-1', {
      tipo_vehiculo: 'moto',
      marca: 'Honda',
      modelo: 'CBR',
      año: 2022,
      color: 'Rojo',
      placa: 'MOT-022',
      foto: 'url',
    });

    expect(result.props.activo).toBe(false);
  });

  it('bloquea el registro del cuarto vehículo', async () => {
    const repo = makeVehicleRepo();
    repo.findByUserId.mockResolvedValue([
      buildVehicle({ id: 'v-1' }),
      buildVehicle({ id: 'v-2' }),
      buildVehicle({ id: 'v-3' }),
    ]);

    const useCase = new VehicleUseCase(repo as any);
    await expect(
      useCase.agregarVehiculo('user-1', { tipo_vehiculo: 'auto', marca: 'BMW', modelo: 'M3', año: 2023, color: 'Negro', placa: 'BMW-001', foto: 'url' })
    ).rejects.toThrow('No puedes registrar más de 3 vehículos');
  });

  it('asigna placa null a los monopatines eléctricos', async () => {
    const repo = makeVehicleRepo();
    repo.findByUserId.mockResolvedValue([]);
    repo.save.mockResolvedValue(undefined);

    const useCase = new VehicleUseCase(repo as any);
    const result = await useCase.agregarVehiculo('user-1', {
      tipo_vehiculo: 'monopatin_electrico',
      marca: 'Ninebot',
      modelo: 'Max',
      año: 2023,
      color: 'Gris',
      placa: 'IGNORAR',
      foto: 'url',
    });

    expect(result.props.placa).toBeNull();
  });
});

describe('VehicleUseCase - marcarComoActivo', () => {
  it('activa el vehículo seleccionado y desactiva los demás', async () => {
    const v1 = buildVehicle({ id: 'v-1', activo: true });
    const v2 = buildVehicle({ id: 'v-2', activo: false });
    const v3 = buildVehicle({ id: 'v-3', activo: false });

    const repo = makeVehicleRepo();
    repo.findByUserId.mockResolvedValue([v1, v2, v3]);
    repo.update.mockResolvedValue(undefined);

    const useCase = new VehicleUseCase(repo as any);
    await useCase.marcarComoActivo('user-1', 'v-2');

    expect(v1.props.activo).toBe(false);
    expect(v2.props.activo).toBe(true);
    expect(v3.props.activo).toBe(false);
    expect(repo.update).toHaveBeenCalledTimes(3);
  });
});

describe('VehicleUseCase - findByUserId', () => {
  it('devuelve todos los vehículos del usuario', async () => {
    const vehicles = [buildVehicle({ id: 'v-1' }), buildVehicle({ id: 'v-2' })];
    const repo = makeVehicleRepo();
    repo.findByUserId.mockResolvedValue(vehicles);

    const useCase = new VehicleUseCase(repo as any);
    const result = await useCase.findByUserId('user-1');
    expect(result).toHaveLength(2);
  });
});

describe('UserUseCase - obtenerPerfil', () => {
  it('retorna el perfil del usuario existente', async () => {
    const repo = makeUserRepo();
    const user = buildUser();
    repo.findById.mockResolvedValue(user);

    const useCase = new UserUseCase(repo as any);
    const result = await useCase.obtenerPerfil('user-1');
    expect(result).toBe(user);
  });

  it('lanza error si el usuario no existe', async () => {
    const repo = makeUserRepo();
    repo.findById.mockResolvedValue(null);

    const useCase = new UserUseCase(repo as any);
    await expect(useCase.obtenerPerfil('nadie')).rejects.toThrow('Usuario no encontrado');
  });
});

describe('UserUseCase - obtenerPilotosParaRetar', () => {
  it('excluye al propio usuario de la lista de rivales', async () => {
    const repo = makeUserRepo();
    const yo = buildUser({ id: 'user-1' });
    const rival = buildUser({ id: 'user-2', username: 'rival' });
    repo.findByRango.mockResolvedValue([yo, rival]);

    const useCase = new UserUseCase(repo as any);
    const result = await useCase.obtenerPilotosParaRetar('user-1', 'C');

    expect(result).toHaveLength(1);
    expect(result[0].props.id).toBe('user-2');
  });

  it('devuelve lista vacía si no hay más pilotos del mismo rango', async () => {
    const repo = makeUserRepo();
    repo.findByRango.mockResolvedValue([buildUser({ id: 'user-1' })]);

    const useCase = new UserUseCase(repo as any);
    const result = await useCase.obtenerPilotosParaRetar('user-1', 'C');
    expect(result).toHaveLength(0);
  });
});

describe('UserUseCase - actualizarPerfil', () => {
  it('actualiza solo los campos permitidos', async () => {
    const repo = makeUserRepo();
    const user = buildUser();
    repo.findById.mockResolvedValue(user);
    repo.save.mockResolvedValue(undefined);

    const useCase = new UserUseCase(repo as any);
    await useCase.actualizarPerfil('user-1', {
      username: 'nuevo_nombre',
      foto_perfil: 'nueva_foto.jpg',
      rango: 'S',
    });

    expect(user.props.username).toBe('nuevo_nombre');
    expect(user.props.foto_perfil).toBe('nueva_foto.jpg');
    expect(user.props.rango).toBe('C');
  });

  it('lanza error si el usuario no existe', async () => {
    const repo = makeUserRepo();
    repo.findById.mockResolvedValue(null);

    const useCase = new UserUseCase(repo as any);
    await expect(useCase.actualizarPerfil('fantasma', { username: 'x' })).rejects.toThrow('Usuario no encontrado');
  });
});
