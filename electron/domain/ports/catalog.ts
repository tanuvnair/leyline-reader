export interface CatalogCharacter {
  name?: string;
  title?: string;
  vision?: string;
  weapon?: string;
  nation?: string;
  rarity?: number;
  description?: string;
  birthday?: string;
  constellation?: string;
  iconUrl: string;
  iconBigUrl?: string;
  portraitUrl?: string;
  [key: string]: unknown;
}

/** Static game catalog enrichment (genshin.dev). */
export interface CatalogPort {
  enrichCharacters(
    names: string[],
  ): Promise<Record<string, CatalogCharacter>>;
}
