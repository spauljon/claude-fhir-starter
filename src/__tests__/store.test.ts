import { describe, it, expect, beforeEach } from 'vitest';
import { codeSystemStore } from '../store.js';

const baseResource = {
  status: 'active' as const,
  content: 'complete' as const,
  url: 'http://example.com/cs',
  name: 'ExampleCS',
  version: '1.0',
};

describe('CodeSystemStore', () => {
  beforeEach(() => {
    codeSystemStore.clear();
  });

  describe('create', () => {
    it('assigns a UUID id', () => {
      const cs = codeSystemStore.create(baseResource);
      expect(cs.id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('sets resourceType to CodeSystem', () => {
      const cs = codeSystemStore.create(baseResource);
      expect(cs.resourceType).toBe('CodeSystem');
    });

    it('sets meta.lastUpdated as ISO string', () => {
      const cs = codeSystemStore.create(baseResource);
      expect(cs.meta.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('sets meta.versionId to "1"', () => {
      const cs = codeSystemStore.create(baseResource);
      expect(cs.meta.versionId).toBe('1');
    });

    it('persists provided fields', () => {
      const cs = codeSystemStore.create(baseResource);
      expect(cs.url).toBe('http://example.com/cs');
      expect(cs.status).toBe('active');
      expect(cs.content).toBe('complete');
    });
  });

  describe('read', () => {
    it('returns the created resource by id', () => {
      const cs = codeSystemStore.create(baseResource);
      expect(codeSystemStore.read(cs.id)).toEqual(cs);
    });

    it('returns undefined for unknown id', () => {
      expect(codeSystemStore.read('no-such-id')).toBeUndefined();
    });
  });

  describe('update', () => {
    it('returns undefined when resource does not exist', () => {
      expect(codeSystemStore.update('ghost', baseResource)).toBeUndefined();
    });

    it('updates fields and bumps versionId', () => {
      const cs = codeSystemStore.create(baseResource);
      const updated = codeSystemStore.update(cs.id, { ...baseResource, status: 'retired' });
      expect(updated).toBeDefined();
      expect(updated!.status).toBe('retired');
      expect(updated!.meta.versionId).toBe('2');
    });

    it('preserves the same id after update', () => {
      const cs = codeSystemStore.create(baseResource);
      const updated = codeSystemStore.update(cs.id, baseResource);
      expect(updated!.id).toBe(cs.id);
    });
  });

  describe('delete', () => {
    it('returns true when resource exists', () => {
      const cs = codeSystemStore.create(baseResource);
      expect(codeSystemStore.delete(cs.id)).toBe(true);
    });

    it('removes the resource from the store', () => {
      const cs = codeSystemStore.create(baseResource);
      codeSystemStore.delete(cs.id);
      expect(codeSystemStore.read(cs.id)).toBeUndefined();
    });

    it('returns false when resource does not exist', () => {
      expect(codeSystemStore.delete('nope')).toBe(false);
    });
  });

  describe('search', () => {
    it('returns all resources when no params given', () => {
      codeSystemStore.create(baseResource);
      codeSystemStore.create({ ...baseResource, url: 'http://other.com/cs' });
      expect(codeSystemStore.search({})).toHaveLength(2);
    });

    it('filters by url', () => {
      codeSystemStore.create(baseResource);
      codeSystemStore.create({ ...baseResource, url: 'http://other.com/cs' });
      const results = codeSystemStore.search({ url: 'http://example.com/cs' });
      expect(results).toHaveLength(1);
      expect(results[0]?.url).toBe('http://example.com/cs');
    });

    it('filters by status', () => {
      codeSystemStore.create(baseResource);
      codeSystemStore.create({ ...baseResource, status: 'draft' });
      expect(codeSystemStore.search({ status: 'active' })).toHaveLength(1);
      expect(codeSystemStore.search({ status: 'draft' })).toHaveLength(1);
    });

    it('filters by name', () => {
      codeSystemStore.create(baseResource);
      codeSystemStore.create({ ...baseResource, name: 'OtherCS' });
      expect(codeSystemStore.search({ name: 'ExampleCS' })).toHaveLength(1);
    });

    it('filters by version', () => {
      codeSystemStore.create(baseResource);
      codeSystemStore.create({ ...baseResource, version: '2.0' });
      expect(codeSystemStore.search({ version: '1.0' })).toHaveLength(1);
    });

    it('returns empty array when nothing matches', () => {
      codeSystemStore.create(baseResource);
      expect(codeSystemStore.search({ url: 'http://no-match.com' })).toHaveLength(0);
    });
  });

  describe('size', () => {
    it('reflects current count', () => {
      expect(codeSystemStore.size).toBe(0);
      codeSystemStore.create(baseResource);
      expect(codeSystemStore.size).toBe(1);
    });
  });
});
