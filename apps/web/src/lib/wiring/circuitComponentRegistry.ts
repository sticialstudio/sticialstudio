import type { ComponentCategory } from './componentDefinitions';
import type {
  CircuitComponentCatalogEntry,
  CircuitComponentMetadata,
  CircuitComponentPropertySchema,
  CircuitComponentRegistryApi,
} from './circuitComponentCatalogTypes';
import {
  CIRCUIT_COMPONENT_CATEGORY_LABELS,
  CIRCUIT_COMPONENT_CATEGORY_ORDER,
  CIRCUIT_COMPONENT_METADATA,
} from './generated/circuitComponentMetadata.generated';

function normalizeCatalogKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function createSearchTokens(metadata: CircuitComponentMetadata) {
  return [
    metadata.id,
    metadata.name,
    metadata.category,
    metadata.description,
    ...metadata.aliases,
    ...metadata.keywords,
  ]
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

class CircuitComponentRegistry implements CircuitComponentRegistryApi {
  private readonly entries: CircuitComponentCatalogEntry[];
  private readonly entryById: Map<string, CircuitComponentCatalogEntry>;
  private readonly aliasToId: Map<string, string>;
  private readonly categoryOrder: ComponentCategory[];

  constructor(metadata: CircuitComponentMetadata[]) {
    this.entries = metadata.map((entry) => ({
      ...entry,
      categoryLabel: CIRCUIT_COMPONENT_CATEGORY_LABELS[entry.category] ?? entry.category,
      searchTokens: createSearchTokens(entry),
    }));
    this.entryById = new Map(this.entries.map((entry) => [entry.id, entry] as const));
    this.aliasToId = new Map();
    this.categoryOrder = CIRCUIT_COMPONENT_CATEGORY_ORDER as ComponentCategory[];

    this.entries.forEach((entry) => {
      this.aliasToId.set(normalizeCatalogKey(entry.id), entry.id);
      entry.aliases.forEach((alias) => {
        this.aliasToId.set(normalizeCatalogKey(alias), entry.id);
      });
    });
  }

  getEntry(idOrAlias: string) {
    const resolvedId = this.aliasToId.get(normalizeCatalogKey(idOrAlias)) ?? idOrAlias;
    return this.entryById.get(resolvedId);
  }

  getEntries(options?: { placeableOnly?: boolean }) {
    if (!options?.placeableOnly) {
      return [...this.entries];
    }

    return this.entries.filter((entry) => entry.placeable);
  }

  getCategories(options?: { placeableOnly?: boolean }) {
    const available = new Set(this.getEntries(options).map((entry) => entry.category));
    return this.categoryOrder.filter((category) => available.has(category));
  }

  getCategoryLabel(category: ComponentCategory) {
    return CIRCUIT_COMPONENT_CATEGORY_LABELS[category] ?? category;
  }

  getEntriesByCategory(category: ComponentCategory, options?: { placeableOnly?: boolean }) {
    return this.getEntries(options).filter((entry) => entry.category === category);
  }

  search(query: string, options?: { placeableOnly?: boolean }) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return this.getEntries(options);
    }

    return this.getEntries(options).filter((entry) =>
      entry.searchTokens.some((token) => token.includes(normalizedQuery))
    );
  }

  isPlaceable(idOrAlias: string) {
    return this.getEntry(idOrAlias)?.placeable ?? false;
  }

  isSingleton(idOrAlias: string) {
    return this.getEntry(idOrAlias)?.singleton ?? false;
  }

  getPropertySchema(idOrAlias: string): CircuitComponentPropertySchema | undefined {
    return this.getEntry(idOrAlias)?.propertySchema;
  }
}

const circuitComponentRegistry = new CircuitComponentRegistry(CIRCUIT_COMPONENT_METADATA);

export function getCircuitComponentRegistry() {
  return circuitComponentRegistry;
}
