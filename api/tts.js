export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text" });
  if (!process.env.OPENAI_API_KEY) return res.json({ fallback: true });
  try {
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "tts-1", input: text, voice: process.env.TTS_VOICE || "nova", response_format: "mp3", speed: 1.0 })
    });
    if (!r.ok) return res.json({ fallback: true });
    const buffer = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch { res.json({ fallback: true }); }
}
