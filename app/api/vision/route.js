// Server-side proxy for chip-photo recognition. The Anthropic API key never
// reaches the browser — the client posts a base64 image here and gets back
// the raw Messages API response to parse.

// Cheapest current vision model. Swap to "claude-sonnet-5" for higher accuracy.
const VISION_MODEL = "claude-haiku-4-5-20251001";

const PROMPTS = {
  chipset: 'This is a photo of poker chips grouped by colour. Identify each distinct chip colour and estimate the total number of chips of that colour visible. Respond with ONLY compact JSON, no prose: {"chips":[{"color":"<name>","hex":"#rrggbb","count":<integer>}]}.',
  stack: 'This is a photo of one player\'s poker chip stack. Count the chips of each distinct colour. Respond with ONLY compact JSON, no prose: {"chips":[{"color":"<name>","hex":"#rrggbb","count":<integer>}]}.',
};

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not configured on the server." }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { image, mediaType, kind } = body || {};
  if (!image || typeof image !== "string") {
    return Response.json({ error: "Missing base64 image." }, { status: 400 });
  }
  const prompt = PROMPTS[kind] || PROMPTS.chipset;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: image } },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return Response.json({ error: data?.error?.message || "Vision request failed." }, { status: res.status });
    }
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: "Could not reach the vision service." }, { status: 502 });
  }
}
