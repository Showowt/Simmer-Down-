import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { canonicalVanityPath } from '@/lib/vanity-paths'

export async function proxy(request: NextRequest) {
  const vanity = canonicalVanityPath(request.nextUrl.pathname)
  if (vanity) {
    const url = request.nextUrl.clone()
    url.pathname = vanity
    return NextResponse.redirect(url, 308)
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
