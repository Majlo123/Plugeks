"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Suptilni "reveal-on-scroll" wrapper. Animira sadržaj pri ulasku u vidno polje.
 * Poštuje prefers-reduced-motion (Framer ga uvažava globalno).
 */

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
};

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: { delay: number; y: number }) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: custom.delay,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export function Reveal({ children, delay = 0, y = 24, className }: Props) {
  return (
    <motion.div
      className={className}
      variants={variants}
      custom={{ delay, y }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}
