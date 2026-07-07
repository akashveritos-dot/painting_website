'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [pressed, setPressed] = useState(false);
  const [textMode, setTextMode] = useState(false);

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
    document.documentElement.classList.add('custom-cursor-ready');

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 18);
      cursorY.set(e.clientY - 18);
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
      const isTextControl =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.isContentEditable;
      
      setHovered(!!isClickable);
      setTextMode(!!isTextControl);
    };

    const handleMouseDown = () => setPressed(true);
    const handleMouseUp = () => setPressed(false);

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.documentElement.classList.remove('custom-cursor-ready');
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [cursorX, cursorY]);

  if (hidden || textMode) return null;

  return (
    <>
      <motion.div
        className="heritage-cursor pointer-events-none fixed left-0 top-0 z-50 h-9 w-9"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          scale: pressed ? 0.86 : hovered ? 1.28 : 1,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        aria-hidden="true"
      >
        <span className="heritage-cursor__ring" />
        <span className="heritage-cursor__petal heritage-cursor__petal--top" />
        <span className="heritage-cursor__petal heritage-cursor__petal--right" />
        <span className="heritage-cursor__petal heritage-cursor__petal--bottom" />
        <span className="heritage-cursor__petal heritage-cursor__petal--left" />
      </motion.div>
      <motion.div
        className="heritage-cursor-dot pointer-events-none fixed left-0 top-0 z-50 h-3 w-3"
        style={{
          x: dotXSpring,
          y: dotYSpring,
          scale: pressed ? 0.65 : hovered ? 1.25 : 1,
        }}
        aria-hidden="true"
      />
    </>
  );
}
