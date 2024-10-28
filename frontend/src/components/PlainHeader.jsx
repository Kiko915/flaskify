import { HelpCircle } from 'lucide-react';
import simplelogo from '/assets/flaskify-wordmark-noslogan.png';
import { Link, useLocation } from 'react-router-dom';

export default function PlainHeader() {
  const location = useLocation();

  return (
    <header className="bg-white border-b w-full sticky top-0 z-10 flex items-center justify-between py-4 px-4 md:px-8 lg:px-40">
      <div className="flex items-end gap-2">
        <Link to="/">
          <img src={simplelogo} alt="flaskify logo" className="w-28 md:w-36 lg:w-40" />
        </Link>
        <h2 className="font-medium text-xl md:text-2xl mb-1">
          | {location.pathname === "/auth/signup" ? "Sign Up" : "Log In"}
        </h2>
      </div>
      <div>
        <Link to="/" className="flex items-center gap-1">
          <HelpCircle strokeWidth={1.5} />
          <span className="hidden sm:inline">Help</span>
        </Link>
      </div>
    </header>
  );
}
