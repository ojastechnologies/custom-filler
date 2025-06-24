'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AnimatedNotFoundProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
}

export default function AnimatedNotFound({ 
  title = "Page Not Found",
  message = "The page you're looking for doesn't exist.",
  showHomeButton = true 
}: AnimatedNotFoundProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className={`text-center transition-all duration-1000 transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        
        {/* Animated 404 Number */}
        <div className="relative mb-8">
          <div className={`text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-1500 ${
            isVisible ? 'scale-100' : 'scale-75'
          }`}>
            404
          </div>
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 bg-primary-400 rounded-full animate-float transition-opacity duration-1000 ${
                  isVisible ? 'opacity-60' : 'opacity-0'
                }`}
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 40}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${3 + i * 0.5}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className={`space-y-6 transition-all duration-1000 delay-300 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            {message}
          </p>

          {/* Animated Icon */}
          <div className="flex justify-center my-8">
            <div className={`relative transition-all duration-1000 delay-500 ${
              isVisible ? 'rotate-0 scale-100' : 'rotate-12 scale-75'
            }`}>
              <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-full flex items-center justify-center">
                <svg 
                  className="w-12 h-12 text-primary-600 dark:text-primary-400 animate-bounce" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  style={{ animationDelay: '1s' }}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" 
                  />
                </svg>
              </div>
              
              {/* Ripple effect */}
              <div className="absolute inset-0 rounded-full border-2 border-primary-300 dark:border-primary-700 animate-ping opacity-20"></div>
            </div>
          </div>

          {/* Action Buttons */}
          {showHomeButton && (
            <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}>
              <button
                onClick={() => router.push('/')}
                className="group relative px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Go Home
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
              
              <button
                onClick={() => router.back()}
                className="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transform hover:scale-105 transition-all duration-200"
              >
                Go Back
              </button>
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-1/4 left-1/4 w-32 h-32 bg-primary-200 dark:bg-primary-800 rounded-full opacity-10 animate-pulse transition-all duration-2000 ${
            isVisible ? 'scale-100' : 'scale-0'
          }`}></div>
          <div className={`absolute bottom-1/4 right-1/4 w-24 h-24 bg-primary-300 dark:bg-primary-700 rounded-full opacity-10 animate-pulse transition-all duration-2000 delay-500 ${
            isVisible ? 'scale-100' : 'scale-0'
          }`}></div>
        </div>
      </div>
    </div>
  );
}