import { db } from "../firebase";
import { User } from "../../../core/domain/entities/User";
import { IUserRepository } from "../../../core/interfaces/repositories/IUserRepository";

export class FirebaseUserRepository implements IUserRepository {
  private collection = db.collection('users');

  async save(user: User): Promise<void> {
    await this.collection.doc(user.props.id).set({
      ...user.props,
      created_at: user.props.created_at,
      updated_at: user.props.updated_at
    });
  }

  async update(user: User, actualizarContrasena: boolean = true): Promise<void> {
    const dataToUpdate: any = { 
      ...user.props, 
      updated_at: new Date() 
    };

    if (!actualizarContrasena) {
      delete dataToUpdate.password_hash;
    }

    await this.collection.doc(user.props.id).update(dataToUpdate);
}

  async findById(id: string): Promise<User | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    let user = new User(doc.data() as any);
    return this.sanitizeUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const snapshot = await this.collection.where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    let user = new User(snapshot.docs[0].data() as any);
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const snapshot = await this.collection.where('username', '==', username).limit(1).get();
    if (snapshot.empty) return null;
    let user = new User(snapshot.docs[0].data() as any);
    return this.sanitizeUser(user);
  }

  // RF-05: Listado de competidores
  async findAvailableCompetitors(rango: string, tipo_vehiculo: string, excludeId: string): Promise<User[]> {
    const snapshot = await this.collection
      .where('rango', '==', rango)
      .where('estado', '==', 'activo')
      .get();

    const users = snapshot.docs
      .map(doc => this.sanitizeUser(new User(doc.data() as any)))
      .filter(u => u.props.id !== excludeId);

    return users;
  }

  async findByRango(rango: string): Promise<User[]> {
    const snapshot = await this.collection.where('rango', '==', rango).get();
    let users = snapshot.docs.map(doc => this.sanitizeUser(new User(doc.data() as any)));
    return users;
  }

  private sanitizeUser(user: User): User {
    user.props.password_hash = '';
    return user;
  }
}