'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(true);

  // Motion values for tracking cursor position
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Smooth spring physics for trailing effect
  const springConfig = { damping: 30, stiffness: 250, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  const dotXSpring = useSpring(cursorX, { damping: 40, stiffness: 400 });
  const dotYSpring = useSpring(cursorY, { damping: 40, stiffness: 400 });

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
      setHidden(false);
    };

    const handleMouseLeave = () => {
      setHidden(true);
    };

    const handleMouseEnter = () => {
      setHidden(false);
    };

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Track clickable element hovers
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') || 
        target.closest('button') || 
        target.classList.contains('clickable');
      
      setHovered(!!isClickable);
    };

    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  if (hidden) return null;

  return (
    <>
      {/* Outer Spring Trail Ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-50 h-8 w-8 rounded-full border border-madhubani-terracotta/60 dark:border-madhubani-mustard/60"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          scale: hovered ? 1.5 : 1,
          backgroundColor: hovered ? 'var(--accent)' : 'transparent',
          opacity: hovered ? 0.25 : 0.7,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      />
      {/* Inner Immediate Dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-50 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-madhubani-terracotta dark:bg-madhubani-mustard"
        style={{
          x: dotXSpring,
          y: dotYSpring,
          scale: hovered ? 0.5 : 1,
        }}
      />
    </>
  );
}
