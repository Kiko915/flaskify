import { Construction } from 'lucide-react';

export default function ConstructionPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50">
      {/* Container */}
      <div className="w-full max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
        {/* Image and Content Container */}
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full text-center">
          {/* Construction Icon */}
          <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Construction className="w-8 h-8 text-yellow-600" />
          </div>

          {/* Main Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent" />
            <img 
              src="/assets/flaskify_building.png" 
              alt="Page is under construction" 
              className="w-full max-w-md mx-auto object-contain animate-float"
            />
          </div>

          {/* Text Content */}
          <div className="mt-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Under Development
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              We're working hard to bring you something amazing! This page is currently under construction and will be available soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add this CSS to your global styles or component
const styles = `
@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
  100% {
    transform: translateY(0px);
  }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}
`;

// Add this style tag to your component or global CSS
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
