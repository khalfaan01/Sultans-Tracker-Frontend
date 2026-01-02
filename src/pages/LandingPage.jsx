import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useTransform } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { useAuth } from '../contexts';
import { useSuppressedScroll } from '../hooks/useSuppressedScroll';
import HamburgerNav from '../components/ui/HamburgerNav';
import MagneticCursor from '../components/ui/MagneticCursor';
import CenteredSlider from '../components/ui/CenteredSlider';
import DirectionalList from '../components/ui/DirectionalList';

export default function LandingPage() {
  const containerRef = useRef();
  const navigate = useNavigate();
  const location = useLocation(); 
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [pageError, setPageError] = useState(null);

  // Redirect authenticated users to dashboard ONLY on initial page load/reload
  useEffect(() => {
    try {
      // Don't redirect if user explicitly navigated to landing page
      const navigationType = window.performance?.getEntriesByType?.('navigation')[0]?.type;
      const isReload = navigationType === 'reload';
      const isHardNavigation = !document.referrer || document.referrer === '';
      
      // Only redirect on fresh page load/reload, not when navigating from dashboard
      if (!authLoading && isAuthenticated && (isReload || isHardNavigation)) {
        console.log('Auto-redirecting to dashboard from landing page (fresh load)');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Navigation error:', err);
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Custom scroll hook for parallax effects
  const { scrollYProgress, error: scrollError } = useSuppressedScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Parallax transformations
  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Static data definitions
  const securityFeatures = [
    { 
      label: "Real-time Fraud Detection", 
      description: "AI-powered anomaly detection for suspicious transactions" 
    },
    { 
      label: "Geo-Location Tracking", 
      description: "Monitor login locations and detect unusual access" 
    },
    { 
      label: "Encrypted Data Storage", 
      description: "Bank-level encryption for all your financial data" 
    },
    { 
      label: "Multi-Factor Authentication", 
      description: "Extra layers of security for your account" 
    },
  ];

  const financialFeatures = [
    { 
      label: "Smart Budgeting", 
      description: "AI-powered budget recommendations and alerts" 
    },
    { 
      label: "Investment Tracking", 
      description: "Monitor your portfolio and get insights" 
    },
    { 
      label: "Bill Reminders", 
      description: "Never miss a payment with smart notifications" 
    },
    { 
      label: "Financial Reports", 
      description: "Detailed PDF and Excel reports" 
    },
  ];

  const sliderItems = [
    {
      title: "AI-Powered Financial Insights",
      description: "Get personalized recommendations based on your spending patterns and financial goals."
    },
    {
      title: "Military-Grade Security",
      description: "Your financial data is protected with bank-level encryption and real-time fraud detection."
    },
    {
      title: "Cross-Platform Synchronization",
      description: "Access your financial data anywhere, anytime, across all your devices."
    }
  ];

  // Handle navigation with error handling
  const handleNavigation = useCallback((path) => {
    try {
      navigate(path);
    } catch (err) {
      console.error(`Navigation to ${path} failed:`, err);
      setPageError(`Unable to navigate to ${path}`);
    }
  }, [navigate]);

  // Error state display
  if (pageError || scrollError) {
    return (
      <div className="min-h-screen bg-desert bg-cover bg-fixed flex items-center justify-center">
        <div className="text-center text-white bg-black bg-opacity-70 p-8 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
          <p className="mb-4">{pageError || scrollError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen bg-desert bg-cover bg-fixed flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-desert bg-cover bg-fixed relative overflow-hidden">
      <MagneticCursor />
      <HamburgerNav isLoggedIn={isAuthenticated} />
      
      {/* Hero Section with fade-out on scroll */}
      <section className="h-screen flex items-center justify-center relative">
        <motion.h1 
          className="text-6xl md:text-8xl font-bold text-white text-center tracking-tight"
          style={{ opacity }}
        >
          Sultans-Tracker
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white text-lg"
        >
          Scroll to explore ↓
        </motion.div>
      </section>

      {/* Parallax Content Section */}
      <motion.section 
        className="min-h-screen bg-white bg-opacity-95 py-20"
        style={{ y }}
      >
        <div className="container mx-auto px-6">
          {/* Security Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-20"
          >
            <h2 className="text-4xl font-bold text-center mb-4">
              Advanced Security Features
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              Protecting your financial data with cutting-edge security technology
            </p>
            
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <DirectionalList items={securityFeatures} />
              <div className="bg-gray-100 p-8 rounded-2xl">
                <h3 className="text-2xl font-semibold mb-4">Security Analytics</h3>
                <p className="text-gray-600 mb-4">
                  Our system continuously monitors for suspicious activities and provides real-time alerts.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>• Login attempt tracking</li>
                  <li>• Transaction anomaly detection</li>
                  <li>• IP address monitoring</li>
                  <li>• Automated fraud alerts</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Financial Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-20"
          >
            <h2 className="text-4xl font-bold text-center mb-4">
              Comprehensive Financial Tools
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              Everything you need to take control of your finances
            </p>
            
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div className="bg-gray-100 p-8 rounded-2xl">
                <h3 className="text-2xl font-semibold mb-4">Financial Health Score</h3>
                <p className="text-gray-600 mb-4">
                  Get a monthly assessment of your financial health with actionable insights.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li>• Spending analysis</li>
                  <li>• Savings rate tracking</li>
                  <li>• Debt management</li>
                  <li>• Investment growth</li>
                </ul>
              </div>
              <DirectionalList items={financialFeatures} />
            </div>
          </motion.div>

          {/* Slider and CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h2 className="text-4xl font-bold text-center mb-4">
              Why Choose Sultans-Tracker?
            </h2>
            <p className="text-xl text-gray-600 text-center mb-12 max-w-3xl mx-auto">
              Experience the future of personal finance management
            </p>
            
            <CenteredSlider items={sliderItems} />
            
            {/* Call to Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center gap-4 mt-12"
            >
              <a
                href="/register"
                className="px-8 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-colors duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/register');
                }}
              >
                Get Started Free
              </a>
              <a
                href="/login"
                className="px-8 py-3 bg-white border-2 border-black text-black font-medium rounded-lg hover:bg-gray-50 transition-colors duration-300"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/login');
                }}
              >
                Sign In
              </a>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}