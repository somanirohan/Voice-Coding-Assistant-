import React from 'react';
import Navbar from '../components/Navbar';

// A reusable component for displaying command examples
const CommandExample = ({ command, description }) => (
  <div className="mb-6">
    <p className="text-gray-300 mb-2">{description}</p>
    <div className="bg-black rounded-lg p-4 font-code text-green-400">
      {`> "${command}"`}
    </div>
  </div>
);

function DocsPage() {
  return (
    <div className="bg-gray-900 min-h-screen font-sans">
      <Navbar />
      <div className="container mx-auto px-6 pt-32 pb-20">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
          Documentation
        </h1>
        <p className="text-lg text-gray-300 mt-4">
          Everything you need to know to get the most out of your Voice Assistant.
        </p>

        <div className="grid md:grid-cols-12 gap-12 mt-12">
          
          <aside className="md:col-span-3">
            <nav className="sticky top-28">
              <h3 className="text-purple-400 font-bold mb-4">Getting Started</h3>
              <ul>
                <li><a href="#installation" className="block py-2 text-white font-semibold hover:text-purple-300">Installation</a></li>
                <li><a href="#basic-commands" className="block py-2 text-gray-400 hover:text-white">Basic Commands</a></li>
              </ul>
            </nav>
          </aside>

          <main className="md:col-span-9 space-y-12">

            <section id="installation">
              <div className="bg-gray-800/50 rounded-xl p-8">
                <h2 className="text-3xl font-bold text-white mb-6">Installation</h2>
                <p className="text-gray-300 mb-4">
                  To get started, simply navigate to the application page. The assistant runs entirely in your browser. You will be prompted to provide microphone access. Please ensure you click "Allow" to enable voice recognition.
                </p>
                <div className="bg-black rounded-lg p-4 font-code text-green-400">
                  <p>// No installation needed!</p>
                </div>
              </div>
            </section>

            <section id="basic-commands">
              <div className="bg-gray-800/50 rounded-xl p-8">
                <h2 className="text-3xl font-bold text-white mb-6">Basic Commands</h2>
                <CommandExample 
                  command="create a python file named app"
                  description="To create a new file, specify the language and name."
                />
                <CommandExample 
                  command="write a function that prints hello world"
                  description="For simple code generation, describe what you want the code to do."
                />
                <CommandExample 
                  command="run the code"
                  description="Once you have code in the editor, use this command to execute it."
                />
              </div>
            </section>

            {/* === THIS IS THE CORRECTED SECTION === */}
            

          </main>
        </div>
      </div>
    </div>
  );
}

export default DocsPage;