import { randomUUID } from 'crypto';
import type { Bundle, BundleEntry, CodeSystem, OperationOutcome, Parameters, Parameter } from './types.js';

export const FHIR_JSON = 'application/fhir+json';

export function makeBundle(resources: CodeSystem[]): Bundle {
  const entries: BundleEntry[] = resources.map((cs) => ({
    fullUrl: `urn:uuid:${cs.id}`,
    resource: cs,
  }));
  return {
    resourceType: 'Bundle',
    id: randomUUID(),
    type: 'searchset',
    total: resources.length,
    entry: entries,
  };
}

export function makeOutcome(
  severity: 'fatal' | 'error' | 'warning' | 'information',
  code: string,
  diagnostics: string,
): OperationOutcome {
  return {
    resourceType: 'OperationOutcome',
    issue: [{ severity, code, diagnostics }],
  };
}

export function notFound(id?: string): OperationOutcome {
  return makeOutcome('error', 'not-found', id ? `CodeSystem/${id} not found` : 'Resource not found');
}

export function badRequest(msg: string): OperationOutcome {
  return makeOutcome('error', 'invalid', msg);
}

export function makeParameters(params: Record<string, string | boolean | undefined>): Parameters {
  const parameter: Parameter[] = [];
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (typeof value === 'boolean') {
      parameter.push({ name, valueBoolean: value });
    } else {
      parameter.push({ name, valueString: value });
    }
  }
  return { resourceType: 'Parameters', parameter };
}

export function getParam(params: Parameters | undefined, name: string): string | undefined {
  return params?.parameter?.find((p) => p.name === name)?.valueString
    ?? params?.parameter?.find((p) => p.name === name)?.valueCode
    ?? params?.parameter?.find((p) => p.name === name)?.valueUri;
}
