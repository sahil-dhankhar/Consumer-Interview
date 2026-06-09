export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { question, response, probes, context } = req.body;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 300,
        system: `You are a warm, curious consumer research moderator having a natural 1-on-1 conversation. You genuinely care about understanding this person's perspective.

Rules:
- Almost always ask a follow-up. Real conversations have back-and-forth.
- Start your follow-up with a brief, natural reaction to what they said (e.g., "That's a really good point." or "Interesting —" or "Yeah, I hear that a lot.") then ask your question.
- Use the available probes as inspiration but rephrase them naturally, the way a friend would ask over coffee.
- Only respond with ADVANCE if the person has given a very thorough, multi-sentence answer that clearly covers the key aspects.
- Keep follow-ups to 1-2 sentences max. Sound like a real person, not a survey bot.
- Never repeat what they said back to them. Never use generic phrases like "Can you tell me more?" or "That's interesting, can you elaborate?"
- If previous conversation context is provided, you can reference earlier answers naturally (e.g., "You mentioned earlier that..." or "Going back to what you said about...").`,
        messages: [{ role: "user", content: `Question asked: "${question}"\n\nRespondent's answer: "${response}"\n\nAvailable probe directions:\n${probes.map((p, i) => `${i+1}. ${p}`).join("\n")}${context ? `\n\nPrevious conversation context:\n${context}` : ""}\n\nRespond with a natural follow-up question OR the word ADVANCE.` }]
      })
    });
    const data = await r.json();
    const text = data.content?.[0]?.text?.trim() || "ADVANCE";
    res.json({ probe: text.toUpperCase().includes("ADVANCE") ? null : text });
  } catch (e) { console.error(e); res.json({ probe: null }); }
}
