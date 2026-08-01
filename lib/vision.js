import { parseVisionChips } from "./chips";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Uploads a chip photo to the server-side /api/vision proxy and returns the
// parsed {color, hex, count} list. `kind` is "chipset" or "stack".
export async function scanChipPhoto(file, kind) {
  const dataUrl = await readFileAsDataUrl(file);
  const base64 = dataUrl.split(",")[1];
  const res = await fetch("/api/vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64, mediaType: file.type || "image/jpeg", kind }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "vision request failed");
  return { chips: parseVisionChips(data), preview: dataUrl };
}
