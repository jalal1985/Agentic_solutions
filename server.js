const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) { /* ignore */ }

// Simulated subagent runner
function runSubagent(name, task, payload) {
  return new Promise((resolve) => {
    const delay = 400 + Math.random() * 1200;
    setTimeout(() => {
      // Simple mock logic per agent name/task
      let result = { agent: name, ok: true, details: '' };
      if (task === 'shopping_check') {
        if (name === 'price_checker') {
          result.details = `Prices found for ${payload.items.length} items. Avg price: $${(20 + Math.random()*80).toFixed(2)}`;
        } else if (name === 'stock_checker') {
          result.details = `Stock available for ${Math.max(0, Math.floor(payload.items.length * (0.7 + Math.random()*0.3)))} items.`;
        } else if (name === 'recommendation') {
          result.details = `Suggested 2 alternatives for items with low availability.`;
        } else if (name === 'verifier') {
          result.details = `Cross-check passed: data from other agents is consistent.`;
        }
      } else if (task === 'bi_report') {
        if (name === 'data_aggregator') {
          result.details = `Aggregated ${payload.range || '30d'} of sales data. Total revenue: $${(50000 + Math.random()*200000).toFixed(0)}`;
        } else if (name === 'anomaly_detector') {
          result.details = `Found ${Math.floor(Math.random()*5)} anomalies in orders.`;
        } else if (name === 'insights_writer') {
          result.details = `Top product categories: Electronics, Home, Sports.`;
        } else if (name === 'verifier') {
          result.details = `BI checks passed; figures reconcile with source.`;
        }
      }

      resolve(result);
    }, delay);
  });
}

