import type { Transition, Variants } from "framer-motion";

export const motionTiming = {
  hover: 0.15,
  transition: 0.24,
  page: 0.3,
  panel: 0.28,
} as const;

export const easeOut = [0.22, 1, 0.36, 1] as const;
export const easeSoft = [0.25, 0.9, 0.32, 1] as const;

export const hoverTransition: Transition = {
  duration: motionTiming.hover,
  ease: easeSoft,
};

export const pageTransition: Transition = {
  duration: motionTiming.page,
  ease: easeOut,
};

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 26,
  mass: 0.9,
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTiming.transition,
      ease: easeOut,
    },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motionTiming.transition,
      ease: easeOut,
    },
  },
};

export const pageFadeSlide: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: pageTransition,
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: {
      duration: 0.2,
      ease: easeOut,
    },
  },
};

export const panelSlide: Variants = {
  hidden: { opacity: 0, x: 28, y: 6 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      duration: motionTiming.panel,
      ease: easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: 16,
    transition: {
      duration: 0.18,
      ease: easeOut,
    },
  },
};

export const drawerSlide: Variants = {
  hidden: { opacity: 0, x: 18 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: motionTiming.transition,
      ease: easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: 12,
    transition: {
      duration: 0.16,
      ease: easeSoft,
    },
  },
};

export const hoverLift = {
  whileHover: { scale: 1.018, y: -3 },
  whileTap: { scale: 0.988 },
  transition: springTransition,
};

export const gentleHover = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.992 },
  transition: hoverTransition,
};

export const pressMotion = {
  whileTap: { scale: 0.982 },
  transition: hoverTransition,
};
