import { Clipboard, Settings, Store, Camera, DollarSign, Star } from 'lucide-react'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function NewSellerGuide() {
    const [isGuideCompleted, setIsGuideCompleted] = useState(localStorage.getItem('newSellerGuideCompleted') === 'true')

  const steps = [
    { icon: Settings, text: "Customize profile", href: "#" },
    { icon: Store, text: "Create store", href: "/seller/seller-center/products/listings" },
    { icon: Camera, text: "Add photos", href: "#" },
  ]

  const handleDone = () => {
    setIsGuideCompleted(true)
    localStorage.setItem('newSellerGuideCompleted', 'true')
 }

  return (
    <Card className={`w-full max-w-full mx-auto overflow-hidden ${isGuideCompleted ? 'hidden' : ''}`}>
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">New Seller Guide</h2>
        <p className="text-yellow-100 text-lg">Your path to success ✨</p>
      </div>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {steps.map((step, index) => (
            <Link to={step.href} key={index} className="flex flex-col items-center bg-gray-50 p-4 py-8 rounded-lg shadow-sm transition-all hover:shadow-md hover:scale-105 text-center">
              <div className="bg-yellow-100 p-3 rounded-full mb-3">
                <step.icon className="text-yellow-600" size={24} />
              </div>
              <span className="text-gray-700 font-medium">{step.text}</span>
            </Link>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <button className="bg-yellow-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-yellow-600 transition-all" onClick={handleDone}>
            I&apos;ve Done All The Steps! 🎉
        </button>
      </CardFooter>
    </Card>
  )
}