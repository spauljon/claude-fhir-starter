/**
 * FHIR R4 type definitions scoped to CodeSystem resources.
 */

export type FhirStatus = 'draft' | 'active' | 'retired' | 'unknown';

export interface Meta {
  lastUpdated: string;
  versionId?: string;
}

export interface Coding {
  system?: string;
  code?: string;
  display?: string;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface CodeSystemProperty {
  code: string;
  uri?: string;
  description?: string;
  type: 'code' | 'Coding' | 'string' | 'integer' | 'boolean' | 'dateTime' | 'decimal';
}

export interface ConceptProperty {
  code: string;
  valueCode?: string;
  valueCoding?: Coding;
  valueString?: string;
  valueInteger?: number;
  valueBoolean?: boolean;
  valueDateTime?: string;
  valueDecimal?: number;
}

export interface ConceptDesignation {
  language?: string;
  use?: Coding;
  value: string;
}

export interface CodeSystemConcept {
  code: string;
  display?: string;
  definition?: string;
  designation?: ConceptDesignation[];
  property?: ConceptProperty[];
  concept?: CodeSystemConcept[];
}

export interface CodeSystem {
  resourceType: 'CodeSystem';
  id: string;
  meta: Meta;
  url?: string;
  version?: string;
  name?: string;
  title?: string;
  status: FhirStatus;
  experimental?: boolean;
  description?: string;
  content: 'not-present' | 'example' | 'fragment' | 'complete' | 'supplement';
  count?: number;
  property?: CodeSystemProperty[];
  concept?: CodeSystemConcept[];
}

export interface BundleEntry {
  fullUrl?: string;
  resource: CodeSystem;
}

export interface Bundle {
  resourceType: 'Bundle';
  id: string;
  type: 'searchset';
  total: number;
  entry: BundleEntry[];
}

export interface OperationOutcomeIssue {
  severity: 'fatal' | 'error' | 'warning' | 'information';
  code: string;
  details?: CodeableConcept;
  diagnostics?: string;
}

export interface OperationOutcome {
  resourceType: 'OperationOutcome';
  issue: OperationOutcomeIssue[];
}

export interface ParameterValue {
  valueString?: string;
  valueCode?: string;
  valueUri?: string;
  valueBoolean?: boolean;
  valueCoding?: Coding;
  valueDateTime?: string;
}

export interface Parameter extends ParameterValue {
  name: string;
  part?: Parameter[];
}

export interface Parameters {
  resourceType: 'Parameters';
  parameter?: Parameter[];
}
