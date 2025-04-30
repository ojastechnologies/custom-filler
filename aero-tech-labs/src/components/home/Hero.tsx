import Link from 'next/link';
import Button from '@/components/ui/Button';

const Hero = () => {
  return (
    <section className="relative bg-gray-900 text-white">
      {/* Background image with overlay */}
      <div className="absolute inset-0 bg-black opacity-60"></div>
      
      {/* Hero content */}
      <div className="relative container mx-auto px-4 py-32 md:py-48">
        <div className="max-w-3xl">
          <h1 className="texst-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Custom Aerosol Filling Solutions
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200">
            Specialized contract filling services for aerosol products and laser cryogen applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/services" passHref>
              <Button variant="primary" size="lg">
                Our Services
              </Button>
            </Link>
            <Link href="/contact-us" passHref>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-gray-800">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;