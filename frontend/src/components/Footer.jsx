const Footer = () => {
    return (
      <footer className="bg-gray-100 text-gray-600 py-8 px-4 lg:px-16">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* All Menu Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4">All Menu</h4>
            <ul>
              <li><a href="/" className="hover:underline">Home</a></li>
              <li><a href="/shop" className="hover:underline">Shop</a></li>
              <li><a href="/categories" className="hover:underline">Categories</a></li>
              <li><a href="/blog" className="hover:underline">Blog</a></li>
              <li><a href="/contact" className="hover:underline">Contact</a></li>
            </ul>
          </div>
  
          {/* Categories Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Categories</h4>
            <ul>
              <li><a href="/categories/clothes" className="hover:underline">Clothes</a></li>
              <li><a href="/categories/shoes" className="hover:underline">Shoes</a></li>
              <li><a href="/categories/accessories" className="hover:underline">Accessories</a></li>
              <li><a href="/categories/watches" className="hover:underline">Watches</a></li>
              <li><a href="/categories/sunglasses" className="hover:underline">Sunglasses</a></li>
            </ul>
          </div>
  
          {/* Account Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Account</h4>
            <ul>
              <li><a href="/auth/signup" className="hover:underline">Sign In / Sign Up</a></li>
              <li><a href="/dashboard" className="hover:underline">Dashboard</a></li>
              <li><a href="/orders" className="hover:underline">Track Order</a></li>
              <li><a href="/wishlist" className="hover:underline">Wishlist</a></li>
              <li><a href="/checkout" className="hover:underline">Checkout</a></li>
            </ul>
          </div>
  
          {/* Contact Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul>
              <li>📞 <a href="tel:+63999999999" className="hover:underline">+63 999 9999</a></li>
              <li>📧 <a href="mailto:info@flaskify.com" className="hover:underline">info@flaskify.com</a></li>
              <li>📍 083 Rizal Street, Liliw, Laguna, Philippines</li>
            </ul>
          </div>
        </div>
  
        {/* Footer Bottom Section */}
        <div className="border-t mt-8 pt-4 text-gray-500 text-center lg:flex lg:justify-between lg:items-center">
          <div>
            <p>© 2024 Flaskify. All Rights Reserved.</p>
          </div>
          <div className="flex justify-center lg:justify-end mt-4 lg:mt-0 gap-4">
            <img src="/assets/visa.png" alt="Visa" className="h-10" />
            <img src="/assets/mastercard.png" alt="Mastercard" className="h-10" />
            <img src="/assets/paypal.png" alt="Paypal" className="h-10" />
            <img src="/assets/stripe.png" alt="Paypal" className="h-10" />
            {/* Add more payment icons as needed */}
          </div>
        </div>
      </footer>
    );
  };
  
  export default Footer;
  