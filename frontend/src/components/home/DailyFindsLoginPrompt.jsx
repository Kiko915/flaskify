import { Link } from 'react-router-dom';
import { ShoppingBag, Gift, Percent, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DailyFindsLoginPrompt = () => {
  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-[#062a51] to-[#1e4976] rounded-xl overflow-hidden shadow-lg">
          <div className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              {/* Left side - Text Content */}
              <div className="text-white text-center md:text-left">
                <h2 className="text-3xl font-bold mb-4">
                  Daily Special Finds
                </h2>
                <p className="text-gray-200 text-lg mb-6">
                  Log in now to unlock exclusive deals!
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <Percent className="w-5 h-5 text-yellow-300" />
                    </div>
                    <span className="text-sm">Daily Discounts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <Gift className="w-5 h-5 text-yellow-300" />
                    </div>
                    <span className="text-sm">Special Offers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <ShoppingBag className="w-5 h-5 text-yellow-300" />
                    </div>
                    <span className="text-sm">Flash Sales</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-yellow-300" />
                    </div>
                    <span className="text-sm">Trending Deals</span>
                  </div>
                </div>
                <Link to="/auth/login">
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-[#062a51] font-semibold px-8 py-6 h-auto text-lg shadow-lg transition-transform hover:scale-105">
                    Login to View Daily Finds
                  </Button>
                </Link>
              </div>

              {/* Right side - Decorative Image */}
              <div className="hidden md:block relative">
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-yellow-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-yellow-500 rounded-full opacity-20 animate-pulse delay-300"></div>
                <img 
                  src="/assets/flaskify-primary.png" 
                  alt="Flaskify" 
                  className="w-72 h-72 object-contain relative drop-shadow-xl transform hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>

          {/* Bottom Banner */}
          <div className="bg-yellow-500 py-3 px-6">
            <p className="text-center text-[#062a51] font-medium">
              🎉 New users get an extra 10% off their first purchase!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyFindsLoginPrompt; 