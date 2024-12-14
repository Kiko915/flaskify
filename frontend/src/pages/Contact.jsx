import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { MessageSquare, Mail, Phone, MapPin } from 'lucide-react';
import Map from '../components/Map';
import axios from 'axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5555/api/contact', formData);
      
      if (response.status === 201) {
        toast.success('Message sent successfully! We will get back to you soon.');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | Flaskify</title>
      </Helmet>

      {/* Header Banner */}
      <div className="bg-[#062a51] text-white relative overflow-hidden z-[20]">
        <div className="container mx-auto px-4 lg:px-32 py-16 relative">
          <div className="flex flex-col items-center justify-center space-y-4">
            <span className="text-[#FFD700] text-lg font-medium">Get in Touch</span>
            <h1 className="text-4xl md:text-5xl font-bold text-center">Contact Us</h1>
            <div className="w-20 h-1 bg-[#FFD700] rounded-full"></div>
            <p className="text-lg text-center max-w-2xl text-gray-200">
              Have questions or need assistance? We're here to help you with anything you need.
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 py-12 relative z-[10]">
        <div className="container mx-auto px-4 lg:px-32">
          {/* Map Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Find Us Here</h2>
            <Map />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-8 border-t-4 border-[#FFD700]">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Get in Touch</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#062a51] p-3 rounded-lg">
                      <MessageSquare className="w-6 h-6 text-[#FFD700]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Chat with Us</h3>
                      <p className="text-gray-600">Our friendly team is here to help.</p>
                      <a href="mailto:support@flaskify.com" className="text-[#062a51] hover:text-[#FFD700] transition-colors">support@flaskify.com</a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-[#062a51] p-3 rounded-lg">
                      <MapPin className="w-6 h-6 text-[#FFD700]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Office</h3>
                      <p className="text-gray-600">083 Rizal Street, Liliw, Laguna, Philippines</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-[#062a51] p-3 rounded-lg">
                      <Phone className="w-6 h-6 text-[#FFD700]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">Phone</h3>
                      <p className="text-gray-600">Mon-Fri from 8am to 5pm</p>
                      <a href="tel:+63999999999" className="text-[#062a51] hover:text-[#FFD700] transition-colors">+63 999 9999</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-8 border-t-4 border-[#FFD700]">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Send us a Message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 text-sm rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Your Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 text-sm rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 text-sm rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-2.5 text-sm rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-[#062a51] text-white rounded-md hover:bg-[#062a51]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                  >
                    {loading ? (
                      <>
                        <Mail className="w-5 h-5 animate-spin text-[#FFD700]" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5 text-[#FFD700] group-hover:scale-110 transition-transform" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact; 