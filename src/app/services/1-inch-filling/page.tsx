import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const InchFillingPage = () => {
  const canMouths = [
    { id: 'inside-curl', name: 'Inside Curl', image: '/images/inside_curl.jpg' },
    { id: 'outside-curl-1', name: 'Outside Curl (1 in. Opening)', image: '/images/outside_curl.jpg' },
    { id: 'outside-curl-20', name: 'Outside Curl (20 mm Opening)', image: '/images/outside_curl20.jpg' },
  ];

  const neckProfiles = [
    { id: 'tiered-neck', name: 'Tiered Neck', image: '/images/tiered_neck.jpg' },
    { id: 'soft-shoulder', name: 'Soft Shoulder', image: '/images/soft_shoulder.jpg' },
    { id: 'shelf-neck', name: 'Shelf Neck', image: '/images/shelf_neck.jpg' },
    { id: 'flat-shoulder', name: 'Flat Shoulder', image: '/images/flat_shoulder.jpg' },
    { id: 'flat-shoulder-overcap', name: 'Flat Shoulder for Overcap', image: '/images/flat_shoulder_overcap.jpg' },
    { id: 'conical-shoulder', name: 'Conical Shoulder', image: '/images/conical_shoulder.jpg' },
  ];

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              1 Inch Opening Contract Aerosol Filling
            </h1>
            
            <div className="mb-8 flex flex-col md:flex-row gap-8">
              <div className="md:w-1/2">
                <div className="relative h-80 w-full mb-4">
                  <Image 
                    src="/images/1inch.png" 
                    alt="1 Inch Aerosol Can" 
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              </div>
              
              <div className="md:w-1/2">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The aerosol cans to the left have a standard 1 inch opening that is found on a majority of aerosol products throughout the industry, if not the world, and is the standard for larger fill operations. These cans are available in a variety of shapes and sizes from 35mm aluminum cans all the way up to 76mm diameter; to view can shapes, click on the link below.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The heights of most cans must be at least double (2X) the diameter as a starting point. We can have your cans custom lithographed to suit your needs and we work with an excellent arts and graphics agency.
                </p>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  Aero Tech Labs fills a variety of products like these for companies like yours; what can we put together for you!
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Can Shapes For Your Products
              </h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Mouth Options
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {canMouths.map(mouth => (
                    <div 
                      key={mouth.id} 
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="relative h-56 overflow-hidden">
                        <Image 
                          src={mouth.image} 
                          alt={mouth.name} 
                          fill
                          className="object-contain p-2 transition-transform duration-300 hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        />
                      </div>
                      <div className="p-4 text-center bg-white dark:bg-gray-800">
                        <h4 className="font-medium text-gray-900 dark:text-white text-lg">{mouth.name}</h4>
                        <div className="mt-2 flex justify-center">
                          <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-3 py-1 rounded-full">
                            Mouth Option
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Neck And Shoulder Profiles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {neckProfiles.map(profile => (
                    <div 
                      key={profile.id} 
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="relative h-56 overflow-hidden">
                        <Image 
                          src={profile.image} 
                          alt={profile.name} 
                          fill
                          className="object-contain p-2 transition-transform duration-300 hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        />
                      </div>
                      <div className="p-4 text-center bg-white dark:bg-gray-800">
                        <h4 className="font-medium text-gray-900 dark:text-white text-lg">{profile.name}</h4>
                        <div className="mt-2 flex justify-center">
                          <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-3 py-1 rounded-full">
                            Neck Profile
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Link 
                href="/contact-us" 
                className="inline-block px-6 py-3 bg-primary-600 text-white font-medium rounded-md hover:bg-primary-700 transition-colors"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default InchFillingPage;