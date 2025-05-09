import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const TwentyMMFillingPage = () => {
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
              20 mm Opening Contract Aerosol Filling
            </h1>
            
            <div className="mb-8 flex flex-col md:flex-row gap-8">
              <div className="md:w-1/2">
                <div className="relative h-80 w-full mb-4">
                  <Image 
                    src="/images/20mm.png" 
                    alt="20mm Aerosol Can" 
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              </div>
              
              <div className="md:w-1/2">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The cans to the left depict a 20 millimeter opening usually found on small, one piece, aluminum cans. These aerosol products will hold anywhere from a few grams to around three (3) ounces (under 100 grams) as the can size will have to be smaller to accommodate the smaller opening.
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Usually, you will find that these cans will have a diameter ranging from 22mm up to 45mm and the heights can be as tall as 200mm. A majority of our business is the filling of the 20 mm opening and if you are looking to fill products like these, look no further. The filling of these smaller openings require experience and expertise; these smaller 20 mm sizes can be problematic.
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We have had years of filling the 20 mm can and we can pass on our experience to you and facilitate the launch of your product. We have partnered with can companies that are capable of making aerosol cans that can take the pressure and won't leak.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We have a "knowledge base" of suppliers for components, that we have worked with in the past, who are reliable, and can supply your needs your 20 mm product will require. Aero Tech Labs takes pride in filling "small" in a big way.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Can Shapes For Your Products
              </h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Mouth Options
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {canMouths.map(mouth => (
                    <div key={mouth.id} className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div className="relative h-48">
                        <Image 
                          src={mouth.image} 
                          alt={mouth.name} 
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-3 text-center">
                        <h4 className="font-medium text-gray-900 dark:text-white">{mouth.name}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Neck And Shoulder Profiles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {neckProfiles.map(profile => (
                    <div key={profile.id} className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <div className="relative h-48">
                        <Image 
                          src={profile.image} 
                          alt={profile.name} 
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-3 text-center">
                        <h4 className="font-medium text-gray-900 dark:text-white">{profile.name}</h4>
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

export default TwentyMMFillingPage;