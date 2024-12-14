import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How do I track my order?",
      answer: "You can track your order by going to 'My Orders' in your account dashboard. Click on the specific order and you'll find the tracking information. You can also use the tracking number sent to your email."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept various payment methods including credit/debit cards (Visa, Mastercard), PayPal, bank transfers, and cash on delivery (for eligible locations). All payments are processed securely through our platform."
    },
    {
      question: "How can I return an item?",
      answer: "To return an item: 1) Go to 'My Orders' 2) Select the order containing the item 3) Click 'Return Item' 4) Follow the instructions to print the return label. Items must be returned within 14 days of delivery in their original condition."
    },
    {
      question: "How do I become a seller on Flaskify?",
      answer: "To become a seller: 1) Click 'Start Selling' at the top of the page 2) Complete the seller registration form 3) Verify your identity and business documents 4) Set up your shop profile 5) Start listing your products!"
    },
    {
      question: "What should I do if I haven't received my order?",
      answer: "If you haven't received your order by the estimated delivery date: 1) Check the tracking information 2) Contact the seller through the order details page 3) If no response within 24 hours, open a dispute through our customer service."
    },
    {
      question: "How secure is my personal information?",
      answer: "We take data security seriously. Your personal information is protected using industry-standard encryption. We never share your data with third parties without your consent and follow strict privacy guidelines in accordance with data protection regulations."
    },
    {
      question: "Can I change or cancel my order?",
      answer: "You can change or cancel your order within 1 hour of placing it. After that, the order enters processing and cannot be modified. Contact the seller directly if you need to make changes after this window."
    },
    {
      question: "How long does shipping take?",
      answer: "Shipping times vary depending on your location and the seller's location. Standard shipping typically takes 3-7 business days. Express shipping options are available for most items. Specific delivery estimates are shown at checkout."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            <button
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleFAQ(index)}
            >
              <span className="font-medium text-gray-800">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-[#062a51]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {openIndex === index && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQs; 