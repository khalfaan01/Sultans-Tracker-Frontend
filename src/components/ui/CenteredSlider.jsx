// CenteredSlider.jsx
// Auto-advancing centered carousel with smooth transitions and navigation controls

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CenteredSlider({ items }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance slides every 8 seconds
  useEffect(() => {
    if (items.length <= 1) return; // Prevent unnecessary intervals for single item
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [items.length]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // Handle empty items array gracefully
  if (!items || items.length === 0) {
    return (
      <div className="relative h-80 overflow-hidden rounded-2xl bg-white bg-opacity-90 p-8 flex items-center justify-center">
        <p className="text-gray-500">No slides to display</p>
      </div>
    );
  }

  return (
    <div className="relative h-80 overflow-hidden rounded-2xl bg-white bg-opacity-90 p-8">
      {/* Previous button - only show if multiple slides exist */}
      {items.length > 1 && (
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      
      {/* Next button - only show if multiple slides exist */}
      {items.length > 1 && (
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          aria-label="Next slide"
        >
          <ChevronRight size={24} />
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 flex items-center justify-center p-8"
        >
          <div className="text-center max-w-2xl">
            <h3 className="text-3xl font-bold mb-4 text-gray-800">
              {items[currentIndex].title}
            </h3>
            <p className="text-lg text-gray-600 leading-relaxed">
              {items[currentIndex].description}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Indicators - only show if multiple slides exist */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-black scale-110' : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}
    </div>
  );
}