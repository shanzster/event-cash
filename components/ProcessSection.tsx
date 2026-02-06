'use client';

import { motion } from 'framer-motion';
import { MessageSquare, ClipboardList, ChefHat, Sparkles } from 'lucide-react';

const steps = [
  {
    id: 1,
    number: '01',
    title: 'Consultation',
    description: 'Share your vision, preferences, and dietary requirements with our team',
    icon: MessageSquare,
    gradient: 'from-primary to-yellow-500',
  },
  {
    id: 2,
    number: '02',
    title: 'Menu Planning',
    description: 'We create a custom menu tailored to your event and budget',
    icon: ClipboardList,
    gradient: 'from-yellow-500 to-yellow-600',
  },
  {
    id: 3,
    number: '03',
    title: 'Preparation',
    description: 'Our expert chefs prepare everything with premium ingredients',
    icon: ChefHat,
    gradient: 'from-yellow-600 to-primary',
  },
  {
    id: 4,
    number: '04',
    title: 'Flawless Execution',
    description: 'We deliver and serve with impeccable attention to detail',
    icon: Sparkles,
    gradient: 'from-primary to-yellow-500',
  },
];

export default function ProcessSection() {
  return (
    <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-primary/5 to-white" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Our simple 4-step process ensures your event is perfectly catered
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="relative"
              >
                {/* Connecting line (except for last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent -translate-x-1/2 z-0" />
                )}

                <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-primary/10 border-2 border-primary/30 rounded-3xl p-8 overflow-hidden group"
                  style={{
                    boxShadow: '0 10px 40px rgba(212, 175, 55, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                  }}
                >
                  {/* Step number background */}
                  <div className="absolute top-4 right-4 text-8xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    className={`relative w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-xl z-10`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-2xl" />
                    <Icon size={32} className="text-white relative z-10" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-3 text-gray-900 relative z-10">
                    {step.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed relative z-10">
                    {step.description}
                  </p>

                  {/* Decorative line */}
                  <motion.div
                    className={`mt-6 h-1 bg-gradient-to-r ${step.gradient} rounded-full`}
                    initial={{ width: 0 }}
                    whileInView={{ width: '60%' }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
