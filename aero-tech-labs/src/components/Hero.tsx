import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';

const Hero = () => {
  return (
    <section className="relative">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black opacity-60 z-10"></div>
        <div className="relative h-full w-full">
          <Image 
            src="/hero-background.jpg" 
            alt="Aerosol filling facility"
            fill
            priority
            className="object-cover"
            sizes="100vw"
            // If you don't have the image yet, you can use a placeholder
            // src="https://images.unsplash.com/photo-1581093458791-9d15482442f5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1920&q=80"
          />
        </div>
      </div>
      
      {/* Hero content */}
      <div className="relative z-20 container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
            Custom Aerosol Filling Solutions
          </h1>
          <p className="text-lg md:text-xl mb-6 text-gray-200">
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
