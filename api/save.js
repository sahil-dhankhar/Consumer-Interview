import { kv } from "@vercel/kv";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { id, ts, answers } = req.body;
  try {
    await kv.set(`interview:${id}`, JSON.stringify({ id, ts, answers }));
    await kv.sadd("interview_ids", id);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: "Save failed" }); }
}
