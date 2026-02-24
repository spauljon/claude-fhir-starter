import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { codeSystemStore } from '../store.js';

const FHIR_JSON = 'application/fhir+json';

beforeEach(() => {
  codeSystemStore.clear();
});

/** Helper to seed a CodeSystem with known concepts */
function seedCodeSystem() {
  return codeSystemStore.create({
    status: 'active',
    content: 'complete',
    url: 'http://example.com/cs',
    version: '1.0',
    concept: [
      { code: 'A', display: 'Alpha', definition: 'The first letter' },
      {
        code: 'B',
        display: 'Beta',
        concept: [
          { code: 'B1', display: 'Beta One' },
        ],
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// $lookup (GET)
// ---------------------------------------------------------------------------
describe('GET /fhir/CodeSystem/$lookup', () => {
  it('returns Parameters resource when code is found', async () => {
    seedCodeSystem();
    const res = await request(app).get('/fhir/CodeSystem/$lookup?system=http://example.com/cs&code=A');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain(FHIR_JSON);
    expect(res.body.resourceType).toBe('Parameters');
  });

  it('includes display in returned parameters', async () => {
    seedCodeSystem();
    const res = await request(app).get('/fhir/CodeSystem/$lookup?system=http://example.com/cs&code=A');

    const displayParam = res.body.parameter?.find((p: { name: string }) => p.name === 'display');
    expect(displayParam?.valueString).toBe('Alpha');
  });

  it('finds nested concepts', async () => {
    seedCodeSystem();
    const res = await request(app).get('/fhir/CodeSystem/$lookup?system=http://example.com/cs&code=B1');

    expect(res.status).toBe(200);
    const displayParam = res.body.parameter?.find((p: { name: string }) => p.name === 'display');
    expect(displayParam?.valueString).toBe('Beta One');
  });

  it('returns 404 when code is not found', async () => {
    seedCodeSystem();
    const res = await request(app).get('/fhir/CodeSystem/$lookup?system=http://example.com/cs&code=Z');

    expect(res.status).toBe(404);
    expect(res.body.resourceType).toBe('OperationOutcome');
  });

  it('returns 404 when system is not found', async () => {
    seedCodeSystem();
    const res = await request(app).get('/fhir/CodeSystem/$lookup?system=http://no-such.com&code=A');

    expect(res.status).toBe(404);
  });

  it('returns 400 when system is missing', async () => {
    const res = await request(app).get('/fhir/CodeSystem/$lookup?code=A');

    expect(res.status).toBe(400);
    expect(res.body.resourceType).toBe('OperationOutcome');
  });

  it('returns 400 when code is missing', async () => {
    const res = await request(app).get('/fhir/CodeSystem/$lookup?system=http://example.com/cs');

    expect(res.status).toBe(400);
    expect(res.body.resourceType).toBe('OperationOutcome');
  });

  it('filters by version when provided', async () => {
    seedCodeSystem();
    codeSystemStore.create({
      status: 'active',
      content: 'complete',
      url: 'http://example.com/cs',
      version: '2.0',
      concept: [{ code: 'A', display: 'Alpha v2' }],
    });

    const res = await request(app).get(
      '/fhir/CodeSystem/$lookup?system=http://example.com/cs&code=A&version=2.0'
    );
    expect(res.status).toBe(200);
    const display = res.body.parameter?.find((p: { name: string }) => p.name === 'display');
    expect(display?.valueString).toBe('Alpha v2');
  });
});

// ---------------------------------------------------------------------------
// $lookup (POST)
// ---------------------------------------------------------------------------
describe('POST /fhir/CodeSystem/$lookup', () => {
  it('accepts Parameters body and returns result', async () => {
    seedCodeSystem();
    const params = {
      resourceType: 'Parameters',
      parameter: [
        { name: 'system', valueString: 'http://example.com/cs' },
        { name: 'code', valueString: 'A' },
      ],
    };

    const res = await request(app)
      .post('/fhir/CodeSystem/$lookup')
      .set('Content-Type', FHIR_JSON)
      .send(params);

    expect(res.status).toBe(200);
    expect(res.body.resourceType).toBe('Parameters');
  });

  it('returns 400 when required params are missing', async () => {
    const params = {
      resourceType: 'Parameters',
      parameter: [{ name: 'code', valueString: 'A' }],
    };

    const res = await request(app)
      .post('/fhir/CodeSystem/$lookup')
      .set('Content-Type', FHIR_JSON)
      .send(params);

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// $validate-code (GET)
// ---------------------------------------------------------------------------
describe('GET /fhir/CodeSystem/$validate-code', () => {
  it('returns Parameters resource', async () => {
    seedCodeSystem();
    const res = await request(app).get(
      '/fhir/CodeSystem/$validate-code?url=http://example.com/cs&code=A'
    );

    expect(res.status).toBe(200);
    expect(res.body.resourceType).toBe('Parameters');
  });

  it('result parameter is true for a valid code', async () => {
    seedCodeSystem();
    const res = await request(app).get(
      '/fhir/CodeSystem/$validate-code?url=http://example.com/cs&code=A'
    );

    const resultParam = res.body.parameter?.find((p: { name: string }) => p.name === 'result');
    expect(resultParam?.valueBoolean).toBe(true);
  });

  it('result parameter is false for an invalid code', async () => {
    seedCodeSystem();
    const res = await request(app).get(
      '/fhir/CodeSystem/$validate-code?url=http://example.com/cs&code=NOPE'
    );

    expect(res.status).toBe(200);
    const resultParam = res.body.parameter?.find((p: { name: string }) => p.name === 'result');
    expect(resultParam?.valueBoolean).toBe(false);
  });

  it('includes message when code is invalid', async () => {
    seedCodeSystem();
    const res = await request(app).get(
      '/fhir/CodeSystem/$validate-code?url=http://example.com/cs&code=NOPE'
    );

    const msgParam = res.body.parameter?.find((p: { name: string }) => p.name === 'message');
    expect(msgParam?.valueString).toContain('NOPE');
  });

  it('includes display when code is valid', async () => {
    seedCodeSystem();
    const res = await request(app).get(
      '/fhir/CodeSystem/$validate-code?url=http://example.com/cs&code=A'
    );

    const displayParam = res.body.parameter?.find((p: { name: string }) => p.name === 'display');
    expect(displayParam?.valueString).toBe('Alpha');
  });

  it('validates nested concepts', async () => {
    seedCodeSystem();
    const res = await request(app).get(
      '/fhir/CodeSystem/$validate-code?url=http://example.com/cs&code=B1'
    );

    const resultParam = res.body.parameter?.find((p: { name: string }) => p.name === 'result');
    expect(resultParam?.valueBoolean).toBe(true);
  });

  it('returns 400 when url is missing', async () => {
    const res = await request(app).get('/fhir/CodeSystem/$validate-code?code=A');

    expect(res.status).toBe(400);
    expect(res.body.resourceType).toBe('OperationOutcome');
  });

  it('returns 400 when code is missing', async () => {
    const res = await request(app).get('/fhir/CodeSystem/$validate-code?url=http://example.com/cs');

    expect(res.status).toBe(400);
    expect(res.body.resourceType).toBe('OperationOutcome');
  });
});

// ---------------------------------------------------------------------------
// $validate-code (POST)
// ---------------------------------------------------------------------------
describe('POST /fhir/CodeSystem/$validate-code', () => {
  it('accepts Parameters body and returns result', async () => {
    seedCodeSystem();
    const params = {
      resourceType: 'Parameters',
      parameter: [
        { name: 'url', valueString: 'http://example.com/cs' },
        { name: 'code', valueString: 'A' },
      ],
    };

    const res = await request(app)
      .post('/fhir/CodeSystem/$validate-code')
      .set('Content-Type', FHIR_JSON)
      .send(params);

    expect(res.status).toBe(200);
    const resultParam = res.body.parameter?.find((p: { name: string }) => p.name === 'result');
    expect(resultParam?.valueBoolean).toBe(true);
  });

  it('returns 400 when required params are missing', async () => {
    const params = {
      resourceType: 'Parameters',
      parameter: [{ name: 'url', valueString: 'http://example.com/cs' }],
    };

    const res = await request(app)
      .post('/fhir/CodeSystem/$validate-code')
      .set('Content-Type', FHIR_JSON)
      .send(params);

    expect(res.status).toBe(400);
  });
});
