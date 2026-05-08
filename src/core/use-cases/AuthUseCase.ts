import { User } from "../domain/entities/User";
import { IUserRepository } from "../interfaces/repositories/IUserRepository";
import { ICompetitionCategoryRepository } from "../interfaces/repositories/ICompetitionCategoryRepository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
import { CompetitionCategory } from "../domain/entities/CompetitionCategory";
dotenv.config();

export class AuthUseCase {
  constructor(
    private userRepository: IUserRepository,
    private categoryRepository: ICompetitionCategoryRepository
  ) {}

  async registrar(data: any): Promise<User> {
    const { username, email, password, zona_localidad, zona_ciudad, zona_estado, zona_pais } = data;

    // 1. Validaciones de duplicidad (Regla 1)
    const emailExists = await this.userRepository.findByEmail(email);
    if (emailExists) throw new Error("El correo electrónico ya está registrado");

    const userExists = await this.userRepository.findByUsername(username);
    if (userExists) throw new Error("El nombre de usuario ya está en uso");

    // 2. Buscar la categoría inicial en la DB (Sección 3.4)
    let categoriaInicial = await this.categoryRepository.findByNombre("Novato");
    if (!categoriaInicial) {
      categoriaInicial = await this.categoryRepository.save(new CompetitionCategory({
        id: crypto.randomUUID(),
        nombre: "Novato",
        descripcion: "Categoría inicial para nuevos usuarios",
        activo: true
      }));
    }

    // 3. Seguridad
    const password_hash = await bcrypt.hash(password, 10);

    // 4. Crear entidad Usuario con la referencia correcta
    const nuevoUsuario = new User({
      id: crypto.randomUUID(),
      username,
      email,
      password_hash,
      foto_perfil: data.foto_perfil || "",
      zona_localidad,
      zona_ciudad,
      zona_estado,
      zona_pais,
      rango: 'D',
      categoria: categoriaInicial.props.id,
      victorias: 0,
      derrotas: 0,
      retos_consecutivos: 0,
      estado: 'activo',
      puntos: 0,
      created_at: new Date(),
      updated_at: new Date()
    });

    await this.userRepository.save(nuevoUsuario);
    return nuevoUsuario;
  }

  // RF-02: Inicio de sesión y emisión de JWT
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("Credenciales inválidas");

    const isPasswordValid = await bcrypt.compare(password, user.props.password_hash);
    if (!isPasswordValid) throw new Error("Credenciales inválidas");

    const token = jwt.sign(
      { id: user.props.id, rango: user.props.rango },
      process.env.JWT_SECRET || "secret_key",
      { expiresIn: "24h" }
    );

    return { token, user };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error("Usuario no encontrado");
    return user;
  }
  
}