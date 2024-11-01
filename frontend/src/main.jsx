import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
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
import Profile from './pages/Profile.jsx';
import ProtectedRoute from './pages/auth/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
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
        element: <SellerLayout />,
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
          }
        ]
      }
    ]
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </HelmetProvider>
  </StrictMode>,
)