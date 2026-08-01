import { updateSession } from "@/lib/supabase/middleware";

// Named `proxy` (not `middleware`) — Next.js 16 renamed the convention.
export async function proxy(request) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
