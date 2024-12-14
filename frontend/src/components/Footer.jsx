import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5555/categories?type=parent&is_active=true');
        // Randomly select 5 categories
        const shuffled = response.data.sort(() => 0.5 - Math.random());
        setCategories(shuffled.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories([]); // Set empty array on error
      }
    };

    fetchCategories();
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setStatus({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Replace this with your actual API endpoint
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus({ type: 'success', message: 'Successfully subscribed to newsletter!' });
        setEmail('');
      } else {
        const data = await response.json();
        setStatus({ type: 'error', message: data.message || 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to subscribe. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-white border-t">
      {/* Newsletter Section */}
      <div className="border-b">
        <div className="container mx-auto py-12 px-4 lg:px-32">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">Subscribe to our Newsletter</h3>
            <p className="text-gray-600 mb-6">Stay updated with our latest products and offers</p>
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm rounded-md bg-gray-50 border border-gray-200 focus:outline-none focus:border-[#062a51] focus:ring-1 focus:ring-[#062a51]"
                />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 bg-[#062a51] text-white rounded-md hover:bg-[#062a51]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
              {status.message && (
                <p className={`text-sm ${status.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                  {status.message}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto py-16 px-4 lg:px-32">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Quick Links Section */}
          <div>
            <h4 className="text-gray-800 font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="/" className="text-gray-600 hover:text-[#062a51] transition-colors">Home</a></li>
              <li><a href="/" className="text-gray-600 hover:text-[#062a51] transition-colors">Shop</a></li>
              <li><a href="/categories" className="text-gray-600 hover:text-[#062a51] transition-colors">Categories</a></li>
              <li><a href="/about" className="text-gray-600 hover:text-[#062a51] transition-colors">About</a></li>
              <li><a href="/contact" className="text-gray-600 hover:text-[#062a51] transition-colors">Contact</a></li>
            </ul>
          </div>
  
          {/* Categories Section */}
          <div>
            <h4 className="text-gray-800 font-semibold mb-6">Categories</h4>
            <ul className="space-y-3">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <li key={category.uuid}>
                    <Link 
                      to={`/category/${category.uuid}`} 
                      className="text-gray-600 hover:text-[#062a51] transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-gray-400">Loading categories...</li>
              )}
            </ul>
          </div>
  
          {/* Account Section */}
          <div>
            <h4 className="text-gray-800 font-semibold mb-6">Account</h4>
            <ul className="space-y-3">
              <li><a href="/auth/signup" className="text-gray-600 hover:text-[#062a51] transition-colors">Sign In / Sign Up</a></li>
              <li><a href="/dashboard" className="text-gray-600 hover:text-[#062a51] transition-colors">Dashboard</a></li>
              <li><a href="/orders" className="text-gray-600 hover:text-[#062a51] transition-colors">Track Order</a></li>
              <li><a href="/wishlist" className="text-gray-600 hover:text-[#062a51] transition-colors">Wishlist</a></li>
              <li><a href="/checkout" className="text-gray-600 hover:text-[#062a51] transition-colors">Checkout</a></li>
            </ul>
          </div>
  
          {/* Contact Section */}
          <div>
            <h4 className="text-gray-800 font-semibold mb-6">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-lg">📞</span>
                <a href="tel:+63999999999" className="hover:text-[#062a51] transition-colors">+63 999 9999</a>
              </li>
              <li className="flex items-center gap-2 text-gray-600">
                <span className="text-lg">📧</span>
                <a href="mailto:info@flaskify.com" className="hover:text-[#062a51] transition-colors">info@flaskify.com</a>
              </li>
              <li className="flex items-start gap-2 text-gray-600">
                <span className="text-lg">📍</span>
                <span>083 Rizal Street, Liliw, Laguna, Philippines</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
  
      {/* Footer Bottom */}
      <div className="border-t bg-gray-50">
        <div className="container mx-auto px-4 lg:px-32 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">© 2024 Flaskify. All Rights Reserved.</p>
            
            {/* Payment Methods */}
            <div className="flex items-center gap-3">
              <img src="/assets/visa.png" alt="Visa" className="h-8 grayscale hover:grayscale-0 transition-all" />
              <img src="/assets/mastercard.png" alt="Mastercard" className="h-8 grayscale hover:grayscale-0 transition-all" />
              <img src="/assets/paypal.png" alt="Paypal" className="h-8 grayscale hover:grayscale-0 transition-all" />
              <img src="/assets/stripe.png" alt="Stripe" className="h-8 grayscale hover:grayscale-0 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;