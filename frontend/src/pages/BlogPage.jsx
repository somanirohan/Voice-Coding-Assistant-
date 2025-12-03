import React from 'react';
import Navbar from '../components/Navbar';
import Wave from '../components/Wave';

function BlogPage() {
  return (
    <div className="bg-gray-900 min-h-screen font-sans">
      <Navbar />
      <div className="relative z-10 container mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
          From Our Blog
        </h1>
        <p className="text-lg text-gray-300 mt-6 max-w-2xl mx-auto">
          Updates, tutorials, and insights from the development team are coming soon. Stay tuned!
        </p>
      </div>
      <Wave />
    </div>
  );
}

export default BlogPage;