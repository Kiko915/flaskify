import { Star } from 'lucide-react';

// ... other imports ...

{/* Products Section */}
<div className="space-y-1">
  <Link
    to="/seller/seller-center/products"
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900",
      location.pathname === '/seller/seller-center/products' && 'bg-gray-100 text-gray-900'
    )}
  >
    <Package className="h-4 w-4" />
    <span>Products</span>
  </Link>
  <Link
    to="/seller/seller-center/products/reviews"
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900",
      location.pathname === '/seller/seller-center/products/reviews' && 'bg-gray-100 text-gray-900'
    )}
  >
    <Star className="h-4 w-4" />
    <span>Reviews</span>
  </Link>
</div> 