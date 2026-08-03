// Server-side proxy for chip-photo recognition. The Anthropic API key never
// reaches the browser — the client posts a base64 image here and gets back
// the raw Messages API response to parse.
//
// Deliberately callable while signed out: Setup (where the scanner lives)
// is explicitly browsable without an account (see HANDOFF.md's Milestone 1
// notes) — requiring a session here would silently break that. The actual
// abuse risk (burning ANTHROPIC_API_KEY spend at unlimited volume) is
// closed instead with IP rate-limiting, a payload size cap, and a
// media-type allowlist. Set a hard monthly spend cap in the Anthropic
// console too — that's an account-level setting this code can't enforce.

// Cheapest current vision model. Swap to "claude-sonnet-5" for higher accuracy.
const VISION_MODEL = "claude-haiku-4-5-20251001";

const PROMPTS = {
  chipset: 'This is a photo of poker chips grouped by colour. Identify each distinct chip colour and estimate the total number of chips of that colour visible. Respond with ONLY compact JSON, no prose: {"chips":[{"color":"<name>","hex":"#rrggbb","count":<integer>}]}.',
  stack: 'This is a photo of one player\'s poker chip stack. Count the chips of each distinct colour. Respond with ONLY compact JSON, no prose: {"chips":[{"color":"<name>","hex":"#rrggbb","count":<integer>}]}.',
};

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const MAX_BASE64_CHARS = 8_000_000; // ~6MB decoded — plenty for a phone photo, not for abuse payloads.

// In-memory per-IP token bucket. Resets on server restart and isn't shared
// across instances if this is ever scaled horizontally — good enough for a
// single-instance deploy; swap for Upstash Redis (per the original spec)
// if that ever changes.
const RATE_LIMIT = { max: 8, windowMs: 60_000 };
const hits = new Map(); // ip -> array of request timestamps

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT.max;
}

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not configured on the server." }, { status: 500 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (isRateLimited(ip)) {
    return Response.json({ error: "Too many scan requests — wait a moment and try again." }, { status: 429 });
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
  if (image.length > MAX_BASE64_CHARS) {
    return Response.json({ error: "Image is too large." }, { status: 413 });
  }
  if (mediaType && !ALLOWED_MEDIA_TYPES.has(mediaType)) {
    return Response.json({ error: "Unsupported image type." }, { status: 400 });
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
