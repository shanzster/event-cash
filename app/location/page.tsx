'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Car, Train } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ContactInfo {
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  hours: {
    weekdays: string;
    weekends: string;
  };
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  mapUrl?: string;
}

/**
 * Location Page
 * Displays company location with embedded map and directions
 */
export default function Location() {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const docRef = doc(db, 'settings', 'contact');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setContactInfo(docSnap.data() as ContactInfo);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  };
  return (
    <>
      <Navigation />
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-[50vh] flex items-center justify-center pt-32 pb-12 px-4 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80"
              alt="Location background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-yellow-600/20"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </div>
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-2xl"
            >
              Visit Us
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-lg"
            >
              Located in the heart of Gourmet City, easily accessible and ready to serve you
            </motion.p>
          </div>
        </section>

        {/* Location Content */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Map Section */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/30"
            >
              <iframe
                src={contactInfo?.mapUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290355!2d-74.00601!3d40.71282!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a20f96bfe8d%3A0x7685d66de8e0f1a4!2s123%20Main%20St%2C%20New%20York%2C%20NY%2010001!5e0!3m2!1sen!2sus!4v1234567890"}
                width="100%"
                height="500"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </motion.div>

            {/* Location Information */}
            <div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-bold mb-8 text-gray-900"
              >
                Our Location
              </motion.h2>

              {/* Address Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-2xl p-6 mb-6 shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-12 h-12 bg-gradient-to-br from-primary to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                  >
                    <MapPin size={20} className="text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Main Office</h3>
                    <p className="text-gray-700 font-medium">
                      {contactInfo?.address.street || '123 Culinary Lane'}<br />
                      {contactInfo?.address.city || 'Gourmet City'}, {contactInfo?.address.state || 'FC'} {contactInfo?.address.zip || '12345'}<br />
                      {contactInfo?.address.country || 'United States'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Phone Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-2xl p-6 mb-6 shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                  >
                    <Phone size={20} className="text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Phone</h3>
                    <a
                      href={`tel:${contactInfo?.phone || '+15551234567'}`}
                      className="text-gray-700 hover:text-primary transition-colors font-medium"
                    >
                      {contactInfo?.phone || '(555) 123-4567'}
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Email Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-2xl p-6 mb-6 shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-12 h-12 bg-gradient-to-br from-primary to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                  >
                    <Mail size={20} className="text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Email</h3>
                    <a
                      href={`mailto:${contactInfo?.email || 'info@eventcash.com'}`}
                      className="text-gray-700 hover:text-primary transition-colors font-medium"
                    >
                      {contactInfo?.email || 'info@eventcash.com'}
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Hours Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                  >
                    <Clock size={20} className="text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-lg mb-2 text-gray-900">Hours</h3>
                    <p className="text-gray-700 text-sm font-medium">
                      <span className="block">Mon - Fri: {contactInfo?.hours.weekdays || '9:00 AM - 6:00 PM'}</span>
                      <span className="block">Sat - Sun: {contactInfo?.hours.weekends || '10:00 AM - 4:00 PM'}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Directions Section */}
        <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-white via-primary/5 to-white">
          <div className="max-w-4xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold mb-12 text-center bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent"
            >
              Directions & Parking
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* By Car */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-3xl p-8 shadow-lg"
              >
                <motion.div 
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                  className="w-14 h-14 bg-gradient-to-br from-primary to-yellow-600 rounded-xl flex items-center justify-center mb-6 shadow-xl"
                >
                  <Car size={28} className="text-white" />
                </motion.div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">By Car</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Our location is easily accessible from the main highway. Turn right at the 
                  traffic light and continue for 2 blocks. Free parking is available in our 
                  dedicated lot.
                </p>
                <motion.a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block px-6 py-3 bg-gradient-to-r from-primary to-yellow-600 text-white rounded-xl font-semibold shadow-lg"
                >
                  Get Directions
                </motion.a>
              </motion.div>

              {/* By Public Transit */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-3xl p-8 shadow-lg"
              >
                <motion.div 
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                  className="w-14 h-14 bg-gradient-to-br from-yellow-600 to-primary rounded-xl flex items-center justify-center mb-6 shadow-xl"
                >
                  <Train size={28} className="text-white" />
                </motion.div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">By Public Transit</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Our office is just a 5-minute walk from the downtown metro station. 
                  Take the Red Line to Culinary Station and exit north. Our building 
                  is directly across the street.
                </p>
                <motion.a
                  href="#"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-600 to-primary text-white rounded-xl font-semibold shadow-lg"
                >
                  Transit Info
                </motion.a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Why Choose Our Location */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold mb-12 bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent"
            >
              Why Choose Our Location
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Central Location', desc: 'Easy access from all parts of the city', gradient: 'from-primary to-yellow-600' },
                { title: 'Ample Parking', desc: 'Dedicated parking lot with plenty of spaces', gradient: 'from-yellow-600 to-primary' },
                { title: 'Modern Facilities', desc: 'State-of-the-art kitchen and meeting spaces', gradient: 'from-primary to-yellow-600' },
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -10, scale: 1.05 }}
                  className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-3xl p-8 shadow-lg"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-xl mx-auto mb-4`} />
                  <h3 className="font-bold text-lg mb-2 text-gray-900">{item.title}</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
