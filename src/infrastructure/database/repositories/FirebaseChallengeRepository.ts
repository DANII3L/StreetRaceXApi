import { db } from "../firebase";
import { Challenge } from "../../../core/domain/entities/Challenge";
import { IChallengeRepository } from "../../../core/interfaces/repositories/IChallengeRepository";

export class FirebaseChallengeRepository implements IChallengeRepository {
  private collection = db.collection('challenges');

  async save(challenge: Challenge): Promise<void> {
    await this.collection.doc(challenge.props.id).set({ ...challenge.props });
  }

  async update(challenge: Challenge): Promise<void> {
    await this.collection.doc(challenge.props.id).update({ 
      ...challenge.props,
      updated_at: new Date() 
    });
  }

  async findById(id: string): Promise<Challenge | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return new Challenge(doc.data() as any);
  }

  async findAllByUserId(user_id: string): Promise<Challenge[]> {
    const retadorQuery = await this.collection.where('retador_id', '==', user_id).get();
    const retadoQuery = await this.collection.where('retado_id', '==', user_id).get();
    
    const results = [...retadorQuery.docs, ...retadoQuery.docs];
    return results.map(doc => new Challenge(doc.data() as any));
  }

  async findActiveBetweenPlayers(p1: string, p2: string): Promise<Challenge | null> {
    const estadosActivos = ['pendiente', 'aceptado', 'en_curso'];
    const snapshot = await this.collection
      .where('retador_id', 'in', [p1, p2])
      .where('estado', 'in', estadosActivos)
      .get();

    const match = snapshot.docs.find(doc => {
      const data = doc.data();
      return (data.retado_id === p1 || data.retado_id === p2);
    });

    return match ? new Challenge(match.data() as any) : null;
  }
}