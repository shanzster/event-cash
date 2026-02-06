'use client';

import { motion } from 'framer-motion';
import { 
  Utensils, 
  Wine, 
  Cake, 
  Coffee, 
  Pizza,
  IceCream,
  Soup,
  Cookie,
  Apple,
  Salad
} from 'lucide-react';

const icons = [
  { Icon: Utensils, delay: 0, duration: 20, x: '10%', y: '15%' },
  { Icon: Wine, delay: 2, duration: 25, x: '80%', y: '10%' },
  { Icon: Cake, delay: 4, duration: 22, x: '15%', y: '70%' },
  { Icon: Coffee, delay: 1, duration: 23, x: '85%', y: '65%' },
  { Icon: Pizza, delay: 3, duration: 21, x: '25%', y: '40%' },
  { Icon: IceCream, delay: 5, duration: 24, x: '70%', y: '35%' },
  { Icon: Soup, delay: 2.5, duration: 26, x: '45%', y: '20%' },
  { Icon: Cookie, delay: 4.5, duration: 19, x: '60%', y: '80%' },
  { Icon: Apple, delay: 1.5, duration: 27, x: '35%', y: '85%' },
  { Icon: Salad, delay: 3.5, duration: 20, x: '90%', y: '45%' },
];

export default function FloatingIcons() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {icons.map(({ Icon, delay, duration, x, y }, index) => (
        <motion.div
          key={index}
          className="absolute"
          style={{ left: x, top: y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.15, 0.15, 0],
            scale: [0, 1, 1, 0],
            y: [0, -30, -60, -90],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon 
            size={40} 
            className="text-primary/30"
            strokeWidth={1.5}
          />
        </motion.div>
      ))}
    </div>
  );
}
