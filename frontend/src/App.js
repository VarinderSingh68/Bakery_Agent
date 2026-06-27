import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthCallback } from './components/AuthCallback';
import { ExitIntentModal } from './components/ExitIntentModal';
import { AIChatWidget } from './components/AIChatWidget';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetails } from './pages/ProductDetails';
import { Cart } from './pages/Cart';
import { Wishlist } from './pages/Wishlist';
import { Checkout } from './pages/Checkout';
import { Login } from './pages/Login';
import { Orders } from './pages/Orders';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Contact } from './pages/Contact';
import { Offers } from './pages/Offers';
import { Admin } from './pages/Admin';
import './App.css';

function AppRouter() {
  const location = useLocation();
  const cleanLayoutRoutes = ['/login', '/admin-login', '/admin'];
  const useCleanLayout = cleanLayoutRoutes.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const hasOAuthParams =
    location.hash?.includes('session_id=') ||
    location.search?.includes('session_id=') ||
    location.hash?.includes('code=') ||
    location.search?.includes('code=') ||
    location.hash?.includes('access_token=') ||
    location.search?.includes('access_token=') ||
    location.hash?.includes('error=') ||
    location.search?.includes('error=');
  
  // Process OAuth callback params no matter which route received them.
  if (hasOAuthParams) {
    return <AuthCallback />;
  }
  
  return (
    <>
      {!useCleanLayout && <Header />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<Login adminOnly />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </main>
      {!useCleanLayout && <Footer />}
      {!useCleanLayout && <ExitIntentModal />}
      {!useCleanLayout && <AIChatWidget />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <BrowserRouter>
            <div className="App min-h-screen flex flex-col">
              <AppRouter />
              <Toaster 
                position="top-right" 
                toastOptions={{
                  style: {
                    background: '#FFFFFF',
                    color: '#2D241E',
                    border: '1px solid #E3DCCF',
                    borderRadius: '1rem',
                  },
                  success: {
                    iconTheme: {
                      primary: '#4A6B53',
                      secondary: '#FFFFFF',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#D94848',
                      secondary: '#FFFFFF',
                    },
                  },
                }}
              />
            </div>
          </BrowserRouter>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
