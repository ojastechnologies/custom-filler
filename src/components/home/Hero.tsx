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
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isVideoControlsVisible, setIsVideoControlsVisible] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    // Only auto-advance if video is not playing
    if (!isVideoPlaying) {
      const interval = setInterval(() => {
        nextSlide();
      }, 6000);
      
      return () => clearInterval(interval);
    }
    
    return () => {}; // No interval to clear if video is playing
  }, [nextSlide, isVideoPlaying]);

  useEffect(() => {
    // Reset video playing state when changing slides
    if (currentSlide !== 3) {
      setIsVideoPlaying(false);
      setIsVideoControlsVisible(false);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [currentSlide]);

  // Video event handlers
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setVideoDuration(videoElement.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handleWaiting = () => {
      setIsVideoBuffering(true);
    };

    const handlePlaying = () => {
      setIsVideoBuffering(false);
    };

    // Add event listeners
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);

    // Clean up
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('playing', handlePlaying);
    };
  }, []);

  const isVideoSlide = (index: number) => {
    return carouselItems[index].id === 4;
  };

  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (!isVideoPlaying) {
        videoRef.current.play()
          .then(() => {
            setIsVideoPlaying(true);
            showVideoControls();
          })
          .catch(err => {
            console.log('Video play error:', err);
            setIsVideoPlaying(false);
          });
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * videoDuration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    showVideoControls();
  };

  const showVideoControls = () => {
    setIsVideoControlsVisible(true);
    
    // Clear any existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Hide controls after 3 seconds of inactivity
    controlsTimeoutRef.current = setTimeout(() => {
      if (isVideoPlaying) {
        setIsVideoControlsVisible(false);
      }
    }, 3000);
  };

  const handleVideoContainerMouseMove = () => {
    if (isVideoSlide(currentSlide)) {
      showVideoControls();
    }
  };

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
              {/* Image Side - Full width on mobile, half width on desktop */}
              <motion.div 
                className="w-full md:w-1/2 h-[300px] md:h-full relative"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                {carouselItems[currentSlide].image ? (
                  isVideoSlide(currentSlide) ? (
                    // Video content for slide with id 4
                    <div 
                      className="relative w-full h-full bg-black"
                      onMouseMove={handleVideoContainerMouseMove}
                    >
                      <video
                        ref={videoRef}
                        src={carouselItems[currentSlide].image}
                        className="w-full h-full object-contain"
                        muted={isMuted}
                        loop
                        playsInline
                        poster="/img/video-poster.jpg" // Add a poster image if you have one
                      />
                      
                      {/* Play/Pause Button Overlay */}
                      {!isVideoPlaying && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center cursor-pointer"
                          onClick={handlePlayVideo}
                        >
                          <div className="bg-black bg-opacity-40 rounded-full p-4 transform transition-transform hover:scale-110">
                            <svg 
                              className="w-12 h-12 text-white" 
                              fill="currentColor" 
                              viewBox="0 0 20 20" 
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path 
                                fillRule="evenodd" 
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" 
                                clipRule="evenodd" 
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      {/* Buffering Indicator */}
                      {isVideoBuffering && isVideoPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                        </div>
                      )}
                      
                      {/* Video Controls */}
                      <div 
                        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 transition-opacity duration-300 ${
                          isVideoControlsVisible || !isVideoPlaying ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        {/* Timeline */}
                        <div 
                          ref={timelineRef}
                          className="w-full h-2 bg-gray-600 rounded-full mb-2 cursor-pointer relative"
                          onClick={handleTimelineClick}
                        >
                          <div 
                            className="absolute top-0 left-0 h-full bg-primary-500 rounded-full"
                            style={{ width: `${(currentTime / videoDuration) * 100}%` }}
                          ></div>
                        </div>
                        
                        {/* Controls Row */}
                        <div className="flex items-center justify-between">
                          {/* Left Controls */}
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={handlePlayVideo}
                              className="text-white hover:text-primary-300 focus:outline-none"
                            >
                              {isVideoPlaying ? (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                            
                            <button 
                              onClick={toggleMute}
                              className="text-white hover:text-primary-300 focus:outline-none"
                            >
                                                           {isMuted ? (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                            
                            {/* Time Display */}
                            <span className="text-white text-xs">
                              {formatTime(currentTime)} / {formatTime(videoDuration)}
                            </span>
                          </div>
                          
                          {/* Right Controls */}
                          <div>
                            <button 
                              onClick={() => {
                                if (videoRef.current) {
                                  if (videoRef.current.requestFullscreen) {
                                    videoRef.current.requestFullscreen();
                                  }
                                }
                              }}
                              className="text-white hover:text-primary-300 focus:outline-none"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Image content for other slides
                    <div className="relative w-full h-full bg-white/5">
                      <Image 
                        src={carouselItems[currentSlide].image}
                        alt={carouselItems[currentSlide].title}
                        fill
                        className="w-full h-full object-contain p-4"
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
              
              {/* Content Side - Full width on mobile, half width on desktop */}
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
        
        {/* Navigation Arrows - Hidden on small screens, visible on medium and up */}
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
        
        {/* Indicator Dots - Made more touch-friendly on mobile */}
        <div className="absolute bottom-4 md:bottom-6 left-0 right-0 z-10 flex justify-center space-x-2 md:space-x-3">
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
              className={`h-2 md:h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-white w-8 md:w-10' 
                  : 'bg-white/30 w-2 md:w-2.5 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Hero content below carousel - Improved for mobile */}
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
