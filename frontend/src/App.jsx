import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AppPage from './pages/AppPage';
import FeaturesPage from './pages/FeaturesPage'; // Corrected Import
import DocsPage from './pages/DocsPage';
import BlogPage from './pages/BlogPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/app" element={<AppPage />} />
      <Route path="/features" element={<FeaturesPage />} /> {/* Corrected Route */}
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/blog" element={<BlogPage />} />
    </Routes>
  );
}

export default App;