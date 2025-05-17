"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

const carouselItems = [
  {
    id: 1,
    title: "Contract Aerosol Filling and Laser Cryogen",
    description: "Contract Aerosol Filling of Your Products with Non-Flammable Propellents HFC134a and HFO12342e",
    image: "/img/1.png",
    buttonText: "Explore Services",
    buttonLink: "/services"
  },
  {
    id: 2,
    title: "1 Inch Opening Contract Aerosol Filling",
    description: "Found on a majority of aerosol products throughout the industry and is the standard for larger fill operations. These cans are available in a variety of shapes and sizes from 35mm all the way up to 76mm diameter.",
    image: "https://customfiller.com/wp-content/uploads/2022/04/carousel2.png",
    buttonText: "Learn More",
    buttonLink: "/services/1-inch-filling"
  },
  {
    id: 3,
    title: "20 mm Opening Contract Aerosol Filling",
    description: "Usually found on small, one piece, aluminum cans. These aerosol products will hold anywhere from a few grams to several ounces of your product. Sizes range from 22mm in diameter up to 50mm with the 20mm top.",
    image: "/img/20mm.png",
    buttonText: "View Details",
    buttonLink: "/services/20mm-filling"
  },
  {
    id: 4,
    title: "This Could Be Your Project",
    description: "Let us help you bring your aerosol product to market with our specialized filling services.",
    image: "https://customfiller.com/wp-content/uploads/2022/04/carousel-5.mp4",
    buttonText: "Get Started",
    buttonLink: "/contact-us"
  }
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 6000); 

    return () => clearInterval(interval);
  }, [nextSlide]);

  useEffect(() => {
    if (currentSlide === 3 && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => console.log('Video play error:', err));
    }
  }, [currentSlide]);

  const isVideoSlide = (index: number) => {
    return carouselItems[index].id === 4;
  };

  return (
    <section className="relative">
      {/* Hero Carousel Section */}
      <div 
        className="relative h-[600px] overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 dark:from-primary-900 dark:via-primary-800 dark:to-black"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5 bg-[url('/images/pattern.png')]"></div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="h-full w-full"
          >
            <div className="h-full flex flex-col md:flex-row">
              {/* Image Side - Full height, starting from left edge */}
              <motion.div 
                className="w-full md:w-1/2 h-1/2 md:h-full relative"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                {carouselItems[currentSlide].image ? (
                  isVideoSlide(currentSlide) ? (
                    // Video content for slide with id 4
                    <video
                      ref={videoRef}
                      src={carouselItems[currentSlide].image}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    // Image content for other slides
                    <div className="relative w-full h-full">
                      <Image 
                        src={carouselItems[currentSlide].image}
                        alt={carouselItems[currentSlide].title}
                        fill
                        className="w-full h-full object-contain bg-white/5"
                        priority={currentSlide === 0}
                      />
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary-600 to-primary-500 text-white">
                    <div className="text-center p-4">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="text-xl font-semibold">
                        {carouselItems[currentSlide].id === 4 ? "Your Project Here" : `Aerosol ${carouselItems[currentSlide].id === 1 ? "Filling" : carouselItems[currentSlide].id === 2 ? "1 Inch" : "20mm"}`}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
              
              {/* Content Side */}
              <motion.div 
                className="w-full md:w-1/2 h-1/2 md:h-full flex items-center bg-primary-800/50"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <div className="p-8 md:p-12">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                    {carouselItems[currentSlide].title}
                  </h1>
                  
                  <div className="w-16 h-1 bg-primary-400 mb-6"></div>
                  
                  <p className="text-lg text-white/80 mb-8 leading-relaxed">
                    {carouselItems[currentSlide].description}
                  </p>
                  
                  <Link 
                    href={carouselItems[currentSlide].buttonLink}
                    className="inline-flex items-center px-6 py-3 bg-white hover:bg-primary-50 text-primary-700 font-medium rounded-lg transition-colors"
                  >
                    {carouselItems[currentSlide].buttonText}
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation Arrows */}
        <button 
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all duration-300"
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all duration-300"
          onClick={nextSlide}
          aria-label="Next slide"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white w-10' 
                  : 'bg-white/30 w-2.5 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Hero content below carousel */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-primary-900 dark:text-white mb-4">
              Contract Aerosol Filling and Laser Cryogen Specialists
            </h2>
            <p className="text-xl font-semibold text-primary-700 dark:text-primary-300 mb-8">
              COMMITTED TO THE FINEST CARE FOR YOUR LONG TERM FILLING NEEDS!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
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
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Quality Assurance</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  We maintain strict quality control standards to ensure your products meet all specifications and regulatory requirements.
                </p>
              </div>
            </div>
            
            <div className="mt-12">
              <Link 
                href="/contact-us" 
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-8 rounded-md transition-colors shadow-md"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
