import React from 'react';
import { Link, NavLink } from 'react-router-dom';

function Navbar() {
  const getNavLinkClass = ({ isActive }) =>
    isActive
      ? 'text-white font-semibold border-b-2 border-purple-500 pb-1'
      : 'text-gray-300 hover:text-white transition-colors duration-300';

  return (
    <nav className="absolute top-0 left-0 right-0 z-30 flex justify-between items-center p-6 px-8 bg-transparent">
      
      <Link to="/" className="flex items-center space-x-3">
        <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 M002 2z" />
        </svg>
        <h1 className="text-xl font-bold text-white">Voice Assistant</h1>
      </Link>
      
      <div className="hidden md:flex items-center space-x-10 text-md">
        <NavLink to="/features" className={getNavLinkClass}>Features</NavLink> {/* Corrected Link */}
        <NavLink to="/docs" className={getNavLinkClass}>Getting Started</NavLink>
        <NavLink to="/blog" className={getNavLinkClass}>Blog</NavLink>
      </div>
      
      <div className="flex items-center space-x-6">
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" title="GitHub Repository">
          <svg className="w-7 h-7 text-gray-300 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.492.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.852 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
          </svg>
        </a>
        
        <Link to="/app">
          <button className="bg-purple-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20 transform hover:scale-105">
            Launch Assistant
          </button>
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;