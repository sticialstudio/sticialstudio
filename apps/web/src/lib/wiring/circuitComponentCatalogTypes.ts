import type { ComponentCategory } from './componentDefinitions';

export type CircuitComponentPropertyFieldType = 'boolean' | 'number' | 'text';

export interface CircuitComponentPropertyOption {
  label: string;
  value: boolean | number | string;
}

export interface CircuitComponentPropertyField {
  key: string;
  label: string;
  type: CircuitComponentPropertyFieldType;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: CircuitComponentPropertyOption[];
}

export interface CircuitComponentPropertySchema {
  fields: CircuitComponentPropertyField[];
}

export interface CircuitComponentMetadata {
  id: string;
  name: string;
  category: ComponentCategory;
  description: string;
  aliases: string[];
  keywords: string[];
  placeable: boolean;
  singleton: boolean;
  previewSourceKey: string;
  defaultState: Record<string, unknown>;
  propertySchema: CircuitComponentPropertySchema;
}

export interface CircuitComponentCatalogEntry extends CircuitComponentMetadata {
  categoryLabel: string;
  searchTokens: string[];
}

export interface CircuitComponentRegistryApi {
  getEntry(idOrAlias: string): CircuitComponentCatalogEntry | undefined;
  getEntries(options?: { placeableOnly?: boolean }): CircuitComponentCatalogEntry[];
  getCategories(options?: { placeableOnly?: boolean }): ComponentCategory[];
  getCategoryLabel(category: ComponentCategory): string;
  getEntriesByCategory(category: ComponentCategory, options?: { placeableOnly?: boolean }): CircuitComponentCatalogEntry[];
  search(query: string, options?: { placeableOnly?: boolean }): CircuitComponentCatalogEntry[];
  isPlaceable(idOrAlias: string): boolean;
  isSingleton(idOrAlias: string): boolean;
  getPropertySchema(idOrAlias: string): CircuitComponentPropertySchema | undefined;
}
