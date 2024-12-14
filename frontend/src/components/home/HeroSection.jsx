import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '@/lib/api';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultSlides = [
    {
      id: 1,
      image_url: '/assets/banners/banner1.jpg',
      title: '12.12 Sale',
      description: 'Up to 70% off on all items',
      button_text: 'Shop Now',
      button_link: '/products',
      secondary_button_text: 'Learn More',
      secondary_button_link: '/about',
      overlay_opacity: 50,
      title_color: '#FFFFFF',
      description_color: '#E5E7EB',
      button_style: 'primary',
      show_secondary_button: true,
      show_special_offer: true,
      special_offer_text: 'Special Offer'
    }
  ];

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await api.get('/banners');
        console.log('Banner response:', response.data); // Debug log
        if (response.status === 200 && response.data && response.data.length > 0) {
          // Ensure all required fields are present
          const processedSlides = response.data.map(slide => ({
            ...defaultSlides[0], // Use default values as fallback
            ...slide, // Override with actual data
            button_text: slide.button_text || 'Shop Now', // Fallback for button text
            button_link: slide.button_link || '#', // Fallback for button link
            secondary_button_text: slide.secondary_button_text || 'Learn More',
            secondary_button_link: slide.secondary_button_link || '#',
            button_style: slide.button_style || 'primary',
            // Convert to boolean explicitly
            show_secondary_button: Boolean(slide.show_secondary_button),
            show_special_offer: Boolean(slide.show_special_offer),
            special_offer_text: slide.special_offer_text || 'Special Offer'
          }));
          console.log('Processed slides:', processedSlides); // Debug log
          setSlides(processedSlides);
        } else {
          console.log('Using default slides'); // Debug log
          setSlides(defaultSlides);
        }
      } catch (err) {
        console.error('Error fetching banners:', err);
        setSlides(defaultSlides);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const getButtonClasses = (style, isSecondary = false) => {
    if (isSecondary) {
      return "px-8 py-3 border-2 border-white text-white rounded-full font-semibold tracking-wide hover:bg-white hover:text-black transition-colors duration-200";
    }

    switch (style) {
      case 'outline':
        return "group relative px-8 py-3 border-2 border-yellow-500 text-yellow-500 rounded-full overflow-hidden hover:text-black transition-colors duration-200";
      case 'minimal':
        return "group relative px-8 py-3 text-white rounded-full overflow-hidden hover:bg-white/10 transition-colors duration-200";
      default: // primary
        return "group relative px-8 py-3 bg-yellow-500 text-black rounded-full overflow-hidden";
    }
  };

  if (loading) {
    return (
      <div className="relative h-[500px] bg-gray-100 animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[700px] overflow-hidden bg-gray-100">
      <div className="relative h-full">
        <AnimatePresence mode="wait">
          {slides.map((slide, index) => (
            index === currentSlide && (
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <div className="relative h-full">
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent"
                    
                  >
                    <div className="container mx-auto h-full flex items-center">
                      <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="max-w-xl text-white px-6 md:px-0"
                      >
                        {slide.show_special_offer && (
                          <span 
                            className="text-yellow-400 font-medium tracking-wider uppercase text-sm mb-2 inline-block"
                          >
                            {slide.special_offer_text}
                          </span>
                        )}
                        <h2 
                          className="text-5xl md:text-6xl font-bold mb-4 leading-tight tracking-tight"
                          style={{ color: slide.title_color }}
                        >
                          {slide.title}
                        </h2>
                        <p 
                          className="text-xl mb-8 leading-relaxed font-light"
                          style={{ color: slide.description_color }}
                        >
                          {slide.description}
                        </p>
                        <div className="flex gap-4">
                          <Link 
                            to={slide.button_link || '#' }
                            className={getButtonClasses(slide.button_style)}
                          >
                            <span className="relative z-10 font-semibold tracking-wide">
                              {slide.button_text}
                            </span>
                            {slide.button_style === 'primary' && (
                              <div className="absolute inset-0 bg-yellow-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200" />
                            )}
                          </Link>
                          {slide.show_secondary_button && (
                            <Link 
                              to={slide.secondary_button_link || '#' }
                              className={getButtonClasses(slide.button_style, true)}
                            >
                              {slide.secondary_button_text}
                            </Link>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300 group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-3 rounded-full backdrop-blur-sm transition-all duration-300 group"
          >
            <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className="group"
              >
                <div className="h-1 w-10 rounded-full overflow-hidden bg-white/30">
                  <div
                    className={`h-full bg-yellow-500 transition-all duration-500 ${
                      index === currentSlide ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroSection;