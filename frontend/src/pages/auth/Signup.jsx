import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import StepOne from "../../components/auth/S1";
import StepTwo from "../../components/auth/S2";
import StepThree from "../../components/auth/S3";
import "./step.css";
import { ArrowLeft, ArrowRight, Check, InfoIcon, Mail, MapPin, Phone, Send } from "lucide-react";
import toast from "react-hot-toast"
import StepVerifyEmail from "../../components/auth/emailVerify";

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    country: "",
    province: "",
    city: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
    isVerified: false // For phone verification
  });
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function checkEmail(email) {
    try {
      const response = await fetch("http://localhost:5555/check_email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
  
      const data = await response.json();

      console.log(data)
  
      if (response.status === 200) {
        return false; // Email is available
      } else if (response.status === 400) {
        return true; // Email already exists
      }
    } catch (error) {
      console.error("Error checking email:", error);
      toast.error("Server error while checking email.");
      return false;
    }
  }

  async function checkUsername(username) {
    try {
      const response = await fetch("http://localhost:5555/check_username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.status === 200) {
        return false; // Username is available
      } else if (response.status === 400) {
        return true; // Username already exists
      }
    } catch (error) {
      console.error("Error checking username:", error);
      toast.error("Server error while checking username.");
      return false;
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateStep = async () => {
    if (step === 1) {
      const emailUsed = await checkEmail(formData.email);
      const usernameCheck = await checkUsername(formData.username);
      
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.username) {
        toast.error("Full name,username, email, and phone are required");
        return false;
      }

      if (emailUsed) {
        toast.error("Email is already used");
        return false;
      }
      if (usernameCheck) {
        toast.error("Username is already used");
        return false;
      }

      if (!emailRegex.test(formData.email)) {
        toast.error("Invalid email format");
        return false;
      }
    }
  
    if (step === 3) {
      console.log("Verification Code:", formData.verificationCode);
      console.log("Phone Number:", formData.phone);
      
      if (!formData.email) {
        toast.error("Email is required");
        return false;
      }
    
      if (!formData.isVerified) {
        toast.error("Verification code is required");
        return false;
      }
    }
    

    if (step === 2) {
      if (
        !formData.country || 
        !formData.city || 
        !formData.province
      ) {
        toast.error("Complete address information first");
        return false;
      }
    }
    
  
    // Debugging step for passwords
    if (step === 4) {
      const passwordRequirements = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
      };
    
      const hasWeakPassword = Object.values(passwordRequirements).some(req => !req);
    
      if (hasWeakPassword) {
        toast.error('Password does not meet all requirements');
        return false;
      }
    
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match!');
        return false;
      }
    }

    return true;
  };
  

  const handleNext = async () => {
    const valid = await validateStep();
    if (valid) {
      setStep((prevStep) => prevStep + 1);
    }
  };

  const handlePrevious = () => {
    setStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Validate the final step (password matching)
    const valid = await validateStep();
    
    if (valid) {
      // If all steps are valid, prepare the form data for submission
      const formDataToSend = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        province: formData.province,
        city: formData.city,
        password: formData.password,
      };
  
      try {
        const response = await fetch("http://localhost:5555/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formDataToSend),
        });
  
        const data = await response.json();
  
        if (response.ok) {
          toast.success(data.message); // Show success message
          toast.success("You can now login with your credentials.");
          // Navigate to login after successful signup
          navigate("/auth/login");
        } else {
          throw new Error(data.message || "Signup failed");
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Failed to signup.");
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Please fix the issues in the form before submitting.");
      setIsLoading(false);
    }
  };
  
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value })); // `.trim()` added to prevent extra spaces
  };
  

  const renderStepIndicator = () => {
    return (
      <div className="flex justify-center items-center mb-8">
        <div className={`step ${step === 1 ? "active" : ""}`}><InfoIcon /></div>
        <div className="line"></div>
        <div className={`step ${step === 2 ? "active" : ""}`}><MapPin /></div>
        <div className="line"></div>
        <div className={`step ${step === 3 ? "active" : ""}`}><Mail /></div>
        <div className="line"></div>
        <div className={`step ${step === 4 ? "active" : ""}`}><Check /></div>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Flaskify | Sign Up</title>
      </Helmet>

      <div className="min-h-screen flex justify-center items-center">
        <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
          {/* Flastify Branding */}
          <div className="text-center mb-6">
            <img src="/assets/flaskify-wordmark.png" className="w-44 mx-auto" alt="Flaskify Logo" />
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {alert.message && <div className={`alert alert-${alert.type}`}>{alert.message}</div>}

          <form onSubmit={handleSubmit}>
            {step === 1 && <StepOne formData={formData} handleChange={handleChange} />}
            {step === 2 && <StepTwo formData={formData} handleChange={handleChange} />}
            {step === 3 && <StepVerifyEmail formData={formData} handleChange={handleChange} />}
            {step === 4 && <StepThree formData={formData} handleChange={handleChange} />}

            <div className="flex justify-between mt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="btn border-[#062a51] border-2 text-[#062a51] p-2 px-4 rounded hover:font-semibold inline-flex items-center gap-1"
                >
                  <ArrowLeft /> Previous
                </button>
              )}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn bg-yellow-400 hover:font-semibold p-2 px-4 rounded inline-flex items-center gap-1"
                >
                  Next <ArrowRight />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn hover:font-semibold bg-green-600 inline-flex items-center gap-1 hover:bg-green-700 p-2 px-4 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Submitting" : "Submit"} <Send />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SignUp;
