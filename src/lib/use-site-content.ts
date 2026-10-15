'use client'

/**
 * Client hook: fetch the segment CMS payload (brand-page items, location
 * photos, careers, historia stats) once per session and share it. Fails
 * silent — static content remains the fallback, same pattern as
 * useMenuOverrides.
 */

import { useEffect, useState } from 'react'
import {
  EMPTY_SITE_CONTENT,
  type SiteContentPayload,
} from '@/lib/site-content'

let cached: SiteContentPayload | null = null

export function useSiteContent(): SiteContentPayload {
  const [payload, setPayload] = useState<SiteContentPayload>(cached || EMPTY_SITE_CONTENT)

  useEffect(() => {
    if (cached) return
    let cancelled = false
    fetch('/api/site-content')
      .then((r) => (r.ok ? r.json() : EMPTY_SITE_CONTENT))
      .then((data: Partial<SiteContentPayload>) => {
        cached = {
          segments: { ...EMPTY_SITE_CONTENT.segments, ...(data.segments || {}) },
          locationMedia: data.locationMedia || {},
          careers: { ...EMPTY_SITE_CONTENT.careers, ...(data.careers || {}) },
          historia: { ...EMPTY_SITE_CONTENT.historia, ...(data.historia || {}) },
        }
        if (!cancelled) setPayload(cached)
      })
      .catch((err) => {
        console.error('[useSiteContent]', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return payload
}
