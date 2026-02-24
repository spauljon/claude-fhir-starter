# claude-fhir-starter

A FHIR R4 REST API service for CodeSystem resources, implemented in TypeScript with Node.js ESM modules.

## Project Goal

Implement a spec-compliant FHIR R4 CodeSystem REST API service suitable for development and testing use cases. This project is scoped to CodeSystem resources only — it is not a full terminology service.

## Technology Stack

- Node.js (ESM modules)
- TypeScript
- Express.js (or Fastify — choose whichever better suits ESM and the FHIR use case)
- In-memory storage (no database dependency required)

## In Scope

**CRUD Endpoints**
- `GET /CodeSystem` — search CodeSystems by supported parameters
- `GET /CodeSystem/:id` — read a CodeSystem by logical ID
- `POST /CodeSystem` — create a new CodeSystem
- `PUT /CodeSystem/:id` — update an existing CodeSystem
- `DELETE /CodeSystem/:id` — delete a CodeSystem

**Search Parameters**
- `url` — canonical URL of the CodeSystem
- `version`
- `name`
- `status` — (`draft` | `active` | `retired` | `unknown`)

**Terminology Operations**
- `GET /CodeSystem/$lookup` and `POST /CodeSystem/$lookup` — look up a code
- `GET /CodeSystem/$validate-code` and `POST /CodeSystem/$validate-code` — validate a code

**General FHIR Requirements**
- Responses must use `application/fhir+json` content type
- Errors must be returned as FHIR `OperationOutcome` resources
- Resources must include `id`, `meta.lastUpdated`, and `resourceType` fields
- Search responses must be wrapped in a FHIR `Bundle` of type `searchset`

## Out of Scope

- ValueSet, ConceptMap, and all other FHIR resource types
- `$subsumes`, `$find-matches`, `$closure` operations
- Persistent storage / database integration
- Authentication and authorization
- FHIR capability statement (`/metadata` endpoint)
- Pagination (bundles may return all results)

## Development Approach

- All features should be developed incrementally with clear commit boundaries
- Each milestone should include unit tests before moving to the next
- Tests should be runnable with a single command (`npm test`)
- Code should be idiomatic TypeScript with strict mode enabled

## Cost Controls

This project targets completion within a constrained Claude Code session budget. The following rules must be followed:

- At the end of each milestone, run `/cost` and report the current session spend before proceeding to the next milestone
- If progress stalls or the session becomes slow (a sign of rate limiting), stop work, commit everything in a clean state, and produce a short summary of remaining scope rather than continuing
- Prefer simpler, more direct implementations over elaborate ones — the goal is a working, tested service, not a showcase

## Milestones (suggested)

Claude Code should determine the appropriate milestone breakdown, but the general progression should be: project scaffolding → core CRUD → search → terminology operations → integration/cleanup.
