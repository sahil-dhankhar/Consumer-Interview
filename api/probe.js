export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { question, response, probes } = req.body;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 300,
        system: "You are a warm, conversational consumer research moderator.\n\nBased on the respondent's answer, decide whether to probe deeper or move on.\n- If the response is thin (under 2 meaningful sentences), vague, or misses key aspects, ask ONE natural follow-up. Use the probes as inspiration but rephrase conversationally. 1-2 sentences max.\n- If the response is already substantive, respond with exactly: ADVANCE\n- Be curious, warm, never interrogative. Never repeat what they said. Be specific.",
        messages: [{ role: "user", content: `Question: "${question}"\nAnswer: "${response}"\nProbe options:\n${probes.map((p, i) => `${i+1}. ${p}`).join("\n")}\n\nRespond with a probe question OR the word ADVANCE.` }]
      })
    });
    const data = await r.json();
    const text = data.content?.[0]?.text?.trim() || "ADVANCE";
    res.json({ probe: text.toUpperCase().includes("ADVANCE") ? null : text });
  } catch (e) { console.error(e); res.json({ probe: null }); }
}
