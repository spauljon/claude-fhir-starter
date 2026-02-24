import { app } from './app.js';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

app.listen(PORT, () => {
  console.log(`FHIR CodeSystem service running on http://localhost:${PORT}`);
});
