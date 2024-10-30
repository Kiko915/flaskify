import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { token } = useParams();
    const navigate = useNavigate();
  
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
      
        try {
          const response = await fetch('http://localhost:5555/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password })
          });
      
          // Check if response is successful
          if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.message || 'An error occurred');
            setMessage('');
            return;
          }
      
          const data = await response.json();
          setMessage(data.message);
          setError('');
      
          // Redirect to login after a successful password reset
          setTimeout(() => navigate('/auth/login'), 3000);
        } catch (err) {
          setError('An error occurred');
          setMessage('');
        } finally {
            setLoading(false);
        }
      };
      
  
    return (
      <div className="max-w-md mx-auto mt-10 p-6 my-28 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Reset Password</h2>
        
        {message && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{message}</div>}
        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
              minLength="8"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
              minLength="8"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed" 
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    );
  };

export default ResetPassword;