"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Updated carousel items with local video paths
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
    title: "Aerosol Filling Process",
    description: "Watch our specialized aerosol filling process in action. Our state-of-the-art equipment ensures precision and quality in every product.",
    videoUrl: "/videos/carousel5.mp4",
    image: "/img/video-poster.jpg",
    buttonText: "Learn About Our Process",
    buttonLink: "/services"
  },
  {
    id: 5,
    title: "Custom Aerosol Solutions",
    description: "See how we can customize aerosol solutions for your specific needs. Our flexible manufacturing capabilities can accommodate various product requirements.",
    videoUrl: "/videos/carousel4.mp4",
    image: "/img/video-poster.jpg",
    buttonText: "Request Custom Solution",
    buttonLink: "/contact-us"
  }
];

// Define slide durations
const IMAGE_SLIDE_DURATION = 6000; 
const VIDEO_SLIDE_DURATION = 20000; 

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isVideoPlaying) return;

    // Check if current slide has video
    const hasVideo = carouselItems[currentSlide].videoUrl !== undefined;
    
    // Set timer with appropriate duration
    timerRef.current = setTimeout(() => {
      setCurrentSlide((prev) => (prev === carouselItems.length - 1 ? 0 : prev + 1));
    }, hasVideo ? VIDEO_SLIDE_DURATION : IMAGE_SLIDE_DURATION);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentSlide, isVideoPlaying]);

  // Handle video events when slide changes
  useEffect(() => {
    const hasVideo = carouselItems[currentSlide].videoUrl !== undefined;
    
    if (hasVideo && videoRef.current) {
      // Set up video event listeners
      const handlePlay = () => setIsVideoPlaying(true);
      const handlePause = () => setIsVideoPlaying(false);
      const handleEnded = () => {
        setIsVideoPlaying(false);
        // Advance to next slide when video ends
        setCurrentSlide((prev) => (prev === carouselItems.length - 1 ? 0 : prev + 1));
      };
      
      const videoElement = videoRef.current;
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('ended', handleEnded);
      
      // Clean up event listeners
      return () => {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentSlide]);

  // Simple next/prev functions - only work when video is not playing
  const nextSlide = () => {
    if (!isVideoPlaying) {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setCurrentSlide((prev) => (prev === carouselItems.length - 1 ? 0 : prev + 1));
    }
  };
  
  const prevSlide = () => {
    if (!isVideoPlaying) {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setCurrentSlide((prev) => (prev === 0 ? carouselItems.length - 1 : prev - 1));
    }
  };

  // Basic touch handlers - only work when video is not playing
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isVideoPlaying) {
      setTouchStart(e.targetTouches[0].clientX);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isVideoPlaying) {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };
  
  const handleTouchEnd = () => {
    if (!isVideoPlaying) {
      if (touchStart - touchEnd > 100) {
        nextSlide();
      }
      if (touchStart - touchEnd < -100) {
        prevSlide();
      }
    }
  };

  // Check if current slide has video
  const hasVideo = carouselItems[currentSlide].videoUrl !== undefined;

  return (
    <section className="relative">
      {/* Hero Carousel Section */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 dark:from-primary-900 dark:via-primary-800 dark:to-black"
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
            className="w-full"
          >
            <div className="flex flex-col md:flex-row md:h-[600px]">
              {/* Image/Video Side */}
              <motion.div
                className="w-full md:w-1/2 h-[300px] md:h-full relative"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                {hasVideo ? (
                  // Simple video element with ref for controlling playback
                  <div className="relative w-full h-full bg-black">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-contain"
                      autoPlay
                      muted
                      playsInline
                      poster={carouselItems[currentSlide].image}
                    >
                      <source src={carouselItems[currentSlide].videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  // Image content
                  <div className="relative w-full h-full bg-white/5">
                    <Image
                      src={carouselItems[currentSlide].image}
                      alt={carouselItems[currentSlide].title}
                      fill
                      className="w-full h-full object-contain p-4"
                      priority={currentSlide === 0}
                    />
                  </div>
                )}
              </motion.div>
              
              {/* Content Side */}
              <motion.div
                className="w-full md:w-1/2 flex items-center bg-primary-800/50"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <div className="p-6 md:p-12 w-full">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
                    {carouselItems[currentSlide].title}
                  </h1>
                  
                  <div className="w-16 h-1 bg-primary-400 mb-4 md:mb-6"></div>
                  
                  <p className="text-base md:text-lg text-white/80 mb-6 md:mb-8 leading-relaxed line-clamp-4 md:line-clamp-none">
                    {carouselItems[currentSlide].description}
                  </p>
                  
                  <Link
                    href={carouselItems[currentSlide].buttonLink}
                    className="inline-flex items-center px-5 py-2.5 md:px-6 md:py-3 bg-white hover:bg-primary-50 text-primary-700 font-medium rounded-lg transition-colors"
                  >
                    {carouselItems[currentSlide].buttonText}
                    <svg className="w-4 h-4 md:w-5 md:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation Arrows - Only show when video is not playing */}
        {!isVideoPlaying && (
          <>
            <button
              className="hidden sm:block absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 md:p-3 transition-all duration-300"
              onClick={prevSlide}
              aria-label="Previous slide"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              className="hidden sm:block absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 md:p-3 transition-all duration-300"
              onClick={nextSlide}
              aria-label="Next slide"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
        
        {/* Indicator Dots - Only show when video is not playing */}
        {!isVideoPlaying && (
          <div className="absolute bottom-4 md:bottom-6 left-0 right-0 z-10 flex justify-center space-x-2 md:space-x-3">
            {carouselItems.map((_, index) => (
              <button
                key={index}
                onClick={() => !isVideoPlaying && setCurrentSlide(index)}
                className={`h-2 md:h-2.5 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-white w-8 md:w-10'
                    : 'bg-white/30 w-2 md:w-2.5 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hero content below carousel */}
      <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 dark:text-white mb-3 md:mb-4">
              Contract Aerosol Filling and Laser Cryogen Specialists
            </h2>
            <p className="text-lg sm:text-xl font-semibold text-primary-700 dark:text-primary-300 mb-6 md:mb-8">
              COMMITTED TO THE FINEST CARE FOR YOUR LONG TERM FILLING NEEDS!
            </p>
            
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 mt-8 md:mt-12">
              <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-lg shadow-md">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">Custom Component Sourcing</h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  Aero Tech Labs will source your can, valve, box, actuator and other components to build your specific product.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-lg shadow-md">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">Quality Assurance</h3>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300">
                  We maintain strict quality control standards to ensure your products meet all specifications and regulatory requirements.
                </p>
              </div>
            </div>
            
            <div className="mt-8 md:mt-12">
              <Link 
                href="/contact-us" 
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-6 md:py-3 md:px-8 rounded-md transition-colors shadow-md"
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
