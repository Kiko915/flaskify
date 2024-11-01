import { useState, useEffect } from 'react';

const FCarousel = () => {
  // Sample images (replace with your actual image paths)
  const images = [
    "/assets/carousel/flaskify-carousel-1.png",
    "/assets/carousel/flaskify-carousel-2.png",
    "/assets/carousel/flaskify-carousel-3.png",
    "/assets/carousel/flaskify-carousel-4.png"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        (prevIndex + 1) % images.length
      );
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full my-4 mx-auto overflow-hidden">
      {/* Carousel Container */}
      <div className="relative w-[500px] h-[400px] overflow-hidden">
        {images.map((image, index) => (
          <div 
            key={index} 
            className={`
              absolute w-full h-full transition-transform duration-700 ease-in-out
              ${index === currentIndex 
                ? 'translate-x-0 opacity-100' 
                : index > currentIndex 
                  ? 'translate-x-full opacity-0' 
                  : '-translate-x-full opacity-0'
              }
            `}
          >
            <img 
              src={image} 
              alt={`Slide ${index + 1}`} 
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              w-3 h-3 rounded-full 
              ${index === currentIndex 
                ? 'bg-black' : 'bg-gray-300'
              }
            `}
          />
        ))}
      </div>
    </div>
  );
};

export default FCarousel;