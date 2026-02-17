'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Facebook, Instagram, Twitter, Clock } from 'lucide-react';
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

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <>
      <Navigation />
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-[50vh] flex items-center justify-center pt-32 pb-12 px-4 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=1920&q=80"
              alt="Contact background"
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
              Get in Touch
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-lg"
            >
              Have questions about our catering services? We'd love to hear from you.
            </motion.p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <motion.h2 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-2xl sm:text-3xl font-bold text-gray-900"
              >
                Contact Information
              </motion.h2>

              {/* Phone */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-4 mb-3">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-12 h-12 bg-gradient-to-br from-primary to-yellow-600 rounded-xl flex items-center justify-center shadow-lg"
                  >
                    <Phone size={20} className="text-white" />
                  </motion.div>
                  <h3 className="font-bold text-gray-900">Phone</h3>
                </div>
                <a
                  href={`tel:${contactInfo?.phone || '+15551234567'}`}
                  className="text-gray-700 hover:text-primary transition-colors font-medium"
                >
                  {contactInfo?.phone || '(555) 123-4567'}
                </a>
              </motion.div>

              {/* Email */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-4 mb-3">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-primary rounded-xl flex items-center justify-center shadow-lg"
                  >
                    <Mail size={20} className="text-white" />
                  </motion.div>
                  <h3 className="font-bold text-gray-900">Email</h3>
                </div>
                <a
                  href={`mailto:${contactInfo?.email || 'info@eventcash.com'}`}
                  className="text-gray-700 hover:text-primary transition-colors font-medium"
                >
                  {contactInfo?.email || 'info@eventcash.com'}
                </a>
              </motion.div>

              {/* Address */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-4 mb-3">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="w-12 h-12 bg-gradient-to-br from-primary to-yellow-600 rounded-xl flex items-center justify-center shadow-lg"
                  >
                    <MapPin size={20} className="text-white" />
                  </motion.div>
                  <h3 className="font-bold text-gray-900">Location</h3>
                </div>
                <p className="text-gray-700 font-medium">
                  {contactInfo?.address.street || '123 Culinary Lane'}<br />
                  {contactInfo?.address.city || 'Gourmet City'}, {contactInfo?.address.state || 'FC'} {contactInfo?.address.zip || '12345'}<br />
                  {contactInfo?.address.country || 'United States'}
                </p>
              </motion.div>

              {/* Social Links */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="pt-4"
              >
                <h3 className="font-bold mb-4 text-gray-900">Follow Us</h3>
                <div className="flex gap-4">
                  {[
                    { icon: Facebook, label: 'Facebook', href: contactInfo?.social?.facebook || '#' },
                    { icon: Instagram, label: 'Instagram', href: contactInfo?.social?.instagram || '#' },
                    { icon: Twitter, label: 'Twitter', href: contactInfo?.social?.twitter || '#' },
                  ].map(({ icon: Icon, label, href }) => (
                    <motion.a
                      key={label}
                      href={href}
                      target={href !== '#' ? '_blank' : undefined}
                      rel={href !== '#' ? 'noopener noreferrer' : undefined}
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 backdrop-blur-xl bg-white/70 border-2 border-primary/30 rounded-full flex items-center justify-center shadow-lg"
                      aria-label={label}
                    >
                      <Icon size={20} className="text-primary" />
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Contact Form */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-900">Send us a Message</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-bold mb-2 text-gray-900">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-xl focus:outline-none focus:border-primary transition-colors text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold mb-2 text-gray-900">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-xl focus:outline-none focus:border-primary transition-colors text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-bold mb-2 text-gray-900">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-xl focus:outline-none focus:border-primary transition-colors text-gray-900 placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-bold mb-2 text-gray-900">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Tell us about your event and catering needs..."
                    rows={6}
                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-xl focus:outline-none focus:border-primary transition-colors resize-none text-gray-900 placeholder:text-gray-500"
                  ></textarea>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-primary via-yellow-600 to-primary text-white rounded-xl font-semibold shadow-xl flex items-center justify-center gap-2"
                >
                  <Send size={20} />
                  Send Message
                </motion.button>

                {submitted && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 backdrop-blur-xl bg-green-50 border-2 border-green-500/30 rounded-xl text-center"
                  >
                    <p className="font-bold text-green-700">Message sent successfully!</p>
                    <p className="text-sm text-green-600">
                      We'll get back to you as soon as possible.
                    </p>
                  </motion.div>
                )}
              </form>
            </motion.div>
          </div>
        </section>

        {/* Office Hours */}
        <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-white via-primary/5 to-white">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-bold mb-8 bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent"
            >
              Office Hours
            </motion.h2>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-3xl p-8 shadow-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Clock size={24} className="text-white" />
                  </div>
                  <h3 className="font-bold mb-2 text-primary text-lg">Monday - Friday</h3>
                  <p className="text-lg text-gray-900 font-semibold">{contactInfo?.hours.weekdays || '9:00 AM - 6:00 PM'}</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Clock size={24} className="text-white" />
                  </div>
                  <h3 className="font-bold mb-2 text-yellow-600 text-lg">Saturday - Sunday</h3>
                  <p className="text-lg text-gray-900 font-semibold">{contactInfo?.hours.weekends || '10:00 AM - 4:00 PM'}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
