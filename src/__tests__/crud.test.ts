import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { codeSystemStore } from '../store.js';

const FHIR_JSON = 'application/fhir+json';

const validBody = {
  status: 'active',
  content: 'complete',
  url: 'http://example.com/cs',
  name: 'ExampleCS',
  version: '1.0',
};

beforeEach(() => {
  codeSystemStore.clear();
});

describe('POST /fhir/CodeSystem', () => {
  it('creates a resource and returns 201', async () => {
    const res = await request(app)
      .post('/fhir/CodeSystem')
      .set('Content-Type', FHIR_JSON)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toContain(FHIR_JSON);
    expect(res.body.resourceType).toBe('CodeSystem');
    expect(res.body.id).toBeDefined();
    expect(res.body.meta.lastUpdated).toBeDefined();
    expect(res.body.status).toBe('active');
  });

  it('returns Location header', async () => {
    const res = await request(app)
      .post('/fhir/CodeSystem')
      .set('Content-Type', FHIR_JSON)
      .send(validBody);

    expect(res.headers['location']).toMatch(/^\/fhir\/CodeSystem\//);
  });

  it('returns 400 when status is missing', async () => {
    const { status: _s, ...noStatus } = validBody;
    const res = await request(app)
      .post('/fhir/CodeSystem')
      .set('Content-Type', FHIR_JSON)
      .send(noStatus);

    expect(res.status).toBe(400);
    expect(res.body.resourceType).toBe('OperationOutcome');
  });

  it('returns 400 when content is missing', async () => {
    const { content: _c, ...noContent } = validBody;
    const res = await request(app)
      .post('/fhir/CodeSystem')
      .set('Content-Type', FHIR_JSON)
      .send(noContent);

    expect(res.status).toBe(400);
    expect(res.body.resourceType).toBe('OperationOutcome');
  });

  it('ignores client-supplied id and assigns its own', async () => {
    const res = await request(app)
      .post('/fhir/CodeSystem')
      .set('Content-Type', FHIR_JSON)
      .send({ ...validBody, id: 'client-id' });

    expect(res.status).toBe(201);
    expect(res.body.id).not.toBe('client-id');
  });
});

describe('GET /fhir/CodeSystem/:id', () => {
  it('returns the resource when it exists', async () => {
    const created = codeSystemStore.create(validBody);
    const res = await request(app).get(`/fhir/CodeSystem/${created.id}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain(FHIR_JSON);
    expect(res.body.id).toBe(created.id);
    expect(res.body.resourceType).toBe('CodeSystem');
  });

  it('returns 404 with OperationOutcome for unknown id', async () => {
    const res = await request(app).get('/fhir/CodeSystem/no-such-id');

    expect(res.status).toBe(404);
    expect(res.body.resourceType).toBe('OperationOutcome');
    expect(res.body.issue[0].code).toBe('not-found');
  });
});

describe('PUT /fhir/CodeSystem/:id', () => {
  it('updates and returns the resource', async () => {
    const created = codeSystemStore.create(validBody);
    const res = await request(app)
      .put(`/fhir/CodeSystem/${created.id}`)
      .set('Content-Type', FHIR_JSON)
      .send({ ...validBody, status: 'retired' });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
    expect(res.body.status).toBe('retired');
    expect(res.body.meta.versionId).toBe('2');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app)
      .put('/fhir/CodeSystem/ghost')
      .set('Content-Type', FHIR_JSON)
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.resourceType).toBe('OperationOutcome');
  });

  it('returns 400 when status is missing', async () => {
    const created = codeSystemStore.create(validBody);
    const { status: _s, ...noStatus } = validBody;
    const res = await request(app)
      .put(`/fhir/CodeSystem/${created.id}`)
      .set('Content-Type', FHIR_JSON)
      .send(noStatus);

    expect(res.status).toBe(400);
    expect(res.body.resourceType).toBe('OperationOutcome');
  });
});

describe('DELETE /fhir/CodeSystem/:id', () => {
  it('deletes and returns 204', async () => {
    const created = codeSystemStore.create(validBody);
    const res = await request(app).delete(`/fhir/CodeSystem/${created.id}`);

    expect(res.status).toBe(204);
    expect(codeSystemStore.read(created.id)).toBeUndefined();
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/fhir/CodeSystem/ghost');

    expect(res.status).toBe(404);
    expect(res.body.resourceType).toBe('OperationOutcome');
  });
});

describe('Content-Type enforcement', () => {
  it('all responses have application/fhir+json content type', async () => {
    const res = await request(app).get('/fhir/CodeSystem/nonexistent');
    expect(res.headers['content-type']).toContain(FHIR_JSON);
  });
});
