// MagneticCursor.jsx
// Custom magnetic cursor that follows mouse with interactive element attraction effects

import { useEffect, useRef, useCallback } from 'react';
import './MagneticCursor.css';

export default function MagneticCursor() {
  const cursorRef = useRef(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef(null);
  const lastTimeRef = useRef(0);
  const isInitializedRef = useRef(false); 

  // Throttled animation update using requestAnimationFrame
  const updateCursorPosition = useCallback(() => {
    if (!cursorRef.current) return;

    const cursor = cursorRef.current;
    const { x, y } = positionRef.current;
    
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  }, []);

  // Smooth position update with throttling
  const handleMouseMove = useCallback((e) => {
    const now = Date.now();
    
    // Throttle to 60fps (16ms) for performance
    if (now - lastTimeRef.current < 16) return;
    lastTimeRef.current = now;

    positionRef.current = { x: e.clientX, y: e.clientY };
    
    // Cancel previous frame if exists
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    // Schedule update on next animation frame
    rafIdRef.current = requestAnimationFrame(updateCursorPosition);
  }, [updateCursorPosition]);

  const handleMouseLeave = useCallback(() => {
    if (cursorRef.current) {
      cursorRef.current.classList.add('hidden');
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (cursorRef.current) {
      cursorRef.current.classList.remove('hidden');
    }
  }, []);

  const handleMouseDown = useCallback(() => {
    if (cursorRef.current) {
      cursorRef.current.classList.add('click');
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (cursorRef.current) {
      cursorRef.current.classList.remove('click');
    }
  }, []);

  // Magnetic effect for interactive elements
  const handleElementHover = useCallback((e) => {
    if (!cursorRef.current) return;

    const cursor = cursorRef.current;
    const rect = e.target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate magnetic pull (stronger for larger elements)
    const pullStrength = Math.min(rect.width, rect.height) * 0.1;
    const dx = centerX - e.clientX;
    const dy = centerY - e.clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 100) { // Magnetic radius
      const force = (1 - distance / 100) * pullStrength;
      positionRef.current = {
        x: e.clientX + dx * force,
        y: e.clientY + dy * force
      };
      cursor.classList.add('magnetic');
    } else {
      cursor.classList.remove('magnetic');
    }
  }, []);

  const handleElementLeave = useCallback(() => {
    if (cursorRef.current) {
      cursorRef.current.classList.remove('magnetic');
    }
  }, []);

  useEffect(() => {
    
    // Prevent double initialization
    if (isInitializedRef.current) {
      return;
    }

    isInitializedRef.current = true;

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    // Add magnetic effect to interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, a, [role="button"], input, select, textarea, .magnetic-element'
    );

    interactiveElements.forEach(element => {
      // Skip elements that explicitly opt-out
      if (element.hasAttribute('data-no-magnetic')) return;
      
      element.addEventListener('mouseenter', handleElementHover);
      element.addEventListener('mouseleave', handleElementLeave);
      element.style.cursor = 'none'; // Hide default cursor
    });

    // Hide default cursor globally
    document.body.style.cursor = 'none';

    return () => {
      
      // Cleanup event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);

      // Cleanup magnetic effects
      interactiveElements.forEach(element => {
        element.removeEventListener('mouseenter', handleElementHover);
        element.removeEventListener('mouseleave', handleElementLeave);
        element.style.cursor = '';
      });

      // Restore default cursor
      document.body.style.cursor = '';

      // Cancel any pending animation frames
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      isInitializedRef.current = false;
    };
  }, [handleMouseMove, handleMouseLeave, handleMouseEnter, 
      handleMouseDown, handleMouseUp, handleElementHover, handleElementLeave]);

  return (
    <div 
      ref={cursorRef}
      className="magnetic-cursor"
      style={{ 
        left: 0, 
        top: 0,
        transform: 'translate3d(0, 0, 0) translate(-50%, -50%)',
        pointerEvents: 'none'
      }}
      aria-hidden="true"
    />
  );
}