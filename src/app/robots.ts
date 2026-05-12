import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/callback', '/kitchen/', '/checkout/', '/cart/', '/orders/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/auth/callback', '/kitchen/'],
      },
    ],
    sitemap: 'https://simmerdownsv.com/sitemap.xml',
    host: 'https://simmerdownsv.com',
  }
}
