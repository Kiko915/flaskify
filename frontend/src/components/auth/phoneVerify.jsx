import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

const StepVerifyPhone = ({ formData, handleChange }) => {
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(90);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    let countdown;
    if (isCodeSent && timer > 0) {
      countdown = setInterval(() => {
        setTimer((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(countdown);
    }

    return () => clearInterval(countdown);
  }, [isCodeSent, timer]);

  const sendVerificationCode = async () => {
    try {
      setIsCodeSent(true);
      setCanResend(false);
      setTimer(60);
      toast.success("Verification Code sent successfully!")
    } catch (error) {
      toast.error("Failed to send verification code.");
    }
  };

  const verifyCode = async () => {
    try {
      const isValid = true; // Mock success response
      if (isValid) {
        toast.success("Phone number verified successfully!");
      } else {
        toast.error("Invalid verification code.");
      }
    } catch (error) {
      toast.error("Failed to verify the code.");
    }
  };

  const handleInputChange = (e, index) => {
    const value = e.target.value;

    if (/^\d$/.test(value) || value === "") {
      let updatedCode = [...verificationCode];
      updatedCode[index] = value;
      setVerificationCode(updatedCode);

      if (value && index < 5) {
        inputRefs.current[index + 1].focus();
      }

      if (updatedCode.join("").length === 6) {
        verifyCode(); // Automatically verify when all inputs are filled
      }
    }
  };

  const handleBackspace = (e, index) => {
    if (e.key === "Backspace" && index > 0 && verificationCode[index] === "") {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Phone Verification</h2>

      <div className="mb-4">
        <label htmlFor="phone" className="block font-medium mb-2">
          Phone Number
        </label>
        <input
          type="text"
          name="phone"
          id="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 disabled:text-gray-300 disabled:cursor-not-allowed"
          disabled={isCodeSent}
        />
      </div>

      {isCodeSent && (
        <div className="mb-4">
          <label className="block font-medium mb-2">Enter PIN</label>
          <div className="flex space-x-2 justify-center">
            {verificationCode.map((digit, index) => (
              <input
                key={index}
                type="text"
                value={digit}
                onChange={(e) => handleInputChange(e, index)}
                onKeyDown={(e) => handleBackspace(e, index)}
                ref={(el) => (inputRefs.current[index] = el)}
                maxLength="1"
                className="w-12 h-12 text-center text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>
        </div>
      )}

      {isCodeSent ? (
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={sendVerificationCode}
            className={`btn ${canResend ? "bg-blue-500" : "bg-gray-400"} text-white p-2 rounded`}
            disabled={!canResend}
          >
            {canResend ? "Resend Code" : `Resend in ${timer}s`}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={sendVerificationCode}
          className="btn bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Send Verification Code
        </button>
      )}
    </div>
  );
};

export default StepVerifyPhone;
