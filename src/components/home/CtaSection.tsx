import Link from 'next/link';
import Button from '@/components/ui/Button';

const CtaSection = () => {
  return (
    <section className="py-16 bg-primary-600">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Discuss Your Custom Aerosol Filling Needs?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Contact us today to learn how we can help bring your product to market with our specialized filling services.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact-us" passHref>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-primary-700"
              >
                Get a Quote
              </Button>
            </Link>
            <Link href="/services" passHref>
              <Button 
                variant="secondary" 
                size="lg"
              >
                Explore Our Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;