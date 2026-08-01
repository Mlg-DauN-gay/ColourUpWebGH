import Link from "next/link";

export default async function JoinCodePage({ params }) {
  const { code } = await params;
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0B1120", color: "#E7ECF4", padding: 24, textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 380 }}>
        <div style={{ fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", color: "#7A8699", marginBottom: 8 }}>Colour Up</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 12px" }}>Table code {code}</h1>
        <p style={{ fontSize: 14, color: "#A9B4C6", lineHeight: 1.5, marginBottom: 20 }}>
          Open Colour Up, tap <strong>Join a table</strong>, and enter this code to take your seat.
        </p>
        <Link href="/" style={{ display: "inline-block", padding: "12px 20px", borderRadius: 10, background: "#4C8DFF", color: "#fff", fontWeight: 600, textDecoration: "none" }}>
          Open Colour Up
        </Link>
      </div>
    </div>
  );
}
