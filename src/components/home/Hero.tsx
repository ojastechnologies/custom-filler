"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const carouselItems = [
  {
    id: 1,
    title: "Contract Aerosol Filling and Laser Cryogen",
    description: "Contract Aerosol Filling of Your Products with Non-Flammable Propellents HFC134a and HFO12342e",
    image: "/images/carousel/aerosol-filling.jpg",
    buttonText: "Explore Services",
    buttonLink: "/services"
  },
  {
    id: 2,
    title: "1 Inch Opening Contract Aerosol Filling",
    description: "Found on a majority of aerosol products throughout the industry and is the standard for larger fill operations. These cans are available in a variety of shapes and sizes from 35mm all the way up to 76mm diameter.",
    image: "/images/carousel/1-inch-filling.jpg",
    buttonText: "Learn More",
    buttonLink: "/services/1-inch-filling"
  },
  {
    id: 3,
    title: "20 mm Opening Contract Aerosol Filling",
    description: "Usually found on small, one piece, aluminum cans. These aerosol products will hold anywhere from a few grams to several ounces of your product. Sizes range from 22mm in diameter up to 50mm with the 20mm top.",
    image: "/images/carousel/20mm-filling.jpg",
    buttonText: "View Details",
    buttonLink: "/services/20mm-filling"
  },
  {
    id: 4,
    title: "This Could Be Your Project",
    description: "Let us help you bring your aerosol product to market with our specialized filling services.",
    image: "/images/carousel/custom-project.jpg",
    buttonText: "Get Started",
    buttonLink: "/contact-us"
  }
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const nextSlide = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev === carouselItems.length - 1 ? 0 : prev + 1));
      setTimeout(() => setIsTransitioning(false), 500);
    }
  }, [isTransitioning]);

  const prevSlide = useCallback(() => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide((prev) => (prev === 0 ? carouselItems.length - 1 : prev - 1));
      setTimeout(() => setIsTransitioning(false), 500);
    }
  }, [isTransitioning]);

  // Handle touch events for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 100) {
      // Swipe left
      nextSlide();
    }

    if (touchStart - touchEnd < -100) {
      // Swipe right
      prevSlide();
    }
  };

  // Auto-advance the carousel
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 6000); // Change slide every 6 seconds

    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <section className="relative">
      {/* Carousel */}
      <div 
        className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="h-full w-full flex transition-transform duration-500 ease-in-out" 
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {carouselItems.map((item, index) => (
            <div key={item.id} className="h-full w-full flex-shrink-0 relative">
              {/* Background Image or Placeholder */}
              <div className="absolute inset-0">
                {item.image ? (
                  <div className="relative h-full w-full">
                    <Image 
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-400">
                    <span className="text-white text-2xl font-bold">
                      {item.id === 4 ? "Your Project Here" : `Aerosol ${item.id === 1 ? "Filling" : item.id === 2 ? "1 Inch" : "20mm"}`}
                    </span>
                  </div>
                )}
                
                {/* Gradient Overlay - Using primary colors instead of black */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-800/80 to-primary-600/50" />
              </div>
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-4">
                  <div className="max-w-3xl">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                      {item.title}
                    </h1>
                    
                    <p className="text-lg md:text-xl text-white mb-8 max-w-2xl">
                      {item.description}
                    </p>
                    
                    <Link 
                      href={item.buttonLink}
                      className="inline-block bg-white hover:bg-gray-100 text-primary-600 font-medium py-3 px-6 rounded-md transition-colors shadow-lg"
                    >
                      {item.buttonText}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Navigation Arrows */}
        <button 
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-primary-600 rounded-full p-3 shadow-lg transition-colors duration-300"
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-primary-600 rounded-full p-3 shadow-lg transition-colors duration-300"
          onClick={nextSlide}
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Indicator Dots */}
        <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center space-x-3">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isTransitioning) {
                  setIsTransitioning(true);
                  setCurrentSlide(index);
                  setTimeout(() => setIsTransitioning(false), 500);
                }
              }}
              className={`h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white w-10' 
                  : 'bg-white/40 w-3 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Hero content below carousel */}
      <div className="bg-white dark:bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Contract Aerosol Filling and Laser Cryogen Specialists
            </h2>
            <p className="text-xl font-semibold text-primary-600 dark:text-primary-400 mb-8">
              COMMITTED TO THE FINEST CARE FOR YOUR LONG TERM FILLING NEEDS!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Custom Component Sourcing</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Aero Tech Labs will source your can, valve, box, actuator and other components to build your specific product.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Non-Flammable Propellants</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Our specialty is aerosol filling with non-flammable propellant systems, ensuring safety and performance.
                </p>
              </div>
            </div>
            
            <div className="mt-12">
              <Link 
                href="/services" 
                className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
              >
                <span>View All Our Services</span>
                <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
