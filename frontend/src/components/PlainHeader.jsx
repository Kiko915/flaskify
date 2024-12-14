import { HelpCircle } from 'lucide-react';
import simplelogo from '/assets/flaskify-wordmark-noslogan.png';
import { Link, useLocation } from 'react-router-dom';

export default function PlainHeader() {
  const location = useLocation();

  const pageIdentifier = () => {
    if (location.pathname === "/auth/signup") {
      return "Sign Up";
    } else if (location.pathname === "/auth/login") {
      return "Log In";
    } else if (location.pathname === "/auth/forgot-password") {
      return "Forgot Password";
    } else if (location.pathname === "/auth/reset-password") {
      return "Reset Password";
    } else if (location.pathname === "/seller/register") {
      return "Start Selling";
    }
  };

  return (
    <div className="bg-white shadow-sm">
      {/* Top bar */}
      <div className="bg-[#062a51] text-white/90">
        <div className="container mx-auto px-4 lg:px-32 py-1.5">
          <div className="flex justify-end text-xs">
            <Link to="/help" className="hover:text-white transition-colors flex items-center gap-1">
              <HelpCircle size={14} />
              <span>Need Help?</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="container mx-auto px-4 lg:px-32 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/">
              <img 
                src={simplelogo} 
                alt="flaskify logo" 
                className="h-8 lg:h-10 w-auto"
              />
            </Link>
            <div className="h-8 w-[1px] bg-gray-200 hidden sm:block"></div>
            <h2 className="text-gray-800 font-medium text-xl hidden sm:block">
              {pageIdentifier()}
            </h2>
          </div>

          {/* Mobile page identifier */}
          <h2 className="text-gray-800 font-medium text-lg sm:hidden">
            {pageIdentifier()}
          </h2>
        </div>
      </header>
    </div>
  );
}
