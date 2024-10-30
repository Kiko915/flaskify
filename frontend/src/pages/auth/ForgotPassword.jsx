import { useState } from "react";
import toast from "react-hot-toast";

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
  
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          const response = await fetch('http://localhost:5555/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
      
          // Check if response was successful
          if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.message || 'An error occurred');
            toast.error(errorData.message || 'An error occurred');
            setMessage('');
            return;
          }
      
          const data = await response.json();
          setMessage(data.message);
          toast.success(data.message);
          setError('');
        } catch (err) {
          setError('An error occurred');
          toast.error('An error occurred');
          setMessage('');
        } finally {
            setLoading(false);
        }
      };
  
    return (
    <div className="h-screen flex items-center justify-center">
      <div className="max-w-lg flex-1 mx-auto mt-10 p-6 my-12 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Forgot Password</h2>
        
        {message && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{message}</div>}
        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
    );
};

export default ForgotPassword;