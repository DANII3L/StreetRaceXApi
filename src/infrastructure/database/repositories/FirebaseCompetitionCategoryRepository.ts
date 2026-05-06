import { db } from "../firebase";
import { CompetitionCategory } from "../../../core/domain/entities/CompetitionCategory";
import { ICompetitionCategoryRepository } from "../../../core/interfaces/repositories/ICompetitionCategoryRepository";

export class FirebaseCompetitionCategoryRepository implements ICompetitionCategoryRepository {
  private collection = db.collection('competition_categories');

  async findByNombre(nombre: string): Promise<CompetitionCategory | null> {
    const snapshot = await this.collection.where('nombre', '==', nombre).limit(1).get();
    
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];

    if (!doc.exists) throw new Error('Categoría no encontrada');

    return new CompetitionCategory(doc.data() as any);
  }

  async save(categoria: CompetitionCategory): Promise<CompetitionCategory> {
    const dataToSave = {
      ...categoria.props
    };
  
    await this.collection.doc(categoria.props.id).set(dataToSave);
    return new CompetitionCategory({
      ...categoria.props
    });
  }
}