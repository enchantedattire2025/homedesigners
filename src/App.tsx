import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useDesignerProfile } from './hooks/useDesignerProfile';
import { detectUserTypeAndRedirect } from './utils/userTypeDetection';
import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import InstallPrompt from './components/InstallPrompt';
import Home from './pages/Home';
import Designers from './pages/Designers';
import Projects from './pages/Projects';
import Gallery from './pages/Gallery';
import Materials from './pages/Materials';
import DesignerDetail from './pages/DesignerDetail';
import ProjectDetail from './pages/ProjectDetail';
import DesignerRegistration from './pages/DesignerRegistration';
import CustomerRegistration from './pages/CustomerRegistration';
import MyProjects from './pages/MyProjects';
import EditProject from './pages/EditProject';
import CustomerProjects from './pages/CustomerProjects';
import ProjectDetailWithTracking from './pages/ProjectDetailWithTracking';
import DesignerDashboard from './pages/DesignerDashboard';
import DesignerMaterialPricing from './pages/DesignerMaterialPricing';
import DesignerQuotes from './pages/DesignerQuotes';
import DesignerQuoteGenerator from './pages/DesignerQuoteGenerator';
import CustomerQuotes from './pages/CustomerQuotes';
import QuoteViewer from './pages/QuoteViewer';
import DesignerSubscription from './pages/DesignerSubscription';
import Designer3DTool from './pages/Designer3DTool';
import AdminDashboard from './pages/AdminDashboard';
import AdminDealsManagement from './pages/AdminDealsManagement';
import AdminSubscriptionManagement from './pages/AdminSubscriptionManagement';
import AdminSignup from './pages/AdminSignup';
import AdminLogin from './pages/AdminLogin';
import DebugPage from './pages/DebugPage';
import DebugDesignerProfile from './pages/DebugDesignerProfile';
import SharePhotoForm from './pages/SharePhotoForm';
import ClearSession from './pages/ClearSession';
import { forceLogoutAll } from './utils/clearAuth';
import { debugAuthState } from './utils/debugDesigner';

// Expose utilities to window for emergency use and debugging
if (typeof window !== 'undefined') {
  (window as any).forceLogoutAll = forceLogoutAll;
  (window as any).debugAuthState = debugAuthState;

  // Log a helpful message on load
  console.log('%cDebug Commands Available:', 'color: blue; font-size: 14px; font-weight: bold;');
  console.log('%cwindow.forceLogoutAll() - Force logout all users', 'color: green;');
  console.log('%cwindow.debugAuthState() - Show current auth state', 'color: green;');
}

// Component to handle dashboard redirects for designers and admins
const DashboardRedirectHandler = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [redirecting, setRedirecting] = React.useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      // Wait for auth to finish loading
      if (authLoading || redirecting) {
        return;
      }

      // Only redirect from home page
      if (window.location.pathname !== '/') {
        return;
      }

      // If user is authenticated, detect type and redirect
      if (user) {
        console.log('DashboardRedirectHandler: User logged in, detecting type...');
        setRedirecting(true);

        try {
          const result = await detectUserTypeAndRedirect();

          if (result && result.redirectPath !== '/') {
            console.log(`DashboardRedirectHandler: Redirecting ${result.userType} to ${result.redirectPath}`);
            navigate(result.redirectPath);
          } else {
            console.log('DashboardRedirectHandler: User has no registration');
          }
        } catch (error) {
          console.error('DashboardRedirectHandler: Error:', error);
        } finally {
          setRedirecting(false);
        }
      }
    };

    handleRedirect();
  }, [user, authLoading, navigate, redirecting]);

  return null;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <DashboardRedirectHandler />
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/designers" element={<Designers />} />
            <Route path="/designers/:id" element={<DesignerDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/register-designer" element={<DesignerRegistration />} />
            <Route path="/edit-designer-profile" element={<DesignerRegistration />} />
            <Route path="/register-customer" element={<CustomerRegistration />} />
            <Route path="/my-projects" element={<MyProjects />} />
            <Route path="/edit-project/:id" element={<EditProject />} />
            <Route path="/project-detail/:id" element={<ProjectDetailWithTracking />} />
            <Route path="/customer-projects" element={<CustomerProjects />} />
            <Route path="/designer-dashboard" element={<DesignerDashboard />} />
            <Route path="/designer-material-pricing" element={<DesignerMaterialPricing />} />
            <Route path="/designer-quotes" element={<DesignerQuotes />} />
            <Route path="/customer-quotes" element={<CustomerQuotes />} />
            <Route path="/designer-subscription" element={<DesignerSubscription />} />
            <Route path="/designer-3d-tool" element={<Designer3DTool />} />
            <Route path="/designer-3d-tool/:projectId" element={<Designer3DTool />} />
            <Route path="/generate-quote/:id" element={<DesignerQuoteGenerator />} />
            <Route path="/view-quote/:id" element={<QuoteViewer />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/deals" element={<AdminDealsManagement />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptionManagement />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-signup" element={<AdminSignup />} />
            <Route path="/debug" element={<DebugPage />} />
            <Route path="/debug-profile" element={<DebugDesignerProfile />} />
            <Route path="/share-photo" element={<SharePhotoForm />} />
            <Route path="/clear-session" element={<ClearSession />} />
          </Routes>
        </main>
        <Footer />
        <Chatbot />
        <InstallPrompt />
      </div>
    </Router>
  );
}

export default App;