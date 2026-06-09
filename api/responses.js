import { kv } from "@vercel/kv";
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (req.query.key !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });
  try {
    const ids = await kv.smembers("interview_ids");
    if (!ids?.length) return res.json({ responses: [] });
    const responses = [];
    for (const id of ids) { const d = await kv.get(`interview:${id}`); if (d) responses.push(typeof d === "string" ? JSON.parse(d) : d); }
    responses.sort((a, b) => new Date(a.ts) - new Date(b.ts));
    res.json({ responses });
  } catch (e) { console.error(e); res.status(500).json({ error: "Fetch failed" }); }
}
