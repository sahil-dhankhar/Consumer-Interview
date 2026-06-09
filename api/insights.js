export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { responses } = req.body;
  try {
    const summary = responses.map((r, i) => `--- Respondent ${i+1} ---\n${r.answers.map(a => `Q: ${a.q}\nA: ${a.a}`).join("\n")}`).join("\n\n");
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 2000,
        system: "You are a senior consumer insights analyst. Produce a clear, structured synthesis.",
        messages: [{ role: "user", content: `Analyze ${responses.length} interview transcripts about survey participation.\n\nProduce:\n1. TOP BARRIERS (ranked by frequency)\n2. INCENTIVE PREFERENCES\n3. MOMENT & CONTEXT PATTERNS\n4. FRAMING & CREDIBILITY TAKEAWAYS\n5. STANDOUT VERBATIMS (3-5 quotes)\n6. TESTABLE HYPOTHESES (2-3)\n\nBe specific. Reference respondent numbers.\n\n${summary}` }]
      })
    });
    const data = await r.json();
    res.json({ insights: data.content?.[0]?.text || "Unable to generate insights." });
  } catch { res.status(500).json({ insights: "Error generating insights." }); }
}
