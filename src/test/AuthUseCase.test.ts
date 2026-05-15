import { AuthUseCase } from '../core/use-cases/AuthUseCase';
import { User } from '../core/domain/entities/User';
import { CompetitionCategory } from '../core/domain/entities/CompetitionCategory';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('jwt_token_mock'),
}));

import bcrypt from 'bcrypt';

const makeUser = (overrides = {}): User =>
  new User({
    id: 'user-1',
    username: 'vettel',
    email: 'vettel@race.com',
    password_hash: 'hashed_password',
    foto_perfil: '',
    zona_localidad: 'Bello',
    zona_ciudad: 'Medellín',
    zona_estado: 'Antioquia',
    zona_pais: 'Colombia',
    rango: 'D',
    categoria: 'cat-novato',
    victorias: 0,
    derrotas: 0,
    retos_consecutivos: 0,
    estado: 'activo',
    puntos: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  });

const makeCategory = (): CompetitionCategory =>
  new CompetitionCategory({
    id: 'cat-novato',
    nombre: 'Novato',
    descripcion: 'Categoría inicial para nuevos usuarios',
    activo: true,
  });

const makeRepos = () => ({
  userRepo: {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findByRango: jest.fn(),
  },
  categoryRepo: {
    findByNombre: jest.fn(),
    save: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  },
});

describe('AuthUseCase - registrar', () => {
  it('registra un nuevo usuario cuando email y username están disponibles', async () => {
    const { userRepo, categoryRepo } = makeRepos();
    const category = makeCategory();

    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.findByUsername.mockResolvedValue(null);
    categoryRepo.findByNombre.mockResolvedValue(category);
    userRepo.save.mockResolvedValue(undefined);

    const useCase = new AuthUseCase(userRepo as any, categoryRepo as any);
    const result = await useCase.registrar({
      username: 'nuevoPiloto',
      email: 'nuevo@race.com',
      password: 'pass123',
      zona_localidad: 'Laureles',
      zona_ciudad: 'Medellín',
      zona_estado: 'Antioquia',
      zona_pais: 'Colombia',
    });

    expect(result.props.rango).toBe('D');
    expect(result.props.victorias).toBe(0);
    expect(result.props.puntos).toBe(0);
    expect(result.props.estado).toBe('activo');
    expect(userRepo.save).toHaveBeenCalledTimes(1);
  });

  it('rechaza el registro si el email ya existe', async () => {
    const { userRepo, categoryRepo } = makeRepos();
    userRepo.findByEmail.mockResolvedValue(makeUser());

    const useCase = new AuthUseCase(userRepo as any, categoryRepo as any);
    await expect(
      useCase.registrar({ username: 'otro', email: 'vettel@race.com', password: '123', zona_localidad: '', zona_ciudad: '', zona_estado: '', zona_pais: '' })
    ).rejects.toThrow('El correo electrónico ya está registrado');
  });

  it('rechaza el registro si el username ya está en uso', async () => {
    const { userRepo, categoryRepo } = makeRepos();
    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.findByUsername.mockResolvedValue(makeUser());

    const useCase = new AuthUseCase(userRepo as any, categoryRepo as any);
    await expect(
      useCase.registrar({ username: 'vettel', email: 'nuevo@race.com', password: '123', zona_localidad: '', zona_ciudad: '', zona_estado: '', zona_pais: '' })
    ).rejects.toThrow('El nombre de usuario ya está en uso');
  });

  it('crea la categoría Novato si no existe en la base de datos', async () => {
    const { userRepo, categoryRepo } = makeRepos();
    const category = makeCategory();

    userRepo.findByEmail.mockResolvedValue(null);
    userRepo.findByUsername.mockResolvedValue(null);
    categoryRepo.findByNombre.mockResolvedValue(null);
    categoryRepo.save.mockResolvedValue(category);
    userRepo.save.mockResolvedValue(undefined);

    const useCase = new AuthUseCase(userRepo as any, categoryRepo as any);
    await useCase.registrar({
      username: 'primerPiloto',
      email: 'primer@race.com',
      password: '123',
      zona_localidad: '',
      zona_ciudad: '',
      zona_estado: '',
      zona_pais: '',
    });

    expect(categoryRepo.save).toHaveBeenCalledTimes(1);
  });
});

describe('AuthUseCase - login', () => {
  it('devuelve token y usuario con credenciales válidas', async () => {
    const { userRepo, categoryRepo } = makeRepos();
    const user = makeUser();

    userRepo.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const useCase = new AuthUseCase(userRepo as any, categoryRepo as any);
    const result = await useCase.login('vettel@race.com', 'pass123');

    expect(result.token).toBe('jwt_token_mock');
    expect(result.user).toBe(user);
  });

  it('lanza error si el email no existe', async () => {
    const { userRepo, categoryRepo } = makeRepos();
    userRepo.findByEmail.mockResolvedValue(null);

    const useCase = new AuthUseCase(userRepo as any, categoryRepo as any);
    await expect(useCase.login('noexiste@race.com', 'pass')).rejects.toThrow('Credenciales inválidas');
  });

  it('lanza error si la contraseña no coincide', async () => {
    const { userRepo, categoryRepo } = makeRepos();
    userRepo.findByEmail.mockResolvedValue(makeUser());
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const useCase = new AuthUseCase(userRepo as any, categoryRepo as any);
    await expect(useCase.login('vettel@race.com', 'wrongpass')).rejects.toThrow('Credenciales inválidas');
  });
});

describe('AuthUseCase - getUserById', () => {
  it('retorna el usuario si existe', async () => {
    const { userRepo, categoryRepo } = makeRepos();
    const user = makeUser();
    userRepo.findById.mockResolvedValue(user);

    const useCase = new AuthUseCase(userRepo as any, categoryRepo as any);
    const result = await useCase.getUserById('user-1');
    expect(result).toBe(user);
  });

  it('lanza error si el usuario no existe', async () => {
    const { userRepo, categoryRepo } = makeRepos();
    userRepo.findById.mockResolvedValue(null);

    const useCase = new AuthUseCase(userRepo as any, categoryRepo as any);
    await expect(useCase.getUserById('fantasma')).rejects.toThrow('Usuario no encontrado');
  });
});
