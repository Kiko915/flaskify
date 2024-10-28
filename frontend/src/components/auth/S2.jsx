import Select from "react-select";
import countryList from "react-select-country-list";

const StepTwo = ({ formData, handleChange }) => {
  const countryOptions = countryList().getData();

  return (
    <div>
      <h2 className="text-2xl mb-4">Address Information</h2>

      <div className="mb-5">
        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
          Country
        </label>
        <Select
          name="country"
          options={countryOptions}
          onChange={(selectedOption) => handleChange({ target: { name: "country", value: selectedOption.value } })}
          value={countryOptions.find((option) => option.value === formData.country)}
        />
      </div>

      <div className="mb-5">
        <label htmlFor="province" className="block text-sm font-medium text-gray-700">
          Province
        </label>
        <input
          type="text"
          id="province"
          name="province"
          value={formData.province}
          onChange={handleChange}
          className="block w-full mt-1 p-3 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div className="mb-5">
        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
          City/Town
        </label>
        <input
          type="text"
          id="city"
          name="city"
          value={formData.city}
          onChange={handleChange}
          className="block w-full mt-1 p-3 border border-gray-300 rounded-lg"
          required
        />
      </div>
    </div>
  );
};

export default StepTwo;
