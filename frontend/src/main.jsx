import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx'
import './index.css'
import ErrorPage from './pages/ErrorPage.jsx';
import Signup from './pages/auth/Signup.jsx';
import Login from './pages/auth/Login.jsx';
import { HelmetProvider } from 'react-helmet-async';
import '@fontsource/roboto';
import AuthLayout from './layouts/AuthLayout.jsx';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './utils/AuthContext.jsx';
import { CartProvider } from './app/CartContext.jsx';
import Profile from './pages/Profile.jsx';
import ProtectedRoute from './pages/auth/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import CategoriesPage from './pages/CategoriesPage.jsx';
import UserLayout from './layouts/UserLayout.jsx';
import PublicRoute from './components/auth/PublicRoute.jsx';
import UserErrors from './components/errors/UserErrors.jsx';
import Purchase from './pages/user/purchases/Purchase.jsx';
import BanksCards from './pages/user/profile/BanksCards.jsx';
import Addresses from './pages/user/profile/Addresses.jsx';
import ChangePassword from './pages/user/profile/ChangePassword.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import SellerLayout from './layouts/SellerLayout.jsx';
import SellerRegister from './pages/seller/SellerRegister.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import { ROLES } from './utils/Enum.js';
import SellerManagement from './pages/admin/seller-management/SellerManagement.jsx';
import SellerVerifications from './pages/admin/seller-management/SellerVerifications.jsx';
import SellerCenter from './layouts/SellerCenter.jsx';
import SellerDashboard from './pages/seller/seller-center/SellerDashboard.jsx';
import ShopInfo from './pages/seller/seller-center/shop/ShopInfo.jsx';
import NewShop from './pages/seller/seller-center/shop/NewShop.jsx';
import EditShop from './pages/seller/seller-center/shop/EditShop.jsx';
import ShopDetail from './pages/seller/seller-center/shop/ShopDetail.jsx';
import AddProduct from './pages/seller/seller-center/shop/AddProduct.jsx';
import ProductDetail from './pages/seller/seller-center/products/ProductDetail.jsx';
import EditProduct from './pages/seller/seller-center/products/EditProduct.jsx';
import InventoryManagement from './pages/seller/seller-center/products/InventoryManagement.jsx';
import ProductInventory from './pages/seller/seller-center/products/ProductInventory.jsx';
import Dashboard from "./pages/admin/dashboard/Dashboard";
import UsersPage from './pages/admin/users/UsersPage';
import SellersPage from './pages/admin/sellers/SellersPage.jsx';
import ProductManagement from './pages/seller/seller-center/products/ProductManagement.jsx';
import ArchivedProducts from './pages/seller/seller-center/products/ArchivedProducts.jsx';
import CategoryManagement from './pages/seller/seller-center/categories/CategoryManagement.jsx';
import ShippingProviders from './pages/admin/shipping/ShippingProviders.jsx';
import ShippingRates from './pages/admin/shipping/ShippingRates.jsx';
import Help from './pages/Help.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import DiscountManagement from './pages/seller/seller-center/marketing/DiscountManagement';
import SearchResults from './pages/SearchResults.jsx';
import ProductPage from './pages/ProductPage.jsx';
import WishlistView from './components/WishlistView.jsx';
import ContactManagement from './pages/admin/contacts/ContactManagement';
import NewsletterManagement from './pages/admin/newsletter/NewsletterManagement';
import CartPage from './pages/CartPage';
import BannerManagement from './pages/admin/banners/BannerManagement';
import Shop from './pages/Shop/Shop.jsx';
import Checkout from './pages/checkout/Checkout.jsx';
import PayPal from './pages/payment/PayPal';
import Card from './pages/payment/Card';
import Orders from './pages/seller/Orders.jsx';
import CancellationRequests from './pages/seller/CancellationRequests';
import ProductReviews from './pages/seller/ProductReviews';
import SellerReviews from './pages/seller/seller-center/SellerReviews.jsx';
import Messages from './pages/Messages.jsx';
import SellerChats from './pages/seller/seller-center/SellerChats.jsx';
import MyIncome from './pages/seller/MyIncome';
import MyBalance from './pages/seller/MyBalance';
import BankAccounts from './pages/seller/BankAccounts';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/auth",
        element: <PublicRoute><AuthLayout /></PublicRoute>,
        children: [
          {
            path: "/auth/signup",
            element: <Signup />
          },
          {
            path: "/auth/login",
            element: <Login />
          },
          {
            path: "/auth/forgot-password",
            element: <ForgotPassword />
          },
          {
            path: "/auth/reset-password/:token",
            element: <ResetPassword />
          }
        ]
      },
      {
        path: "/",
        element: <Home />
      },
      {
        path: "/messages",
        element: <ProtectedRoute><Messages /></ProtectedRoute>
      },
      {
        path: "/unauthorized",
        element: <p>Unauthorized to view this Page</p>
      },
      {
        path: "/user",
        element: <ProtectedRoute><UserLayout /></ProtectedRoute>,
        errorElement: <UserErrors />,
        children: [
          {
            path: "account",
            element: <Profile />
          },
          {
            path: "account/payment-methods",
            element: <BanksCards />
          },
          {
            path: "account/addresses",
            element: <Addresses />
          },
          {
            path: "account/change-password",
            element: <ChangePassword />
          },
          {
            path: "purchases",
            element: <Purchase />
          },
          {
            path: "purchases/cancellation-requests",
            element: <CancellationRequests />
          },
          {
            path: "notifications",
            element: <div>Notifications Page</div>
          },
          {
            path: "vouchers",
            element: <div>Vouchers Page</div>
          }
        ]
      },
      {
        path: "/seller",
        element: <ProtectedRoute><SellerLayout /></ProtectedRoute>,
        children: [
          {
            path: "register",
            element: <AuthLayout />,
            children: [
              {
                index: true,
                element: <SellerRegister />
              }
            ]
          },
          {
            path: "seller-center",
            element: <ProtectedRoute roles={[ROLES.SELLER]}><SellerCenter /></ProtectedRoute>,
            children: [
              {
                index: true,
                element: <SellerDashboard />
              },
              {
                path: "orders",
                element: <Orders />
              },
              {
                path: "orders/cancellations",
                element: <CancellationRequests />
              },
              {
                path: "orders/returns",
                element: <Orders />
              },
              {
                path: "orders/shipping",
                element: <Orders />
              },
              {
                path: "shop/info",
                element: <ShopInfo />
              },
              {
                path: "shop/new",
                element: <NewShop />
              },
              {
                path: "shop/:shopId/edit",
                element: <EditShop />
              },
              {
                path: "shop/:shopUuid",
                element: <ShopDetail />
              },
              {
                path: "shop/:shopUuid/detail",
                element: <ShopDetail />
              },
              {
                path: "shop/:shopUuid/products/new",
                element: <AddProduct />
              },
              {
                path: "shop/:shopUuid/products/:productUuid",
                element: <ProductDetail />
              },
              {
                path: "products/listings",
                element: <ProductManagement />
              },
              {
                path: "products/archived",
                element: <ArchivedProducts />
              },
              {
                path: "shop/:shopUuid/products/:productUuid/edit",
                element: <EditProduct />
              },
              {
                path: "products/inventory",
                element: <InventoryManagement />
              },
              {
                path: "shop/:shopUuid/products/:productUuid/inventory",
                element: <ProductInventory />
              },
              {
                path: "categories",
                element: <CategoryManagement />
              },
              {
                path: "marketing/discounts",
                element: <DiscountManagement />
              },
              {
                path: "finance/income",
                element: <MyIncome />
              },
              {
                path: "finance/balance",
                element: <MyBalance />
              },
              {
                path: "finance/bank-accounts",
                element: <BankAccounts />
              },
              {
                path: "products/reviews",
                element: <SellerReviews />
              },
              {
                path: "chat",
                element: <SellerChats />
              }
            ]
          }
        ]
      },
      {
        path: "/admin",
        element: <ProtectedRoute roles={[ROLES.ADMIN]}><AdminLayout /></ProtectedRoute>,
        children: [
          {
            path: "dashboard",
            element: <Dashboard />
          },
          {
            path: "users",
            element: <UsersPage />
          },
          {
            path: "sellers",
            element: <SellersPage />
          },
          {
            path: "sellers/verification",
            element: <SellerVerifications />
          },
          {
            path: "categories",
            element: <CategoryManagement />,
          },
          {
            path: "shipping-providers",
            element: <ShippingProviders />,
          },
          {
            path: "shipping-rates",
            element: <ShippingRates />,
          },
          {
            path: "contacts",
            element: <ContactManagement />,
          },
          {
            path: "newsletter",
            element: <NewsletterManagement />,
          },
          {
            path: "banners",
            element: <BannerManagement />,
          },
        ]
      },
      {
        path: "/help",
        element: <Help />
      },
      {
        path: "/about",
        element: <About />
      },
      {
        path: "/contact",
        element: <Contact />
      },
      {
        path: "category/:categoryId",
        element: <CategoryPage />
      },
      {
        path: "category/:categoryId/:subcategoryId",
        element: <CategoryPage />
      },
      {
        path: "categories",
        element: <CategoriesPage />
      },
      {
        path: "search",
        element: <SearchResults />
      },
      {
        path: '/product/:productId',
        element: <ProductPage />
      },
      {
        path: "/wishlist",
        element: <WishlistView />
      },
      {
        path: "/cart",
        element: <CartPage />
      },
      {
        path: "/shop/:shopId",
        element: <Shop />
      },
      {
        path: "/checkout",
        element: <ProtectedRoute><Checkout /></ProtectedRoute>
      },
      {
        path: '/payment/paypal',
        element: <ProtectedRoute><PayPal /></ProtectedRoute>
      },
      {
        path: '/payment/card',
        element: <ProtectedRoute><Card /></ProtectedRoute>
      }
    ]
  },
]);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('flaskify-root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <CartProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster />
          </AuthProvider>
        </CartProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </StrictMode>,
)