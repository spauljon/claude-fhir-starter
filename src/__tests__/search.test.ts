import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { codeSystemStore } from '../store.js';

const FHIR_JSON = 'application/fhir+json';

beforeEach(() => {
  codeSystemStore.clear();
});

describe('GET /fhir/CodeSystem (search)', () => {
  it('returns a Bundle of type searchset', async () => {
    const res = await request(app).get('/fhir/CodeSystem');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain(FHIR_JSON);
    expect(res.body.resourceType).toBe('Bundle');
    expect(res.body.type).toBe('searchset');
  });

  it('returns all resources when no params given', async () => {
    codeSystemStore.create({ status: 'active', content: 'complete', url: 'http://a.com' });
    codeSystemStore.create({ status: 'draft', content: 'complete', url: 'http://b.com' });

    const res = await request(app).get('/fhir/CodeSystem');

    expect(res.body.total).toBe(2);
    expect(res.body.entry).toHaveLength(2);
  });

  it('returns empty bundle when store is empty', async () => {
    const res = await request(app).get('/fhir/CodeSystem');
    expect(res.body.total).toBe(0);
    expect(res.body.entry).toHaveLength(0);
  });

  it('filters by url', async () => {
    codeSystemStore.create({ status: 'active', content: 'complete', url: 'http://a.com' });
    codeSystemStore.create({ status: 'active', content: 'complete', url: 'http://b.com' });

    const res = await request(app).get('/fhir/CodeSystem?url=http://a.com');

    expect(res.body.total).toBe(1);
    expect(res.body.entry[0].resource.url).toBe('http://a.com');
  });

  it('filters by status', async () => {
    codeSystemStore.create({ status: 'active', content: 'complete', url: 'http://a.com' });
    codeSystemStore.create({ status: 'draft', content: 'complete', url: 'http://b.com' });
    codeSystemStore.create({ status: 'retired', content: 'complete', url: 'http://c.com' });

    const res = await request(app).get('/fhir/CodeSystem?status=active');

    expect(res.body.total).toBe(1);
    expect(res.body.entry[0].resource.status).toBe('active');
  });

  it('filters by name', async () => {
    codeSystemStore.create({ status: 'active', content: 'complete', name: 'Alpha' });
    codeSystemStore.create({ status: 'active', content: 'complete', name: 'Beta' });

    const res = await request(app).get('/fhir/CodeSystem?name=Alpha');

    expect(res.body.total).toBe(1);
    expect(res.body.entry[0].resource.name).toBe('Alpha');
  });

  it('filters by version', async () => {
    codeSystemStore.create({ status: 'active', content: 'complete', url: 'http://a.com', version: '1.0' });
    codeSystemStore.create({ status: 'active', content: 'complete', url: 'http://a.com', version: '2.0' });

    const res = await request(app).get('/fhir/CodeSystem?version=1.0');

    expect(res.body.total).toBe(1);
    expect(res.body.entry[0].resource.version).toBe('1.0');
  });

  it('supports combining multiple filters', async () => {
    codeSystemStore.create({ status: 'active', content: 'complete', url: 'http://a.com', version: '1.0' });
    codeSystemStore.create({ status: 'draft', content: 'complete', url: 'http://a.com', version: '1.0' });

    const res = await request(app).get('/fhir/CodeSystem?url=http://a.com&status=active');

    expect(res.body.total).toBe(1);
    expect(res.body.entry[0].resource.status).toBe('active');
  });

  it('each bundle entry has fullUrl and resource', async () => {
    codeSystemStore.create({ status: 'active', content: 'complete' });
    const res = await request(app).get('/fhir/CodeSystem');

    const entry = res.body.entry[0];
    expect(entry.fullUrl).toBeDefined();
    expect(entry.resource).toBeDefined();
    expect(entry.resource.resourceType).toBe('CodeSystem');
  });

  it('returns 400 for invalid status value', async () => {
    const res = await request(app).get('/fhir/CodeSystem?status=invalid');

    expect(res.status).toBe(400);
    expect(res.body.resourceType).toBe('OperationOutcome');
  });

  it('bundle includes id and total fields', async () => {
    const res = await request(app).get('/fhir/CodeSystem');
    expect(res.body.id).toBeDefined();
    expect(typeof res.body.total).toBe('number');
  });
});
