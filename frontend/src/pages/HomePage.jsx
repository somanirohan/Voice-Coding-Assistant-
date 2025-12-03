import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // Import Framer Motion
import Navbar from '../components/Navbar';
import Wave from '../components/Wave';

// Sub-component for the "How It Works" section with animations
const HowItWorks = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3, // Animates children one after another
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="bg-gray-800 relative z-10 py-20"
      initial="hidden"
      whileInView="visible" // Animation triggers when you scroll to it
      viewport={{ once: true, amount: 0.5 }} // Configures the trigger
      variants={containerVariants}
    >
      <div className="container mx-auto px-6 text-center">
        <motion.h2 variants={itemVariants} className="text-3xl font-bold text-white mb-12">Get Started in Seconds</motion.h2>
        <div className="grid md:grid-cols-3 gap-12">
          <motion.div variants={itemVariants} className="text-center">
            <div className="text-5xl font-bold text-purple-400 mb-4">1</div>
            <h3 className="text-xl font-semibold text-white mb-2">Allow Access</h3>
            <p className="text-gray-400">Grant microphone permissions in your browser. No sign-ups, no downloads.</p>
          </motion.div>
          <motion.div variants={itemVariants} className="text-center">
            <div className="text-5xl font-bold text-purple-400 mb-4">2</div>
            <h3 className="text-xl font-semibold text-white mb-2">Speak Your Mind</h3>
            <p className="text-gray-400">Use natural language to write code, create files, and manage your project.</p>
          </motion.div>
          <motion.div variants={itemVariants} className="text-center">
            <div className="text-5xl font-bold text-purple-400 mb-4">3</div>
            <h3 className="text-xl font-semibold text-white mb-2">See it Live</h3>
            <p className="text-gray-400">Watch your ideas turn into reality in the live editor and console.</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// Sub-component for the "Social Proof" section with animation
const SocialProof = () => (
  <motion.div
    className="bg-gray-900 py-20"
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 1 }}
  >
    <div className="container mx-auto px-6">
      <h2 className="text-3xl font-bold text-white text-center mb-12">Trusted by Developers Worldwide</h2>
      <div className="bg-gray-800/50 p-8 rounded-xl max-w-2xl mx-auto text-center">
        <p className="text-xl italic text-gray-300">"This is the future of development. Being able to code complex functions without touching the keyboard feels like a superpower."</p>
        <p className="text-white font-bold mt-6">- Placeholder Name, Lead Developer</p>
      </div>
    </div>
  </motion.div>
);

// The main HomePage component with animations
function HomePage() {
  return (
    <div className="bg-gray-900 min-h-screen font-sans relative">
      <Navbar />
      
      <div className="relative z-10 container mx-auto px-6 pt-32 pb-48 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="text-4xl md:text-6xl font-extrabold text-white leading-tight"
        >
          The Zero-Installation Voice IDE.
          <br />
          <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
            Code in Your Browser.
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
          className="text-lg text-gray-300 mt-6 max-w-2xl mx-auto"
        >
          This is your AI-powered pair programmer. From simple functions to complex deployments, just say the word.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "backOut" }}
          className="mt-10"
        >
          <Link
            to="/app"
            className="font-bold text-lg transition-all duration-300 transform hover:scale-105 text-white py-4 px-10 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/40"
          >
            Get Started
          </Link>
        </motion.div>
      </div>
      
      <Wave />
      <HowItWorks />
      <SocialProof />
    </div>
  );
}

export default HomePage;