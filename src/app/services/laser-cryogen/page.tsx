import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function LaserCryogenPage() {
  return (
    <Layout>
      <div className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Link href="/services" className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Products
              </Link>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Laser Cryogen Solutions</h1>
            
            <div className="bg-gray-200 dark:bg-gray-700 h-64 md:h-96 rounded-lg mb-8 flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400 text-lg">Service Image</span>
            </div>
            
            <div className="mb-12">
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Overview</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Our laser cryogen solutions are specifically formulated for medical and aesthetic laser applications. These specialized cooling sprays are designed to protect the epidermis during laser treatments, allowing for more effective and safer procedures.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  With years of experience in this niche field, we've developed expertise in producing high-quality, consistent cryogen sprays that meet the exacting standards required for medical applications. Our products are used by leading dermatologists, aesthetic clinics, and medical device manufacturers across the country.
                </p>
              </Card>
            </div>
            
            <div className="mb-12">
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Key Features</h2>
                <ul className="space-y-4">
                  <li className="flex">
                    <svg className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Medical-Grade Formulations</h3>
                      <p className="text-gray-600 dark:text-gray-400">Our cryogen sprays are formulated with medical-grade components and undergo rigorous testing to ensure purity and performance.</p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <svg className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Consistent Spray Patterns</h3>
                      <p className="text-gray-600 dark:text-gray-400">Our products deliver reliable, consistent spray patterns for predictable cooling effects, essential for precise laser treatments.</p>
                    </div>
                  </li>
                  <li className="flex">
                    <svg className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Compatible with Major Laser Systems</h3>
                      <p className="text-gray-600 dark:text-gray-400">Our cryogen sprays are designed to work seamlessly with all major laser systems used in dermatology and aesthetics.</p>
                    </div>
                  </li>
                  
                  <li className="flex">
                    <svg className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Custom Labeling Available</h3>
                      <p className="text-gray-600 dark:text-gray-400">We offer custom labeling options for clinics and medical device manufacturers who want to brand the products they use.</p>
                    </div>
                  </li>
                </ul>
              </Card>
            </div>
            
            <div className="mb-12">
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Applications</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Our laser cryogen sprays are used in a variety of medical and aesthetic procedures:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Dermatology</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>• Laser hair removal</li>
                      <li>• Tattoo removal</li>
                      <li>• Vascular lesion treatment</li>
                      <li>• Pigmented lesion treatment</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aesthetics</h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                      <li>• Skin rejuvenation</li>
                      <li>• Wrinkle reduction</li>
                      <li>• Acne scar treatment</li>
                      <li>• Skin tightening procedures</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="mb-12">
              <Card className="p-8">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Quality Assurance</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Quality is paramount when it comes to medical applications. Our laser cryogen products undergo rigorous testing and quality control measures:
                </p>
                
                <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Batch testing for purity and performance
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Spray pattern verification
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Fill weight consistency checks
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Valve and actuator functionality testing
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Detailed documentation and traceability
                  </li>
                </ul>
              </Card>
            </div>
            
            <div>
              <Card className="p-8 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Ready to Order or Learn More?</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                    Contact our team to discuss your laser cryogen requirements, request samples, or place an order. 
                    We're here to help you find the right solution for your specific needs.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/contact-us" passHref>
                      <Button variant="primary" size="lg">
                        Request a Quote
                      </Button>
                    </Link>
                    <Link href="/faqs" passHref>
                      <Button variant="outline" size="lg">
                        View FAQs
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}