"use client";

import { motion } from "framer-motion";

interface DiceDisplayProps {
  values: number[];
  isRolling: boolean;
}

export function DiceDisplay({ values, isRolling }: DiceDisplayProps) {
  const getDots = (value: number) => {
    const dots = [];
    for (let i = 0; i < value; i++) {
      dots.push(
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-foreground"
        />
      );
    }
    return dots;
  };

  return (
    <div className="flex justify-center space-x-8">
      {values.map((value, index) => (
        <motion.div
          key={index}
          animate={{
            rotate: isRolling ? [0, 360, 720, 1080] : 0,
          }}
          transition={{
            duration: 1,
            ease: "easeInOut",
          }}
          className="relative h-24 w-24 rounded-xl bg-white shadow-lg"
        >
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 place-items-center p-2">
            {getDots(value)}
          </div>
        </motion.div>
      ))}
    </div>
  );
}