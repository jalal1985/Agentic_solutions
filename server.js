const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// Always serve index for unknown routes (SPA-friendly)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
