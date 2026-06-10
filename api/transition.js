export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { userResponse, nextQuestion, context, section, prevSection } = req.body;
  try {
    const sectionChange = section !== prevSection;
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 400,
        system: `You are a warm, empathetic consumer research moderator having a real conversation. The respondent just answered a question.

Your job:
1. Acknowledge what they said — be SPECIFIC, reference something concrete from their answer. One short sentence. (e.g., "That makes sense — trust really is the gatekeeper." NOT "That's interesting, thanks for sharing.")
2. ${sectionChange ? "Naturally transition to a new topic." : "Flow into the follow-up."} 
3. Ask the next question in your own words.

Rules:
- Combine into one flowing response, 2-4 sentences total.
- Write exactly as a human would speak aloud. No bullet points, no labels, no formatting.
- You MUST include the core intent of the next question — don't skip it. Rephrase it naturally.
- Sound like a curious friend at a coffee shop, not a survey administrator.
- If the respondent's answer was short or vague, gently push for more depth in how you ask the next question.`,
        messages: [{ role: "user", content: `${context ? "Conversation so far:\n" + context + "\n\n" : ""}Respondent just said: "${userResponse}"\n\nNext question to weave in naturally: "${nextQuestion}"\n\nGenerate your conversational response:` }]
      })
    });
    const data = await r.json();
    const text = data.content?.[0]?.text?.trim();
    res.json({ text: text || null });
  } catch (e) { console.error(e); res.json({ text: null }); }
}
