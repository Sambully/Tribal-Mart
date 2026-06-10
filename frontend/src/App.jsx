import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import MobileMenuToggle from './components/MobileMenuToggle';
import ChatBot from './components/ChatBot';
import WhatsAppButton from './components/WhatsAppButton';
import VoiceButton from './components/VoiceButton';
import { I18nProvider } from './i18n';
import LandingPage from './LandingPage/LandingPage';
import AuthSelection from './AuthSelection/AuthSelection';
import AuthPage from './AuthForm/AuthPage';
import CustomerDashboard from './Dashboard/CustomerDashboard';
import AgencyDashboard from './Dashboard/AgencyDashboard';
import AdminDashboard from './Dashboard/AdminDashboard';
import AgentDashboard from './Dashboard/AgentDashboard';
import AddProduct from './AddProduct/AddProduct';
import MyProducts from './MyProducts/MyProducts';
import Analytics from './Analytics/Analytics';
import Messages from './Messages/Messages';
import Settings from './Settings/Settings';
import BrowseProducts from './BrowseProducts/BrowseProducts';
import ProductDetail from './ProductDetail/ProductDetail';
import Orders from './Orders/Orders';
import Watchlist from './Watchlist/Watchlist';
import Support from './Support/Support';
import UploadDocuments from './UploadDocuments/UploadDocuments';
import DocumentApproval from './DocumentApproval/DocumentApproval';
import Checkout from './Checkout/Checkout';
import Cart from './Cart/Cart';
import EditProduct from './EditProduct/EditProduct';
import Store from './Store/Store';
import Profile from './Profile/Profile';
import Returns from './Returns/Returns';
import Compare from './Compare/Compare';
import Payouts from './Payouts/Payouts';
import AgentEarnings from './AgentEarnings/AgentEarnings';
import AgencyDrilldown from './AgencyDrilldown/AgencyDrilldown';
import AdminUserDetail from './AdminUserDetail/AdminUserDetail';
import AdminFinance from './AdminFinance/AdminFinance';
import AdminCategories from './AdminCategories/AdminCategories';
import PendingProducts from './AdminProducts/PendingProducts';
import AllProducts from './AdminProducts/AllProducts';
import AdminUsers from './AdminUsers/AdminUsers';
import AdminAnalytics from './AdminAnalytics/AdminAnalytics';
import AgencyOrders from './AgencyOrders/AgencyOrders';
import Features from './StaticPages/Features';
import HowItWorks from './StaticPages/HowItWorks';
import About from './StaticPages/About';
import PrivacyPolicy from './StaticPages/PrivacyPolicy';
import TermsOfService from './StaticPages/TermsOfService';
import Compliance from './StaticPages/Compliance';
import HelpCenter from './StaticPages/HelpCenter';
import ContactUs from './StaticPages/ContactUs';
import FAQ from './StaticPages/FAQ';

function App() {
  return (
    <Router>
      <I18nProvider>
      <ToastProvider>
      <MobileMenuToggle />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<AuthSelection type="signup" />} />
        <Route path="/login" element={<AuthSelection type="login" />} />
        <Route path="/signup/:userType" element={<AuthPage />} />
        <Route path="/login/:userType" element={<AuthPage />} />
        <Route path="/dashboard/customer" element={<CustomerDashboard />} />
        <Route path="/dashboard/agency" element={<AgencyDashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/agent" element={<AgentDashboard />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/my-products" element={<MyProducts />} />
        <Route path="/upload-documents" element={<UploadDocuments />} />
        <Route path="/document-approval" element={<DocumentApproval />} />
        <Route path="/admin/pending-products" element={<PendingProducts />} />
        <Route path="/admin/all-products" element={<AllProducts />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/browse-products" element={<BrowseProducts />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/edit-product/:id" element={<EditProduct />} />
        <Route path="/store/:agencyId" element={<Store />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/payouts" element={<Payouts />} />
        <Route path="/agent-earnings" element={<AgentEarnings />} />
        <Route path="/agency/:agencyId" element={<AgencyDrilldown />} />
        <Route path="/admin/users/:id" element={<AdminUserDetail />} />
        <Route path="/admin/finance" element={<AdminFinance />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/agency-orders" element={<AgencyOrders />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/support" element={<Support />} />
        <Route path="/features" element={<Features />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/faq" element={<FAQ />} />

        {/* Shared Routes */}
        <Route path="/messages" element={<Messages />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      {/* Saathi — floating chatbot, available on every page */}
      <ChatBot />
      {/* Direct-to-admin WhatsApp shortcut (bottom-left) */}
      <WhatsAppButton />
      {/* Vapi voice assistant (bottom-left, stacked above WhatsApp) */}
      <VoiceButton />
      </ToastProvider>
      </I18nProvider>
    </Router>
  );
}

export default App;