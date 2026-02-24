import { app } from './app.js';

const PORT = Number.parseInt(process.env['PORT'] ?? '8080', 10);

app.listen(PORT, () => {
  console.log(`FHIR CodeSystem service running on http://localhost:${PORT}`);
});
