'use client';

import React from 'react';
import Link from 'next/link';
import ClientImage from '@/components/ui/ClientImage';

const ServicesSection = () => {
  const services = [
    {
      id: '1-inch-filling',
      title: '1 Inch Opening Contract  Filling',
      description: 'Standard 1 inch opening found on a majority of aerosol products throughout the industry. Available in various shapes and sizes from 35mm to 76mm diameter.',
      image: '/img/1inch.png',
      link: '/services/1-inch-filling'
    },
    {
      id: '20mm-filling',
      title: '20mm Filling',
      description: '20mm opening usually found on small, one piece, aluminum cans. These aerosol products will hold anywhere from a few grams to around three ounces.',
      image: '/img/20mm.png',
      link: '/services/20mm-filling'
    },
    {
      id: 'laser-cryogen',
      title: 'Laser Cryogen',
      description: 'High Purity Grade 1,1,1,3-Tetrafluoropropene, the next generation of safe, non-flammable, non-toxic, non-ozone depleting fluorocarbon gas for medical devices.',
      image: '/images/laser_cryogen.png',
      link: '/services/laser-cryogen'
    }
  ];

  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Our Services</h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
            Specialized aerosol filling solutions for your unique needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {services.map(service => (
            <div 
              key={service.id} 
              className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1 duration-300"
            >
              <div className="relative h-96">
                <ClientImage 
                  src={service.image} 
                  alt={service.title} 
                  fill
                  className="object-cover"
                  // Remove the onError handler
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {service.description}
                </p>
                <Link 
                  href={service.link}
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  <span>Learn More</span>
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link 
            href="/contact-us" 
            className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
          >
            Request a Consultation
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
