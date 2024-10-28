import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';

const StepThree = ({ formData, handleChange }) => {
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  const validatePassword = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  };

  const getPasswordStrengthScore = () => {
    const requirements = Object.values(passwordStrength);
    const metRequirements = requirements.filter(Boolean).length;
    return (metRequirements / requirements.length) * 100;
  };

  useEffect(() => {
    setPasswordStrength(validatePassword(formData.password || ''));
  }, [formData.password]);

  const RequirementRow = ({ met, text }) => (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-red-500" />
      )}
      <span className={met ? 'text-green-700' : 'text-gray-600'}>
        {text}
      </span>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl mb-4">Set Your Password</h2>

      <div className="mb-5">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="block w-full mt-1 p-3 border border-gray-300 rounded-lg"
          required
        />
        
        {/* Password strength indicator */}
        <div className="mt-2">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${getPasswordStrengthScore()}%`,
                backgroundColor: getPasswordStrengthScore() <= 33 ? '#ef4444' : 
                                getPasswordStrengthScore() <= 66 ? '#f59e0b' : 
                                '#22c55e'
              }}
            />
          </div>
          
          {/* Password requirements list */}
          <div className="mt-3 space-y-2">
            <RequirementRow met={passwordStrength.length} text="At least 8 characters long" />
            <RequirementRow met={passwordStrength.uppercase} text="Contains uppercase letter" />
            <RequirementRow met={passwordStrength.lowercase} text="Contains lowercase letter" />
            <RequirementRow met={passwordStrength.number} text="Contains number" />
            <RequirementRow met={passwordStrength.special} text="Contains special character" />
          </div>
        </div>
      </div>

      <div className="mb-5">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="block w-full mt-1 p-3 border border-gray-300 rounded-lg"
          required
        />
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
        )}
      </div>
    </div>
  );
};

export default StepThree;