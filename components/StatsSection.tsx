'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Award, Heart } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function StatsSection() {
  const [stats, setStats] = useState([
    {
      id: 1,
      number: '500+',
      label: 'Events Catered',
      icon: TrendingUp,
      gradient: 'from-primary to-yellow-500',
    },
    {
      id: 2,
      number: '10,000+',
      label: 'Happy Guests',
      icon: Users,
      gradient: 'from-yellow-500 to-yellow-600',
    },
    {
      id: 3,
      number: '25+',
      label: 'Awards Won',
      icon: Award,
      gradient: 'from-yellow-600 to-primary',
    },
    {
      id: 4,
      number: '98%',
      label: 'Client Satisfaction',
      icon: Heart,
      gradient: 'from-primary to-yellow-500',
    },
  ]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const docRef = doc(db, 'cms', 'content');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.home?.stats) {
          setStats([
            {
              id: 1,
              number: data.home.stats.eventsCatered || '500+',
              label: 'Events Catered',
              icon: TrendingUp,
              gradient: 'from-primary to-yellow-500',
            },
            {
              id: 2,
              number: data.home.stats.happyGuests || '10,000+',
              label: 'Happy Guests',
              icon: Users,
              gradient: 'from-yellow-500 to-yellow-600',
            },
            {
              id: 3,
              number: data.home.stats.awardsWon || '25+',
              label: 'Awards Won',
              icon: Award,
              gradient: 'from-yellow-600 to-primary',
            },
            {
              id: 4,
              number: data.home.stats.clientSatisfaction || '98%',
              label: 'Client Satisfaction',
              icon: Heart,
              gradient: 'from-primary to-yellow-500',
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  return (
    <section className="py-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Background with image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/80" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-white">
            Our Track Record
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Numbers that speak to our commitment to excellence
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="relative backdrop-blur-xl bg-white/10 border-2 border-white/20 rounded-3xl p-8 text-center overflow-hidden group"
                style={{
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                }}
              >
                {/* Animated background glow */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                  style={{ backgroundSize: '200% 200%' }}
                />

                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                  className={`inline-flex w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-2xl items-center justify-center mb-6 shadow-xl relative z-10`}
                >
                  <Icon size={32} className="text-white" />
                </motion.div>

                {/* Number */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1, type: 'spring' }}
                  className={`text-5xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-2 relative z-10`}
                >
                  {stat.number}
                </motion.div>

                {/* Label */}
                <p className="text-white/90 font-medium relative z-10">
                  {stat.label}
                </p>

                {/* Decorative line */}
                <motion.div
                  className={`mt-6 h-1 bg-gradient-to-r ${stat.gradient} rounded-full mx-auto`}
                  initial={{ width: 0 }}
                  whileInView={{ width: '60%' }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
