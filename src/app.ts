import express from 'express';
import { codeSystemStore } from './store.js';
import { makeBundle, makeOutcome, notFound, badRequest, FHIR_JSON, makeParameters, getParam } from './fhirHelpers.js';
import type { CodeSystem, FhirStatus, Parameters as FhirParameters } from './types.js';

export const app = express();

app.use(express.json({ type: ['application/json', 'application/fhir+json'] }));

// Set FHIR content type on all responses
app.use((_req, res, next) => {
  res.setHeader('Content-Type', FHIR_JSON);
  next();
});

// ---------------------------------------------------------------------------
// GET /CodeSystem — search
// ---------------------------------------------------------------------------
app.get('/CodeSystem', (req, res) => {
  const { url, version, name, status } = req.query as Record<string, string | undefined>;

  if (status !== undefined && !['draft', 'active', 'retired', 'unknown'].includes(status)) {
    res.status(400).json(badRequest(`Invalid status value: ${status}`));
    return;
  }

  const searchParams: import('./store.js').SearchParams = {};
  if (url !== undefined) searchParams.url = url;
  if (version !== undefined) searchParams.version = version;
  if (name !== undefined) searchParams.name = name;
  if (status !== undefined) searchParams.status = status as FhirStatus;
  const results = codeSystemStore.search(searchParams);

  res.json(makeBundle(results));
});

// ---------------------------------------------------------------------------
// POST /CodeSystem — create
// ---------------------------------------------------------------------------
app.post('/CodeSystem', (req, res) => {
  const body = req.body as Partial<CodeSystem>;

  if (!body.status) {
    res.status(400).json(badRequest('status is required'));
    return;
  }
  if (!body.content) {
    res.status(400).json(badRequest('content is required'));
    return;
  }

  // Strip id/meta/resourceType — store will set them
  const { id: _id, meta: _meta, resourceType: _rt, ...rest } = body;
  const created = codeSystemStore.create(rest as Omit<CodeSystem, 'id' | 'meta' | 'resourceType'>);

  res.status(201)
    .setHeader('Location', `/CodeSystem/${created.id}`)
    .json(created);
});

// ---------------------------------------------------------------------------
// GET /CodeSystem/$lookup — terminology operation
// ---------------------------------------------------------------------------
app.get('/CodeSystem/\\$lookup', (req, res) => {
  const { system, code, version } = req.query as Record<string, string | undefined>;

  if (!system || !code) {
    res.status(400).json(badRequest('system and code are required'));
    return;
  }

  const result = performLookup(system, code, version);
  if (!result) {
    res.status(404).json(notFound());
    return;
  }
  res.json(result);
});

app.post('/CodeSystem/\\$lookup', (req, res) => {
  const params = req.body as FhirParameters | undefined;
  const system = getParam(params, 'system') ?? getParam(params, 'url');
  const code = getParam(params, 'code');
  const version = getParam(params, 'version');

  if (!system || !code) {
    res.status(400).json(badRequest('system and code parameters are required'));
    return;
  }

  const result = performLookup(system, code, version);
  if (!result) {
    res.status(404).json(notFound());
    return;
  }
  res.json(result);
});

// ---------------------------------------------------------------------------
// GET /CodeSystem/$validate-code — terminology operation
// ---------------------------------------------------------------------------
app.get('/CodeSystem/\\$validate-code', (req, res) => {
  const { url, code, version } = req.query as Record<string, string | undefined>;

  if (!url || !code) {
    res.status(400).json(badRequest('url and code are required'));
    return;
  }

  const outcome = performValidateCode(url, code, version);
  res.json(outcome);
});

app.post('/CodeSystem/\\$validate-code', (req, res) => {
  const params = req.body as FhirParameters | undefined;
  const url = getParam(params, 'url');
  const code = getParam(params, 'code');
  const version = getParam(params, 'version');

  if (!url || !code) {
    res.status(400).json(badRequest('url and code parameters are required'));
    return;
  }

  const outcome = performValidateCode(url, code, version);
  res.json(outcome);
});

// ---------------------------------------------------------------------------
// GET /CodeSystem/:id — read
// ---------------------------------------------------------------------------
app.get('/CodeSystem/:id', (req, res) => {
  const cs = codeSystemStore.read(req.params.id);
  if (!cs) {
    res.status(404).json(notFound(req.params.id));
    return;
  }
  res.json(cs);
});

// ---------------------------------------------------------------------------
// PUT /CodeSystem/:id — update
// ---------------------------------------------------------------------------
app.put('/CodeSystem/:id', (req, res) => {
  const body = req.body as Partial<CodeSystem>;

  if (!body.status) {
    res.status(400).json(badRequest('status is required'));
    return;
  }
  if (!body.content) {
    res.status(400).json(badRequest('content is required'));
    return;
  }

  const { id: _id, meta: _meta, resourceType: _rt, ...rest } = body;
  const updated = codeSystemStore.update(req.params.id, rest as Omit<CodeSystem, 'id' | 'meta' | 'resourceType'>);

  if (!updated) {
    res.status(404).json(notFound(req.params.id));
    return;
  }
  res.json(updated);
});

// ---------------------------------------------------------------------------
// DELETE /CodeSystem/:id — delete
// ---------------------------------------------------------------------------
app.delete('/CodeSystem/:id', (req, res) => {
  const deleted = codeSystemStore.delete(req.params.id);
  if (!deleted) {
    res.status(404).json(notFound(req.params.id));
    return;
  }
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// 404 fallback
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json(makeOutcome('error', 'not-found', 'Endpoint not found'));
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function findConceptInTree(
  concepts: CodeSystem['concept'],
  code: string,
): { code: string; display?: string; definition?: string } | undefined {
  if (!concepts) return undefined;
  for (const c of concepts) {
    if (c.code === code) return c;
    const nested = findConceptInTree(c.concept, code);
    if (nested) return nested;
  }
  return undefined;
}

function performLookup(system: string, code: string, version?: string) {
  const matches = codeSystemStore.search({ url: system, ...(version ? { version } : {}) });
  for (const cs of matches) {
    const concept = findConceptInTree(cs.concept, code);
    if (concept) {
      return makeParameters({
        name: concept.display ?? code,
        display: concept.display,
        definition: concept.definition,
        version: cs.version,
      });
    }
  }
  return undefined;
}

function performValidateCode(url: string, code: string, version?: string) {
  const matches = codeSystemStore.search({ url, ...(version ? { version } : {}) });
  let result = false;
  let display: string | undefined;

  for (const cs of matches) {
    const concept = findConceptInTree(cs.concept, code);
    if (concept) {
      result = true;
      display = concept.display;
      break;
    }
  }

  return makeParameters({
    result: result,
    display,
    message: result ? undefined : `Code '${code}' not found in CodeSystem '${url}'`,
  } as Record<string, string | boolean | undefined>);
}

