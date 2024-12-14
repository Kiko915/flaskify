import { Search, ChevronRight, Phone, Mail, MessageCircle, FileQuestion, BookOpen, ShieldCheck, CreditCard, Package, UserCog } from 'lucide-react';
import FAQs from '../components/help/FAQs';

export default function Help() {
  const commonTopics = [
    {
      icon: <Package className="w-6 h-6" />,
      title: "Orders & Shipping",
      description: "Track orders, shipping info, and returns",
      links: ["Track My Order", "Shipping Policy", "Returns & Refunds", "Order Cancellation"]
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Payments",
      description: "Payment methods and transactions",
      links: ["Payment Methods", "Transaction Issues", "Refund Status", "Payment Security"]
    },
    {
      icon: <UserCog className="w-6 h-6" />,
      title: "Account & Profile",
      description: "Manage your account settings",
      links: ["Account Settings", "Login Issues", "Privacy Settings", "Account Security"]
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Security & Privacy",
      description: "Keep your account safe",
      links: ["Security Tips", "Privacy Policy", "Report an Issue", "Data Protection"]
    }
  ];

  const contactMethods = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Live Chat",
      description: "Chat with our support team",
      availability: "24/7 Available"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "Get help via email",
      availability: "Response within 24 hours"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone Support",
      description: "Speak with our team",
      availability: "Mon-Fri, 9AM-6PM"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#062a51] to-[#0a4281] text-white py-16 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-400/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-1/2 -right-8 w-32 h-32 bg-blue-400/10 rounded-full blur-xl animate-pulse delay-700"></div>
          <div className="absolute bottom-0 left-1/3 w-28 h-28 bg-yellow-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 lg:px-32 relative">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6 animate-fadeIn">
              <div className="bg-white/95 px-6 py-3 rounded-lg shadow-lg flex items-center">
                <img 
                  src="/assets/flaskify-primary.png" 
                  alt="Flaskify" 
                  className="h-8"
                />
                <div className="mx-3 h-6 w-px bg-gray-300"></div>
                <span className="text-gray-800 font-semibold text-xl">Help</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 animate-slideDown">
              How can we help you?
            </h1>
            <p className="text-gray-200 mb-8 animate-slideDown animation-delay-200">
              Search our knowledge base or browse common topics below
            </p>
            <div className="relative transform transition-all duration-300 hover:scale-[1.02]">
              <input
                type="text"
                placeholder="Search for help..."
                className="w-full px-6 py-4 rounded-lg text-gray-800 bg-white/95 focus:outline-none focus:ring-2 focus:ring-yellow-400 pl-12 transition-shadow duration-300 shadow-lg hover:shadow-xl"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Common Topics */}
      <div className="container mx-auto px-4 lg:px-32 py-16">
        <h2 className="text-2xl font-semibold mb-8">Common Topics</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {commonTopics.map((topic, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-[#062a51] mb-4">{topic.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{topic.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{topic.description}</p>
              <ul className="space-y-2">
                {topic.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a href="#" className="text-sm text-[#062a51] hover:underline flex items-center gap-1">
                      {link}
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Methods */}
      <div className="container mx-auto px-4 lg:px-32 pb-16">
        <h2 className="text-2xl font-semibold mb-8">Contact Us</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {contactMethods.map((method, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-[#062a51] mb-4">{method.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{method.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{method.description}</p>
              <span className="text-sm text-[#062a51] font-medium">{method.availability}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section - Replace the existing Help Resources section */}
      <div className="bg-white border-t">
        <div className="container mx-auto px-4 lg:px-32 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find quick answers to common questions about using Flaskify
            </p>
          </div>
          
          <FAQs />
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-[#062a51] hover:text-[#062a51]/80 font-medium transition-colors"
            >
              Contact our support team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 