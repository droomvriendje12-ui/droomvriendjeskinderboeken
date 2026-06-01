import "./App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./context/CartContext";
import { ProductsProvider } from "./context/ProductsContext";
import { AdminAuthProvider, ProtectedAdminRoute } from "./context/AdminAuthContext";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentResultPage from "./pages/PaymentResultPage";
import OverOnsPage from "./pages/OverOnsPage";
import ContactPage from "./pages/ContactPage";
import RetournerenPage from "./pages/RetournerenPage";
import PrivacyPage from "./pages/PrivacyPage";
import VoorwaardenPage from "./pages/VoorwaardenPage";
import BlogsPage from "./pages/BlogsPage";
import BlogSlaaptipsPage from "./pages/BlogSlaaptipsPage";
import BlogStressKnuffelsPage from "./pages/BlogStressKnuffelsPage";
import BlogWaaromHuiltBabyPage from "./pages/BlogWaaromHuiltBabyPage";
import BlogVerschilVerzwaringsknuffelNachtlampjePage from "./pages/BlogVerschilVerzwaringsknuffelNachtlampjePage";
import BlogBesteSlaapknuffel2026Page from "./pages/BlogBesteSlaapknuffel2026Page";
import BlogSlaapregressiePage from "./pages/BlogSlaapregressiePage";
import BlogAvondroutinePage from "./pages/BlogAvondroutinePage";
import CmsBlogPostPage from "./pages/CmsBlogPostPage";
import CadeaubonPage from "./pages/CadeaubonPage";
import LandingProPage from "./pages/LandingProPage";
import B2BPage from "./pages/B2BPage";
import QuizPage from "./pages/QuizPage";
import StressPage from "./pages/StressPage";
import OverprikkelingPage from "./pages/OverprikkelingPage";
import AngstPage from "./pages/AngstPage";
import SlaapproblemenPage from "./pages/SlaapproblemenPage";
import TroostPage from "./pages/TroostPage";
import HSPPage from "./pages/HSPPage";
import DementiePage from "./pages/DementiePage";
import ReviewsPage from "./pages/ReviewsPage";
import NaamBedenkerPage from "./pages/NaamBedenkerPage";
import UitproberenPage from "./pages/UitproberenPage";
import VrouwenLandingPage from "./pages/VrouwenLandingPage";
import OudersBabyPage from "./pages/OudersBabyPage";
import OudersPeutersPage from "./pages/OudersPeutersPage";
import OudersExtraBehoeftenPage from "./pages/OudersExtraBehoeftenPage";
import KnuffelsPage from "./pages/KnuffelsPage";
import GoogleAdsPage from "./pages/GoogleAdsPage";
import MerchantFeedPage from "./pages/MerchantFeedPage";
import ShoppingCampaignsPage from "./pages/ShoppingCampaignsPage";
import ShoppingCampaignsDataPage from "./pages/ShoppingCampaignsDataPage";
import GoogleAdsCallbackPage from "./pages/GoogleAdsCallbackPage";
import KeywordsPage from "./pages/KeywordsPage";
import AdsStrategyPage from "./pages/AdsStrategyPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminDiscountCodesPage from "./pages/AdminDiscountCodesPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminProductsPageV2 from "./pages/AdminProductsPageV2";
import AdminAdvancedProductEditor from "./pages/AdminAdvancedProductEditor";
import AdminCommandCenter from "./pages/AdminCommandCenter";
import AdminCommandCenterNew from "./pages/AdminCommandCenterNew";
import MarketingDashboardPage from "./pages/MarketingDashboardPage";
import MarketingCommandCenter from "./pages/MarketingCommandCenter";
import LeadManagementPage from "./pages/LeadManagementPage";
import TipsBedtijdPage from "./pages/TipsBedtijdPage";
import OudersSlaaptipsPage from "./pages/OudersSlaaptipsPage";
import RustmomentOudersPage from "./pages/RustmomentOudersPage";
import VerzendingPage from "./pages/VerzendingPage";
import CampaignManagementPage from "./pages/CampaignManagementPage";
import OfflineLandingPage from "./pages/OfflineLandingPage";
import SeoLandingPage from "./pages/SeoLandingPage";
import BabySlaaptNietPage from "./pages/BabySlaaptNietPage";
import AdminReviewsImporterPage from "./pages/AdminReviewsImporterPage";
import AdminReviewsToolAdvanced from "./pages/AdminReviewsToolAdvanced";
import AdminDatabasePage from "./pages/AdminDatabasePage";
import EmailTemplatesAdmin from "./pages/admin/EmailTemplates";
import InboxPage from "./pages/admin/InboxPage";
import MarketingMailPage from "./pages/admin/MarketingMailPage";
import ContactsPage from "./pages/admin/ContactsPage";
import LeadsBestormingPage from "./pages/admin/LeadsBestormingPage";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage";
import AdminFaqStatsPage from "./pages/admin/AdminFaqStatsPage";
import AdminDigitalProductsPage from "./pages/admin/AdminDigitalProductsPage";
import AdminBlogCmsPage from "./pages/admin/AdminBlogCmsPage";
import AdsBuilderPage from "./pages/admin/AdsBuilderPage";
import ShoppingFeedBuilderPage from "./pages/admin/ShoppingFeedBuilderPage";
import CustomerDownloadPage from "./pages/CustomerDownloadPage";
import DroomvriendjesReviewsPage from "./pages/DroomvriendjesReviewsPage";
import PresentationPage from "./pages/PresentationPage";
import { Toaster } from "./components/ui/toaster";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  // Force correct page title
  useEffect(() => {
    document.title = "Droomvriendjes | Slaapknuffels met Nachtlampje & Rustgevende Geluiden";
  }, []);

  return (
    <HelmetProvider>
    <div className="App">
      <ProductsProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AdminAuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/knuffels" element={<KnuffelsPage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/betaling-resultaat/:orderId" element={<PaymentResultPage />} />
              <Route path="/over-ons" element={<OverOnsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/retourneren" element={<RetournerenPage />} />
              <Route path="/verzending" element={<VerzendingPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/voorwaarden" element={<VoorwaardenPage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/blog/5-tips-betere-nachtrust-kinderen" element={<BlogSlaaptipsPage />} />
              <Route path="/blog/hoe-helpen-kalmerende-knuffels-bij-stress" element={<BlogStressKnuffelsPage />} />
              <Route path="/blog/waarom-huilt-baby-s-nachts" element={<BlogWaaromHuiltBabyPage />} />
              <Route path="/blog/verschil-verzwaringsknuffel-nachtlampje" element={<BlogVerschilVerzwaringsknuffelNachtlampjePage />} />
              <Route path="/blog/beste-slaapknuffel-2026" element={<BlogBesteSlaapknuffel2026Page />} />
              <Route path="/blog/slaapregressie-bij-kinderen" element={<BlogSlaapregressiePage />} />
              <Route path="/blog/avondroutine-kind-7-stappen" element={<BlogAvondroutinePage />} />
              <Route path="/blog/:slug" element={<CmsBlogPostPage />} />
              <Route path="/cadeaubon" element={<CadeaubonPage />} />
              <Route path="/pro" element={<LandingProPage />} />
              <Route path="/b2b" element={<B2BPage />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/stress" element={<StressPage />} />
              <Route path="/overprikkeling" element={<OverprikkelingPage />} />
              <Route path="/angst" element={<AngstPage />} />
              <Route path="/slaapproblemen" element={<SlaapproblemenPage />} />
              <Route path="/troost" element={<TroostPage />} />
              <Route path="/hsp" element={<HSPPage />} />
              <Route path="/dementie" element={<DementiePage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/droomvriendjes-reviews" element={<DroomvriendjesReviewsPage />} />
              <Route path="/naam-bedenker" element={<NaamBedenkerPage />} />
              {/* Offline Marketing Landing Pages */}
              <Route path="/actie/:channel" element={<OfflineLandingPage />} />
              <Route path="/qr/:channel" element={<OfflineLandingPage />} />
              {/* Marketing Presentatie */}
              <Route path="/presentatie" element={<PresentationPage />} />
              {/* SEO Landing Pages - AI Optimized */}
              <Route path="/baby-slaapt-niet" element={<BabySlaaptNietPage />} />
              <Route path="/slaapknuffel" element={<SeoLandingPage />} />
              <Route path="/knuffel-nachtlampje" element={<SeoLandingPage />} />
              <Route path="/baby-nachtlamp" element={<SeoLandingPage />} />
              <Route path="/kraamcadeau" element={<SeoLandingPage />} />
              <Route path="/kind-slaapt-niet-door" element={<SeoLandingPage />} />
              <Route path="/sterrenprojector-knuffel" element={<SeoLandingPage />} />
              <Route path="/white-noise-knuffel" element={<SeoLandingPage />} />
              <Route path="/peuter-nachtlampje" element={<SeoLandingPage />} />
              <Route path="/baby-slaapt-slecht" element={<SeoLandingPage />} />
              <Route path="/beste-slaapknuffel" element={<SeoLandingPage />} />
              <Route path="/seo/:keyword" element={<SeoLandingPage />} />
              <Route path="/uitproberen" element={<UitproberenPage />} />
              <Route path="/vrouwen-60" element={<VrouwenLandingPage />} />
              <Route path="/ouders-baby" element={<OudersBabyPage />} />
              <Route path="/ouders-peuters" element={<OudersPeutersPage />} />
              <Route path="/ouders-extra-behoeften" element={<OudersExtraBehoeftenPage />} />
              <Route path="/tips-bedtijd" element={<TipsBedtijdPage />} />
              <Route path="/ouders-slaaptips" element={<OudersSlaaptipsPage />} />
              <Route path="/rustmoment-ouders" element={<RustmomentOudersPage />} />
              
              {/* Admin Login (Public) */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              
              {/* Admin Command Center 2026 - Main Dashboard */}
              <Route path="/admin" element={<ProtectedAdminRoute><AdminCommandCenterNew /></ProtectedAdminRoute>} />
              <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminCommandCenterNew /></ProtectedAdminRoute>} />
              <Route path="/admin/command-center" element={<ProtectedAdminRoute><AdminCommandCenterNew /></ProtectedAdminRoute>} />
              <Route path="/admin/command-center-old" element={<ProtectedAdminRoute><AdminCommandCenter /></ProtectedAdminRoute>} />
              
              {/* Protected Admin Routes */}
              <Route path="/admin/orders" element={<ProtectedAdminRoute><AdminOrdersPage /></ProtectedAdminRoute>} />
              <Route path="/admin/discount-codes" element={<ProtectedAdminRoute><AdminDiscountCodesPage /></ProtectedAdminRoute>} />
              <Route path="/admin/products" element={<ProtectedAdminRoute><AdminProductsPageV2 /></ProtectedAdminRoute>} />
              <Route path="/admin/products-old" element={<ProtectedAdminRoute><AdminProductsPage /></ProtectedAdminRoute>} />
              <Route path="/admin/products/:productId/advanced-editor" element={<ProtectedAdminRoute><AdminAdvancedProductEditor /></ProtectedAdminRoute>} />
              <Route path="/admin/google-ads" element={<ProtectedAdminRoute><GoogleAdsPage /></ProtectedAdminRoute>} />
              <Route path="/admin/google-ads/callback" element={<GoogleAdsCallbackPage />} />
              <Route path="/admin/merchant-feed" element={<ProtectedAdminRoute><MerchantFeedPage /></ProtectedAdminRoute>} />
              <Route path="/admin/shopping-campaigns" element={<ProtectedAdminRoute><ShoppingCampaignsPage /></ProtectedAdminRoute>} />
              <Route path="/admin/shopping-campaigns/data" element={<ProtectedAdminRoute><ShoppingCampaignsDataPage /></ProtectedAdminRoute>} />
              <Route path="/admin/keywords" element={<ProtectedAdminRoute><KeywordsPage /></ProtectedAdminRoute>} />
              <Route path="/admin/email-marketing" element={<ProtectedAdminRoute><MarketingCommandCenter /></ProtectedAdminRoute>} />
              <Route path="/admin/leads" element={<ProtectedAdminRoute><LeadManagementPage /></ProtectedAdminRoute>} />
              <Route path="/admin/campaigns" element={<ProtectedAdminRoute><CampaignManagementPage /></ProtectedAdminRoute>} />
              <Route path="/admin/product-reviews-importer" element={<ProtectedAdminRoute><AdminReviewsImporterPage /></ProtectedAdminRoute>} />
              <Route path="/admin/reviews-tool" element={<ProtectedAdminRoute><AdminReviewsToolAdvanced /></ProtectedAdminRoute>} />
              <Route path="/admin/database" element={<ProtectedAdminRoute><AdminDatabasePage /></ProtectedAdminRoute>} />
              <Route path="/admin/email-templates" element={<ProtectedAdminRoute><EmailTemplatesAdmin /></ProtectedAdminRoute>} />
              <Route path="/admin/inbox" element={<ProtectedAdminRoute><InboxPage /></ProtectedAdminRoute>} />
              <Route path="/admin/nieuwsbrief" element={<ProtectedAdminRoute><MarketingMailPage /></ProtectedAdminRoute>} />
              <Route path="/admin/contacten" element={<ProtectedAdminRoute><ContactsPage /></ProtectedAdminRoute>} />
              <Route path="/admin/leads-bestorming" element={<ProtectedAdminRoute><LeadsBestormingPage /></ProtectedAdminRoute>} />
              <Route path="/admin/customers" element={<ProtectedAdminRoute><AdminCustomersPage /></ProtectedAdminRoute>} />
              <Route path="/admin/faq-stats" element={<ProtectedAdminRoute><AdminFaqStatsPage /></ProtectedAdminRoute>} />
              <Route path="/admin/digital-products" element={<ProtectedAdminRoute><AdminDigitalProductsPage /></ProtectedAdminRoute>} />
              <Route path="/admin/blog-cms" element={<ProtectedAdminRoute><AdminBlogCmsPage /></ProtectedAdminRoute>} />
              <Route path="/admin/ads-builder" element={<ProtectedAdminRoute><AdsBuilderPage /></ProtectedAdminRoute>} />
              <Route path="/admin/shopping-feed-builder" element={<ProtectedAdminRoute><ShoppingFeedBuilderPage /></ProtectedAdminRoute>} />
              <Route path="/mijn-download/:token" element={<CustomerDownloadPage />} />
            </Routes>
            <Toaster />
          </AdminAuthProvider>
        </BrowserRouter>
      </CartProvider>
      </ProductsProvider>
    </div>
    </HelmetProvider>
  );
}

export default App;
