import { db } from "../firebase";
import { Notification } from "../../../core/domain/entities/Notification";
import { INotificationRepository } from "../../../core/interfaces/repositories/INotificationRepository";
import { io, userSockets } from "../../http/app";

export class FirebaseNotificationRepository implements INotificationRepository {
  private collection = db.collection('notifications');

  async save(notification: Notification): Promise<void> {
    const targetSocketId = userSockets.get(notification.props.user_id);
    if (targetSocketId) {
      io.to(targetSocketId).emit('notification', {
        tipo: notification.props.tipo,
        mensaje: notification.props.mensaje,
        referencia_id: notification.props.referencia_id
      });
    }
    await this.collection.doc(notification.props.id).set({ ...notification.props });
  }

  async update(notification: Notification): Promise<void> {

    const targetSocketId = userSockets.get(notification.props.user_id);
    if (targetSocketId) {
      io.to(targetSocketId).emit('notification', {
        tipo: notification.props.tipo,
        mensaje: notification.props.mensaje,
        referencia_id: notification.props.referencia_id
      });
    }
    await this.collection.doc(notification.props.id).update({ ...notification.props });
  }

  async findById(id: string): Promise<Notification | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return new Notification(doc.data() as any);
  }

  async findByUserId(user_id: string): Promise<Notification[]> {
    const snapshot = await this.collection
      .where('user_id', '==', user_id)
      .orderBy('created_at', 'desc')
      .get();
    return snapshot.docs.map(doc => new Notification(doc.data() as any));
  }
}