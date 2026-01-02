// useSuppressedScroll.js
import { useScroll } from 'framer-motion';
import { useEffect } from 'react';

/**
 * Custom hook that wraps framer-motion's useScroll with console warning suppression
 * Suppresses specific framer-motion warnings about container positioning
 * 
 * @param {Object} options - Options to pass to framer-motion's useScroll hook
 * @returns {Object} The scroll position information from useScroll
 * 
 * @example
 * // Usage remains identical to framer-motion's useScroll
 * const { scrollY } = useSuppressedScroll();
 * const scale = useTransform(scrollY, [0, 300], [1, 1.2]);
 */
export function useSuppressedScroll(options) {
  /**
   * Temporarily suppresses framer-motion's container position warnings
   * Restores original console.warn when component unmounts
   */
  useEffect(() => {
    const originalWarn = console.warn;
    
    console.warn = (...args) => {
      // Suppress only the specific framer-motion positioning warning
      if (args[0]?.includes?.('ensure that the container has a non-static position')) {
        return;
      }
      originalWarn.apply(console, args);
    };
    
    // Cleanup: Restore original console.warn
    return () => {
      console.warn = originalWarn;
    };
  }, []);
  
  // Return the original useScroll functionality unchanged
  return useScroll(options);
}