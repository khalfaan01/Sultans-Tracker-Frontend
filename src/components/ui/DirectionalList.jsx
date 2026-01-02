// DirectionalList.jsx
// Interactive list items with directional hover effects and magnetic cursor behavior

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function DirectionalList({ items }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Handle empty items array gracefully
  if (!items || items.length === 0) {
    return (
      <div className="p-4 bg-white bg-opacity-90 rounded-lg border border-gray-200 text-center">
        <p className="text-gray-500">No items to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" role="list">
      {items.map((item, index) => {
        // Generate a stable key using label and index
        const itemKey = item.label ? `${item.label}-${index}` : index;
        
        return (
          <motion.div
            key={itemKey}
            className="p-4 bg-white bg-opacity-90 rounded-lg cursor-pointer border border-gray-200 hover:shadow-md transition-shadow"
            whileHover={{ 
              x: 20,
              transition: { type: "spring", stiffness: 300, damping: 25 }
            }}
            onHoverStart={() => setHoveredIndex(index)}
            onHoverEnd={() => setHoveredIndex(null)}
            data-magnetic="true"
            role="listitem"
            aria-label={item.description ? `${item.label}. ${item.description}` : item.label}
            tabIndex={0}
            onKeyDown={(e) => {
              // Add keyboard navigation support
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Trigger click behavior if needed
              }
            }}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-800">{item.label}</span>
              <motion.div
                animate={{ 
                  opacity: hoveredIndex === index ? 1 : 0.7,
                  x: hoveredIndex === index ? 0 : -10,
                  scale: hoveredIndex === index ? 1.2 : 1
                }}
                transition={{ duration: 0.2 }}
                className="text-lg font-bold text-blue-600"
                aria-hidden="true"
              >
                →
              </motion.div>
            </div>
            {item.description && (
              <motion.p 
                className="text-sm text-gray-600 mt-1"
                initial={{ opacity: 0.8 }}
                animate={{ opacity: hoveredIndex === index ? 1 : 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {item.description}
              </motion.p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}