import { Calendar, Users, Code2, Rocket, Mail } from 'lucide-react';

export default function About() {
  const timeline = [
    {
      year: 'October 2024',
      title: 'Project Inception',
      description: 'Flaskify was conceived as a modern e-commerce solution combining Flask and React.'
    },
    {
      year: 'November 2024',
      title: 'Beta Launch',
      description: 'First beta version released with core shopping features and user management.'
    },
    {
      year: 'December 2024',
      title: 'Public Release',
      description: 'Official launch with complete e-commerce functionality and mobile responsiveness.'
    }
  ];

  const developers = [
    {
      name: 'John Doe',
      role: 'Full Stack Developer',
      image: '/assets/team/john.jpg',
      github: 'https://github.com/johndoe'
    },
    // Add other team members here
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#062a51] to-[#0a4281] text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-1/2 -right-8 w-32 h-32 bg-yellow-500/20 rounded-full blur-xl animate-pulse delay-700"></div>
          <div className="absolute bottom-1/4 left-1/3 w-40 h-40 bg-blue-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 lg:px-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block animate-bounce-slow mb-4">
              <div className="h-1 w-20 bg-yellow-500 mx-auto rounded-full"></div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-slideDown">
              About <span className="text-yellow-500">Flaskify</span>
            </h1>
            <p className="text-xl text-gray-200 animate-slideDown animation-delay-200">
              A modern e-commerce platform built with Flask and React, designed for seamless shopping experiences
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto px-4 lg:px-32 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fadeIn">
            <div className="h-1 w-20 bg-yellow-500 rounded-full mb-6"></div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Mission</h2>
            <p className="text-gray-600 mb-6">
              Flaskify aims to revolutionize e-commerce by providing a robust, scalable, and user-friendly platform that combines the power of Flask's backend capabilities with React's dynamic frontend features.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow hover:border-yellow-500 border-2 border-transparent">
                <Users className="w-8 h-8 text-yellow-500 mb-2" />
                <h3 className="font-semibold mb-1">User-Centric</h3>
                <p className="text-sm text-gray-600">Focused on providing the best user experience</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow hover:border-yellow-500 border-2 border-transparent">
                <Code2 className="w-8 h-8 text-yellow-500 mb-2" />
                <h3 className="font-semibold mb-1">Modern Tech</h3>
                <p className="text-sm text-gray-600">Built with cutting-edge technologies</p>
              </div>
            </div>
          </div>
          <div className="relative animate-fadeIn animation-delay-200">
            <div className="absolute inset-0 bg-yellow-500/10 rounded-lg transform rotate-3"></div>
            <img 
              src="/assets/flaskify-wordmark.png" 
              alt="About Flaskify" 
              className="relative rounded-lg hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 lg:px-32">
          <div className="text-center mb-12 animate-fadeIn">
            <div className="h-1 w-20 bg-yellow-500 mx-auto rounded-full mb-6"></div>
            <h2 className="text-3xl font-bold text-gray-800">Our Journey</h2>
          </div>
          <div className="max-w-3xl mx-auto">
            {timeline.map((item, index) => (
              <div key={index} className="flex gap-6 mb-8 animate-slideIn" style={{ animationDelay: `${index * 200}ms` }}>
                <div className="flex-none">
                  <div className="w-16 h-16 bg-yellow-500 text-white rounded-full flex items-center justify-center transform hover:rotate-12 transition-transform">
                    <Calendar className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-all hover:border-yellow-500 border-2 border-transparent">
                    <h3 className="font-semibold text-lg text-yellow-500 mb-1">{item.year}</h3>
                    <h4 className="font-medium mb-2">{item.title}</h4>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="container mx-auto px-4 lg:px-32 py-16">
        <div className="text-center mb-12 animate-fadeIn">
          <div className="h-1 w-20 bg-yellow-500 mx-auto rounded-full mb-6"></div>
          <h2 className="text-3xl font-bold text-gray-800">Meet the Developer</h2>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            Passionate about creating seamless e-commerce experiences with modern technologies
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group">
            {/* Banner/Background */}
            <div className="h-32 bg-gradient-to-r from-[#062a51] to-[#0a4281] relative">
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-full h-full bg-yellow-500/10 rounded-full blur-xl animate-pulse"></div>
              </div>
            </div>
            
            {/* Profile Image */}
            <div className="relative -mt-16 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur animate-pulse"></div>
                <img 
                  src="/assets/about/me.jpg" 
                  alt="Francis Mistica" 
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover relative group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
            
            {/* Content */}
            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-2 text-gray-800">Francis Mistica</h3>
              <p className="text-yellow-500 font-medium mb-4">CEO & Full Stack Developer</p>
              
              {/* Skills/Tech Tags */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {['Flask', 'React', 'Python', 'TailwindCSS'].map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-yellow-500/10 hover:text-yellow-600 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              
              <p className="text-gray-600 mb-6">
                Building Flaskify from ground up with a focus on user experience and scalable architecture
              </p>
              
              {/* Social Links */}
              <div className="flex justify-center items-center gap-4">
                <a 
                  href="https://github.com/Kiko915"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-yellow-500 transition-colors flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg hover:shadow-md"
                >
                  <Code2 className="w-5 h-5" />
                  <span className="font-medium">GitHub</span>
                </a>
                <a 
                  href="mailto:francismistica06@gmail.com"
                  className="text-gray-600 hover:text-yellow-500 transition-colors flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg hover:shadow-md"
                >
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 lg:px-32">
          <div className="text-center mb-12 animate-fadeIn">
            <div className="h-1 w-20 bg-yellow-500 mx-auto rounded-full mb-6"></div>
            <h2 className="text-3xl font-bold text-gray-800">Our Tech Stack</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all hover:border-yellow-500 border-2 border-transparent group">
              <div className="h-20 flex items-center justify-center mb-4">
                <img 
                  src="/assets/about/flask.svg" 
                  alt="Flask" 
                  className="h-16 w-16 object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <h3 className="font-semibold text-center">Flask</h3>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all hover:border-yellow-500 border-2 border-transparent group">
              <div className="h-20 flex items-center justify-center mb-4">
                <img 
                  src="/assets/about/react.svg" 
                  alt="React" 
                  className="h-16 w-16 object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <h3 className="font-semibold text-center">React</h3>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all hover:border-yellow-500 border-2 border-transparent group">
              <div className="h-20 flex items-center justify-center mb-4">
                <img 
                  src="/assets/about/tailwindcss.svg" 
                  alt="Tailwind" 
                  className="h-16 w-16 object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <h3 className="font-semibold text-center">Tailwind CSS</h3>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all hover:border-yellow-500 border-2 border-transparent group">
              <div className="h-20 flex items-center justify-center mb-4">
                <img 
                  src="/assets/about/python.svg" 
                  alt="Python" 
                  className="h-16 w-16 object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <h3 className="font-semibold text-center">Python</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 