export interface CompetitionCategoryProps {
    id: string;
    nombre: string;
    descripcion: string;
    activo: boolean;
}

export class CompetitionCategory {
    constructor(public props: CompetitionCategoryProps) { }
}