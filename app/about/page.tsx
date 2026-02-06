'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Target, Eye, Lightbulb, Award, Users, Heart, Quote, Zap, TrendingUp, Utensils } from 'lucide-react';

export default function About() {
  return (
    <>
      <Navigation />
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-12 px-4 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1530062845289-9109b2c9c868?w=1920&q=80"
              alt="About background"
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
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <span className="text-sm uppercase tracking-widest text-primary font-bold">Est. 2009</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-2xl"
            >
              About EventCash Catering
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-lg"
            >
              15 years of culinary excellence, dedicated to making every event unforgettable
            </motion.p>
          </div>
        </section>

        {/* Main Content - Newspaper Layout with Luxury Styling */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Featured Story - Two Column */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="relative overflow-hidden rounded-3xl shadow-2xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80"
                  alt="EventCash Catering"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <p className="text-sm text-white/80 italic">
                    The EventCash team preparing for a grand celebration
                  </p>
                </div>
              </motion.div>

              <div className="flex flex-col justify-center">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-primary/10 border-2 border-primary/30 rounded-3xl p-8 shadow-xl"
                >
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    15 Years of Culinary Excellence
                  </h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-primary to-yellow-600 rounded-full mb-6"></div>
                  <p className="text-lg text-gray-800 mb-4 leading-relaxed font-medium">
                    From humble beginnings to becoming the city's premier catering service
                  </p>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Founded in 2009, EventCash Catering began with a simple vision: to elevate the art of event catering through exceptional food, impeccable service, and meticulous attention to detail.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    What started as a small team of passionate chefs has grown into a full-service catering company serving hundreds of clients annually.
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                <div className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-3xl p-6 shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-primary/30">
                    The Beginning
                  </h3>
                  <p className="text-gray-800 leading-relaxed mb-4">
                    Our founder, inspired by family traditions and culinary arts, set out to create something special—a catering service that would treat every event as if it were their own celebration.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    From intimate dinner parties to grand corporate galas, we've had the privilege of being part of countless memorable moments.
                  </p>
                </div>

                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="relative overflow-hidden rounded-3xl shadow-xl"
                >
                  <img
                    src="https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80"
                    alt="Catering setup"
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-sm text-white italic">
                      Elegant table settings at a recent wedding
                    </p>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-3xl p-6 shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-primary/30">
                    Our Philosophy
                  </h3>
                  <p className="text-gray-800 leading-relaxed mb-4">
                    Our success is built on a foundation of quality ingredients, creative menus, and a commitment to customer satisfaction that goes beyond expectations.
                  </p>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="backdrop-blur-xl bg-gradient-to-br from-primary/10 to-yellow-600/10 border-l-4 border-primary rounded-2xl p-6 my-6 shadow-lg"
                  >
                    <Quote size={32} className="text-primary mb-3" />
                    <p className="text-gray-900 italic text-lg font-medium mb-3">
                      "Excellence is not a skill, it's an attitude we bring to every event."
                    </p>
                    <p className="text-sm text-gray-600 font-semibold">— Executive Chef, EventCash</p>
                  </motion.div>
                  
                  <p className="text-gray-700 leading-relaxed">
                    We believe that great food brings people together, and exceptional service makes moments unforgettable.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                <div className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-3xl p-6 shadow-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b-2 border-primary/30">
                    Today & Tomorrow
                  </h3>
                  <p className="text-gray-800 leading-relaxed mb-4">
                    Today, we're proud to serve over 500 events annually, with a team of award-winning chefs and dedicated professionals.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Our vision for the future includes expanding our sustainable sourcing practices and continuing to set the standard for excellence.
                  </p>
                </div>

                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="backdrop-blur-xl bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-6 shadow-xl border-2 border-primary/50"
                >
                  <h4 className="text-xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">
                    By The Numbers
                  </h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Events Catered', value: '500+' },
                      { label: 'Happy Guests', value: '10K+' },
                      { label: 'Years Experience', value: '15+' },
                      { label: 'Awards Won', value: '25+' },
                    ].map((stat, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-gray-700 pb-3">
                        <span className="text-sm text-gray-300">{stat.label}</span>
                        <span className="text-2xl font-bold text-primary">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Mission, Vision, Values */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent">
                Our Guiding Principles
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Target,
                    title: 'Mission',
                    text: 'To deliver exceptional catering experiences that exceed expectations, creating lasting memories through culinary artistry and professional excellence.',
                    gradient: 'from-primary to-yellow-600',
                  },
                  {
                    icon: Eye,
                    title: 'Vision',
                    text: 'To be the premier catering choice for discerning clients who demand excellence, innovation, and personalized service for their most important celebrations.',
                    gradient: 'from-yellow-600 to-primary',
                  },
                  {
                    icon: Lightbulb,
                    title: 'Values',
                    list: ['Quality & Excellence', 'Customer Focus', 'Innovation', 'Professionalism', 'Sustainability'],
                    gradient: 'from-primary to-yellow-600',
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="relative backdrop-blur-xl bg-gradient-to-br from-white/90 via-white/80 to-primary/10 border-2 border-primary/30 rounded-3xl p-8 overflow-hidden shadow-xl"
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.gradient} opacity-20 rounded-bl-full`} />
                    
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.2 }}
                      transition={{ duration: 0.6 }}
                      className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-xl relative z-10`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-2xl" />
                      <item.icon size={32} className="text-white relative z-10" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 relative z-10">{item.title}</h3>
                    
                    {item.text && (
                      <p className="text-gray-700 leading-relaxed relative z-10 font-medium">
                        {item.text}
                      </p>
                    )}
                    
                    {item.list && (
                      <ul className="space-y-2 relative z-10">
                        {item.list.map((value, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700 font-medium">
                            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.gradient} mt-2 flex-shrink-0`}></span>
                            <span>{value}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <motion.div
                      className={`mt-6 h-1 bg-gradient-to-r ${item.gradient} rounded-full`}
                      initial={{ width: 0 }}
                      whileInView={{ width: '60%' }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Team Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent">
                Meet The Team
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative overflow-hidden rounded-3xl shadow-2xl"
                >
                  <img
                    src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80"
                    alt="Team"
                    className="w-full h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-sm text-white italic">
                      Our culinary team in action
                    </p>
                  </div>
                </motion.div>

                <div className="flex flex-col justify-center">
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-3xl p-8 shadow-xl"
                  >
                    <p className="text-lg text-gray-800 mb-4 leading-relaxed font-medium">
                      Our team consists of award-winning chefs, experienced event coordinators, and dedicated service professionals.
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      From our Executive Chef who trained in Michelin-starred restaurants to our Event Manager with over a decade of experience, every team member is committed to excellence.
                    </p>
                  </motion.div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { role: 'Executive Chef', icon: Award, desc: 'Culinary Excellence', gradient: 'from-primary to-yellow-600' },
                  { role: 'Event Manager', icon: Users, desc: 'Seamless Coordination', gradient: 'from-yellow-600 to-primary' },
                  { role: 'Service Director', icon: Heart, desc: 'Exceptional Care', gradient: 'from-primary to-yellow-600' },
                ].map((member, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -10, scale: 1.05 }}
                    className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-3xl p-6 text-center shadow-lg"
                  >
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`w-20 h-20 bg-gradient-to-br ${member.gradient} rounded-full mx-auto mb-4 flex items-center justify-center shadow-xl`}
                    >
                      <member.icon size={32} className="text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{member.role}</h3>
                    <p className="text-sm text-gray-600 font-medium">{member.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-gray-50 via-white to-primary/5">
          <div className="max-w-7xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent"
            >
              Why Choose EventCash Catering?
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Utensils,
                  title: 'Premium Cuisine',
                  desc: 'Our chefs craft custom menus using only the finest ingredients sourced from trusted local suppliers.',
                  gradient: 'from-primary to-yellow-600',
                },
                {
                  icon: Zap,
                  title: 'Flawless Execution',
                  desc: 'Years of experience ensure every detail is perfect, from setup to the final course.',
                  gradient: 'from-yellow-600 to-primary',
                },
                {
                  icon: TrendingUp,
                  title: 'Proven Track Record',
                  desc: '500+ successfully catered events with a 98% client satisfaction rate.',
                  gradient: 'from-primary to-yellow-600',
                },
                {
                  icon: Users,
                  title: 'Expert Team',
                  desc: 'Award-winning chefs and professional staff dedicated to your event\'s success.',
                  gradient: 'from-yellow-600 to-primary',
                },
                {
                  icon: Award,
                  title: 'Industry Recognition',
                  desc: 'Multiple awards and features in prestigious culinary and events publications.',
                  gradient: 'from-primary to-yellow-600',
                },
                {
                  icon: Heart,
                  title: 'Personal Touch',
                  desc: 'We treat every event as our own, going above and beyond to exceed expectations.',
                  gradient: 'from-yellow-600 to-primary',
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow"
                >
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <item.icon size={28} className="text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 bg-gradient-to-r from-primary via-yellow-600 to-primary">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Elevate Your Event?
            </h2>
            <p className="text-lg text-white/90 mb-8 leading-relaxed">
              Let EventCash Catering turn your vision into an unforgettable culinary experience. 
              Contact us today for a personalized consultation.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/contact'}
              className="px-8 py-4 bg-white text-primary font-bold rounded-full shadow-xl hover:shadow-2xl transition-shadow"
            >
              Get Started Today
            </motion.button>
          </motion.div>
        </section>

        {/* Developers Section */}
        <section className="py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-4"
            >
              <span className="text-sm uppercase tracking-widest text-primary font-bold">The Tech Behind</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent"
            >
              Makers of Event Cash
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center text-gray-600 text-lg mb-16 max-w-2xl mx-auto"
            >
              Meet the talented developers who built the Event Cash platform from the ground up.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[
                {
                  name: 'Kynna',
                  role: 'Full Stack Developer',
                  desc: 'Kynna is a visionary full-stack developer who led the overall architecture and core functionality of Event Cash. With expertise in modern web technologies, Kynna ensures the platform is scalable, secure, and user-friendly.',
                  image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
                },
                {
                  name: 'Rose Ann',
                  role: 'Frontend Developer & UX Designer',
                  desc: 'Rose Ann crafted the beautiful and intuitive user interface you see today. Her focus on user experience and design excellence makes Event Cash a pleasure to use for both customers and administrators.',
                  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80',
                },
                {
                  name: 'Glynnes',
                  role: 'Backend Developer',
                  desc: 'Glynnes is the backbone of Event Cash\'s server infrastructure. Specializing in database design and API development, Glynnes ensures that all data is handled securely and efficiently behind the scenes.',
                  image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
                },
                {
                  name: 'Carlo',
                  role: 'DevOps & QA Engineer',
                  desc: 'Carlo keeps Event Cash running smoothly across all environments. With expertise in deployment, testing, and system optimization, Carlo ensures the platform is reliable and performs flawlessly for all users.',
                  image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
                },
              ].map((dev, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="overflow-hidden rounded-3xl shadow-xl mb-6"
                  >
                    <div className="relative h-96 overflow-hidden">
                      <img
                        src={dev.image}
                        alt={dev.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-3xl font-bold text-white mb-2">{dev.name}</h3>
                        <p className="text-primary text-lg font-semibold">{dev.role}</p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.15 }}
                    className="backdrop-blur-xl bg-white/80 border-2 border-primary/30 rounded-3xl p-8 shadow-lg"
                  >
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {dev.desc}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 text-center"
            >
              <div className="backdrop-blur-xl bg-gradient-to-br from-primary/10 to-yellow-600/10 border-2 border-primary/30 rounded-3xl p-12 shadow-lg max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Passion for Innovation</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Together, Kynna, Rose Ann, Glynnes, and Carlo are committed to building the best event management platform. Their collaborative approach, attention to detail, and passion for technology make Event Cash the industry-leading solution for modern event planning and catering services.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
