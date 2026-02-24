import { randomUUID } from 'crypto';
import type { CodeSystem, FhirStatus } from './types.js';

export interface SearchParams {
  url?: string;
  version?: string;
  name?: string;
  status?: FhirStatus;
}

class CodeSystemStore {
  private readonly store = new Map<string, CodeSystem>();

  create(resource: Omit<CodeSystem, 'id' | 'meta' | 'resourceType'>): CodeSystem {
    const id = randomUUID();
    const now = new Date().toISOString();
    const cs: CodeSystem = {
      ...resource,
      resourceType: 'CodeSystem',
      id,
      meta: { lastUpdated: now, versionId: '1' },
    };
    this.store.set(id, cs);
    return cs;
  }

  read(id: string): CodeSystem | undefined {
    return this.store.get(id);
  }

  update(id: string, resource: Omit<CodeSystem, 'id' | 'meta' | 'resourceType'>): CodeSystem | undefined {
    const existing = this.store.get(id);
    if (!existing) return undefined;
    const now = new Date().toISOString();
    const nextVersion = String((parseInt(existing.meta.versionId ?? '0', 10) || 0) + 1);
    const updated: CodeSystem = {
      ...resource,
      resourceType: 'CodeSystem',
      id,
      meta: { lastUpdated: now, versionId: nextVersion },
    };
    this.store.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.store.delete(id);
  }

  search(params: SearchParams): CodeSystem[] {
    const results: CodeSystem[] = [];
    for (const cs of this.store.values()) {
      if (params.url !== undefined && cs.url !== params.url) continue;
      if (params.version !== undefined && cs.version !== params.version) continue;
      if (params.name !== undefined && cs.name !== params.name) continue;
      if (params.status !== undefined && cs.status !== params.status) continue;
      results.push(cs);
    }
    return results;
  }

  /** For testing — reset all data */
  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

export const codeSystemStore = new CodeSystemStore();
