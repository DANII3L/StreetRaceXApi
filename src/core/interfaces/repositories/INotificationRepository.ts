import { Notification } from "../../domain/entities/Notification";

export interface INotificationRepository {
  save(notification: Notification): Promise<void>;
  update(notification: Notification): Promise<void>;
  findByUserId(user_id: string): Promise<Notification[]>;
  findById(id: string): Promise<Notification | null>;
}