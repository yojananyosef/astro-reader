export interface StrongData {
  id: string;
  word: string;
  transliteration: string;
  pronunciation: string;
  definitions: {
    definition: string;
    extendedDefinition: string;
    reinaValeraDefinition: string;
  };
  grammar: string;
  frequency: number;
  audio?: string;
  wordFrequencyRV?: Record<string, string | number>;
}
