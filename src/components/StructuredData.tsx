'use client'

export default function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.customfiller.com'
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Custom Filler",
    "url": baseUrl,
    "logo": `${baseUrl}/images/logo_nav_customfiller.png`,
    "description": "Professional custom filling services including aerosol filling, propellant services, and specialized filling solutions.",
    "address": {
      "@type": "PostalAddress",
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": `${baseUrl}/contact-us`
    },
    "sameAs": [
      // Add your social media URLs here
    ],
    "service": [
      {
        "@type": "Service",
        "name": "1 Inch Filling",
        "description": "Professional 1-inch aerosol filling services",
        "url": `${baseUrl}/services/1-inch-filling`
      },
      {
        "@type": "Service",
        "name": "20mm Filling",
        "description": "Specialized 20mm filling solutions",
        "url": `${baseUrl}/services/20mm-filling`
      },
      {
        "@type": "Service",
        "name": "Non-Flammable Propellant",
        "description": "Safe non-flammable propellant services",
        "url": `${baseUrl}/services/non-flammable-propellant`
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}