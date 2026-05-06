import { db } from "../firebase";
import { Vehicle } from "../../../core/domain/entities/Vehicle";
import { IVehicleRepository } from "../../../core/interfaces/repositories/IVehicleRepository";

export class FirebaseVehicleRepository implements IVehicleRepository {
  private collection = db.collection('vehicles');

  async save(vehicle: Vehicle): Promise<void> {
    await this.collection.doc(vehicle.props.id).set({ ...vehicle.props });
  }

  async update(vehicle: Vehicle): Promise<void> {
    await this.collection.doc(vehicle.props.id).update({ ...vehicle.props });
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  async findById(id: string): Promise<Vehicle | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return new Vehicle(doc.data() as any);
  }

  async findByUserId(user_id: string): Promise<Vehicle[]> {
    const snapshot = await this.collection.where('user_id', '==', user_id).get();
    return snapshot.docs.map(doc => new Vehicle(doc.data() as any));
  }

  async findActiveByUserId(user_id: string): Promise<Vehicle | null> {
    const snapshot = await this.collection
      .where('user_id', '==', user_id)
      .where('activo', '==', true)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return new Vehicle(snapshot.docs[0].data() as any);
  }
}