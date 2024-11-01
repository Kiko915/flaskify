import FCarousel from "@/components/misc/FCarousel";
import { Helmet } from "react-helmet-async";

export default function SellerRegister() {
  return (
    <>
      <Helmet>
        <title>Flaskify | Seller Registration</title>
        <meta name="description" content="Seller Registration" />
        <link rel="canonical" href="/seller/register" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="bingbot" content="index, follow" />
      </Helmet>
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col lg:flex-row min-h-screen">
          {/* Form Column */}
          <div className="w-full lg:w-1/2 px-4 py-8 lg:px-12 xl:px-16">
            <div className="max-w-lg mx-auto">
              {/* Header Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Selling on Flaskify</h1>
                <p className="text-gray-600">Be one of the successful sellers on our platform</p>
              </div>

              {/* Form Section */}
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner's Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Address</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Business Type</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  >
                    <option>Retail</option>
                    <option>Wholesale</option>
                    <option>Manufacturing</option>
                    <option>Service</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    I agree to the terms and conditions
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-yellow-500 text-white py-3 px-4 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors"
                >
                  Register as Seller
                </button>
              </form>
            </div>
          </div>

          {/* Image/Carousel Column */}
          <div className="hidden lg:block w-1/2 bg-yellow-500">
            <div className="h-full flex items-center justify-center relative">
              {/* Example static content - replace with your carousel/image */}
              <div className="text-center p-8">
                <div className="space-y-6 text-white">
                  <h2 className="text-3xl font-bold">Why Sell on Flaskify?</h2>
                  <FCarousel />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}