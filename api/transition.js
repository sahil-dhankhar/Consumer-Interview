export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { userResponse, nextQuestion, context, section, prevSection } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[TRANSITION] No ANTHROPIC_API_KEY set");
    return res.json({ text: null, error: "no_key" });
  }

  try {
    const sectionChange = section !== prevSection;
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: `You are a warm, empathetic consumer research moderator. You are conducting a real-time, voice-based interview about why people do or don't participate in surveys.

YOUR TASK: The respondent just gave you an answer. You must produce ONE flowing spoken response that does ALL THREE of these things, in this order:

1. ACKNOWLEDGE — Open with a specific, genuine reaction to something concrete they said. Reference their actual words or idea. Examples of good acknowledgments:
   - "Yeah, that makes total sense — the time-versus-reward thing is huge."
   - "Mmm, interesting that brand trust is the first filter for you."
   - "Oh wow, so it's really about feeling like the survey was designed for you."
   AVOID generic openers like "That's interesting" / "Thanks for sharing" / "Great point."

2. ${sectionChange ? "BRIDGE — Add a brief, natural transition because we're shifting topics. Example: 'Let me ask you something a little different now...' or 'Okay, switching gears for a moment...'" : "CONNECT — Use a light connecting phrase like 'Building on that,' or 'On a related note,' or 'Speaking of which,'"}

3. ASK — Weave in the next question naturally in your own words. Keep the core intent but make it sound conversational, not like you're reading from a script.

RULES (strict):
- TOTAL output: 2-4 sentences. Be concise. This is spoken aloud.
- Write as if speaking. No bullets, no headers, no labels, no formatting markers.
- NEVER start your response with the next question. ALWAYS start with the acknowledgment.
- You MUST include the next question's intent — don't drop it.
- If their answer was vague or under 15 words, gently push for depth.
- Sound human. Use natural verbal tics occasionally: "you know," "I mean," "yeah," "right." Use sparingly.
- Never say "I appreciate you sharing" or other robotic moderator phrases.`,
        messages: [{
          role: "user",
          content: `${context ? "Conversation history:\n" + context + "\n\n" : ""}The respondent just said:\n"${userResponse}"\n\nThe next question I need you to weave in is:\n"${nextQuestion}"\n\nNow generate your conversational response (acknowledge + bridge + ask):`
        }]
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("[TRANSITION] API error:", r.status, errText);
      return res.json({ text: null, error: `api_${r.status}` });
    }

    const data = await r.json();
    const text = data.content?.[0]?.text?.trim();

    if (!text) {
      console.error("[TRANSITION] Empty response from Claude");
      return res.json({ text: null, error: "empty" });
    }

    console.log("[TRANSITION] Success:", text.substring(0, 80));
    res.json({ text });
  } catch (e) {
    console.error("[TRANSITION] Exception:", e.message);
    res.json({ text: null, error: e.message });
  }
}
