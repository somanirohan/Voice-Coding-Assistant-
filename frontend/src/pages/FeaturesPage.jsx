import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Wave from '../components/Wave';

const UseCaseCard = ({ title, description, icon }) => (
  <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-purple-500/30 shadow-lg hover:border-purple-500 transition-all transform hover:-translate-y-1">
    <div className="text-purple-400 mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

// A new, improved UseCaseCard component
const FeatureCard = ({ title, description, icon }) => (
  <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-8 border border-purple-500/30 shadow-lg hover:border-purple-500 transition-all transform hover:-translate-y-1 flex flex-col">
    <div className="text-purple-400 mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-gray-400 flex-grow">{description}</p>
    <a href="#" className="text-purple-400 font-semibold mt-6 self-start hover:text-purple-300">
      Learn More →
    </a>
  </div>
);

// ... then use <FeatureCard /> instead of <UseCaseCard />

function UseCasesPage() {
  return (
    <div className="bg-gray-900 min-h-screen font-sans">
      <Navbar />
      <div className="relative z-10 container mx-auto px-6 pt-32 pb-20">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center leading-tight">
          What You Can Do
        </h1>
        <p className="text-lg text-gray-300 mt-4 max-w-2xl mx-auto text-center">
          From writing boilerplate to complex git commands, your voice is the only tool you need.
        </p>
        <div className="grid md:grid-cols-1 gap-8 mt-16">
          <UseCaseCard 
            title="Write Code" 
            description="Generate functions, classes, and logic in any programming language using natural speech."
            icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
          />
        </div>
        <div className="text-center mt-20">
            <Link to="/app" className="font-bold text-lg transition-all duration-300 transform hover:scale-105 text-white py-4 px-10 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600">
              Try it Now
            </Link>
        </div>
      </div>
      <Wave />
    </div>
  );
}

export default UseCasesPage;