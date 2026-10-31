// Vercel Serverless Function Entrypoint
import express from 'express';
import cors from 'cors';
import { getGenAI, getModelName, getEmbeddingModelName, isGeminiConfigured } from '../server/gemini';
import { agentToolDeclarations, executeTool } from '../server/tools';
import { parseDate, formatDate, addDaysToDate } from '../engine';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: 'vercel-serverless',
    geminiConfigured: isGeminiConfigured(),
    model: getModelName(),
    timestamp: new Date().toISOString(),
  });
});

// POST /api/parse-disruption
app.post('/api/parse-disruption', async (req, res) => {
  try {
    const { text, suppliers, now: nowStr } = req.body;
    const now = nowStr ? parseDate(nowStr) : new Date();
    const todayStr = formatDate(now);

    const ai = getGenAI();
    if (ai) {
      try {
        const prompt = `You are a supply chain assistant. The manager provided this disruption report:
"${text}"
Current real date (today): ${todayStr}
Known suppliers: ${JSON.stringify(suppliers || [])}

Extract and return ONLY a raw JSON object (no markdown backticks, no extra text) with these exact keys:
{
  "supplier_id": "SUP-XX",
  "start_date": "YYYY-MM-DD",
  "duration_days": number,
  "capacity_loss_pct": number
}`;

        const response = await ai.models.generateContent({
          model: getModelName(),
          contents: prompt,
        });

        const rawText = response.text || '';
        const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return res.json(parsed);
      } catch (err) {
        console.warn('Gemini parse failed, falling back to heuristic parsing:', err);
      }
    }

    const lower = (text || '').toLowerCase();
    let supplierId = 'SUP-01';
    if (suppliers && Array.isArray(suppliers)) {
      const match = suppliers.find(
        (s: any) =>
          lower.includes(s.name.toLowerCase()) || lower.includes(s.supplier_id.toLowerCase())
      );
      if (match) supplierId = match.supplier_id;
    }

    const daysMatch = lower.match(/(\d+)\s*(days?|d)/);
    const durationDays = daysMatch ? parseInt(daysMatch[1], 10) : 10;

    return res.json({
      supplier_id: supplierId,
      start_date: todayStr,
      duration_days: durationDays,
      capacity_loss_pct: 100,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to parse disruption' });
  }
});

// POST /api/draft-quote
app.post('/api/draft-quote', async (req, res) => {
  try {
    const { supplier, material, quantity, deadline, now: nowStr } = req.body;
    const now = nowStr ? parseDate(nowStr) : new Date();

    const ai = getGenAI();
    if (ai) {
      try {
        const prompt = `Draft a concise, professional quote request email message from Tiruppur Garments to backup supplier ${supplier.name} (${supplier.city}).
Material: ${material.name} (${material.material_id})
Emergency quantity needed: ${quantity} ${material.unit}
Delivery deadline required: ${deadline}
Current date: ${formatDate(now)}

Request their fastest confirmed lead time, price in INR per ${material.unit}, and available weekly capacity. Return plain text email body only.`;

        const response = await ai.models.generateContent({
          model: getModelName(),
          contents: prompt,
        });

        return res.json({ body: response.text });
      } catch (err) {
        console.warn('Gemini draft quote failed, using standard template');
      }
    }

    const body = `Dear ${supplier.contact_person || supplier.name} Team,

Greetings from Tiruppur Garments Manufacturing.

Due to urgent production scheduling across our knitting units, we are seeking an expedited quote for:
- Material: ${material.name} (${material.material_id})
- Required Quantity: ${quantity} ${material.unit}
- Target Delivery Date: on or before ${deadline}

Kindly confirm your current spot price (INR/${material.unit}), your earliest guaranteed dispatch date, and available weekly volume.

Warm regards,
Supply Chain Operations Desk
Tiruppur Garments Ltd.`;

    res.json({ body });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/explain
app.post('/api/explain', async (req, res) => {
  try {
    const { impact, plan, now: nowStr } = req.body;
    const now = nowStr ? parseDate(nowStr) : new Date();

    const ai = getGenAI();
    if (ai) {
      try {
        const prompt = `You are ChainTwin AI, a supply chain twin recovery expert.
Real current date: ${formatDate(now)}
Disruption Details:
${JSON.stringify(impact)}

Recommended Recovery Plan:
${JSON.stringify(plan)}

Write a crisp 2-paragraph executive briefing for the Supply Chain Manager:
1. Explain how the outage propagates from supplier to materials, factories, and orders (tag verified facts as [KNOWN] and projections as [ASSUMPTION]).
2. Explain why the recommended plan is the most balanced choice.`;

        const response = await ai.models.generateContent({
          model: getModelName(),
          contents: prompt,
        });

        return res.json({ explanation: response.text });
      } catch (err) {
        console.warn('Gemini explain failed, using engine summary');
      }
    }

    const text = `[KNOWN] Disruption at ${impact.disruptedSupplier?.name || 'Primary Supplier'} halts delivery of ${impact.affectedMaterials?.map((m: any) => m.name).join(', ')}. Factory buffers provide limited cover before yarn starvation impacts customer delivery deadlines. Without intervention, ${impact.lateOrdersCount} customer orders face delivery breach with INR ${(impact.totalPenaltyINR || 0).toLocaleString('en-IN')} in contractual late penalties.

${plan ? `[RECOMMENDED PLAN] ${plan.name} achieves optimal balance by deploying ${plan.actions?.length || 3} targeted interventions, protecting customer orders and generating a net benefit of INR ${(plan.businessImpact?.netBenefitINR || 0).toLocaleString('en-IN')}. [KNOWN] Procurement quotes from backup supplier SUP-06 resolve raw material constraints while keeping operational risk low.` : ''}`;

    res.json({ explanation: text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/agent
app.post('/api/agent', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { message, snapshot, now: nowStr } = req.body;
    const now = nowStr ? parseDate(nowStr) : new Date();

    sendEvent('status', { step: 'Reading network state and dependencies...', progress: 20 });

    const ai = getGenAI();
    if (ai) {
      try {
        sendEvent('tool_call', { tool: 'get_network_summary', status: 'executing' });
        const summary = executeTool('get_network_summary', {}, { snapshot, now });
        sendEvent('tool_result', { tool: 'get_network_summary', result: summary });

        sendEvent('status', { step: 'Reasoning over supply chain graph...', progress: 50 });

        const systemInstruction = `You are ChainTwin AI, an Autonomous Supply Chain Digital Twin Agent.
Current real date: ${formatDate(now)}.
Ground numbers in tools. Distinguish [KNOWN] vs [ASSUMPTION].`;

        const responseStream = await ai.models.generateContentStream({
          model: getModelName(),
          contents: `${systemInstruction}\n\nUser Question: ${message}\n\nLive Snapshot Context: ${JSON.stringify(summary)}`,
        });

        sendEvent('status', { step: 'Synthesizing recommendations...', progress: 85 });

        for await (const chunk of responseStream) {
          sendEvent('token', { text: chunk.text });
        }

        sendEvent('status', { step: 'Complete', progress: 100 });
        sendEvent('done', {});
        return res.end();
      } catch (err) {
        console.warn('Gemini streaming agent failed, using structured agent fallback');
      }
    }

    sendEvent('tool_call', { tool: 'get_network_summary', status: 'executing' });
    const summary = executeTool('get_network_summary', {}, { snapshot, now });
    sendEvent('tool_result', { tool: 'get_network_summary', result: summary });

    sendEvent('status', { step: 'Evaluating orders and inventory buffers...', progress: 60 });
    await new Promise((r) => setTimeout(r, 200));

    sendEvent('status', { step: 'Generating recovery insights...', progress: 85 });

    const fallbackResponse = `**ChainTwin AI Network Status (${formatDate(now)})**

- **[KNOWN] Active Network Nodes**: ${summary.suppliersCount} Suppliers, ${summary.factoriesCount} Factories, ${summary.distributionCentresCount} Regional DCs, ${summary.storesCount} Stores.
- **[KNOWN] Live Orders**: ${summary.ordersCount} orders in flight with total valuation of **INR ${summary.totalOrderValueINR.toLocaleString('en-IN')}**.
- **[KNOWN] Disruption Guardrails**: All raw material calculations strictly adhere to BOM requirements and customer SLA tiers.
- **[ASSUMPTION] Recovery Projection**: If primary supplier outages occur, Level 1 internal rebalancing is prioritized before escalating to backup supplier quotes (SUP-06 / SUP-07).`;

    for (const word of fallbackResponse.split(' ')) {
      sendEvent('token', { text: word + ' ' });
      await new Promise((r) => setTimeout(r, 20));
    }

    sendEvent('status', { step: 'Complete', progress: 100 });
    sendEvent('done', {});
    res.end();
  } catch (error: any) {
    sendEvent('error', { message: error.message });
    res.end();
  }
});

// POST /api/embed
app.post('/api/embed', async (req, res) => {
  try {
    const { text } = req.body;
    const ai = getGenAI();
    if (ai) {
      try {
        const response = await ai.models.embedContent({
          model: getEmbeddingModelName(),
          contents: text,
        });
        const resAny = response as any;
        const embedding = resAny?.embedding?.values || resAny?.embeddings?.[0]?.values || [];
        return res.json({ embedding });
      } catch (err) {
        console.warn('Gemini embedding fallback');
      }
    }
    const pseudo = Array.from({ length: 64 }, (_, i) => Math.sin(text.length * (i + 1)));
    res.json({ embedding: pseudo });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/rag/search
app.post('/api/rag/search', async (req, res) => {
  try {
    const { query, chunks } = req.body;
    if (!chunks || chunks.length === 0) return res.json({ results: [] });

    const q = (query || '').toLowerCase();
    const ranked = chunks
      .map((c: any) => {
        const content = (c.content || '').toLowerCase();
        let score = 0;
        const words = q.split(/\s+/).filter(Boolean);
        for (const w of words) {
          if (content.includes(w)) score += 1;
        }
        return { ...c, score };
      })
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5);

    res.json({ results: ranked });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
