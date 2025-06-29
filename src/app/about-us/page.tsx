  import type { Metadata } from 'next'
  import AboutUsClient from './AboutUsClient'

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.customfiller.com'

  export const metadata: Metadata = {
    title: 'About Us - Custom Filler',
    description: 'Learn about Custom Filler\'s professional filling services and our commitment to quality aerosol solutions.',
    alternates: {
      canonical: `${baseUrl}/about-us`,
    },
    openGraph: {
      url: `${baseUrl}/about-us`,
      title: 'About Us - Custom Filler',
      description: 'Learn about Custom Filler\'s professional filling services and our commitment to quality aerosol solutions.',
    },
  }

  export default function AboutUsPage() {
    return <AboutUsClient />
  }
