import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

const StepVerifyEmail = ({ formData, handleChange }) => {
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(90); // Set default timer to 90 seconds
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

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
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5555/send_otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        setIsCodeSent(true);
        setCanResend(false);
        setTimer(90); // Reset timer to 90 seconds after sending code
        toast.success("Verification code sent to your email successfully!");
      } else {
        throw new Error("Failed to send verification code.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setVerifying(true);
    const enteredCode = verificationCode.join("");
  
    if (enteredCode.length < 6) {
      toast.error("Please enter the full 6-digit code.");
      setVerifying(false);
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5555/verify_otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp: enteredCode,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) { // Now just check if the response status is OK
        toast.success(data.message || "Email verified successfully!");
        formData.verificationCode = enteredCode;
        formData.isVerified = true;
      } else {
        toast.error(data.message || "Invalid verification code.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to verify the code.");
    } finally {
        setVerifying(false);
    }
  };
  

  const handleInputChange = (e, index) => {
    const value = e.target.value;

    if (/^\d$/.test(value) || value === "") {
      let updatedCode = [...verificationCode];
      updatedCode[index] = value;
      setVerificationCode(updatedCode);

      if (value && index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    } else {
      toast.error("Please enter only numbers");
    }
  };

  const handleBackspace = (e, index) => {
    if (e.key === "Backspace" && index > 0 && verificationCode[index] === "") {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Email Verification</h2>

      <div className="mb-4">
        <label htmlFor="email" className="block font-medium mb-2">
          Email Address
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 disabled:text-gray-300 disabled:cursor-not-allowed"
          disabled={isCodeSent}
        />
      </div>

      {isCodeSent && (
        <div className="mb-4">
          <label className="block font-medium mb-2">Enter Verification Code</label>
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
        <div className="flex items-center flex-col justify-between mt-4">
          <span>Verification code sent to your email, The code will expire in 10mins.</span>
          <button
            type="button"
            onClick={sendVerificationCode}
            className={`btn ${canResend ? "bg-blue-500" : "bg-gray-400"} text-white p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={!canResend || loading}
          >
            {canResend ? "Resend Code" : `Resend in ${timer}s`}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={sendVerificationCode}
          className="btn bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {!loading ? "Send Verification Code" : "Sending..."}
        </button>
      )}

      {isCodeSent && (
        <button
          type="button"
          onClick={verifyCode}
          disabled={verifying}
          className="btn bg-green-500 text-white p-2 rounded hover:bg-green-600 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!verifying ? "Verify Code" : "Verifying..."}
        </button>
      )}
    </div>
  );
};

export default StepVerifyEmail;
