// TAB SWITCHING
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
  });
});

// API CALL FUNCTION
async function callWorkflow(workflow, payload) {
  const res = await fetch('/api/agents/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow, payload })
  });
  if (!res.ok) throw new Error('Network error: ' + res.status);
  return res.json();
}

// FORMAT AGENT RESULTS FOR DISPLAY
function formatResults(data) {
  const lines = [];
  lines.push(`🚀 Workflow: ${data.workflow}`);
  lines.push(`⏰ Timestamp: ${data.timestamp}`);
  lines.push(`\n📋 Agent Results:\n`);
  
  data.results.forEach((result, i) => {
    lines.push(`[Agent ${i + 1}] ${result.agent.toUpperCase()}`);
    lines.push(`  Status: ${result.ok ? '✅ Success' : '❌ Failed'}`);
    lines.push(`  ${result.details}`);
    lines.push('');
  });
  
  lines.push(`\n✓ AGGREGATED RESULTS:`);
  if (data.aggregated.safeToBuy !== undefined) {
    lines.push(`  Buy Decision: ${data.aggregated.safeToBuy ? '✅ SAFE TO BUY' : '⚠️ WAIT'}`);
  }
  if (data.aggregated.revenue !== undefined) {
    lines.push(`  Revenue: $${data.aggregated.revenue}`);
  }
  if (data.aggregated.topInsights) {
    lines.push(`  Top Insights: ${data.aggregated.topInsights.join(', ')}`);
  }
  lines.push(`  Notes: ${data.aggregated.notes}`);
  
  return lines.join('\n');
}

// SHOPPING AGENTS WORKFLOW
document.getElementById('runShopping').addEventListener('click', async () => {
  const items = document.getElementById('items').value.split('\n').map(s => s.trim()).filter(Boolean);
  const out = document.getElementById('shoppingOutput');
  
  if (items.length === 0) {
    out.textContent = '⚠️ Please enter at least one item.';
    return;
  }
  
  out.textContent = '🔄 Running shopping agents in parallel...\n(Price Checker | Stock Checker | Recommender | Verifier)';
  
  try {
    const data = await callWorkflow('shopping_check', { items });
    out.textContent = formatResults(data);
  } catch (err) {
    out.textContent = `❌ Error: ${err.message}`;
  }
});

// BI REPORT AGENTS WORKFLOW
document.getElementById('runBI').addEventListener('click', async () => {
  const range = document.getElementById('range').value || '30d';
  const out = document.getElementById('biOutput');
  
  out.textContent = '🔄 Running BI agents in parallel...\n(Data Aggregator | Anomaly Detector | Insights Writer | Verifier)';
  
  try {
    const data = await callWorkflow('bi_report', { range });
    out.textContent = formatResults(data);
  } catch (err) {
    out.textContent = `❌ Error: ${err.message}`;
  }
});

// 3-AGENT REVIEW WORKFLOW
async function callReview(payload) {
  const res = await fetch('/api/agents/rebuild', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Network error: ' + res.status);
  return res.json();
}

document.getElementById('runReview').addEventListener('click', async () => {
  const out = document.getElementById('reviewOutput');
  out.textContent = '🔄 Running 3-agent review workflow...\nAgent 1 builds, Agent 2 compares to mockup, Agent 3 recommends changes.';
  
  try {
    const data = await callReview({ target: 'kore-ai-mockup' });
    const lines = [];
    lines.push(`Review status: ${data.status}`);
    lines.push(`Iterations: ${data.iterations}`);
    lines.push(`Final difference count: ${data.finalDifferences.length}`);
    lines.push('');
    data.logs.forEach((entry, index) => {
      lines.push(`[${index + 1}] ${entry.agent.toUpperCase()}`);
      lines.push(`  ${entry.details}`);
      if (entry.diff) {
        lines.push(`  Differences: ${entry.diff.join(', ')}`);
      }
      if (entry.recommendations) {
        lines.push(`  Recommendations: ${entry.recommendations.join(', ')}`);
      }
      lines.push('');
    });
    out.textContent = lines.join('\n');
  } catch (err) {
    out.textContent = `❌ Error: ${err.message}`;
  }
});
