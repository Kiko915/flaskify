const StepOne = ({ formData, handleChange }) => {
    return (
      <div>
        <h2 className="text-2xl mb-4">Personal Information</h2>
  
        <div className="mb-5">
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="block w-full mt-1 p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div className="mb-5">
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="block w-full mt-1 p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div className="mb-5">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="block w-full mt-1 p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
  
        <div className="mb-5">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="block w-full mt-1 p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
  
        <div className="mb-5">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="block w-full mt-1 p-3 border border-gray-300 rounded-lg"
            required
            maxLength={11}
          />
        </div>
      </div>
    );
  };
  
  export default StepOne;
  