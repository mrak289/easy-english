#!/usr/bin/env node
/**
 * Sends allure-results to Allure Docker Service.
 * Usage: node tests/send-results.js [allure-server-url] [project-id]
 *
 * Defaults:
 *   allure-server-url = http://192.168.77.9:5050
 *   project-id        = easy-english
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ALLURE_RESULTS_DIR = path.join(__dirname, '..', 'allure-results');
const ALLURE_SERVER = process.argv[2] || 'http://192.168.77.9:5050';
const PROJECT_ID = process.argv[3] || 'easy-english';

async function ensureProject() {
  const res = await fetch(`${ALLURE_SERVER}/allure-docker-service/projects/${PROJECT_ID}`);
  if (res.status === 404) {
    const create = await fetch(`${ALLURE_SERVER}/allure-docker-service/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: PROJECT_ID }),
    });
    if (!create.ok) throw new Error(`Failed to create project: ${await create.text()}`);
    console.log(`✓ Created project "${PROJECT_ID}"`);
  } else {
    console.log(`✓ Project "${PROJECT_ID}" already exists`);
  }
}

async function sendResults() {
  if (!fs.existsSync(ALLURE_RESULTS_DIR)) {
    console.error(`No allure-results found at ${ALLURE_RESULTS_DIR}`);
    console.error('Run tests first: npm test');
    process.exit(1);
  }

  const files = fs.readdirSync(ALLURE_RESULTS_DIR)
    .filter(f => !fs.statSync(path.join(ALLURE_RESULTS_DIR, f)).isDirectory());

  if (files.length === 0) {
    console.error('allure-results directory is empty');
    process.exit(1);
  }

  console.log(`Sending ${files.length} result files to ${ALLURE_SERVER}...`);

  const results = files.map(file => {
    const content = fs.readFileSync(path.join(ALLURE_RESULTS_DIR, file));
    return {
      file_name: file,
      content_base64: content.toString('base64'),
    };
  });

  const res = await fetch(
    `${ALLURE_SERVER}/allure-docker-service/send-results?project_id=${PROJECT_ID}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to send results: ${await res.text()}`);
  }

  console.log('✓ Results sent');
}

async function generateReport() {
  const res = await fetch(
    `${ALLURE_SERVER}/allure-docker-service/generate-report?project_id=${PROJECT_ID}&execution_name=CI+Run&execution_type=local`,
    { method: 'GET' }
  );
  const data = await res.json();
  console.log(`✓ Report generated`);
  console.log(`\n🔗 View report at: http://192.168.77.9:5252/projects/${PROJECT_ID}/reports/latest/index.html`);
  return data;
}

try {
  await ensureProject();
  await sendResults();
  await generateReport();
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
