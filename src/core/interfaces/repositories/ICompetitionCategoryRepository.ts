import { CompetitionCategory } from "../../domain/entities/CompetitionCategory";

export interface ICompetitionCategoryRepository {
  findByNombre(nombre: string): Promise<CompetitionCategory | null>;
  save(categoria: CompetitionCategory): Promise<CompetitionCategory>;
}