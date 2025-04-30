import Link from 'next/link';
import Card from '@/components/ui/Card';

const products = [
  {
    id: 'laser-cryogen-standard',
    name: 'Laser Cryogen - Standard',
    description: 'Our standard laser cryogen spray for dermatological applications, compatible with most laser systems.',
    image: '/placeholder-product.jpg'
  },
  {
    id: 'laser-cryogen-extended',
    name: 'Laser Cryogen - Extended Duration',
    description: 'Extended duration formula providing longer cooling effect for specialized laser treatments.',
    image: '/placeholder-product.jpg'
  },
  {
    id: 'sample-kit',
    name: 'Custom Filling Sample Kit',
    description: 'A sample kit showcasing our various filling capabilities and container options.',
    image: '/placeholder-product.jpg'
  }
];

const ProductsSection = () => {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Products</h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Explore our specialized aerosol products
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden h-full">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400">Product Image</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {product.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {product.description}
                </p>
                <Link 
                  href={`/products/${product.id}`}
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  <span>Learn More</span>
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;