app.post('/api/agents/run', async (req, res) => {
  const { workflow, payload } = req.body || {};

  try {
    if (workflow === 'shopping_check') {
      const agents = ['price_checker', 'stock_checker', 'recommendation', 'verifier'];
      const promises = agents.map((a) => runSubagent(a, 'shopping_check', payload || {}));
      const results = await Promise.all(promises);
      const summary = {
        workflow: 'shopping_check',
        timestamp: new Date().toISOString(),
        results,
        aggregated: {
          safeToBuy: Math.random() > 0.25,
          notes: 'Mock aggregated decision based on agents.'
        }
      };
      return res.json(summary);
    }

    if (workflow === 'bi_report') {
      const agents = ['data_aggregator', 'anomaly_detector', 'insights_writer', 'verifier'];
      const promises = agents.map((a) => runSubagent(a, 'bi_report', payload || {}));
      const results = await Promise.all(promises);
      const summary = {
        workflow: 'bi_report',
        timestamp: new Date().toISOString(),
        results,
        aggregated: {
          revenue: (50000 + Math.random()*200000).toFixed(0),
          topInsights: ['Electronics', 'Home']
        }
      };
      return res.json(summary);
    }

    res.status(400).json({ error: 'Unknown workflow' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

function compareBuildToMockup(build, target) {
  const differences = [];
  if (build.brand !== target.brand) differences.push('brand');
  if (build.heroText !== target.heroText) differences.push('heroText');
  if (build.heroCtaLink !== target.heroCtaLink) differences.push('heroCtaLink');
  if (build.hasDemoPage !== target.hasDemoPage) differences.push('demoPage');
  target.sections.forEach((section) => {
    if (!build.sections.includes(section)) differences.push(`missing:${section}`);
  });
  build.sections.forEach((section) => {
    if (!target.sections.includes(section)) differences.push(`unexpected:${section}`);
  });
  return [...new Set(differences)];
}

function recommendationsFromDifferences(differences) {
  return differences.map((diff) => {
    if (diff === 'brand') return 'Update branding to databrain.';
    if (diff === 'heroText') return 'Match hero headline text to the requested mockup.';
    if (diff === 'heroCtaLink') return 'Point the hero CTA to /demo.';
    if (diff === 'demoPage') return 'Add the demo request page and link it from the hero CTA.';
    if (diff.startsWith('missing:')) return `Add the ${diff.split(':')[1]} section.`;
    if (diff.startsWith('unexpected:')) return `Remove the unexpected ${diff.split(':')[1]} section.`;
    return `Adjust ${diff}.`;
  });
}

function applyRecommendations(build, recommendations) {
  const updated = { ...build };
  recommendations.forEach((rec) => {
    if (rec.includes('branding')) updated.brand = 'databrain';
    if (rec.includes('hero headline')) updated.heroText = 'Scale agentic AI successfully across the enterprise';
    if (rec.includes('hero CTA')) updated.heroCtaLink = '/demo';
    if (rec.includes('demo request page')) updated.hasDemoPage = true;
    if (rec.includes('Add the features section')) updated.sections = Array.from(new Set([...updated.sections, 'features']));
    if (rec.includes('Add the useCases section')) updated.sections = Array.from(new Set([...updated.sections, 'useCases']));
    if (rec.includes('Add the clients section')) updated.sections = Array.from(new Set([...updated.sections, 'clients']));
    if (rec.includes('Add the demo section')) updated.sections = Array.from(new Set([...updated.sections, 'demo']));
    if (rec.includes('Add the testimonials section')) updated.sections = Array.from(new Set([...updated.sections, 'testimonials']));
    if (rec.includes('Add the recognition section')) updated.sections = Array.from(new Set([...updated.sections, 'recognition']));
    if (rec.includes('Remove the unexpected demo section')) updated.sections = updated.sections.filter((section) => section !== 'demo');
  });
  return updated;
}

app.post('/api/agents/rebuild', (req, res) => {
  const mockup = {
    brand: 'databrain',
    heroText: 'Scale agentic AI successfully across the enterprise',
    heroCtaLink: '/demo',
    hasDemoPage: true,
    sections: ['features', 'useCases', 'clients', 'demo', 'testimonials', 'recognition']
  };

  let build = {
    brand: 'Agentic AI',
    heroText: 'Scale agentic AI successfully across the enterprise',
    heroCtaLink: '/demo',
    hasDemoPage: false,
    sections: ['features', 'useCases', 'clients']
  };

  const logs = [];
  let iteration = 1;
  let differences = compareBuildToMockup(build, mockup);

  logs.push({
    agent: 'agent1-builder',
    details: 'Initial build completed with basic enterprise sections.',
    build
  });
  logs.push({
    agent: 'agent2-checker',
    diff: differences,
    details: `Mockup checker found ${differences.length} difference(s).`
  });
  logs.push({
    agent: 'agent3-inspector',
    recommendations: recommendationsFromDifferences(differences),
    details: 'Inspector reviewed the build and suggested corrective actions.'
  });

  while (differences.length > 1 && iteration < 3) {
    iteration += 1;
    const recs = recommendationsFromDifferences(differences);
    build = applyRecommendations(build, recs);
    differences = compareBuildToMockup(build, mockup);

    logs.push({
      agent: 'agent1-builder',
      details: `Rebuilt page after iteration ${iteration - 1}.`,
      build
    });
    logs.push({
      agent: 'agent2-checker',
      diff: differences,
      details: `Mockup checker evaluated the rebuild and found ${differences.length} difference(s).`
    });
    logs.push({
      agent: 'agent3-inspector',
      recommendations: recommendationsFromDifferences(differences),
      details: 'Inspector reviewed the second build and suggested remaining improvements.'
    });
  }

  const status = differences.length === 0 ? 'completed' : 'needs attention';
  return res.json({ status, iterations: iteration, finalDifferences: differences, logs });
});

// Demo request endpoint - stores submissions as JSON lines
app.post('/api/demo-request', (req, res) => {
  const payload = req.body || {};
  const out = path.join(dataDir, 'demo_submissions.jsonl');
  try {
    fs.appendFileSync(out, JSON.stringify(payload) + '\n', 'utf8');
    return res.json({ ok: true });
  } catch (err) {
    console.error('Failed to save demo request', err);
    return res.status(500).json({ error: 'Failed to save' });
  }
});

// Mockup upload endpoint (Agent 2 uses saved mockups for comparison)
app.post('/api/mockup', (req, res) => {
  const { name, description, imageData } = req.body || {};
  if (!name || !imageData) return res.status(400).json({ error: 'name and imageData required' });

  const mockupsDir = path.join(dataDir, 'mockups');
  try { fs.mkdirSync(mockupsDir, { recursive: true }); } catch (e) { /* ignore */ }

  // imageData is expected to be a data URL: data:image/png;base64,....
  const matches = imageData.match(/^data:(image\/.+);base64,(.+)$/);
  if (!matches) return res.status(400).json({ error: 'invalid imageData' });
  const mime = matches[1];
  const b64 = matches[2];
  const ext = mime.split('/')[1].split('+')[0] || 'png';
  const filename = `${name.replace(/[^a-z0-9_-]/gi, '_')}.${ext}`;
  const outPath = path.join(mockupsDir, filename);

  try {
    fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
    // save metadata
    const meta = { name, description: description || '', filename, uploadedAt: new Date().toISOString() };
    const metaFile = path.join(mockupsDir, 'mockups.json');
    let list = [];
    try { list = JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch (e) { list = []; }
    list = list.filter((m) => m.name !== name);
    list.push(meta);
    fs.writeFileSync(metaFile, JSON.stringify(list, null, 2));
    return res.json({ ok: true, meta });
  } catch (err) {
    console.error('Failed to save mockup', err);
    return res.status(500).json({ error: 'Failed to save mockup' });
  }
});


// Agent 2: Check demo landing page against kore.ai demo-request mockup (simulated)
app.get('/api/agents/check-demo', (req, res) => {
  // Simulated comparison result
  // Load saved mockups if any
  const mockupsDir = path.join(dataDir, 'mockups');
  let meta = [];
  try { meta = JSON.parse(fs.readFileSync(path.join(mockupsDir, 'mockups.json'), 'utf8')); } catch (e) { meta = []; }

  const issues = [];
  const recommendations = [];

  if (meta.length === 0) {
    issues.push('no-reference-mockup');
    recommendations.push('Upload a reference mockup via /admin/mockups.html');
  } else {
    // Basic simulated checks: verify an image exists and description length
    const primary = meta[0];
    const imagePath = path.join(mockupsDir, primary.filename);
    if (!fs.existsSync(imagePath)) {
      issues.push('missing:reference-image');
      recommendations.push('Re-upload the reference image.');
    }
    if (!primary.description || primary.description.length < 40) {
      issues.push('copy:short-description');
      recommendations.push('Provide a longer description highlighting enterprise governance and observability in agentic AI.');
    }
    // Example privacy check
    issues.push('missing:consent-checkbox');
    recommendations.push('Add a consent checkbox for marketing/privacy compliance.');
  }

  return res.json({ ok: meta.length > 0 && issues.length === 0, issues, recommendations, meta });
});

// Always serve index for unknown routes (SPA-friendly)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
