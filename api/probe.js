export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { question, response, probes, context, probeCount } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[PROBE] No ANTHROPIC_API_KEY set");
    return res.json({ probe: null, error: "no_key" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: `You are a warm, curious consumer research moderator having a real conversation. The respondent just gave their first answer to a question, and you need to probe deeper to extract richer insights.

MANDATORY RULE: You MUST probe at least once per question. This is the first probe on this question (probe count so far: ${probeCount || 0}). You should ALWAYS ask a follow-up unless the answer is unusually thorough (multiple paragraphs with deep specifics).

YOUR PROBE MUST:
1. START with a brief, specific acknowledgment of what they said. Reference an actual word or idea from their answer. Examples:
   - "Yeah, the trust angle is really interesting..."
   - "Mmm, so it really comes down to time for you..."
   - "Okay, so cash isn't the issue, it's about feeling valued..."
   AVOID generic openers like "That's interesting" / "Tell me more" / "Can you elaborate".

2. Then ask ONE specific follow-up that digs deeper. Use the available probes as inspiration but rephrase naturally. Good probes pull on a specific thread they mentioned. Examples:
   - "Why do you think trust matters more than the money?"
   - "You mentioned 'feeling annoyed' — what specifically makes you feel that way?"
   - "When you say 'too long,' what's the line for you?"

STRICT RULES:
- Total output: 2-3 sentences max. This is spoken aloud.
- Write as if speaking. No formatting.
- ONLY respond with the word "ADVANCE" if the respondent gave a truly comprehensive answer (multiple specific examples, clear reasoning, deeply explored). For typical answers (1-3 sentences), ALWAYS probe.
- Never repeat what they said back. Never use generic phrases.
- Sound human and curious, not interrogative.`,
        messages: [{
          role: "user",
          content: `Question I asked: "${question}"\n\nRespondent's answer: "${response}"\n\nAvailable probe directions (use as inspiration):\n${probes.map((p, i) => `${i + 1}. ${p}`).join("\n")}${context ? `\n\nConversation context:\n${context}` : ""}\n\nGenerate a probing follow-up (acknowledge + dig deeper). Only respond with ADVANCE if truly comprehensive.`
        }]
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("[PROBE] API error:", r.status, errText);
      return res.json({ probe: null, error: `api_${r.status}` });
    }

    const data = await r.json();
    const text = data.content?.[0]?.text?.trim() || "ADVANCE";
    const isAdvance = text.toUpperCase() === "ADVANCE" || text.toUpperCase().startsWith("ADVANCE.");

    console.log("[PROBE]", isAdvance ? "ADVANCING" : `PROBING: ${text.substring(0, 60)}`);
    res.json({ probe: isAdvance ? null : text });
  } catch (e) {
    console.error("[PROBE] Exception:", e.message);
    res.json({ probe: null, error: e.message });
  }
}
