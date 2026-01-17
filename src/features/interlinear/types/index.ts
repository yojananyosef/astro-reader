export interface InterlinearWord {
  hebrew?: string;         // El texto en hebreo (propiedad opcional)
  hebrew_aramaic?: string;  // El texto en hebreo/arameo (usado en algunos archivos)
  greek?: string;          // El texto en griego (para el Nuevo Testamento)
  spanish: string;         // La traducción/glosa (español)
  strong: string;          // El número Strong
  parsing: string;         // Morfología/Parsing
}

export interface InterlinearVerse {
  chapter: number;
  verse: number;
  words: InterlinearWord[];
}

// El JSON de next-teolingo es un array de InterlinearVerse
export type InterlinearData = InterlinearVerse[];
