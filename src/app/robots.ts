import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.customfiller.com'
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/admin-portal-secure/',
        '/auth/',
        '/dashboard/',
        '/api/',
        '/checkout/',
        '/cart/',
        '/profile/',
        '/test-storage/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}