import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import banner from "/assets/flaskify-symbol-w-wordmark.png";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../utils/AuthContext"; // Add this import

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // Get login function from auth context

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await login({ email, password });
      
      if (result.success) {
        navigate('/', { replace: true });
        toast.success('Successfully logged in!');
        clearFields();
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error(error.message);
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    }
  }

  const clearFields = () => {
    setEmail("");
    setPassword("");
  }

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Flaskify | Log In</title>
      </Helmet>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column: Logo Banner */}
        <div className="hidden lg:flex items-center justify-center">
          <img src={banner} alt="flaskify logo" className="w-96" />
        </div>

        {/* Right Column: Login Form */}
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mx-auto">
          <h2 className="text-3xl font-semibold mb-6 text-gray-900">Log In</h2>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                placeholder="Enter your email"
                disabled={isSubmitting}
              />
            </div>
            <div className="mb-5 relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm pr-10"
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center mt-5 px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="mb-5 text-right">
              <Link to="/auth/forgot-password" className="text-sm text-yellow-500 hover:underline">
                Forgot Password?
              </Link>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {errorMessage}
              </div>
            )}

            <div className="mb-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full font-bold bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="animate-spin mx-auto w-10" /> : "Log In"}
              </button>
            </div>
            <div className="text-sm text-gray-500 text-center">
              <span>Don&apos;t have an account? </span>
              <Link to="/auth/signup" className="text-yellow-500 hover:underline">
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}