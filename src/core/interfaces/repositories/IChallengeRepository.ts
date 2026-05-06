import { Challenge } from "../../domain/entities/Challenge";

export interface IChallengeRepository {
  save(challenge: Challenge): Promise<void>;
  update(challenge: Challenge): Promise<void>;
  findById(id: string): Promise<Challenge | null>;
  findAllByUserId(user_id: string): Promise<Challenge[]>;
  findActiveBetweenPlayers(player1Id: string, player2Id: string): Promise<Challenge | null>;
}