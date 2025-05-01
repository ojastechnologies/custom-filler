"use client";

import React, { useState, useEffect, useCallback } from 'react';

const carouselItems = [
  {
    id: 1,
    title: "Contract Aerosol Filling and Laser Cryogen",
    description: "Contract Aerosol Filling of Your Products with Non-Flammable Propellents HFC134a and HFO12342e",
    bgColor: "from-gray-900 to-black"  // Changed to black gradient
  },
  {
    id: 2,
    title: "1 Inch Opening Contract Aerosol Filling",
    description: "Found on a majority of aerosol products throughout the industry and is the standard for larger fill operations. These cans are available in a variety of shapes and sizes from 35mm all the way up to 76mm diameter.",
    bgColor: "from-gray-900 to-black"  // Changed to black gradient
  },
  {
    id: 3,
    title: "20 mm Opening Contract Aerosol Filling",
    description: "Usually found on small, one piece, aluminum cans. These aerosol products will hold anywhere from a few grams to several ounces of your product. Sizes range from 22mm in diameter up to 50mm with the 20mm top.",
    bgColor: "from-gray-900 to-black"  // Changed to black gradient
  },
  {
    id: 4,
    title: "This Could Be Your Project",
    description: "Let us help you bring your aerosol product to market with our specialized filling services.",
    bgColor: "from-gray-900 to-black"  // Changed to black gradient
  }
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev === carouselItems.length - 1 ? 0 : prev + 1));
      setTimeout(() => setIsTransitioning(false), 500); // Match this with the CSS transition duration
    }
  }, [isTransitioning]);

  // Auto-advance the carousel
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <section className="relative">
      {/* Carousel */}
      <div className="relative h-[500px] md:h-[600px] overflow-hidden bg-black dark:bg-gray-900">
        <div className="h-full w-full flex transition-transform duration-500 ease-in-out" 
             style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {carouselItems.map((item) => (
            <div key={item.id} className="h-full w-full flex-shrink-0">
              {/* Overlay with gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${item.bgColor} opacity-90 z-10`} />
              
              <div className="relative h-full w-full flex items-center">
                <div className="container mx-auto px-4 flex flex-col md:flex-row items-center z-20">
                  {/* Image placeholder side */}
                  <div className="w-full md:w-1/2 h-64 md:h-96 mb-6 md:mb-0 flex items-center justify-center">
                    <div className="w-full h-full bg-white/10 rounded-lg flex items-center justify-center p-8">
                      <div className="text-white text-2xl font-bold text-center">
                        {item.id === 4 ? "Your Project Here" : `Aerosol ${item.id === 1 ? "Filling" : item.id === 2 ? "1 Inch" : "20mm"}`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Text side */}
                  <div className="w-full md:w-1/2 text-white md:pl-8">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">{item.title}</h1>
                    {item.description && (
                      <p className="text-lg md:text-xl">{item.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Indicator dots */}
        <div className="absolute bottom-4 left-0 right-0 z-30 flex justify-center space-x-2">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-white w-4' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => {
                if (!isTransitioning) {
                  setIsTransitioning(true);
                  setCurrentSlide(index);
                  setTimeout(() => setIsTransitioning(false), 500);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Hero content below carousel */}
      <div className="bg-white dark:bg-gray-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Contract Aerosol Filling and Laser Cryogen Specialists
          </h2>
          <p className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-6">
            COMMITTED TO THE FINEST CARE FOR YOUR LONG TERM FILLING NEEDS!
          </p>
          <p className="text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            Aero Tech Labs will source your can, valve, box, actuator and other components to build your specific product.
          </p>
          <p className="text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            How can we fill your needs? Our specialty is aerosol filling with non-flammable propellant systems.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
