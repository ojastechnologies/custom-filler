import Layout from '@/components/layout/Layout';
import Card from '@/components/ui/Card';
import Link from 'next/link';

const services = [
  {
    id: 'service-1',
    title: '1-Inch Filling',
    description: 'Our 1-inch filling service is designed for precision and quality. We specialize in filling small aerosol containers with exact specifications, ensuring consistent product delivery and performance.',
    features: [
      'High-precision filling equipment',
      'Quality control at every step',
      'Customizable formulations',
      'Small to medium batch capabilities',
    ],
    image: '/images/service-placeholder.jpg',
    link: '/services/1-inch-filling',
  },
  {
    id: 'service-2',
    title: '20mm Filling',
    description: 'Our 20mm filling service is ideal for standard aerosol products. We offer efficient, high-volume filling with consistent quality and reliable performance for a wide range of applications.',
    features: [
      'High-speed production line',
      'Consistent fill weights',
      'Multiple propellant options',
      'Large batch capabilities',
    ],
    image: '/images/service-placeholder.jpg',
    link: '/services/20mm-filling',
  },
  {
    id: 'service-3',
    title: 'Laser Cryogen',
    description: 'Our specialized laser cryogen solutions are formulated specifically for medical and aesthetic laser applications. We provide precise, clean, and reliable cryogen sprays that meet the highest standards.',
    features: [
      'Medical-grade formulations',
      'Consistent spray patterns',
      'Compatible with major laser systems',
      'Custom labeling available',
    ],
    image: '/images/service-placeholder.jpg',
    link: '/services/laser-cryogen',
  },
  {
    id: 'service-4',
    title: 'Custom Formulations',
    description: 'Our custom formulation service allows you to create unique aerosol products tailored to your specific requirements. We work closely with you to develop, test, and produce your ideal product.',
    features: [
      'Expert formulation development',
      'Prototype testing',
      'Small batch trials',
      'Scale-up to production',
    ],
    image: '/images/service-placeholder.jpg',
    link: '/services/custom-formulations',
  },
];

export default function ServicesPage() {
  return (
    <Layout>
      <div className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Products</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              We offer specialized aerosol filling solutions to meet your unique product requirements
            </p>
          </div>
          
          <div className="space-y-12">
            {services.map((service, index) => (
              <Card key={service.id} className="overflow-hidden">
                <div className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className="md:w-1/2 bg-gray-200 dark:bg-gray-700 min-h-[300px]">
                    {/* Replace with actual image */}
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <span className="text-lg">{service.title} Image</span>
                    </div>
                  </div>
                  
                  <div className="md:w-1/2 p-8">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{service.title}</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{service.description}</p>
                    
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Key Features:</h3>
                    <ul className="space-y-2 mb-6">
                      {service.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <svg className="h-5 w-5 text-primary-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link href={service.link} className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
                      Learn more
                      <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="mt-16">
            <Card className="p-8 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Need a Custom Solution?</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                  Our team of experts is ready to help you develop the perfect aerosol product for your specific needs. 
                  Contact us today to discuss your requirements and get a personalized quote.
                </p>
                <Link href="/contact-us" className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-md transition-colors">
                  Request a Consultation
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
