import { useState } from 'react';
import { Mail, ShieldCheck, Lock, ArrowLeft } from 'lucide-react';
import UserCard from '../../../components/user/UserCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/utils/AuthContext';

const ChangePassword = () => {
  const { user } = useAuth();
  const [step, setStep] = useState('initial'); // initial, otp, password
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState(user?.email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5555/send_otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }
      
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOTP = [...otp];
    newOTP[index] = value;
    setOtp(newOTP);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5555/verify_otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otp.join('')
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid OTP');
      }
      
      if (data.success) {
        setStep('password');
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (err) {
      setError(err.message);
      // Clear OTP fields on error
      setOtp(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      if (!/[A-Z]/.test(password)) {
        throw new Error('Password must contain at least one uppercase letter');
      }
      if (!/[0-9]/.test(password)) {
        throw new Error('Password must contain at least one number');
      }
      if (!/[!@#$%^&*]/.test(password)) {
        throw new Error('Password must contain at least one special character');
      }
      
      // You'll need to implement this endpoint in your backend
      const response = await fetch('http://localhost:5555/auth/change_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      
      setStep('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderInitialStep = () => (
    <div className="bg-white md:max-w-xl px-6 mx-auto py-12 rounded-lg shadow-lg text-center flex items-center justify-center flex-col gap-4">
      <ShieldCheck size={120} className="text-yellow-500" />
      <p className="text-sm md:text-lg">To protect your account security, please verify your identity.</p>
      <button
        className="inline-flex items-center gap-3 mt-6 hover:border-yellow-500 hover:text-yellow-500 border-2 px-4 py-2"
        onClick={handleSendOTP}
        disabled={loading || !email}
      >
        <Mail /> Verify by Email Link
      </button>
    </div>
  );

  const renderOTPStep = () => (
    <div className="bg-white md:max-w-xl px-6 mx-auto py-12 rounded-lg shadow-lg text-center flex items-center justify-center flex-col gap-4">
      <div className="flex flex-col items-center gap-4 w-full">
        <h3 className="text-xl font-semibold">Enter Verification Code</h3>
        <p className="text-sm text-gray-600">We've sent a code to your email</p>
        
        <div className="flex gap-2 my-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength={1}
              className="w-12 h-12 text-center border-2 rounded-lg text-xl"
              value={digit}
              onChange={(e) => handleOTPChange(index, e.target.value)}
            />
          ))}
        </div>
        
        <button
          className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 disabled:bg-gray-300"
          onClick={handleVerifyOTP}
          disabled={loading || otp.join('').length !== 6}
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>
        
        <button
          className="text-sm text-gray-600 hover:text-yellow-500 mt-4"
          onClick={() => setStep('initial')}
        >
          <span className="inline-flex items-center gap-1">
            <ArrowLeft size={16} /> Back
          </span>
        </button>
      </div>
    </div>
  );

  const renderPasswordStep = () => (
    <div className="bg-white md:max-w-xl px-6 mx-auto py-12 rounded-lg shadow-lg text-center flex items-center justify-center flex-col gap-4">
      <Lock size={64} className="text-yellow-500" />
      <h3 className="text-xl font-semibold">Set New Password</h3>
      
      <div className="w-full space-y-4 mt-4">
        <input
          type="password"
          placeholder="New Password"
          className="w-full px-4 py-2 border rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          className="w-full px-4 py-2 border rounded-lg"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <div id="password-requirements" className="text-sm text-gray-600 mt-2">
        Password must be at least 8 characters long and contain an uppercase letter, a number, and a special character
        <br />
      </div>
      
      <button
        className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 mt-6 disabled:bg-gray-300"
        onClick={handleChangePassword}
        disabled={loading || !password || !confirmPassword}
      >
        {loading ? 'Changing Password...' : 'Change Password'}
      </button>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="bg-white md:max-w-xl px-6 mx-auto py-12 rounded-lg shadow-lg text-center flex items-center justify-center flex-col gap-4">
      <ShieldCheck size={64} className="text-green-500" />
      <h3 className="text-xl font-semibold">Password Changed Successfully</h3>
      <p className="text-sm text-gray-600">Your password has been updated. You can now log in with your new password.</p>
    </div>
  );

  return (
    <UserCard title="Change Password" short_description="Change your account password">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {step === 'initial' && renderInitialStep()}
      {step === 'otp' && renderOTPStep()}
      {step === 'password' && renderPasswordStep()}
      {step === 'success' && renderSuccessStep()}
    </UserCard>
  );
};

export default ChangePassword;