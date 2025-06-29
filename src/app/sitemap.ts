import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.customfiller.com'
  
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services/1-inch-filling`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/20mm-filling`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/non-flammable-propellant`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/laser-cryogen`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faqs`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/policies/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/policies/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/policies/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/policies/returns`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  // If you want to add dynamic product pages later:
  // const products = await getProducts() // Your product fetching function
  // const productPages: MetadataRoute.Sitemap = products.map((product) => ({
  //   url: `${baseUrl}/products/${product.slug}`,
  //   lastModified: new Date(product.updatedAt),
  //   changeFrequency: 'weekly',
  //   priority: 0.7,
  // }))

  return [...staticPages]
}