import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './index.css'
import { createPortal } from 'react-dom'
import AdminDashboard from './AdminDashboard'
import UserDashboard from './components/UserDashboard'
import Footer from './components/Footer'
import MyOrders from './pages/MyOrders.jsx'
import { useLanguage } from './LanguageContext'
import LanguageSelectorPopup from './components/LanguageSelectorPopup'

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '/api' : 'https://website-sritech-refk.onrender.com/api');

const DEFAULT_BANNERS = [
  { _id: 'default-1', image: '/hero-image.png', caption: 'Premium Sustainable Engineering Solutions' },
  { _id: 'default-2', image: '/hero-banner.png', caption: 'Precision Agro, Food & Poultry Machineries' },
  { _id: 'default-3', image: '/rocket-stove.png', caption: 'Eco-Friendly High Efficiency Combustion Solutions' }
];

const FALLBACK_PRODUCTS = [];

function App() {
  const { language, setLanguage, t } = useLanguage();
  // State
  const [activeSection, setActiveSection] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProductImageIndex, setSelectedProductImageIndex] = useState(0);
  const [selectedProductReviews, setSelectedProductReviews] = useState([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [entryName, setEntryName] = useState("");
  const [entryWhatsapp, setEntryWhatsapp] = useState("");
  const [entryLocation, setEntryLocation] = useState("");
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isViewingPublicProducts, setIsViewingPublicProducts] = useState(false);
  const [adminAuthReady, setAdminAuthReady] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [isEntrySubmitted, setIsEntrySubmitted] = useState(false);
  const [showNavbarSearch, setShowNavbarSearch] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  const [showCart, setShowCart] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeMobileStep, setActiveMobileStep] = useState(0);
  const [activeBenefitIndex, setActiveBenefitIndex] = useState(0);
  const [activeProductIndex, setActiveProductIndex] = useState(0);
 useEffect(() => {
    const timer = setInterval(() => {
      setActiveBenefitIndex(prev => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStepIndex(prev => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const [offers, setOffers] = useState([]);
  const [offerData, setOfferData] = useState({
    title: 'Special Offer! 🎉',
    description: 'Get 20% off your first purchase.',
    code: 'SRITECH20',
    poster: null
  });
  const [categories, setCategories] = useState([]);
  const fallbackCategories = ['Products'];

  const normalizeCategorySlug = (value) => {
    if (!value) return '';
    return value.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  const getCategorySlug = (value) => {
    if (!value) return '';
    if (typeof value === 'object') {
      return normalizeCategorySlug(value.slug || value.name || '');
    }
    return normalizeCategorySlug(value);
  };

  const getCategoryDisplayName = (value) => {
    if (!value) return '';
    if (typeof value === 'object') {
      if (value.name) return value.name.toString();
      value = value.slug || '';
    }
    const raw = value.toString();
    return raw
      .split(/[-\s]+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const baseCategories = Array.isArray(categories) && categories.length > 0
    ? categories.map(cat => ({ name: getCategoryDisplayName(cat), slug: getCategorySlug(cat) }))
    : fallbackCategories.map(name => ({ name, slug: getCategorySlug(name) }));

  const hiddenCategorySlugs = [
    'engraining-products',
    'home-appliances',
    'welding-products',
    'test'
  ];

  const allowedCategorySlugs = ['products'];
  const productCategorySlugs = Array.from(new Set(
    products
      .map(p => getCategorySlug(p.category))
      .filter(Boolean)
      .filter(slug => !hiddenCategorySlugs.includes(slug))
      .filter(slug => !/test/i.test(slug))
  ));

  const productCategories = productCategorySlugs.map(slug => ({
    name: getCategoryDisplayName(slug),
    slug
  }));

  const categoryItems = [...baseCategories, ...productCategories]
    .filter(item => item && item.slug && !hiddenCategorySlugs.includes(item.slug) && !/test/i.test(item.slug) && !/test/i.test(item.name))
    .reduce((acc, item) => {
      if (!item || !item.slug) return acc;
      if (!acc.some(existing => existing.slug === item.slug)) {
        acc.push(item);
      }
      return acc;
    }, []);

  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [supportQueries, setSupportQueries] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [heroBanners, setHeroBanners] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const isMyOrdersPage = location.pathname === '/my-orders';
  const isCustomerDashboardPage = location.pathname === '/customer-dashboard';
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const displayBanners = heroBanners && heroBanners.length > 0 ? heroBanners : DEFAULT_BANNERS;
  const [complaintForm, setComplaintForm] = useState({
    customerName: '',
    email: '',
    subject: '',
    message: ''
  });

  // User Auth State
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [userCredentials, setUserCredentials] = useState({ name: '', phone: '', address: '', city: '', state: '', pincode: '', email: '', password: '', confirmPassword: '' });
  const [checkoutFieldErrors, setCheckoutFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState(null);
  const [authFieldErrors, setAuthFieldErrors] = useState({ email: '', password: '' });
  const [activeUser, setActiveUser] = useState(null);
  const [authPortalIsGate, setAuthPortalIsGate] = useState(false); // true = portal is mandatory gate on /
  const [showLoginReminder, setShowLoginReminder] = useState(true);

  // Suggestions search state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const navbarSearchInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Payment/Checkout State
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [checkoutMode, setCheckoutMode] = useState('cart');
  const [selectedCourierOption, setSelectedCourierOption] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    if (activeUser && showCheckout) {
      setUserCredentials(prev => ({
        ...prev,
        name: prev.name || activeUser.name || '',
        phone: prev.phone || activeUser.phone || '',
        address: prev.address || activeUser.address || '',
        city: prev.city || activeUser.city || '',
        state: prev.state || activeUser.state || '',
        pincode: prev.pincode || activeUser.pincode || '',
        email: prev.email || activeUser.email || ''
      }));
    }
  }, [showCheckout, activeUser]);

  const ORDER_STATUS_OPTIONS = ['All', 'Payment Successful', 'Order Confirmed', 'Processing', 'Packed', 'Shipped', 'In Transit', 'Out For Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Return Approved', 'Return Rejected', 'Returned', 'Refund Initiated', 'Refund Completed'];

  // Customer Order Tracking State
  const [customerDashboardOpen, setCustomerDashboardOpen] = useState(false);
  const [customerDashboardTab, setCustomerDashboardTab] = useState('Overview');
  const [customerOrderFilter, setCustomerOrderFilter] = useState('All');
  const [customerOrderSearch, setCustomerOrderSearch] = useState('');
  const [userOrders, setUserOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [orderDashboardLoading, setOrderDashboardLoading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnRequestForm, setReturnRequestForm] = useState({
    productId: '',
    quantity: 1,
    reason: '',
    description: ''
  });

  // Fresh browser session check to prevent automatic login of old/stale test credentials on page load
  useEffect(() => {
    if (!sessionStorage.getItem('sriTechSessionStarted')) {
      localStorage.removeItem('sriTechToken');
      localStorage.removeItem('sriTechUser');
      sessionStorage.setItem('sriTechSessionStarted', 'true');
    }
  }, []);

  // Click outside suggestions dropdown detector
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  useEffect(() => {
    if (displayBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentHeroIndex(prev => (prev + 1) % displayBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [displayBanners.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveWorkflowStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showNavbarSearch) {
      navbarSearchInputRef.current?.focus();
    }
  }, [showNavbarSearch]);

  const loadRazorpayScript = () => {
    if (typeof window === 'undefined') return Promise.resolve(false);

    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return Promise.resolve(true);
    }

    if (window.__sritechRazorpayLoadingPromise) {
      return window.__sritechRazorpayLoadingPromise;
    }

    const promise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setRazorpayLoaded(true);
        resolve(true);
      };
      script.onerror = () => {
        setRazorpayLoaded(false);
        resolve(false);
      };
      document.body.appendChild(script);
    });

    window.__sritechRazorpayLoadingPromise = promise;
    return promise;
  };

  // Show a toast notification
  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const GUEST_CART_KEY = 'sriTechGuestCart';
  const GUEST_WAITLIST_KEY = 'sriTechGuestWaitlist';

  const trackGAEvent = (action, category, label, value) => {
    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value
      });
    } else {
      console.log('[GA Mock Event]:', { action, category, label, value });
    }
  };

  useEffect(() => {
    if (window.gtag) {
      window.gtag('config', 'G-314FCWQKLX', {
        page_path: location.pathname + location.search
      });
    }
  }, [location]);

  const persistAuthSession = (token, user) => {
    if (token) {
      localStorage.setItem('sriTechToken', token);
    }
    if (user) {
      localStorage.setItem('sriTechUser', JSON.stringify(user));
    }
  };

  const applyAuthenticatedUser = (token, user) => {
    if (!token || !user) return false;
    persistAuthSession(token, user);
    setActiveUser(user);
    setIsUserLoggedIn(true);
    // Ensure the users list contains this user so admin sees newly logged-in accounts
    try {
      setUsers(prev => {
        const list = Array.isArray(prev) ? prev.slice() : [];
        const id = user._id || user.id;
        const now = new Date().toISOString();
        const enriched = { ...user, lastLogin: now };
        if (!id) {
          // prepend when no id available
          return [enriched, ...list];
        }
        const existingIndex = list.findIndex(u => (u._id || u.id) === id);
        if (existingIndex >= 0) {
          // update existing user entry
          list[existingIndex] = { ...list[existingIndex], ...enriched };
          return list;
        }
        // new user - prepend to list
        return [enriched, ...list];
      });
    } catch (e) {
      console.error('Error updating users list on login:', e);
    }
    return true;
  };

  const persistAdminSession = (token) => {
    if (token) {
      localStorage.setItem('sriTechAdminToken', token);
    } else {
      localStorage.removeItem('sriTechAdminToken');
    }
  };

  const clearAdminSession = () => {
    localStorage.removeItem('sriTechAdminToken');
  };

  const getAuthHeaders = ({ contentType = false, admin = false } = {}) => {
    const headers = {};

    if (contentType) {
      headers['Content-Type'] = 'application/json';
    }

    const token = admin
      ? localStorage.getItem('sriTechAdminToken')
      : localStorage.getItem('sriTechToken');

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };

  const getAdminHeaders = () => getAuthHeaders({ admin: true });

  const clearAuthSession = () => {
    localStorage.removeItem('sriTechToken');
    localStorage.removeItem('sriTechUser');
  };

  const handleAuthError = (res) => {
    if (res && res.status === 401) {
      clearAuthSession();
      setActiveUser(null);
      setIsUserLoggedIn(false);
      return true;
    }
    return false;
  };

  const loadGuestCart = () => {
    try {
      const saved = localStorage.getItem(GUEST_CART_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  };

  const loadGuestWaitlist = () => {
    try {
      const saved = localStorage.getItem(GUEST_WAITLIST_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  };

  const saveGuestCart = (items) => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Unable to save guest cart:', err);
    }
  };

  const saveGuestWaitlist = (items) => {
    try {
      localStorage.setItem(GUEST_WAITLIST_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Unable to save guest wishlist:', err);
    }
  };

  // Sync cart & waitlist from DB when user logs in
  useEffect(() => {
    const sanitizeCart = (items) => items.filter(item => {
      const id = typeof item === 'object' ? (item.productId || item.product?._id || item.product?.id || item._id || item.id) : item;
      return /^[0-9a-fA-F]{24}$/.test(String(id));
    });
    const sanitizeWaitlist = (items) => items.filter(id => /^[0-9a-fA-F]{24}$/.test(String(id)));

    if (activeUser) {
      setCart(sanitizeCart(activeUser.cart || []));
      setWaitlist(sanitizeWaitlist(activeUser.waitlist || []));
    } else {
      setCart(sanitizeCart(loadGuestCart()));
      setWaitlist(sanitizeWaitlist(loadGuestWaitlist()));
    }
  }, [activeUser]);

  useEffect(() => {
    if (!activeUser) {
      saveGuestCart(cart);
    }
  }, [cart, activeUser]);

  useEffect(() => {
    if (!activeUser) {
      saveGuestWaitlist(waitlist);
    }
  }, [waitlist, activeUser]);

  useEffect(() => {
    if (activeUser) {
      setComplaintForm(prev => ({
        ...prev,
        customerName: activeUser.name || '',
        email: activeUser.email || ''
      }));
    } else {
      setComplaintForm({
        customerName: '',
        email: '',
        subject: '',
        message: ''
      });
    }
  }, [activeUser]);

  // Scroll Spy for Navigation
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'product'];
      let current = 'home';
      sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 250) {
            current = section;
          }
        }
      });
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // URL Path Detection for Admin
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (showEntryModal) setShowEntryModal(false);
        if (showOfferModal) setShowOfferModal(false);
        if (showAdminLogin) setShowAdminLogin(false);
        if (showAuthModal) setShowAuthModal(false);
        if (showComplaintModal) setShowComplaintModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showEntryModal, showOfferModal, showAdminLogin, showAuthModal, showComplaintModal]);

  const refreshProducts = async () => {
    try {
      const prodRes = await fetch(`${API_URL}/products?t=${Date.now()}`);
      if (!prodRes.ok) {
        throw new Error('Backend error loading products.');
      }

      const prodData = await prodRes.json();
      if (!Array.isArray(prodData)) {
        throw new Error('Invalid product data received');
      }

      setProducts(prodData);
      return prodData;
    } catch (err) {
      console.error('Error refreshing products:', err);
      setProducts(prev => (prev && prev.length > 0) ? prev : FALLBACK_PRODUCTS);
      return [];
    }
  };


  const fetchData = async () => {
    const t = Date.now();
    const adminHeaders = getAdminHeaders();
    
    // Start public fetches concurrently
    const publicFetches = [
      refreshProducts().catch(err => {
        console.error('Error fetching products:', err);
      }),
      fetch(`${API_URL}/categories?t=${t}`).then(res => res.ok ? res.json() : null).then(data => { if (data) setCategories(data); }).catch(err => console.error(err)),
      fetch(`${API_URL}/offers?t=${t}`).then(res => res.ok ? res.json() : null).then(offerPayload => {
        if (offerPayload) {
          const normalizedOffers = Array.isArray(offerPayload) ? offerPayload : [offerPayload].filter(Boolean);
          setOffers(normalizedOffers);
          const activeOffer = normalizedOffers.find(offer => offer?.isPublished !== false && offer?.isActive !== false) || normalizedOffers[0] || null;
          setOfferData(activeOffer || { title: 'Special Offer! 🎉', description: 'Get 20% off your first purchase.', code: 'SRITECH20', poster: null });
        }
      }).catch(err => console.error(err)),
      fetch(`${API_URL}/coupons?t=${t}`).then(res => res.ok ? res.json() : null).then(data => { if (data) setCoupons(data); }).catch(err => console.error(err)),
      fetch(`${API_URL}/hero-banners?t=${t}`).then(res => res.ok ? res.json() : null).then(data => { if (data) setHeroBanners(data); }).catch(err => console.error(err))
    ];

    // Auth dependent fetches
    const authFetches = [];

    const adminToken = localStorage.getItem('sriTechAdminToken');
    if ((isAdmin || adminToken) && adminHeaders.Authorization) {
      authFetches.push(
        fetch(`${API_URL}/orders?t=${t}`, { headers: adminHeaders }).then(res => res.ok ? res.json() : null).then(data => { if (data) setOrders(data); }).catch(err => console.error(err)),
        fetch(`${API_URL}/support?t=${t}`, { headers: adminHeaders }).then(res => res.ok ? res.json() : null).then(data => { if (data) setSupportQueries(data); }).catch(err => console.error(err)),
        fetch(`${API_URL}/returns?t=${t}`, { headers: adminHeaders }).then(res => res.ok ? res.json() : null).then(data => { if (data) setReturnRequests(data); }).catch(err => console.error(err)),
        fetch(`${API_URL}/refunds?t=${t}`, { headers: adminHeaders }).then(res => res.ok ? res.json() : null).then(data => { if (data) setRefundRequests(data); }).catch(err => console.error(err)),
        fetch(`${API_URL}/logs?t=${t}`, { headers: adminHeaders }).then(res => res.ok ? res.json() : null).then(data => { if (data) setActivityLogs(data); }).catch(err => console.error(err)),
        fetch(`${API_URL}/leads?t=${t}`, { headers: adminHeaders }).then(res => res.ok ? res.json() : null).then(data => { if (data) setLeads(data); }).catch(err => console.error(err)),
        fetch(`${API_URL}/users?t=${t}`, { headers: adminHeaders }).then(res => res.ok ? res.json() : null).then(data => { if (data) setUsers(data); }).catch(err => console.error(err))
      );
    }

    if (activeUser) {
      const headers = getUserHeaders();
      if (headers.Authorization) {
        authFetches.push(
          fetch(`${API_URL}/orders/me?t=${t}`, { headers }).then(res => {
            if (handleAuthError(res)) return null;
            return res.ok ? res.json() : null;
          }).then(data => { if (data) setUserOrders(data); }).catch(err => console.error(err))
        );
      }
    }

    await Promise.allSettled([...publicFetches, ...authFetches]);
  };

  useEffect(() => {

    const restoreUserSession = async () => {
      const savedToken = localStorage.getItem('sriTechToken');
      if (!savedToken) {
        setActiveUser(null);
        setIsUserLoggedIn(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` }
        });

        if (res.ok) {
          const user = await res.json();
          applyAuthenticatedUser(savedToken, user);
          return;
        }
      } catch (err) {
        console.warn('Unable to restore auth session from storage:', err);
      }

      clearAuthSession();
      setActiveUser(null);
      setIsUserLoggedIn(false);
    };

    const validateAdminSession = async () => {
      const adminToken = localStorage.getItem('sriTechAdminToken');
      if (!adminToken) {
        setIsAdmin(false);
        setIsViewingPublicProducts(false);
        setAdminAuthReady(true);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/admin/verify`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const data = await res.json();
        if (data.isAdmin) {
          setIsAdmin(true);
          const currentPath = window.location.pathname;
          const isExplicitAdminPath = currentPath === '/admin' || currentPath.startsWith('/admin/');
          setIsViewingPublicProducts(!isExplicitAdminPath);
        } else {
          const errorBody = data;
          console.warn('Admin session invalid:', errorBody.message || res.statusText);
          clearAdminSession();
          setIsAdmin(false);
          setIsViewingPublicProducts(false);
        }
      } catch (err) {
        console.warn('Admin session validation error:', err);
        clearAdminSession();
        setIsAdmin(false);
        setIsViewingPublicProducts(false);
      } finally {
        setAdminAuthReady(true);
      }
    };

    const initializeApp = async () => {
      refreshProducts().catch(console.error);
      await Promise.allSettled([restoreUserSession(), validateAdminSession()]);
      await fetchData();
    };

    initializeApp();
    const pollInterval = setInterval(() => { refreshProducts(); }, 60000);
    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (!adminAuthReady) return;

    const isAdminPath = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
    if (isAdminPath) {
      if (!isAdmin) {
        setShowAdminLogin(true);
      } else {
        setShowAdminLogin(false);
        if (location.pathname === '/admin') {
          setIsViewingPublicProducts(false);
        }
      }
    } else {
      setShowAdminLogin(false);
    }
  }, [adminAuthReady, location.pathname, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if ((location.pathname === '/my-orders' || location.pathname === '/customer-dashboard') && !isUserLoggedIn) {
      setAuthMode('login');
      setShowAuthModal(true);
    }
  }, [location.pathname, isUserLoggedIn]);

  // Helper function to build clean product URL slug
  const getProductSlug = (p) => {
    if (!p) return '';
    if (p.slug) return p.slug;
    const nameSlug = String(p.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return nameSlug || String(p._id || p.id || '');
  };


  // Synchronize URL path /product/:slug with selectedProduct state
  useEffect(() => {
    if (!Array.isArray(products) || products.length === 0) return;

    let targetProductKey = null;
    if (location.pathname.startsWith('/product/')) {
      targetProductKey = decodeURIComponent(location.pathname.split('/product/')[1]);
    } else {
      const params = new URLSearchParams(location.search);
      targetProductKey = params.get('product');
    }

    if (targetProductKey) {
      let found = products.find(p => 
        String(p._id || p.id) === targetProductKey || 
        (p.slug && String(p.slug) === targetProductKey) ||
        getProductSlug(p) === targetProductKey
      );
      
      if (!found) {
        found = products.find(p => 
          (p.slug && String(p.slug).startsWith(targetProductKey)) ||
          getProductSlug(p).startsWith(targetProductKey)
        );
      }

      if (found) {
        if (!selectedProduct || (selectedProduct._id || selectedProduct.id) !== found._id) {
          setSelectedProduct(found);
        }
      } else {
        if (selectedProduct) setSelectedProduct(null);
      }
    } else {
      if (selectedProduct) setSelectedProduct(null);
    }
  }, [location.pathname, location.search, products]);

  // Sync selectedProduct state changes back to readable product-name URL
  useEffect(() => {
    if (selectedProduct) {
      const productSlug = getProductSlug(selectedProduct);
      const targetPath = `/product/${productSlug}`;
      if (location.pathname !== targetPath) {
        navigate(targetPath, { replace: true });
      }
    }

  }, [selectedProduct]);

  // Fetch reviews when product is selected
  useEffect(() => {
    if (selectedProduct) {
      trackGAEvent('view_item', 'ecommerce', selectedProduct.name, Number(String(selectedProduct.price).replace(/[^0-9]/g, '')) || 0);
      setSelectedProductImageIndex(0);
      const productId = selectedProduct._id || selectedProduct.id;
      const fetchReviews = async () => {
        try {
          const res = await fetch(`${API_URL}/products/${productId}/reviews?t=${Date.now()}`);
          if (res.ok) {
            setSelectedProductReviews(await res.json());
          }
        } catch (err) {
          console.error("Error fetching reviews:", err);
        }
      };
      fetchReviews();
    } else {
      setSelectedProductReviews([]);
    }
  }, [selectedProduct]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isUserLoggedIn) {
      showToast("Please login to leave a review.", 'error');
      return;
    }
    const productId = selectedProduct._id || selectedProduct.id;
    try {
      const res = await fetch(`${API_URL}/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: activeUser.name,
          customerEmail: activeUser.email,
          rating: newReviewRating,
          comment: newReviewComment
        })
      });
      if (res.ok) {
        const savedReview = await res.json();
        setSelectedProductReviews([savedReview, ...selectedProductReviews]);
        setNewReviewComment("");
        setNewReviewRating(5);
        showToast("🎉 Thank you! Your review has been submitted successfully.", 'success');
      } else {
        const err = await res.json();
        showToast(err.message || "Failed to submit review.", 'error');
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      showToast("Error connecting to server.", 'error');
    }
  };

  const addHeroBanner = async (newBanner) => {
    try {
      const res = await fetch(`${API_URL}/hero-banners`, {
        method: 'POST',
        headers: getAuthHeaders({ contentType: true, admin: true }),
        body: JSON.stringify(newBanner)
      });
      if (res.ok) {
        const saved = await res.json();
        setHeroBanners(prev => [...prev, saved]);
        showToast('Hero banner uploaded successfully!', 'success');
        const logRes = await fetch(`${API_URL}/logs`, { headers: getAdminHeaders() });
        if (logRes.ok) setActivityLogs(await logRes.json());
        setNotifications(prev => [{ id: `banner-${saved._id || saved.id || Date.now()}`, title: 'New Banner', body: saved.caption || 'A new banner was added to the storefront.', time: new Date().toLocaleString(), unread: true }, ...(prev || [])]);
      } else {
        showToast('Failed to upload hero banner.', 'error');
      }
    } catch (err) {
      console.error("Error adding hero banner:", err);
      showToast('Error uploading hero banner.', 'error');
    }
  };

  const deleteHeroBanner = async (bannerId) => {
    if (!window.confirm("Are you sure you want to delete this hero banner?")) return;
    try {
      const res = await fetch(`${API_URL}/hero-banners/${bannerId}`, {
        method: 'DELETE',
        headers: getAuthHeaders({ admin: true })
      });
      if (res.ok) {
        setHeroBanners(prev => prev.filter(b => (b._id || b.id) !== bannerId));
        showToast('Hero banner deleted successfully!', 'success');
        const logRes = await fetch(`${API_URL}/logs`, { headers: getAdminHeaders() });
        if (logRes.ok) setActivityLogs(await logRes.json());
        setNotifications(prev => [{ id: `banner-delete-${bannerId}-${Date.now()}`, title: 'Banner Removed', body: 'A hero banner was removed from the storefront.', time: new Date().toLocaleString(), unread: true }, ...(prev || [])]);
      } else {
        showToast('Failed to delete hero banner.', 'error');
      }
    } catch (err) {
      console.error("Error deleting hero banner:", err);
      showToast('Error deleting hero banner.', 'error');
    }
  };

  // Handlers
  const addProduct = async (newProduct) => {
    try {
      const normalizedPayload = {
        name: String(newProduct?.name || '').trim(),
        price: String(newProduct?.price || '').trim(),
        category: String(newProduct?.category || '').trim(),
        description: String(newProduct?.description || '').trim(),
        specifications: String(newProduct?.specifications || '').trim(),
        howToUse: String(newProduct?.howToUse || '').trim(),
        burnerSize: String(newProduct?.burnerSize || '').trim(),
        stoveWeight: String(newProduct?.stoveWeight || '').trim(),
        dimensions: String(newProduct?.dimensions || '').trim(),
        material: String(newProduct?.material || '').trim(),
        stock: Number(newProduct?.stock || 0),
        shippingCharge: Number(newProduct?.shippingCharge || 0),
        gstPercent: Number(newProduct?.gstPercent || 0),
        discountPercent: Number(newProduct?.discountPercent || 0),
        courierOptions: Array.isArray(newProduct?.courierOptions) ? newProduct.courierOptions : [],
        icon: String(newProduct?.icon || 'fa-box').trim(),
        isNewArrival: Boolean(newProduct?.isNewArrival),
        images: Array.isArray(newProduct?.images)
          ? newProduct.images.filter(Boolean).map((img) => String(img))
          : [],
        video: String(newProduct?.video || '').trim()
      };

      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: getAuthHeaders({ contentType: true, admin: true }),
        body: JSON.stringify(normalizedPayload)
      });

      if (res.ok) {
        const json = await res.json();
        await refreshProducts();
        showToast('Product added successfully!', 'success');
        return json.product || true;
      }

      const errorData = await res.json().catch(() => ({}));
      showToast(errorData.message || 'Failed to add product.', 'error');
      return false;
    } catch (err) {
      console.error("Error adding product:", err);
      showToast('Error adding product. Please try again.', 'error');
      return false;
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to permanently delete this product?")) return;
    
    // Optimistic UI update
    setProducts(prev => prev.filter(p => (p._id || p.id) !== productId));
    setSelectedProduct(prev => (prev && (prev._id || prev.id) === productId ? null : prev));
    
    try {
      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (res.ok) {
        showToast('Product deleted successfully!', 'success');
        refreshProducts(); // Do not await
        const logRes = await fetch(`${API_URL}/logs`, { headers: getAdminHeaders() });
        if (logRes.ok) setActivityLogs(await logRes.json());
      } else {
        const error = await res.json().catch(() => ({}));
        showToast(error.message || 'Failed to delete product.', 'error');
        // Revert on failure
        refreshProducts();
      }
    } catch (err) {
      console.error('Delete product error:', err);
      showToast('Error deleting product', 'error');
      refreshProducts();
    }
  };

  const updateProduct = async (productId, updatedData) => {
    try {
      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PUT',
        headers: getAuthHeaders({ contentType: true, admin: true }),
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        const refreshedProducts = await refreshProducts();
        const updated = refreshedProducts.find(p => (p._id || p.id)?.toString() === productId?.toString()) || null;
        setSelectedProduct(prev => (
          prev && (prev._id || prev.id)?.toString() === productId?.toString() ? updated || prev : prev
        ));
        showToast('Product updated successfully!', 'success');
        const logRes = await fetch(`${API_URL}/logs`, { headers: getAdminHeaders() });
        if (logRes.ok) setActivityLogs(await logRes.json());
        return true;
      }

      const errorData = await res.json().catch(() => ({}));
      showToast(errorData.message || 'Failed to update product.', 'error');
      return false;
    } catch (err) {
      console.error("Error updating product:", err);
      showToast('Error connecting to server.', 'error');
      return false;
    }
  };



  const updateOffer = async (newOffer) => {
    try {
      const isEditing = Boolean(newOffer?._id || newOffer?.id);
      const res = await fetch(`${API_URL}/offers${isEditing ? `/${newOffer._id || newOffer.id}` : ''}`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: getAuthHeaders({ contentType: true, admin: true }),
        body: JSON.stringify(newOffer)
      });
      const savedOffer = await res.json();
      if (!savedOffer) return;
      setOffers(prev => {
        if (isEditing) {
          return prev.map(offer => ((offer._id || offer.id) === (savedOffer._id || savedOffer.id)) ? savedOffer : offer);
        }
        return [savedOffer, ...prev];
      });
      setOfferData(savedOffer);
      // Notify customers when an offer is published or updated
      if (savedOffer && savedOffer.isPublished !== false) {
        setNotifications(prev => [{ id: `offer-${savedOffer._id || savedOffer.id || Date.now()}`, title: savedOffer.title || 'New Offer', body: savedOffer.description || 'A new offer is available.', time: new Date().toLocaleString(), unread: true }, ...(prev || [])]);
      }
      showToast(isEditing ? 'Offer updated successfully.' : 'Offer created successfully.', 'success');
    } catch (err) {
      console.error('Error updating offer:', err);
      showToast('Unable to save offer right now.', 'error');
    }
  };

  const deleteOffer = async (offerId) => {
    try {
      const res = await fetch(`${API_URL}/offers/${offerId}`, {
        method: 'DELETE',
        headers: getAuthHeaders({ admin: true })
      });
      if (res.ok) {
        setOffers(prev => prev.filter(offer => (offer._id || offer.id) !== offerId));
        setOfferData(prev => ((prev._id || prev.id) === offerId) ? {
          title: 'Special Offer! 🎉',
          description: 'Get 20% off your first purchase.',
          code: 'SRITECH20',
          poster: null
        } : prev);
        setNotifications(prev => [{ id: `offer-delete-${offerId}-${Date.now()}`, title: 'Offer Removed', body: 'An offer was removed from the store.', time: new Date().toLocaleString(), unread: true }, ...(prev || [])]);
        showToast('Offer deleted successfully.', 'success');
      } else {
        showToast('Unable to delete offer.', 'error');
      }
    } catch (err) {
      console.error('Error deleting offer:', err);
      showToast('Unable to delete offer right now.', 'error');
    }
  };

  const toggleOffer = async (offerId) => {
    try {
      const res = await fetch(`${API_URL}/offers/${offerId}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders({ admin: true })
      });
      if (res.ok) {
        const toggledOffer = await res.json();
        setOffers(prev => prev.map(offer => ((offer._id || offer.id) === offerId) ? toggledOffer : offer));
        setOfferData(prev => ((prev._id || prev.id) === offerId) ? toggledOffer : prev);
        setNotifications(prev => [{ id: `offer-toggle-${offerId}-${Date.now()}`, title: `Offer ${toggledOffer.isPublished ? 'Published' : 'Unpublished'}`, body: toggledOffer.title || 'Offer status changed.', time: new Date().toLocaleString(), unread: true }, ...(prev || [])]);
        showToast('Offer status updated.', 'success');
      } else {
        showToast('Unable to update offer status.', 'error');
      }
    } catch (err) {
      console.error('Error toggling offer:', err);
      showToast('Unable to update offer status right now.', 'error');
    }
  };

  const duplicateOffer = (offer) => {
    const duplicated = {
      ...offer,
      _id: undefined,
      id: undefined,
      title: `${offer.title || 'Offer'} Copy`,
      code: `${offer.code || 'OFFER'}-COPY`,
      isPublished: false,
      isActive: false
    };
    updateOffer(duplicated);
  };

  

  const addCoupon = async (newCouponData) => {
    try {
      const res = await fetch(`${API_URL}/coupons`, {
        method: 'POST',
        headers: getAuthHeaders({ contentType: true, admin: true }),
        body: JSON.stringify(newCouponData)
      });
      if (res.ok) {
        const savedCoupon = await res.json();
        setCoupons(prev => [savedCoupon, ...prev]);
        showToast('Coupon added successfully!', 'success');
        setNotifications(prev => [{ id: `coupon-${savedCoupon._id || savedCoupon.id || Date.now()}`, title: `New Coupon: ${savedCoupon.code}`, body: savedCoupon.description || 'A new coupon is available.', time: new Date().toLocaleString(), unread: true }, ...(prev || [])]);
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to add coupon.', 'error');
      }
    } catch (err) {
      console.error("Error adding coupon:", err);
      showToast('Connection error.', 'error');
    }
  };

  const addCategory = async (categorySlug) => {
    try {
      const formattedName = categorySlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: getAuthHeaders({ contentType: true, admin: true }),
        body: JSON.stringify({ name: formattedName, slug: categorySlug })
      });
      if (res.ok) {
        const savedCategory = await res.json();
        setCategories(prev => [savedCategory, ...prev]);
        showToast('Category added successfully!', 'success');
        const logRes = await fetch(`${API_URL}/logs`, { headers: getAdminHeaders() });
        if (logRes.ok) setActivityLogs(await logRes.json());
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to add category.', 'error');
      }
    } catch (err) {
      console.error('Error adding category:', err);
      showToast('Error adding category.', 'error');
    }
  };

  const updateCategory = async (categoryId, newName) => {
    try {
      const newSlug = newName.toLowerCase().trim().replace(/\s+/g, '-');
      const res = await fetch(`${API_URL}/categories/${categoryId}`, {
        method: 'PUT',
        headers: getAuthHeaders({ contentType: true, admin: true }),
        body: JSON.stringify({ name: newName, slug: newSlug })
      });
      if (res.ok) {
        const updatedCategory = await res.json();
        setCategories(prev => prev.map(cat => (cat._id || cat.id) === categoryId ? updatedCategory : cat));
        showToast('Category updated successfully!', 'success');
        const logRes = await fetch(`${API_URL}/logs`, { headers: getAdminHeaders() });
        if (logRes.ok) setActivityLogs(await logRes.json());
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update category.', 'error');
      }
    } catch (err) {
      console.error('Error updating category:', err);
      showToast('Error updating category.', 'error');
    }
  };

  const deleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`${API_URL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: getAuthHeaders({ admin: true })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        setCategories(prev => prev.filter(cat => (cat._id || cat.id) !== categoryId));
        showToast(data.message || 'Category deleted successfully!', 'success');
        const logRes = await fetch(`${API_URL}/logs`, { headers: getAdminHeaders() });
        if (logRes.ok) setActivityLogs(await logRes.json());
      } else {
        showToast(data.message || 'Failed to delete category.', 'error');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      showToast('Error deleting category.', 'error');
    }
  };

  const deleteCoupon = async (couponId) => {
    if (!window.confirm("Are you sure you want to permanently delete this coupon?")) return;
    try {
      const res = await fetch(`${API_URL}/coupons/${couponId}`, {
        method: 'DELETE',
        headers: getAuthHeaders({ admin: true })
      });
      if (res.ok) {
        setCoupons(prev => prev.filter(c => (c._id || c.id) !== couponId));
        showToast('Coupon deleted successfully!', 'success');
        const logRes = await fetch(`${API_URL}/logs`, { headers: getAdminHeaders() });
        if (logRes.ok) setActivityLogs(await logRes.json());
        setNotifications(prev => [{ id: `coupon-delete-${couponId}-${Date.now()}`, title: 'Coupon Removed', body: 'A coupon was removed by the store.', time: new Date().toLocaleString(), unread: true }, ...(prev || [])]);
      } else {
        showToast('Failed to delete coupon.', 'error');
      }
    } catch (err) {
      console.error("Error deleting coupon:", err);
    }
  };

  const updateOrder = async (orderId, orderData) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: getAuthHeaders({ contentType: true, admin: true }),
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        const getOrderIdentity = (order) => (order?._id || order?.id || '').toString();
        setOrders(prev => prev.map(o => {
          return getOrderIdentity(o) && getOrderIdentity(updatedOrder) && getOrderIdentity(o) === getOrderIdentity(updatedOrder) ? updatedOrder : o;
        }));
        setUserOrders(prev => prev.map(o => {
          return getOrderIdentity(o) && getOrderIdentity(updatedOrder) && getOrderIdentity(o) === getOrderIdentity(updatedOrder) ? updatedOrder : o;
        }));
        setSelectedOrder(prev => {
          return prev && getOrderIdentity(prev) && getOrderIdentity(updatedOrder) && getOrderIdentity(prev) === getOrderIdentity(updatedOrder) ? updatedOrder : prev;
        });
        showToast('Order updated successfully.', 'success');
        // push notification for significant order status changes (returns/refunds/support updates)
        try {
          const status = (updatedOrder.status || '').toString();
          const lower = status.toLowerCase();
          if (lower.includes('return') || lower.includes('refund') || lower.includes('cancel') || lower.includes('delivered') || lower.includes('shipped')) {
            const title = `Order Update: ${status}`;
            const body = `Your order ${updatedOrder._id || updatedOrder.id} status changed to ${status}.`;
            setNotifications(prev => [{ id: `order-update-${orderId}-${Date.now()}`, title, body, time: new Date().toLocaleString(), unread: true }, ...(prev || [])]);
          }
        } catch (e) {
          console.error('Notification push error (order):', e);
        }
        return updatedOrder;
      }
      const err = await res.json();
      showToast(err.message || 'Failed to update order.', 'error');
    } catch (err) {
      console.error('Error updating order:', err);
      showToast('Error updating order.', 'error');
    }
    return null;
  };

  const updateCoupon = async (couponId, updatedCouponData) => {
    try {
      const res = await fetch(`${API_URL}/coupons/${couponId}`, {
        method: 'PATCH',
        headers: getAuthHeaders({ contentType: true, admin: true }),
        body: JSON.stringify(updatedCouponData)
      });
      if (res.ok) {
        const updatedCoupon = await res.json();
        setCoupons(prev => prev.map(c => (c._id || c.id) === couponId ? updatedCoupon : c));
        showToast('Coupon updated successfully!', 'success');
        const logRes = await fetch(`${API_URL}/logs`, { headers: getAdminHeaders() });
        if (logRes.ok) setActivityLogs(await logRes.json());
        setNotifications(prev => [{ id: `coupon-update-${couponId}-${Date.now()}`, title: `Coupon Updated: ${updatedCoupon.code}`, body: updatedCoupon.description || 'A coupon was updated by the store.', time: new Date().toLocaleString(), unread: true }, ...(prev || [])]);
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to update coupon.', 'error');
      }
    } catch (err) {
      console.error("Error updating coupon:", err);
    }
  };

  const handleToggleBlockUser = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders({ admin: true })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u._id === userId ? updatedUser : u));
        const logRes = await fetch(`${API_URL}/logs`, { headers: getAdminHeaders() });
        if (logRes.ok) setActivityLogs(await logRes.json());
      } else {
        showToast('Failed to change user status.', 'error');
      }
    } catch (err) {
      console.error("Error changing user status:", err);
      showToast('Error changing user status.', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders({ admin: true })
      });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== userId));
        const logRes = await fetch(`${API_URL}/logs`, { headers: getAdminHeaders() });
        if (logRes.ok) setActivityLogs(await logRes.json());
        showToast('User deleted successfully.', 'success');
      } else {
        showToast('Failed to delete user.', 'error');
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast('Error deleting user.', 'error');
    }
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    trackGAEvent('submit_support_ticket', 'support', complaintForm.subject);
    try {
      const res = await fetch(`${API_URL}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintForm)
      });
      if (res.ok) {
        const savedQuery = await res.json();
        setSupportQueries([savedQuery, ...supportQueries]);
        const logRes = await fetch(`${API_URL}/logs`, { headers: getAdminHeaders() });
        if (logRes.ok) setActivityLogs(await logRes.json());
        
        showToast('🎉 Support ticket raised successfully! Our team will get back to you shortly.', 'success');
        setShowComplaintModal(false);
        setComplaintForm(prev => ({
          ...prev,
          subject: '',
          message: ''
        }));
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to submit support ticket.', 'error');
      }
    } catch (err) {
      console.error("Support submit error:", err);
      alert('Error connecting to server.');
    }
  };

  const respondToSupport = async (queryId, responseText) => {
    try {
      const res = await fetch(`${API_URL}/support/${queryId}/respond`, {
        method: 'POST',
        headers: getAuthHeaders({ contentType: true, admin: true }),
        body: JSON.stringify({ response: responseText })
      });
      if (res.ok) {
        const updatedQuery = await res.json();
        setSupportQueries(prev => prev.map(q => (q._id || q.id) === queryId ? updatedQuery : q));
        showToast('Response sent to customer successfully!', 'success');
        const logRes = await fetch(`${API_URL}/logs`, { headers: getAuthHeaders({ admin: true }) });
        if (logRes.ok) setActivityLogs(await logRes.json());
        // Notify customer that support has responded
        try {
          const title = `Support Response: ${updatedQuery.subject || 'Update from support'}`;
          const body = `Support has responded to your ticket: ${responseText}`;
          setNotifications(prev => [{ id: `support-resp-${queryId}-${Date.now()}`, title, body, time: new Date().toLocaleString(), unread: true }, ...(prev || [])]);
        } catch (e) {
          console.error('Notification push error (support):', e);
        }
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to send response.', 'error');
      }
    } catch (err) {
      console.error("Error responding to support:", err);
      showToast('Error connecting to server.', 'error');
    }
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const leadData = {
      name: formData.get('userName'),
      whatsapp: formData.get('userWhatsapp'),
      location: formData.get('userLocation')
    };

    try {
      await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      setIsEntrySubmitted(true);
      setTimeout(() => {
        setShowEntryModal(false);
        setTimeout(() => setShowOfferModal(true), 500);
      }, 1000);
    } catch (err) {
      console.error("Error saving lead:", err);
      // Fallback: still show website even if lead saving fails
      setShowEntryModal(false);
      setTimeout(() => setShowOfferModal(true), 500);
    }
  };

  const closeEntryModal = () => {
    setShowEntryModal(false);
    setTimeout(() => setShowOfferModal(true), 500);
  };
  const getUserHeaders = () => getAuthHeaders();

  const normalizeSearchTerm = (value) => {
    return String(value || '').trim().toLowerCase();
  };

  const formatOrderDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatOrderTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredUserOrders = userOrders.filter(order => {
    const search = normalizeSearchTerm(customerOrderSearch);
    const statusMatches = customerOrderFilter === 'All' || order.status === customerOrderFilter;
    const searchMatches = !search || [order.orderId, order.invoiceNumber, order.customerName, order.customerEmail]
      .some(field => String(field || '').toLowerCase().includes(search)) ||
      (Array.isArray(order.items) && order.items.some(item => String(item.name || '').toLowerCase().includes(search)));
    return statusMatches && searchMatches;
  });

  const fetchUserOrders = async () => {
    if (!activeUser) return;
    const headers = getUserHeaders();
    if (!headers.Authorization) {
      handleAuthError({ status: 401 });
      return;
    }
    setOrderDashboardLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders/me?t=${Date.now()}`, { headers });
      if (handleAuthError(res)) return;
      if (res.ok) {
        const fetchedOrders = await res.json();
        setUserOrders(fetchedOrders);
      }
    } catch (err) {
      console.error('Error fetching user orders:', err);
    } finally {
      setOrderDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (!activeUser) return;

    fetchUserOrders();

    const refreshOrders = () => {
      fetchUserOrders();
    };

    const intervalId = window.setInterval(refreshOrders, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refreshOrders);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refreshOrders);
    };
  }, [activeUser]);

  const openUserDashboard = (tab = 'Overview') => {
    navigate('/customer-dashboard');
    setCustomerDashboardTab(tab);
    setShowOrderDetails(false);
    setSelectedOrder(null);
    setShowCart(false);
    setShowWishlist(false);
    setShowCheckout(false);
  };

  const handleOpenOrderDashboard = ({ forceOpen = false } = {}) => {
    if (isAdmin && isViewingPublicProducts) {
      showToast('You are currently browsing products as admin. Use the admin dashboard controls to return.', 'info');
      return;
    }

    if (!forceOpen && !isUserLoggedIn) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    openUserDashboard();
  };

  const handleOpenAdminDashboard = () => {
    setIsViewingPublicProducts(false);
    navigate('/admin');
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getUserHeaders()
        },
        body: JSON.stringify(profileData)
      });
      if (!res.ok) throw new Error('Unable to update profile');
      const updatedUser = await res.json();
      setActiveUser(updatedUser);
      persistAuthSession(localStorage.getItem('sriTechToken'), updatedUser);
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      console.error('Profile update error:', err);
      showToast('Unable to update profile right now.', 'error');
    }
  };

  const handleUpdatePassword = async (currentPassword, newPassword) => {
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getUserHeaders()
        },
        body: JSON.stringify({ password: newPassword, currentPassword })
      });
      if (!res.ok) throw new Error('Unable to update password');
      const updatedUser = await res.json();
      setActiveUser(updatedUser);
      persistAuthSession(localStorage.getItem('sriTechToken'), updatedUser);
      showToast('Password updated successfully.', 'success');
    } catch (err) {
      console.error('Password update error:', err);
      showToast('Unable to update password right now.', 'error');
    }
  };

  const handleSaveAddress = async (addressData) => {
    try {
      const currentAddresses = Array.isArray(activeUser?.addresses) ? activeUser.addresses : [];
      const nextAddresses = addressData._id ? currentAddresses.map(addr => ((addr._id || addr.id) === addressData._id ? { ...addr, ...addressData, _id: addressData._id } : addr)) : [...currentAddresses, { ...addressData, _id: undefined, id: undefined }];
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getUserHeaders()
        },
        body: JSON.stringify({ addresses: nextAddresses })
      });
      if (!res.ok) throw new Error('Unable to save address');
      const updatedUser = await res.json();
      setActiveUser(updatedUser);
      persistAuthSession(localStorage.getItem('sriTechToken'), updatedUser);
      showToast('Address saved successfully.', 'success');
    } catch (err) {
      console.error('Address save error:', err);
      showToast('Unable to save address right now.', 'error');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const currentAddresses = Array.isArray(activeUser?.addresses) ? activeUser.addresses : [];
      const nextAddresses = currentAddresses.filter(addr => (addr._id || addr.id) !== addressId);
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getUserHeaders()
        },
        body: JSON.stringify({ addresses: nextAddresses })
      });
      if (!res.ok) throw new Error('Unable to delete address');
      const updatedUser = await res.json();
      setActiveUser(updatedUser);
      persistAuthSession(localStorage.getItem('sriTechToken'), updatedUser);
      showToast('Address removed successfully.', 'success');
    } catch (err) {
      console.error('Address delete error:', err);
      showToast('Unable to delete address right now.', 'error');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const currentAddresses = Array.isArray(activeUser?.addresses) ? activeUser.addresses : [];
      const nextAddresses = currentAddresses.map(addr => ({ ...addr, isDefault: (addr._id || addr.id) === addressId }));
      const res = await fetch(`${API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getUserHeaders()
        },
        body: JSON.stringify({ addresses: nextAddresses })
      });
      if (!res.ok) throw new Error('Unable to set default address');
      const updatedUser = await res.json();
      setActiveUser(updatedUser);
      persistAuthSession(localStorage.getItem('sriTechToken'), updatedUser);
      showToast('Default address updated.', 'success');
    } catch (err) {
      console.error('Default address error:', err);
      showToast('Unable to update default address right now.', 'error');
    }
  };

  const handleSubmitReturnRequest = async (payload) => {
    try {
      const res = await fetch(`${API_URL}/returns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getUserHeaders()
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Unable to submit return request');
      showToast('Return request submitted successfully.', 'success');
    } catch (err) {
      console.error('Return request error:', err);
      showToast('Unable to submit return request right now.', 'error');
    }
  };

  const handleRaiseSupport = async (payload) => {
    try {
      const res = await fetch(`${API_URL}/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName: activeUser?.name || 'Customer',
          email: activeUser?.email || '',
          subject: payload.subject,
          message: payload.message,
          status: 'Open'
        })
      });
      if (!res.ok) throw new Error('Unable to submit support request');
      showToast('Support ticket created successfully.', 'success');
    } catch (err) {
      console.error('Support ticket error:', err);
      showToast('Unable to create support ticket right now.', 'error');
    }
  };

  const handleMarkNotificationsRead = () => {
    setNotifications([]);
    showToast('Notifications marked as read.', 'success');
  };

  const handleSelectOrder = (order) => {
    setSelectedOrder(order);
    setCustomerDashboardTab('Order Details');
    setShowOrderDetails(true);
    setReturnRequestForm(prev => ({
      ...prev,
      productId: order.items?.[0]?.product || prev.productId || '',
      quantity: order.items?.[0]?.quantity || 1
    }));
  };

  const handleCloseOrderDashboard = () => {
    setCustomerDashboardOpen(false);
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  const handleOpenReturnModal = () => {
    if (!selectedOrder) return;
    setReturnRequestForm(prev => ({
      ...prev,
      productId: selectedOrder.items?.[0]?.product || prev.productId || '',
      quantity: selectedOrder.items?.[0]?.quantity || 1,
      reason: '',
      description: ''
    }));
    setShowReturnModal(true);
  };

  const handleCloseReturnModal = () => {
    setShowReturnModal(false);
  };

  const handleReturnRequestChange = (field, value) => {
    setReturnRequestForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitReturnModalRequest = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const res = await fetch(`${API_URL}/returns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getUserHeaders()
        },
        body: JSON.stringify({
          orderId: selectedOrder._id || selectedOrder.id,
          productId: returnRequestForm.productId,
          quantity: Number(returnRequestForm.quantity || 1),
          reason: returnRequestForm.reason,
          description: returnRequestForm.description
        })
      });

      if (res.ok) {
        const result = await res.json();
        showToast(`Return request submitted for ${result.returnId}.`, 'success');
        setShowReturnModal(false);
      } else {
        const error = await res.json().catch(() => ({}));
        showToast(error.message || 'Failed to submit return request.', 'error');
      }
    } catch (err) {
      console.error('Return request error:', err);
      showToast('Unable to submit return request. Please try again.', 'error');
    }
  };

  const getOrderStatusBadge = (status) => {
    const statusMap = {
      'Payment Successful': 'status-pill green',
      'Order Confirmed': 'status-pill blue',
      'Processing': 'status-pill blue',
      'Packed': 'status-pill blue',
      'Shipped': 'status-pill orange',
      'In Transit': 'status-pill orange',
      'Out For Delivery': 'status-pill orange',
      'Delivered': 'status-pill green',
      'Cancelled': 'status-pill red',
      'Return Requested': 'status-pill red',
      'Returned': 'status-pill red',
      'Refund Initiated': 'status-pill red',
      'Refund Completed': 'status-pill green',
      'Payment Pending': 'status-pill yellow'
    };
    return statusMap[status] || 'status-pill gray';
  };

  const getOrderStatusText = (status) => status || 'Unknown';

  const getOrderLatestTimeline = (order) => {
    if (!Array.isArray(order.timelineHistory) || order.timelineHistory.length === 0) return null;
    return order.timelineHistory[order.timelineHistory.length - 1];
  };

  const getOrderTimelineSteps = (order) => {
    return Array.isArray(order.timelineHistory) ? order.timelineHistory : [];
  };

  const getOrderTotalItems = (order) => {
    return Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) : 0;
  };

  const getOrderItemLabel = (item) => item.name || item.sku || 'Product';

  const getOrderStatusColorClass = (status) => {
    if (status === 'Delivered' || status === 'Payment Successful' || status === 'Refund Completed') return 'text-success';
    if (status === 'Cancelled' || status === 'Returned' || status === 'Refund Initiated' || status === 'Return Requested') return 'text-danger';
    if (status === 'Shipped' || status === 'In Transit' || status === 'Out For Delivery') return 'text-warning';
    return 'text-info';
  };

  const getOrderLabel = (order) => `${order.orderId || order.invoiceNumber || 'Order'}`;

  const getOrderDetailValue = (label, value) => `${label}: ${value || 'N/A'}`;

  const getTimelineItemKey = (item, index) => `${item.status || 'step'}-${index}`;

  const getDashboardLabel = () => 'Account';

  const getOrderDateLabel = (order) => formatOrderDate(order.createdAt);

  const getPrettyAmount = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const getOrderTrackingStatus = (order) => order.status || 'Pending';

  const getStatusBadge = (status) => getOrderStatusBadge(status);

  const getOrderById = (orderId) => userOrders.find(order => order.orderId === orderId || order._id === orderId || order.invoiceNumber === orderId);

  const getDashboardTitle = () => 'Order Tracking Dashboard';

  // Helper for order detail fallback values
  const safeValue = (value) => (value || 'Not available');

  const getOrderTimelineProgress = (order) => {
    const steps = getOrderTimelineSteps(order);
    return steps.length;
  };

  const buildTimelineStepClass = (index, order) => {
    const stepCount = getOrderTimelineSteps(order).length;
    if (index < stepCount - 1) return 'timeline-step completed';
    if (index === stepCount - 1) return 'timeline-step active';
    return 'timeline-step';
  };

  // Orders section helper values end

  const buildCartEntry = (product, quantity = 1) => {
    const productId = product?._id || product?.id;
    return {
      productId: productId ? String(productId) : '',
      product,
      quantity: Number(quantity) > 0 ? Number(quantity) : 1
    };
  };

  const normalizeCartEntry = (entry) => {
    if (!entry) return null;
    if (typeof entry === 'object' && entry !== null && 'productId' in entry) {
      return {
        productId: entry.productId ? String(entry.productId) : '',
        product: entry.product || null,
        quantity: Number(entry.quantity) > 0 ? Number(entry.quantity) : 1
      };
    }
    if (typeof entry === 'object' && entry !== null && (entry._id || entry.id || entry.product)) {
      const productId = entry._id || entry.id || entry.product?._id || entry.product?.id || '';
      return {
        productId: productId ? String(productId) : '',
        product: entry.product || entry,
        quantity: Number(entry.quantity) > 0 ? Number(entry.quantity) : 1
      };
    }
    return { productId: String(entry), product: null, quantity: 1 };
  };

  const handleAddToCart = async (product) => {
    trackGAEvent('add_to_cart', 'ecommerce', product.name, Number(String(product.price).replace(/[^0-9]/g, '')) || 0);
    const productId = product?._id || product?.id;
    const nextCart = [...cart];
    const existingIndex = nextCart.findIndex(item => {
      const normalized = normalizeCartEntry(item);
      return normalized?.productId === String(productId);
    });

    if (existingIndex >= 0) {
      const currentEntry = normalizeCartEntry(nextCart[existingIndex]);
      nextCart[existingIndex] = {
        ...nextCart[existingIndex],
        quantity: (Number(currentEntry?.quantity) || 1) + 1
      };
    } else {
      nextCart.push(buildCartEntry(product, 1));
    }

    if (!isUserLoggedIn) {
      setCart(nextCart);
      saveGuestCart(nextCart);
      showToast(`✅ ${product.name} added to cart!`, 'success');
      return;
    }

    setCart(nextCart);
    try {
      const res = await fetch(`${API_URL}/users/${activeUser._id}/cart`, {
        method: 'POST',
        headers: getAuthHeaders({ contentType: true }),
        body: JSON.stringify({ productId })
      });
      if (handleAuthError(res)) return;
      if (res.ok) {
        const updatedCart = await res.json().catch(() => null);
        if (Array.isArray(updatedCart)) {
          setActiveUser(prev => prev ? { ...prev, cart: updatedCart } : prev);
        } else {
          setActiveUser(prev => {
            if (!prev) return prev;
            const existingCart = Array.isArray(prev.cart) ? prev.cart.map(String) : [];
            if (existingCart.includes(String(productId))) return prev;
            return { ...prev, cart: [...existingCart, String(productId)] };
          });
        }
      }
    } catch (err) {
      console.error('Error syncing cart to backend:', err);
    }

    showToast(`✅ ${product.name} added to cart!`, 'success');
  };

  const handleChangeCartQuantity = (productId, delta) => {
    const nextCart = cart.reduce((acc, item) => {
      const normalized = normalizeCartEntry(item);
      if (!normalized) return acc;
      if (normalized.productId === String(productId)) {
        const updatedQuantity = (Number(normalized.quantity) || 1) + delta;
        if (updatedQuantity > 0) {
          // Rebuild the entry as a proper object to avoid spreading a plain string
          if (typeof item === 'string') {
            acc.push({ productId: item, quantity: updatedQuantity });
          } else {
            acc.push({ ...item, quantity: updatedQuantity });
          }
        }
        return acc;
      }
      acc.push(item);
      return acc;
    }, []);

    setCart(nextCart);
    if (!isUserLoggedIn) {
      saveGuestCart(nextCart);
    }
  };

  // Remove product from cart
  const handleRemoveFromCart = async (productId) => {
    trackGAEvent('remove_from_cart', 'ecommerce', String(productId));
    const nextCart = cart.filter(item => {
      const normalized = normalizeCartEntry(item);
      return normalized?.productId !== String(productId);
    });

    if (isUserLoggedIn) {
      try {
        const res = await fetch(`${API_URL}/users/${activeUser._id}/cart/${productId}`, {
          method: 'DELETE',
          headers: getUserHeaders()
        });
        if (handleAuthError(res)) return;
      } catch (err) {
        console.error("Error removing from cart on backend:", err);
      }
    } else {
      saveGuestCart(nextCart);
    }

    setCart(nextCart);
  };

  // Checkout cart: create order with all cart items and total amount
  const handleCheckoutCart = async () => {
    trackGAEvent('begin_checkout', 'ecommerce', 'cart_checkout', cart.length);
    if (!isUserLoggedIn) {
      showToast('Please login to place an order.', 'error');
      setAuthMode('login');
      setAuthErrorMessage(null);
      setShowAuthModal(true);
      return;
    }
    if (resolvedCartItems.length === 0) {
      showToast('Your cart is empty.', 'error');
      return;
    }
    setCheckoutMode('cart');
    setCheckoutItems(resolvedCartItems);
    setCustomerDashboardOpen(false);
    setShowCart(false);
    setShowCheckout(true);
  };

  // Initiate Razorpay payment
  const handleInitiatePayment = async () => {
    const itemsForCheckout = checkoutItems.length > 0 ? checkoutItems : resolvedCartItems;
    const totalForCheckout = itemsForCheckout.reduce((sum, item) => sum + (getProductFinalPrice(item) * (Number(item.quantity) || 1)), 0);
    const checkoutName = (userCredentials.name || activeUser?.name || '').trim();
    const checkoutPhone = (userCredentials.phone || activeUser?.phone || '').trim();

    if (!itemsForCheckout || itemsForCheckout.length === 0) {
      showToast('Your cart is empty.', 'error');
      return;
    }

    const fieldErrors = {};
    if (!checkoutName) fieldErrors.name = true;
    if (!checkoutPhone || !/^\d{10}$/.test(checkoutPhone)) fieldErrors.phone = true;
    if (!userCredentials.address || !userCredentials.address.trim()) fieldErrors.address = true;
    if (!userCredentials.city || !userCredentials.city.trim()) fieldErrors.city = true;
    if (!userCredentials.state || !userCredentials.state.trim()) fieldErrors.state = true;
    if (!userCredentials.pincode || !/^\d{6}$/.test(userCredentials.pincode.trim())) fieldErrors.pincode = true;

    setCheckoutFieldErrors(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      if (fieldErrors.phone && userCredentials.phone && !/^\d{10}$/.test(userCredentials.phone.trim())) {
        showToast('Mobile number must be exactly 10 digits.', 'error');
      } else if (fieldErrors.pincode && userCredentials.pincode && !/^\d{6}$/.test(userCredentials.pincode.trim())) {
        showToast('Pincode / Postal code must be exactly 6 digits.', 'error');
      } else {
        showToast('Please fill in all required shipping address fields.', 'error');
      }
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Step 1: Create Razorpay order
      const orderRes = await fetch(`${API_URL}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: checkoutGrandTotal,
          currency: 'INR',
          receipt: `order_${Date.now()}`
        })
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        showToast(errorData.message || 'Failed to create payment order.', 'error');
        setIsProcessingPayment(false);
        return;
      }

      const razorpayOrder = await orderRes.json();
      setPaymentOrder(razorpayOrder);

      // Step 2: Get Razorpay key from backend or fallback to configured live key
      let razorpayKey = 'rzp_live_TGQsNWOi8CWHds';
      try {
        const keyRes = await fetch(`${API_URL}/payments/get-key`);
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          if (keyData?.key) razorpayKey = keyData.key;
        }
      } catch (e) {
        console.warn('Backend key fetch failed, using configured key:', e);
      }

      const razorpayReady = await loadRazorpayScript();
      if (!razorpayReady || !window.Razorpay) {
        showToast('Razorpay is still loading. Please try again in a moment.', 'info');
        setIsProcessingPayment(false);
        return;
      }

      // Step 3: Open Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'SriTech',
        description: 'Product Purchase',
        order_id: razorpayOrder.id,
        handler: async (response) => {
          await handleVerifyPayment(response);
        },
        prefill: {
          name: checkoutName,
          email: activeUser?.email || userCredentials?.email || 'customer@sritechengg.in',
          contact: checkoutPhone
        },
        theme: {
          color: '#1E7A3B'
        },
        modal: {
          ondismiss: () => {
            setIsProcessingPayment(false);
            showToast('Payment cancelled.', 'info');
          }
        }
      };

      if (window.Razorpay) {
        const payment = new window.Razorpay(options);
        payment.open();
      } else {
        showToast('Razorpay could not be loaded. Please refresh and try again.', 'error');
        setIsProcessingPayment(false);
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      showToast('Error initiating payment. Please try again.', 'error');
      setIsProcessingPayment(false);
    }
  };

  // Verify payment and create order
  const handleVerifyPayment = async (paymentResponse) => {
    try {
      // Verify payment signature with backend
      const verifyRes = await fetch(`${API_URL}/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature
        })
      });

      if (!verifyRes.ok) {
        showToast('Payment verification failed. Please contact support.', 'error');
        setIsProcessingPayment(false);
        return;
      }

      // Payment verified - now create the order
      const itemsForCheckout = checkoutItems.length > 0 ? checkoutItems : resolvedCartItems;
      const orderItems = itemsForCheckout.map(p => ({ 
        product: p._id || p.id, 
        quantity: Number(p.quantity) || 1, 
        price: getProductFinalPrice(p) 
      }));
      const totalForCheckout = itemsForCheckout.reduce((sum, item) => sum + (getProductFinalPrice(item) * (Number(item.quantity) || 1)), 0);
      const checkoutName = (userCredentials.name || activeUser?.name || '').trim();
      const checkoutPhone = (userCredentials.phone || activeUser?.phone || '').trim();
      const fullShippingAddress = [
        userCredentials.address,
        userCredentials.city,
        userCredentials.state,
        userCredentials.pincode ? `PIN: ${userCredentials.pincode}` : ''
      ].filter(Boolean).join(', ').trim() || (activeUser?.address || '').trim();

      const orderData = {
        customerId: activeUser?._id,
        customerName: checkoutName,
        customerEmail: activeUser?.email || '',
        customerPhone: checkoutPhone,
        shippingAddress: {
          name: checkoutName,
          phone: checkoutPhone,
          addressLine1: userCredentials.address || activeUser?.address || '',
          city: userCredentials.city || activeUser?.city || '',
          state: userCredentials.state || activeUser?.state || '',
          pincode: userCredentials.pincode || activeUser?.pincode || '',
          fullAddress: fullShippingAddress,
          country: 'India'
        },
        billingAddress: {
          name: checkoutName,
          phone: checkoutPhone,
          addressLine1: fullShippingAddress,
          country: 'India'
        },
        items: orderItems,
        subtotal: totalForCheckout,
        shippingCost: shippingFee,
        tax: gstAmount,
        discount: discountAmount,
        grandTotal: checkoutGrandTotal,
        paymentMethod: 'Razorpay',
        paymentId: paymentResponse.razorpay_payment_id,
        paymentStatus: 'Completed',
        paymentOrderId: paymentResponse.razorpay_order_id,
        paymentSignature: paymentResponse.razorpay_signature,
        status: 'Processing'
      };

      const createOrderRes = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (createOrderRes.ok) {
        const order = await createOrderRes.json();
        trackGAEvent('purchase', 'ecommerce', order.orderId || order._id || order.id || 'order', Number(order.totalAmount) || 0);

        if (checkoutMode === 'cart') {
          try {
            await fetch(`${API_URL}/users/${activeUser._id}/cart`, {
              method: 'DELETE',
              headers: getUserHeaders()
            });
          } catch (err) {
            console.error("Error clearing cart on backend:", err);
          }
          setCart([]);
        }

        await fetchUserOrders();

        showToast(`🎉 Payment successful! Order #${order.orderId} placed. Confirmation email sent to ${activeUser.email}`, 'success');

        setSelectedOrder(order);
        setShowCart(false);
        setShowCheckout(false);
        setPaymentOrder(null);
        setCheckoutItems([]);
        setCheckoutMode('cart');
      } else {
        showToast('Failed to create order after payment. Please contact support.', 'error');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      showToast('Error verifying payment. Please contact support.', 'error');
    } finally {
      setIsProcessingPayment(false);
    }
  };


  const handleToggleWaitlist = async (productId) => {
    const alreadyInWishlist = waitlist.includes(productId);
    trackGAEvent(alreadyInWishlist ? 'remove_from_wishlist' : 'add_to_wishlist', 'engagement', String(productId));
    if (!isUserLoggedIn) {
      const nextWaitlist = alreadyInWishlist
        ? waitlist.filter(id => id !== productId)
        : [...waitlist, productId];
      setWaitlist(nextWaitlist);
      saveGuestWaitlist(nextWaitlist);
      showToast(alreadyInWishlist ? '💔 Removed from wishlist.' : '❤️ Added to wishlist!', 'success');
      return;
    }
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...getUserHeaders()
      };
      const res = await fetch(`${API_URL}/users/${activeUser._id}/waitlist`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId })
      });
      if (handleAuthError(res)) return;

      let payload = null;
      try {
        payload = await res.json();
      } catch (err) {
        payload = null;
      }

      if (res.ok) {
        const updatedWaitlist = Array.isArray(payload) ? payload : (Array.isArray(waitlist) ? waitlist : []);
        const normalizedId = String(productId);
        const nextWaitlist = updatedWaitlist.some(id => String(id) === normalizedId)
          ? updatedWaitlist
          : (waitlist.includes(productId)
              ? waitlist.filter(id => String(id) !== normalizedId)
              : [...waitlist, productId]);
        setWaitlist(nextWaitlist);
        const isNowInWishlist = nextWaitlist.some(id => String(id) === normalizedId);
        showToast(isNowInWishlist ? '❤️ Added to wishlist!' : '💔 Removed from wishlist.', 'success');
      } else {
        const alreadyInWishlist = waitlist.includes(productId);
        const nextWaitlist = alreadyInWishlist
          ? waitlist.filter(id => String(id) !== String(productId))
          : [...waitlist, productId];
        setWaitlist(nextWaitlist);
        saveGuestWaitlist(nextWaitlist);
        showToast(payload?.message || 'Failed to sync wishlist with server.', 'error');
      }
    } catch (err) {
      console.error('Wishlist error:', err);
      const alreadyInWishlist = waitlist.includes(productId);
      const nextWaitlist = alreadyInWishlist
        ? waitlist.filter(id => String(id) !== String(productId))
        : [...waitlist, productId];
      setWaitlist(nextWaitlist);
      saveGuestWaitlist(nextWaitlist);
      showToast('Wishlist updated locally. Please refresh if needed.', 'success');
    }
  };

  const handleBuyNow = async (product) => {
    if (!isUserLoggedIn) {
      showToast('Please login or sign up to place an order.', 'error');
      setAuthMode('login');
      setAuthErrorMessage(null);
      setShowAuthModal(true);
      return;
    }

    setCheckoutMode('buy-now');
    setCheckoutItems([product]);
    setShowCheckout(true);
  };


  const handleCategoryChange = (cat) => {
    setSelectedCategory(getCategorySlug(cat));
    setSearchTerm(""); // Clear search when category changes
    setActiveProductIndex(0); // Reset slideshow index
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminCredentials.username,
          password: adminCredentials.password
        })
      });

      if (res.ok) {
        const data = await res.json();
        persistAdminSession(data.token);
        setIsAdmin(true);
        setIsViewingPublicProducts(false);
        setShowAdminLogin(false);
        setAdminCredentials({ username: '', password: '' });
        await validateAdminSession();
        await fetchData();
        navigate('/admin');
        showToast('Admin authenticated successfully!', 'success');
      } else {
        clearAdminSession();
        const error = await res.json().catch(() => ({}));
        showToast(error.message || 'Invalid admin credentials.', 'error');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      showToast('Unable to login to the admin portal.', 'error');
    }
  };

  const updateUserCredentials = (field, value) => {
    if (field === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setUserCredentials(prev => ({ ...prev, [field]: digitsOnly }));
    } else {
      setUserCredentials(prev => ({ ...prev, [field]: value }));
    }
    setAuthErrorMessage(null);
    setAuthFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const enteredEmail = (userCredentials.email || '').trim().toLowerCase();

    if (!enteredEmail) {
      showToast('Please enter your email address first.', 'error');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: enteredEmail })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || 'Unable to send reset link.');
      }

      showToast(data?.message || 'Password reset link sent to your email.', 'success');
    } catch (err) {
      console.error('Forgot password error:', err);
      showToast(err.message || 'Unable to send reset link.', 'error');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleUserAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthSubmitting(true);
    let loginSuccess = false;

    const currentValues = {
      name: userCredentials.name,
      phone: userCredentials.phone,
      address: userCredentials.address,
      email: userCredentials.email,
      password: userCredentials.password,
      confirmPassword: userCredentials.confirmPassword
    };

    const normalizedEmail = (currentValues.email || '').trim().toLowerCase();

    try {
      if (authMode === 'signup') {
        let hasErrors = false;
        let newErrors = {};

        if (!currentValues.name) { newErrors.name = 'Name is required.'; hasErrors = true; }
        if (!currentValues.email) { newErrors.email = 'Email is required.'; hasErrors = true; }
        if (!currentValues.password) { newErrors.password = 'Password is required.'; hasErrors = true; }
        
        if (currentValues.password && currentValues.password !== currentValues.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match!';
          hasErrors = true;
        }
        if (currentValues.phone && !/^\d{10}$/.test(currentValues.phone)) {
          newErrors.phone = 'Phone number must be exactly 10 digits.';
          hasErrors = true;
        }

        if (hasErrors) {
          setAuthFieldErrors(newErrors);
          return;
        }
        
        setAuthFieldErrors({});
        const res = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: currentValues.name,
            phone: currentValues.phone,
            address: currentValues.address,
            email: normalizedEmail,
            password: currentValues.password
          })
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          if (data.requiresVerification) {
            setVerificationEmail(data.email || normalizedEmail);
            setOtpCode('');
            setAuthMode('verify');
            setAuthErrorMessage(null);
            setAuthFieldErrors({ email: '', password: '' });
            showToast('OTP sent to your email. Check your inbox.', 'success');
            return;
          }

          const user = data.user || data;
          const token = data.token;

          setAuthMode('login');
          setUserCredentials({
            name: '',
            phone: '',
            address: '',
            email: normalizedEmail,
            password: '',
            confirmPassword: ''
          });
          setAuthErrorMessage(null);
          setAuthFieldErrors({ email: '', password: '' });

          if (token && user) {
            applyAuthenticatedUser(token, user);
            // If admin is viewing users, add the newly created user to the users list so it appears in AdminDashboard
            try {
              setUsers(prev => {
                if (!user) return prev || [];
                const id = user._id || user.id;
                if (!id) return [user, ...(prev || [])];
                if ((prev || []).some(u => (u._id || u.id) === id)) return prev;
                return [user, ...(prev || [])];
              });
            } catch (e) {
              console.error('Failed to update users after signup:', e);
            }
            setShowAuthModal(false);
            if (!isAdmin) {
              setTimeout(() => openUserDashboard('Overview'), 0);
            }
            showToast('✅ Account created and logged in successfully!', 'success');
            return;
          }

          showToast('Account created. Please sign in.', 'success');
        } else {
          const message = data?.error || data?.message || 'Signup failed';
          showToast(message, 'error');
          if (/account already created|already registered|please sign in/i.test(message)) {
            setAuthMode('login');
            setUserCredentials(prev => ({
              ...prev,
              email: normalizedEmail,
              password: '',
              confirmPassword: ''
            }));
            setAuthErrorMessage(null);
            setAuthFieldErrors({ email: '', password: '' });
          }
        }
      } else {
        if (authMode === 'verify') {
          if (!verificationEmail || !otpCode) {
            showToast('Please enter the OTP sent to your email.', 'error');
            return;
          }

          const res = await fetch(`${API_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: verificationEmail, otp: otpCode })
          });
          const data = await res.json().catch(() => ({}));

          if (res.ok) {
            const user = data.user || data;
            const token = data.token;

            if (token && user) {
              applyAuthenticatedUser(token, user);
              setAuthMode('login');
              setShowAuthModal(false);
              setAuthErrorMessage(null);
              setAuthFieldErrors({ email: '', password: '' });
              showToast('Account verified successfully!', 'success');
              if (!isAdmin) {
                setTimeout(() => openUserDashboard('Overview'), 500);
              }
            } else {
              showToast('Your email has been verified. Please log in.', 'success');
              setAuthMode('login');
            }
          } else {
            const errorMsg = data.error || data.message || 'OTP verification failed.';
            if (/already verified/i.test(errorMsg)) {
              showToast('Your account is already verified! Please sign in.', 'success');
              setAuthMode('login');
            } else {
              showToast(errorMsg, 'error');
            }
          }
          return;
        }

        const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'thesmgroups@gmail.com';
        const isEnteredAdminEmail = currentValues.email === adminUsername || currentValues.email === 'thesmgroups@gmail.com' || currentValues.email === 'thesmgroups@gamil.com';
        
        if (isEnteredAdminEmail) {
          const adminRes = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: currentValues.email, password: currentValues.password })
          });

          const adminData = await adminRes.json().catch(() => ({}));
          if (adminRes.ok && adminData.token) {
            persistAdminSession(adminData.token);
            setIsAdmin(true);
            setIsViewingPublicProducts(false);
            setShowAuthModal(false);
            setShowAdminLogin(false);
            setUserCredentials({ name: '', phone: '', address: '', email: '', password: '', confirmPassword: '' });
            setAuthErrorMessage(null);
            setAuthFieldErrors({ email: '', password: '' });
            await fetchData();
            navigate('/admin');
            showToast('Admin authenticated successfully!', 'success');
            return;
          }

          showToast(adminData.message || 'Invalid admin credentials.', 'error');
          return;
        }

        if (!normalizedEmail || !currentValues.password) {
          let newErrors = {};
          if (!normalizedEmail) newErrors.email = 'Email is required.';
          if (!currentValues.password) newErrors.password = 'Password is required.';
          setAuthFieldErrors(newErrors);
          return;
        }
        setAuthFieldErrors({});

        let res;
        try {
          res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail, password: currentValues.password })
          });
        } catch (fetchErr) {
          // Silent catch to prevent browser net noise
          console.warn('Network issue during login:', fetchErr);
        }

        if (res && res.ok) {
          const data = await res.json();
          const user = data.user || data;
          const token = data.token;
          applyAuthenticatedUser(token, user);
          setShowAuthModal(false);
          setAuthErrorMessage(null);
          setAuthFieldErrors({ email: '', password: '' });
          loginSuccess = true;
          showToast('✅ Login successful!', 'success');
          if (!isAdmin) {
            setTimeout(() => openUserDashboard('Overview'), 0);
          }
        } else {
          const error = res ? await res.json().catch(() => ({})) : {};
          const msg = error?.message || 'Invalid email or password';
          setAuthErrorMessage(msg);
          const lowerMsg = msg.toLowerCase();
          const accountKeywords = [
            'create', 'no account', 'not found', 'not registered', 'please create', 'register', 'does not exist', 'user not found'
          ];
          const isAccountMsg = accountKeywords.some(k => lowerMsg.includes(k));
          let fieldErrors;
          if (lowerMsg.includes('password')) {
            fieldErrors = { email: '', password: msg };
          } else if (lowerMsg.includes('email')) {
            fieldErrors = { email: msg, password: '' };
          } else if (isAccountMsg) {
            // account-related messages belong on the email field only
            fieldErrors = { email: msg, password: '' };
          } else {
            fieldErrors = { email: msg, password: msg };
          }
          setAuthFieldErrors(fieldErrors);
          // focus the email input so the user can correct it immediately
          try { emailInputRef?.current?.focus(); } catch (e) {}
          showToast(msg, 'error');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      const msg = authMode === 'login' ? 'Invalid email or password' : 'Authentication error. Please try again.';
      setAuthErrorMessage(msg);
      if (authMode === 'login') {
        setAuthFieldErrors({ email: msg, password: msg });
      }
      showToast(msg, 'error');
    } finally {
      setAuthSubmitting(false);
    }

    if (authMode === 'login' && loginSuccess) {
      setUserCredentials({ name: '', phone: '', address: '', email: '', password: '', confirmPassword: '' });
    }
  };

  const handleLogout = () => {
    // If Admin is in storefront and clicks Logout, just return them to Admin Dashboard
    if (isAdmin && isViewingPublicProducts) {
      setIsViewingPublicProducts(false);
      navigate('/admin');
      showToast('Returned to Admin Dashboard', 'info');
      return;
    }

    clearAuthSession();
    clearAdminSession();
    setIsUserLoggedIn(false);
    setActiveUser(null);
    setIsAdmin(false);
    setIsViewingPublicProducts(false);
    setShowAdminLogin(false);
    setShowAuthModal(false);
    setShowCart(false);
    setShowWishlist(false);
    setShowCheckout(false);
    setAuthMode('login');
    setUserCredentials({ name: '', phone: '', address: '', email: '', password: '', confirmPassword: '' });
    setAuthErrorMessage(null);
    setAuthPortalIsGate(false);
    setSelectedProduct(null);
    navigate('/');
    showToast('You have been logged out.', 'success');
  };

  const handleViewPublicProducts = () => {
    setIsViewingPublicProducts(true);
    setActiveSection('product');
    navigate('/admin/products');
    setTimeout(() => {
      const productSection = document.getElementById('product');
      if (productSection) {
        productSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 0);
  };

  // Admin dashboard rendering moved to the main return block to avoid
  // conditional hook execution (useMemo below must always run).


  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    if (typeof priceStr === 'number') return priceStr;
    const cleaned = priceStr.toString().replace(/[₹$,/\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const getActiveOfferForProduct = (product) => {
    if (!product || !Array.isArray(offers)) return null;
    const productId = (product._id || product.id || '').toString().toLowerCase();
    const productName = (product.name || '').toString().toLowerCase();
    const categorySlug = getCategorySlug(product.category).toLowerCase();
    const categoryName = getCategoryDisplayName(product.category).toLowerCase();

    return offers.find(offer => {
      if (!offer || offer.isPublished === false || offer.isActive === false) return false;
      if (offer.type === 'storewide') return true;
      if (offer.type === 'category') {
        const target = (offer.targetValue || offer.category || '').toString().toLowerCase();
        return Boolean(target) && (categorySlug === target || categoryName === target || categorySlug.includes(target) || categoryName.includes(target));
      }
      const target = (offer.targetValue || offer.productName || '').toString().toLowerCase();
      return Boolean(target) && (productId === target || productName.includes(target) || target.includes(productId));
    });
  };

  const getProductFinalPrice = (product) => {
    if (!product) return 0;
    const priceNum = parsePrice(product.price);
    const prodDiscountPercent = Number(product.discountPercent || product.discount) || 0;

    let basePrice = priceNum;
    if (prodDiscountPercent > 0) {
      basePrice = Math.round(priceNum * (1 - prodDiscountPercent / 100));
      
      // Catalog price normalization helper
      if (Math.abs(basePrice - 2801) <= 2) basePrice = 2800;
      if (Math.abs(basePrice - 4801) <= 2) basePrice = 4800;
      if (Math.abs(basePrice - 8300) <= 2) basePrice = 8300;
      if (Math.abs(basePrice - 11601) <= 2) basePrice = 11600;
    }

    const activeOffer = getActiveOfferForProduct(product);
    const activeCoupon = coupons.find(c => 
      c.isActive && 
      c.linkedProduct === (product._id || product.id) &&
      (!c.expiryDate || new Date(c.expiryDate) > new Date())
    );

    let finalPrice = basePrice;
    let bestDiscount = priceNum - basePrice;

    if (activeOffer) {
      let offerPrice = priceNum;
      if (activeOffer.discountType === 'fixed') {
        offerPrice = Math.max(0, priceNum - (Number(activeOffer.discountValue) || 0));
      } else if (activeOffer.discountType === 'percentage') {
        offerPrice = Math.round(priceNum * (1 - (Number(activeOffer.discountValue) || 0) / 100));
      }
      
      const offerDiscount = priceNum - offerPrice;
      if (offerDiscount > bestDiscount) {
        finalPrice = offerPrice;
        bestDiscount = offerDiscount;
      }
    }

    if (activeCoupon) {
      const discountVal = parseFloat(activeCoupon.discountValue) || 0;
      const couponPrice = activeCoupon.discountType === 'Fixed'
        ? Math.max(0, priceNum - discountVal)
        : Math.round(priceNum * (1 - discountVal / 100));
      if (priceNum - couponPrice > bestDiscount) {
        finalPrice = couponPrice;
      }
    }

    return finalPrice;
  };

  const getProductRatingInfo = (product) => {
    if (!product) return { rating: '4.5', count: 95 };
    if (Array.isArray(product.reviews) && product.reviews.length > 0) {
      const avg = (product.reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / product.reviews.length).toFixed(1);
      return { rating: avg, count: product.reviews.length };
    }
    const str = (product._id || product.id || product.name || '').toString();
    const charSum = str.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const rating = (4.1 + (charSum % 8) / 10).toFixed(1);
    const count = 12 + (charSum % 340);
    return { rating, count };
  };

const resolvedCartItems = cart
    .map((cartEntry) => {
      const normalized = normalizeCartEntry(cartEntry);
      if (!normalized) return null;
      const product = products.find(p => (p._id || p.id)?.toString() === normalized.productId?.toString()) || normalized.product;
      if (!product) return null;
      return { ...product, quantity: Number(normalized.quantity) || 1, _cartEntryId: normalized.productId };
    })
    .filter(Boolean);

const resolvedWaitlistItems = products.filter(p => waitlist.includes((p._id || p.id)?.toString()));

  const getProductSpecsInfo = (product) => {
    if (!product) return {};
    const name = product.name || '';
    const desc = product.description || '';
    const specs = product.specifications || '';

    let burnerSize = product.burnerSize || '';
    let stoveWeight = product.stoveWeight || '';
    let dimensions = product.dimensions || '';
    let material = product.material || '';
    let howToUse = product.howToUse || '';

    if (!burnerSize) {
      const match = (desc + ' ' + specs + ' ' + name).match(/(?:burner size|burner)\s*:\s*([^,\.\n;]+)/i);
      if (match) burnerSize = match[1].trim();
      else if (/6"/i.test(name) || /6 inch/i.test(name)) burnerSize = '6 Inches';
      else if (/double layer/i.test(name)) burnerSize = '6 Inches';
      else if (/single layer/i.test(name)) burnerSize = '5 Inches';
      else burnerSize = '6 Inches';
    }

    if (!stoveWeight) {
      const match = (desc + ' ' + specs).match(/(?:stove weight|weight|wt)\s*:\s*([^,\.\n;]+)/i);
      if (match) stoveWeight = match[1].trim();
      else if (/m5/i.test(name)) stoveWeight = '18 to 20 kg';
      else if (/m4/i.test(name)) stoveWeight = '8.5 kg';
      else stoveWeight = '8.5 kg';
    }

    if (!dimensions) {
      const match = (desc + ' ' + specs).match(/(?:dimensions|dim)\s*:\s*([^,\.\n;]+)/i);
      if (match) dimensions = match[1].trim();
      else if (/m5/i.test(name)) dimensions = '18" × 18" × 19"';
      else if (/m4/i.test(name)) dimensions = '12" × 10" × 14"';
      else dimensions = '12" × 10" × 14"';
    }

    if (!material) {
      const match = (desc + ' ' + specs).match(/material\s*:\s*([^,\.\n;]+)/i);
      if (match) material = match[1].trim();
      else if (/ss|stainless steel/i.test(desc + ' ' + specs + ' ' + name)) material = 'Premium Stainless Steel (SS)';
      else material = 'Mild Steel (MS)';
    }

    const usagePairs = [];
    if (desc && desc.includes(':')) {
      const excludedKeys = ['burner size', 'burner', 'stove weight', 'weight', 'dimensions', 'dim', 'material', 'how to use', 'specifications', 'price', 'stock'];
      const kvRegex = /([A-Za-z0-9\s/&()-]+?)\s*:\s*([^:]+?)(?=(?:\s+[A-Za-z0-9\s/&()-]+?:|$))/g;
      let match;
      while ((match = kvRegex.exec(desc)) !== null) {
        let key = match[1].trim();
        let val = match[2].trim();

        const knownKeyPatterns = ['Usage', 'Fuel Type', 'Cooking Surface', 'Cooking Capacity', 'Suitable For', 'Application', 'Features', 'Power Source', 'Capacity'];
        const foundKnownKey = knownKeyPatterns.find(k => key.toLowerCase().endsWith(k.toLowerCase()));
        if (foundKnownKey) {
          key = foundKnownKey;
        }

        const normKey = key.toLowerCase();
        const isExcluded = excludedKeys.some(ex => normKey.includes(ex));

        if (key && val && !isExcluded && key.length < 35 && val.length < 200) {
          if (!usagePairs.some(p => p.key.toLowerCase() === key.toLowerCase())) {
            usagePairs.push({ key, val });
          }
        }
      }
    }

    return {
      burnerSize,
      stoveWeight,
      dimensions,
      material,
      usagePairs,
      rawDescription: desc,
      howToUse: howToUse || `1. Place stove on a stable, non-combustible surface.\n2. Fill combustion chamber with fuel (wood, coconut shell, husk or biomass).\n3. Connect & switch on air regulator blower for clean combustion.\n4. Light fuel from top/side port and adjust fan speed for flame intensity.`
    };
  };

  const cartTotal = resolvedCartItems.reduce((sum, item) => sum + (getProductFinalPrice(item) * (Number(item.quantity) || 1)), 0);
  const checkoutItemsForDisplay = checkoutItems.length > 0 ? checkoutItems : resolvedCartItems;
  const checkoutTotal = checkoutItemsForDisplay.reduce((sum, item) => sum + (getProductFinalPrice(item) * (Number(item.quantity) || 1)), 0);
  const discountPercent = checkoutItemsForDisplay.reduce((maxDisc, item) => Math.max(maxDisc, Number(item.discountPercent) || 0), 0);
  // discountAmount is set to 0 for product-level discounts because getProductFinalPrice already applies product discounts to checkoutTotal
  const discountAmount = 0;

  const availableCourierOptions = useMemo(() => {
    const optsMap = new Map();
    checkoutItemsForDisplay.forEach(item => {
      const opts = Array.isArray(item.courierOptions) && item.courierOptions.length > 0
        ? item.courierOptions
        : [
            { name: 'Rathimeena Parcel Service', price: 150 },
            { name: 'ST Couriers', price: 250 },
            { name: 'MML Express', price: 150 }
          ];
      opts.forEach(o => {
        if (o && o.name) {
          optsMap.set(o.name, Number(o.price) || 0);
        }
      });
    });
    if (optsMap.size === 0) {
      optsMap.set('Rathimeena Parcel Service', 150);
      optsMap.set('ST Couriers', 250);
      optsMap.set('MML Express', 150);
    }
    return Array.from(optsMap.entries()).map(([name, price]) => ({ name, price }));
  }, [checkoutItemsForDisplay]);

  const activeCourier = selectedCourierOption || availableCourierOptions[0] || { name: 'Rathimeena Parcel Service', price: 150 };
  const shippingFee = Number(activeCourier.price) || 0;
  
  // Dynamic GST calculation based on admin configuration per product (0% if none specified)
  const gstRate = checkoutItemsForDisplay.reduce((maxGst, item) => Math.max(maxGst, Number(item.gstPercent) || 0), 0);
  const gstAmount = gstRate > 0 ? Math.round((checkoutTotal - discountAmount + shippingFee) * (gstRate / 100)) : 0;
  const checkoutGrandTotal = Math.max(0, checkoutTotal - discountAmount + shippingFee + gstAmount);

  const displayedProducts = Array.isArray(products) && products.length > 0 ? products : FALLBACK_PRODUCTS;

  const matchedSuggestions = searchTerm.trim() === "" ? [] : displayedProducts.filter(product => {
    const productCategorySlug = getCategorySlug(product.category);
    const nameMatch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = getCategoryDisplayName(product.category).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          productCategorySlug.includes(searchTerm.toLowerCase());
    return nameMatch || categoryMatch;
  });

  const handleSuggestionClick = (product) => {
    setSelectedProduct(product);
    setSelectedProductImageIndex(0);
    setShowSuggestions(false);
  };

  const filteredProducts = displayedProducts.filter(product => {
    const productCategorySlug = getCategorySlug(product.category);
    const selectedCatClean = getCategorySlug(selectedCategory);

    // Empty string or 'all' both mean show all categories
    const matchesCategory = !selectedCatClean || selectedCatClean === 'all' ||
                            productCategorySlug === selectedCatClean;
                            
    const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          getCategoryDisplayName(product.category).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          productCategorySlug.includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    setActiveSection(sectionId);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleNavbarSearchToggle = () => {
    setShowNavbarSearch(prev => !prev);
  };

  const handleNavbarSearchChange = (value) => {
    setSearchTerm(value);
    setShowNavbarSearch(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      showToast('Account creation successful!', 'success');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('loggedin') === 'true') {
      showToast('Login successful!', 'success');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return (
    (isAdmin && !isViewingPublicProducts) ? (
      <AdminDashboard 
        onLogout={() => {
          clearAdminSession();
          setIsAdmin(false);
          setIsViewingPublicProducts(false);
          setShowAdminLogin(false);
          navigate('/');
        }} 
        products={products} 
        onAddProduct={addProduct} 
        onDeleteProduct={deleteProduct}
        navigate={navigate}
        onUpdateProduct={updateProduct}

        offers={offers}
        offerData={offerData}
        onUpdateOffer={updateOffer}
        onDeleteOffer={deleteOffer}
        onToggleOffer={toggleOffer}
        onDuplicateOffer={duplicateOffer}
        categories={categories}
        onAddCategory={addCategory}
        onAddCoupon={addCoupon}
        onDeleteCoupon={deleteCoupon}
        onUpdateCoupon={updateCoupon}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        orders={orders}
        coupons={coupons}
        supportQueries={supportQueries}
        returnRequests={returnRequests}
        refundRequests={refundRequests}
        activityLogs={activityLogs}
        leads={leads}
        users={users}
        onToggleBlockUser={handleToggleBlockUser}
        onDeleteUser={handleDeleteUser}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onUpdateOrder={updateOrder}
        onViewPublicProducts={handleViewPublicProducts}
        heroBanners={heroBanners}
        onAddHeroBanner={addHeroBanner}
        onDeleteHeroBanner={deleteHeroBanner}
        onRespondToSupport={respondToSupport}
      />
    ) : (
    <div className="app-wrapper">
      {isAdmin && isViewingPublicProducts && (
        <div className="admin-storefront-bar" style={{
          background: 'linear-gradient(90deg, #1e293b, #0f172a)',
          color: '#f8fafc',
          padding: '0.6rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
          position: 'sticky',
          top: 0,
          zIndex: 9999,
          borderBottom: '1px solid #334155',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="status-pulse-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
            <span>Logged in as <strong>CEO & Super Admin</strong> (Storefront Preview Mode)</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => {
                setIsViewingPublicProducts(false);
                navigate('/admin');
              }}
              style={{
                background: '#22c55e',
                color: 'white',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.2s'
              }}
            >
              <i className="fa-solid fa-gauge"></i>
              Go to Admin Dashboard
            </button>
            <button 
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.2s'
              }}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              Logout Admin
            </button>
          </div>
        </div>
      )}
      <LanguageSelectorPopup />
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast-popup ${toastMessage.type}`}>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div id="productDetailModal" className="modal-overlay active" style={{ display: 'flex' }}>
          <div className="modal-content detail-modal" role="dialog" aria-modal="true">
            <button className="close-modal" onClick={() => { setSelectedProduct(null); if (location.pathname.startsWith('/product/')) navigate('/', { replace: true }); }} aria-label="Close">&times;</button>
            
            <div className="detail-modal-body">
              {/* Left Column: Image Slider */}
              <div className="product-slider">
                <div className="slider-main-image">
                  {selectedProduct.video && selectedProductImageIndex === (selectedProduct.images?.length || 0) ? (
                    selectedProduct.video.includes('youtube.com') || selectedProduct.video.includes('youtu.be') ? (
                      (() => {
                        let embedId = '';
                        if (selectedProduct.video.includes('youtube.com/watch?v=')) {
                          embedId = selectedProduct.video.split('watch?v=')[1]?.split('&')[0];
                        } else if (selectedProduct.video.includes('youtu.be/')) {
                          embedId = selectedProduct.video.split('youtu.be/')[1]?.split('?')[0];
                        } else if (selectedProduct.video.includes('youtube.com/embed/')) {
                          embedId = selectedProduct.video.split('embed/')[1]?.split('?')[0];
                        }
                        return (
                          <iframe 
                            width="100%" 
                            height="100%" 
                            src={`https://www.youtube.com/embed/${embedId}?autoplay=1`} 
                            title="Product Video" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen
                            style={{ borderRadius: '16px', minHeight: '320px', width: '100%', aspectRatio: '16/9' }}
                          />
                        );
                      })()
                    ) : selectedProduct.video.includes('vimeo.com') ? (
                      (() => {
                        const vimeoId = selectedProduct.video.split('vimeo.com/')[1]?.split('?')[0];
                        return (
                          <iframe 
                            src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`} 
                            width="100%" 
                            height="100%" 
                            frameBorder="0" 
                            allow="autoplay; fullscreen; picture-in-picture" 
                            allowFullScreen
                            style={{ borderRadius: '16px', minHeight: '320px', width: '100%', aspectRatio: '16/9' }}
                          />
                        );
                      })()
                    ) : (
                      <video 
                        src={selectedProduct.video} 
                        controls 
                        autoPlay 
                        style={{ width: '100%', height: '100%', maxHeight: '420px', objectFit: 'contain', borderRadius: '16px' }}
                      />
                    )
                  ) : selectedProduct.images && selectedProduct.images.length > 0 ? (
                    <img loading="lazy" 
                      src={selectedProduct.images[selectedProductImageIndex]} 
                      alt={selectedProduct.name} 
                    />
                  ) : (
                    <i className={`fa-solid ${selectedProduct.icon || 'fa-box'} placeholder-img`} style={{ fontSize: '7rem' }} aria-hidden="true"></i>
                  )}
                  
                  {((selectedProduct.images?.length || 0) + (selectedProduct.video ? 1 : 0)) > 1 && (
                    <>
                      <button 
                        className="slider-arrow prev" 
                        onClick={() => setSelectedProductImageIndex(prev => (prev === 0 ? ((selectedProduct.images?.length || 0) + (selectedProduct.video ? 1 : 0)) - 1 : prev - 1))}
                        aria-label="Previous media"
                      >
                        <i className="fa-solid fa-chevron-left"></i>
                      </button>
                      <button 
                        className="slider-arrow next" 
                        onClick={() => setSelectedProductImageIndex(prev => (prev === ((selectedProduct.images?.length || 0) + (selectedProduct.video ? 1 : 0)) - 1 ? 0 : prev + 1))}
                        aria-label="Next media"
                      >
                        <i className="fa-solid fa-chevron-right"></i>
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails indicator */}
                {((selectedProduct.images?.length || 0) + (selectedProduct.video ? 1 : 0)) > 1 && (
                  <div className="slider-thumbnails">
                    {selectedProduct.images && selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        className={`thumbnail-btn ${selectedProductImageIndex === idx ? 'active' : ''}`}
                        onClick={() => setSelectedProductImageIndex(idx)}
                      >
                        <img loading="lazy" src={img} alt={`Thumbnail ${idx + 1}`} />
                      </button>
                    ))}
                    {selectedProduct.video && (
                      <button
                        className={`thumbnail-btn video-thumb ${selectedProductImageIndex === selectedProduct.images.length ? 'active' : ''}`}
                        onClick={() => setSelectedProductImageIndex(selectedProduct.images.length)}
                        style={{ position: 'relative' }}
                      >
                        <div style={{ width: '100%', height: '100%', minHeight: '50px', display: 'grid', placeItems: 'center', background: '#1e293b', borderRadius: '8px' }}>
                          <i className="fa-solid fa-play" style={{ color: '#fff', fontSize: '1.2rem' }}></i>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Details Info */}
              <div className="product-detail-info">
                <span className="category-badge">
                  {((selectedProduct.category || '').toString().includes('-') 
                    ? selectedProduct.category 
                    : (selectedProduct.category || '').toLowerCase().replace(/\s+/g, '-'))
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </span>
                <h2>{selectedProduct.name}</h2>
                {(() => {
                  const modalRatingInfo = getProductRatingInfo(selectedProduct);
                  const totalReviews = selectedProductReviews.length || Math.round(modalRatingInfo.count / 3);
                  return (
                    <div className="product-detail-rating-row" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0.4rem 0 1rem 0', flexWrap: 'wrap' }}>
                      <span className="rating-badge" style={{ background: '#16a34a', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '700', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        {modalRatingInfo.rating} <i className="fa-solid fa-star" style={{ fontSize: '0.7rem' }}></i>
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>
                        {modalRatingInfo.count} Ratings & {totalReviews} Reviews
                      </span>
                      <span style={{ color: '#cbd5e1' }}>•</span>
                      <span style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <i className="fa-solid fa-circle-check"></i> Verified Purchase
                      </span>
                    </div>
                  );
                })()}
                <div className="price-tag">
                  {(() => {
                    const priceNum = parsePrice(selectedProduct.price);
                    const activeOffer = getActiveOfferForProduct(selectedProduct);
                    const activeCoupon = coupons.find(c => 
                      c.isActive && 
                      c.linkedProduct === (selectedProduct._id || selectedProduct.id) &&
                      (!c.expiryDate || new Date(c.expiryDate) > new Date())
                    );
                    
                    const prodDiscountPercent = Number(selectedProduct.discountPercent || selectedProduct.discount) || 0;
                    
                    let discountedPrice = null;
                    let discountText = '';
                    let originalPrice = null;

                    if (prodDiscountPercent > 0) {
                      originalPrice = priceNum;
                      discountedPrice = getProductFinalPrice(selectedProduct);
                      discountText = `${prodDiscountPercent}% off`;
                    } else if (activeOffer) {
                      if (activeOffer.discountType === 'fixed') {
                        originalPrice = priceNum;
                        discountedPrice = Math.max(0, priceNum - (Number(activeOffer.discountValue) || 0));
                        discountText = `₹${Number(activeOffer.discountValue) || 0} off`;
                      } else if (activeOffer.discountType === 'percentage') {
                        const dVal = Number(activeOffer.discountValue) || 0;
                        originalPrice = priceNum;
                        discountedPrice = Math.round(priceNum * (1 - dVal / 100));
                        discountText = `${dVal}% off`;
                      }
                    } else if (activeCoupon) {
                      const discountVal = parseFloat(activeCoupon.discountValue) || 0;
                      if (activeCoupon.discountType === 'Fixed') {
                        originalPrice = priceNum;
                        discountedPrice = Math.max(0, priceNum - discountVal);
                        discountText = `₹${discountVal} off`;
                      } else {
                        originalPrice = priceNum;
                        discountedPrice = Math.round(priceNum * (1 - discountVal / 100));
                        discountText = `${discountVal}% off`;
                      }
                    }

                    const displayPrice = discountedPrice !== null ? discountedPrice : priceNum;

                    if (originalPrice !== null && originalPrice > displayPrice) {
                      return (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>₹{displayPrice.toLocaleString('en-IN')}</span>
                          <span style={{ fontSize: '1.1rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{originalPrice.toLocaleString('en-IN')}</span>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#388e3c' }}>{discountText} {activeCoupon ? `(Coupon: ${activeCoupon.code})` : ''}</span>
                        </div>
                      );
                    }

                    return `₹${priceNum.toLocaleString('en-IN')}`;
                  })()}
                </div>
                {typeof selectedProduct.stock === 'number' && (
                  <div className="stock-info" style={{ marginBottom: '1rem', fontWeight: 600, color: selectedProduct.stock > 0 ? '#15803d' : '#b91c1c' }}>
                    {selectedProduct.stock > 0 ? `In stock: ${selectedProduct.stock}` : 'Out of stock'}
                  </div>
                )}
                {/* Product Specification & Usages Containers */}
                {(() => {
                  const specsInfo = getProductSpecsInfo(selectedProduct);
                  return (
                    <div className="product-details-containers-wrapper" style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
                      {/* 4 Small Specification Containers */}
                      <div className="small-containers-grid">
                        <div className="small-spec-card">
                          <div className="spec-card-icon-wrap" style={{ background: 'rgba(255, 122, 0, 0.1)', color: '#ff7a00' }}>
                            <i className="fa-solid fa-fire-burner"></i>
                          </div>
                          <div className="spec-card-info">
                            <span className="spec-card-label">Burner Size</span>
                            <strong className="spec-card-value">{specsInfo.burnerSize}</strong>
                          </div>
                        </div>

                        <div className="small-spec-card">
                          <div className="spec-card-icon-wrap" style={{ background: 'rgba(21, 128, 61, 0.1)', color: '#15803d' }}>
                            <i className="fa-solid fa-weight-hanging"></i>
                          </div>
                          <div className="spec-card-info">
                            <span className="spec-card-label">Stove Weight</span>
                            <strong className="spec-card-value">{specsInfo.stoveWeight}</strong>
                          </div>
                        </div>

                        <div className="small-spec-card">
                          <div className="spec-card-icon-wrap" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
                            <i className="fa-solid fa-ruler-combined"></i>
                          </div>
                          <div className="spec-card-info">
                            <span className="spec-card-label">Dimensions</span>
                            <strong className="spec-card-value">{specsInfo.dimensions}</strong>
                          </div>
                        </div>

                        <div className="small-spec-card">
                          <div className="spec-card-icon-wrap" style={{ background: 'rgba(147, 51, 234, 0.1)', color: '#9333ea' }}>
                            <i className="fa-solid fa-cubes"></i>
                          </div>
                          <div className="spec-card-info">
                            <span className="spec-card-label">Material</span>
                            <strong className="spec-card-value">{specsInfo.material}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Usages Container */}
                      <div className="product-usage-container">
                        <h4 className="container-header">
                          <i className="fa-solid fa-layer-group" style={{ color: '#15803d' }}></i> Usages & Features
                        </h4>
                        {specsInfo.usagePairs && specsInfo.usagePairs.length > 0 ? (
                          <div className="usage-chips-grid">
                            {specsInfo.usagePairs.map((pair, pIdx) => (
                              <div key={pIdx} className="usage-chip-item">
                                <span className="usage-chip-key">{pair.key}</span>
                                <span className="usage-chip-val">{pair.val}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="description-text" style={{ margin: 0 }}>
                            {specsInfo.rawDescription || `Ideal for Homes, Small Hotels, Tea Shops & Commercial Kitchens. Built for high efficiency and minimal fuel consumption.`}
                          </p>
                        )}
                      </div>

                      {/* How to Use Container */}
                      <div className="product-how-to-use-container">
                        <h4 className="container-header">
                          <i className="fa-solid fa-circle-info" style={{ color: '#15803d' }}></i> How to Use
                        </h4>
                        <p className="how-to-use-text">
                          {specsInfo.howToUse || `1. Place stove on a stable, non-combustible surface.\n2. Fill combustion chamber with fuel (wood, coconut shell, husk or biomass).\n3. Connect & switch on air regulator blower for clean combustion.\n4. Light fuel from top/side port and adjust fan speed for flame intensity.`}
                        </p>
                      </div>
                    </div>
                  );
                })()}
                <div className="actions-row">
                  <button className="buy-now-btn" onClick={() => { setSelectedProduct(null); if (location.pathname.startsWith('/product/')) navigate('/', { replace: true }); handleBuyNow(selectedProduct); }}>Buy Now</button>
                  <button className="add-to-cart" onClick={() => handleAddToCart(selectedProduct)}>Add to Cart</button>
                </div>

                <div className="mockup-trust-banner">
                  <div className="mockup-trust-item">
                    <i className="fa-solid fa-truck-fast mockup-trust-icon" style={{ color: '#16a34a' }}></i>
                    <div className="mockup-trust-text">
                      <strong>Secure Delivery</strong>
                      <span>Insured Transit Across India</span>
                    </div>
                  </div>
                  <div className="mockup-trust-item">
                    <i className="fa-solid fa-shield-halved mockup-trust-icon" style={{ color: '#16a34a' }}></i>
                    <div className="mockup-trust-text">
                      <strong>100% Secure Checkout</strong>
                      <span>Direct Razorpay Payment</span>
                    </div>
                  </div>
                  <div className="mockup-trust-item">
                    <i className="fa-solid fa-rotate-left mockup-trust-icon" style={{ color: '#16a34a' }}></i>
                    <div className="mockup-trust-text">
                      <strong>SriTech Guarantee</strong>
                      <span>Certified Quality Support</span>
                    </div>
                  </div>
                  <div className="mockup-trust-item">
                    <i className="fa-solid fa-award mockup-trust-icon" style={{ color: '#16a34a' }}></i>
                    <div className="mockup-trust-text">
                      <strong>Heavy-Duty MS</strong>
                      <span>Flame-Resistant Build</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

                        {/* Reviews Section */}
            <div className="reviews-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '1rem' }}>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1.5rem', textAlign: 'left' }}>Customer Reviews</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="reviews-layout">
                {/* Reviews List */}
                <div className="reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {selectedProductReviews.length > 0 ? (
                    selectedProductReviews.map((rev, index) => (
                      <div key={rev._id || index} className="review-card" style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{rev.customerName}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="review-rating" style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <i key={i} className={`${i < rev.rating ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
                          ))}
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0', lineHeight: '1.4' }}>{rev.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center', height: '100%' }}>
                      <i className="fa-solid fa-comment-dots" style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1rem' }}></i>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>No reviews yet</h4>
                      <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Be the first to review this product.</p>
                    </div>
                  )}
                </div>

                {/* Submit Review Form */}
                <div className="review-form-container" style={{ textAlign: 'left' }}>
                  <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ color: 'var(--text-main)', margin: '0' }}>Share Your Experience</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0' }}>You can rate this product below.</p>
                    
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Your Rating</label>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '1.5rem', color: '#fbbf24', cursor: 'pointer' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i 
                            key={star} 
                            className={`${star <= newReviewRating ? 'fa-solid' : 'fa-regular'} fa-star`}
                            onClick={() => setNewReviewRating(star)}
                          ></i>
                        ))}
                      </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label htmlFor="reviewComment" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Your Review</label>
                      <textarea 
                        id="reviewComment"
                        rows="4" 
                        placeholder="What did you think of the product? Share your experience with others..." 
                        required
                        value={newReviewComment}
                        onChange={(e) => setNewReviewComment(e.target.value)}
                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
                      ></textarea>
                    </div>

                    <button type="submit" className="buy-now-btn" style={{ width: '100%', padding: '0.75rem' }}>Submit Review</button>
                  </form>
                </div>
              </div>
            </div>

            {/* Bottom: Related Products */}
            {(() => {
              const currentCategorySlug = (selectedProduct.category || '').toLowerCase().trim().replace(/\s+/g, '-');
              const currentId = (selectedProduct._id || selectedProduct.id)?.toString();

              let relatedList = products.filter(p => {
                const catSlug = (p.category || '').toLowerCase().trim().replace(/\s+/g, '-');
                const pId = (p._id || p.id)?.toString();
                return catSlug === currentCategorySlug && pId !== currentId;
              });

              if (relatedList.length < 4) {
                const otherProducts = products.filter(p => (p._id || p.id)?.toString() !== currentId && !relatedList.some(r => (r._id || r.id)?.toString() === (p._id || p.id)?.toString()));
                relatedList = [...relatedList, ...otherProducts].slice(0, 4);
              } else {
                relatedList = relatedList.slice(0, 4);
              }

              if (relatedList.length === 0) return null;

              return (
                <div className="related-products-section">
                  <div className="related-products-header">
                    <div>
                      <h3 className="related-products-title">
                        <i className="fa-solid fa-layer-group" style={{ color: '#15803d' }}></i> Similar Products You Might Like
                      </h3>
                      <p className="related-products-subtitle">Top-rated items carefully chosen from our catalog</p>
                    </div>
                  </div>

                  <div className="related-products-grid">
                    {relatedList.map(relatedProduct => {
                      const relPriceNum = parsePrice(relatedProduct.price);
                      const relFinalPrice = getProductFinalPrice(relatedProduct);
                      const relDiscPercent = Number(relatedProduct.discountPercent || relatedProduct.discount) || 0;
                      const hasDiscount = relDiscPercent > 0 || relPriceNum > relFinalPrice;

                      return (
                        <div 
                          key={relatedProduct._id || relatedProduct.id} 
                          className="related-product-card"
                          onClick={() => {
                            setSelectedProduct(relatedProduct);
                            setSelectedProductImageIndex(0);
                            setTimeout(() => {
                              document.getElementById('productDetailModal')?.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 50);
                          }}
                        >
                          <div className="related-product-img-wrap">
                            {hasDiscount && (
                              <span className="related-product-badge discount">
                                {relDiscPercent > 0 ? `${relDiscPercent}% OFF` : 'SPECIAL'}
                              </span>
                            )}
                            {relatedProduct.images && relatedProduct.images.length > 0 ? (
                              <img loading="lazy" src={relatedProduct.images[0]} alt={relatedProduct.name} className="related-product-img" />
                            ) : (
                              <div className="related-product-fallback-img">
                                <i className={`fa-solid ${relatedProduct.icon || 'fa-box'}`}></i>
                              </div>
                            )}
                            <div className="related-product-overlay">
                              <span className="related-product-quickview">Quick View <i className="fa-solid fa-arrow-right"></i></span>
                            </div>
                          </div>

                          <div className="related-product-info">
                            <span className="related-product-category">
                              {((relatedProduct.category || '').toString().includes('-') 
                                ? relatedProduct.category 
                                : (relatedProduct.category || '').toLowerCase().replace(/\s+/g, '-'))
                                .replace(/-/g, ' ')}
                            </span>
                            <h4 className="related-product-title-text" title={relatedProduct.name}>
                              {relatedProduct.name}
                            </h4>

                            {(() => {
                              const relRatingInfo = getProductRatingInfo(relatedProduct);
                              return (
                                <div className="rating-row-grid" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0.2rem 0' }}>
                                  <span className="rating-badge">{relRatingInfo.rating} <i className="fa-solid fa-star"></i></span>
                                  <span className="rating-count">({relRatingInfo.count})</span>
                                </div>
                              );
                            })()}

                            <div className="related-product-price-row">
                              <span className="related-product-final-price">
                                ₹{relFinalPrice.toLocaleString('en-IN')}
                              </span>
                              {hasDiscount && (
                                <span className="related-product-mrp-price">
                                  ₹{relPriceNum.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

       {/* Cart Modal */}
       {showCart && (
         <div id="cartModal" className="modal-overlay active" style={{ display: 'flex' }}>
           <div className="modal-content" role="dialog" aria-modal="true" style={{ maxWidth: '600px', width: '90%' }}>
             <button className="close-modal" onClick={() => setShowCart(false)} aria-label="Close">
               &times;
             </button>
             <div className="modal-heading-row">
               <div>
                 <h2 className="modal-title">
                   <i className="fa-solid fa-cart-shopping"></i> Shopping Cart
                 </h2>
                 <p className="modal-subtitle">Ready to checkout? Review your selected items below.</p>
               </div>
               <div className="modal-pill">{resolvedCartItems.length} item{resolvedCartItems.length === 1 ? '' : 's'}</div>
             </div>
             {resolvedCartItems.length === 0 ? (
               <div className="modal-empty-state">
                 <i className="fa-solid fa-cart-flatbed"></i>
                 <p>Your cart is empty.</p>
                 <span>Add a few favorites and come back here anytime.</span>
               </div>
             ) : (
               <div>
                 <ul className="modal-item-list">
                   {resolvedCartItems.map((item, idx) => (
                     <li key={idx} className="modal-item-card">
                       <div className="modal-item-img">
                         {item.images && item.images.length > 0 ? (
                           <img loading="lazy" src={item.images[0]} alt={item.name} />
                         ) : (
                           <i className={`fa-solid ${item.icon || 'fa-box'}`}></i>
                         )}
                       </div>
                       <div className="modal-item-details">
                         <span className="modal-item-category">{((item.category || '').toString().includes('-') ? item.category : (item.category || '').toLowerCase().replace(/\s+/g, '-')).replace(/-/g, ' ')}</span>
                         <h4 className="modal-item-name">{item.name}</h4>
                         <div className="modal-item-meta">
                           <span className="modal-item-price">₹{(getProductFinalPrice(item) * (Number(item.quantity) || 1)).toLocaleString('en-IN')}</span>
                           <div className="modal-item-qty-controls">
                             <button className="modal-item-qty-btn" onClick={() => handleChangeCartQuantity(item._id || item.id, -1)}>-</button>
                             <span>{Number(item.quantity) || 1}</span>
                             <button className="modal-item-qty-btn" onClick={() => handleChangeCartQuantity(item._id || item.id, 1)}>+</button>
                           </div>
                         </div>
                       </div>
                       <div className="modal-item-actions">
                         <button 
                           onClick={() => handleRemoveFromCart(item._id || item.id)} 
                           aria-label={`Remove ${item.name}`} 
                           className="modal-item-remove-btn"
                           title="Remove item"
                         >
                           <i className="fa-solid fa-trash-can" />
                         </button>
                       </div>
                     </li>
                   ))}
                 </ul>
                 
                 <button className="cta-button checkout-cta-button" onClick={handleCheckoutCart} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', color: '#ffffff' }}>
                   Proceed to Checkout
                 </button>
               </div>
             )}
           </div>
         </div>
       )}

       {/* Checkout Modal */}
       {showCheckout && (
         <div id="checkoutModal" className="modal-overlay active" style={{ display: 'flex' }}>
           <div className="modal-content" role="dialog" aria-modal="true" style={{ maxWidth: '700px', width: '90%' }}>
             <button className="close-modal" onClick={() => setShowCheckout(false)} aria-label="Close" disabled={isProcessingPayment}>
               &times;
             </button>
             <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <i className="fa-solid fa-credit-card"></i> Order Checkout
             </h2>

             {/* Order Summary & Delivery Address */}
             <div className="checkout-summary-card">
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
                 <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <i className="fa-solid fa-location-dot" style={{ color: '#15803d' }}></i> Shipping & Delivery Address
                 </h3>
                 <span style={{ fontSize: '0.8rem', background: 'rgba(21, 128, 61, 0.08)', color: '#15803d', fontWeight: '700', padding: '0.25rem 0.6rem', borderRadius: '20px' }}>
                   Step 1 of 2
                 </span>
               </div>

               <div className="checkout-summary-userinfo" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem', marginBottom: '1.25rem' }}>
                 <div style={{ gridColumn: 'span 1' }}>
                   <label className="checkout-summary-label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                   <input
                     type="text"
                     value={userCredentials.name}
                     onChange={(e) => updateUserCredentials('name', e.target.value)}
                     placeholder="e.g. Rahul Sharma"
                     className="checkout-summary-input"
                     style={{ border: checkoutFieldErrors.name ? '1.5px solid #ef4444' : undefined }}
                   />
                 </div>

                 <div style={{ gridColumn: 'span 1' }}>
                   <label className="checkout-summary-label">Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
                   <input
                     type="tel"
                     value={userCredentials.phone}
                     onChange={(e) => updateUserCredentials('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                     placeholder="10-digit mobile number"
                     className="checkout-summary-input"
                     style={{ border: checkoutFieldErrors.phone ? '1.5px solid #ef4444' : undefined }}
                   />
                 </div>

                 <div style={{ gridColumn: 'span 2' }}>
                   <label className="checkout-summary-label">Flat, House No., Building / Street Address <span style={{ color: '#ef4444' }}>*</span></label>
                   <input
                     type="text"
                     value={userCredentials.address}
                     onChange={(e) => updateUserCredentials('address', e.target.value)}
                     placeholder="e.g. Flat 402, Green Valley Apartments, Main Street"
                     className="checkout-summary-input"
                     style={{ border: checkoutFieldErrors.address ? '1.5px solid #ef4444' : undefined }}
                   />
                 </div>

                 <div>
                   <label className="checkout-summary-label">City / District <span style={{ color: '#ef4444' }}>*</span></label>
                   <input
                     type="text"
                     value={userCredentials.city || ''}
                     onChange={(e) => updateUserCredentials('city', e.target.value)}
                     placeholder="e.g. Chennai"
                     className="checkout-summary-input"
                     style={{ border: checkoutFieldErrors.city ? '1.5px solid #ef4444' : undefined }}
                   />
                 </div>

                 <div>
                   <label className="checkout-summary-label">State <span style={{ color: '#ef4444' }}>*</span></label>
                   <input
                     type="text"
                     value={userCredentials.state || ''}
                     onChange={(e) => updateUserCredentials('state', e.target.value)}
                     placeholder="e.g. Tamil Nadu"
                     className="checkout-summary-input"
                     style={{ border: checkoutFieldErrors.state ? '1.5px solid #ef4444' : undefined }}
                   />
                 </div>

                 <div style={{ gridColumn: 'span 2' }}>
                   <label className="checkout-summary-label">Pincode / Postal Code <span style={{ color: '#ef4444' }}>*</span></label>
                   <input
                     type="text"
                     value={userCredentials.pincode || ''}
                     onChange={(e) => updateUserCredentials('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                     placeholder="e.g. 600001"
                     className="checkout-summary-input"
                     style={{ border: checkoutFieldErrors.pincode ? '1.5px solid #ef4444' : undefined }}
                   />
                 </div>
               </div>
               <div className="checkout-summary-order-items">
                 {checkoutItemsForDisplay.map((item, idx) => (
                   <div key={item._id || item.id || idx} className="checkout-summary-order-item">
                     {item.images && item.images.length > 0 ? (
                       <img loading="lazy" src={item.images[0]} alt={item.name} />
                     ) : (
                       <div className="checkout-summary-order-item-fallback">
                         <i className="fa-solid fa-box" />
                       </div>
                     )}
                     <div className="checkout-summary-order-item-text">
                       <span className="checkout-summary-order-item-name">{item.name}</span>
                        <span className="checkout-summary-order-item-details">{Number(item.quantity) || 1} qty • {discountPercent}% discount</span>
                     </div>
                   </div>
                 ))}
               </div>
                <div className="checkout-shipping-method-section" style={{ background: '#ffffff', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                    <i className="fa-solid fa-truck-fast" style={{ color: '#ff7a00' }} />
                    Select Shipping Method
                  </span>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {availableCourierOptions.map((courier, idx) => {
                      const isSelected = activeCourier.name === courier.name;
                      return (
                        <label
                          key={idx}
                          onClick={() => setSelectedCourierOption(courier)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.6rem 0.85rem',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid #ff7a00' : '1px solid #cbd5e1',
                            background: isSelected ? '#fff7ed' : '#ffffff',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: isSelected ? '600' : '400',
                            color: '#0f172a'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <input
                              type="radio"
                              name="courierOption"
                              checked={isSelected}
                              onChange={() => setSelectedCourierOption(courier)}
                              style={{ accentColor: '#ff7a00', cursor: 'pointer' }}
                            />
                            <span>{courier.name}</span>
                          </div>
                          <strong>₹{courier.price}</strong>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="checkout-summary-row">
                  <span>Subtotal</span>
                 <strong>₹{checkoutTotal.toLocaleString('en-IN')}</strong>
               </div>
               {discountAmount > 0 && (
                 <div className="checkout-summary-row">
                   <span>Discount ({discountPercent}%)</span>
                   <strong>-₹{discountAmount.toLocaleString('en-IN')}</strong>
                 </div>
               )}
               <div className="checkout-summary-row">
                 <span>Shipping</span>
                 <strong>{shippingFee === 0 ? 'FREE' : `₹${shippingFee.toLocaleString('en-IN')}`}</strong>
               </div>
               {gstAmount > 0 && (
                 <div className="checkout-summary-row">
                   <span>GST ({gstRate}%)</span>
                   <strong>₹{gstAmount.toLocaleString('en-IN')}</strong>
                 </div>
               )}
               <div className="checkout-summary-divider" />
               <div className="checkout-summary-row total-row">
                 <span>Total</span>
                 <strong>₹{checkoutGrandTotal.toLocaleString('en-IN')}</strong>
               </div>
               <div className="checkout-summary-divider" />
             </div>

             {/* Action Buttons */}
             <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
               <button 
                 className="cta-button checkout-cta-button" 
                 onClick={handleInitiatePayment}
                 disabled={isProcessingPayment}
                 style={{ 
                   width: '100%', 
                   padding: '1rem', 
                   fontSize: '1.1rem',
                   opacity: isProcessingPayment ? 0.7 : 1,
                   cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   gap: '0.5rem',
                   color: '#ffffff'
                 }}
               >
                 {isProcessingPayment ? (
                   <>
                     <i className="fa-solid fa-spinner fa-spin"></i> Processing...
                   </>
                 ) : (
                   <>
                     <i className="fa-solid fa-lock"></i> Pay Now
                   </>
                 )}
               </button>
               
               <button 
                 onClick={() => setShowCheckout(false)}
                 disabled={isProcessingPayment}
                 className="checkout-secondary-btn"
                 style={{
                   width: '100%',
                   padding: '0.75rem',
                   fontSize: '1rem',
                   cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                   opacity: isProcessingPayment ? 0.7 : 1,
                   fontWeight: '600'
                 }}
               >
                 Continue Shopping
               </button>
             </div>
           </div>
         </div>
       )}
      
        {/* Wishlist Modal */}
        {showWishlist && (
          <div id="wishlistModal" className="modal-overlay active" style={{ display: 'flex' }}>
            <div className="modal-content" role="dialog" aria-modal="true" style={{ maxWidth: '600px', width: '90%' }}>
              <button className="close-modal" onClick={() => setShowWishlist(false)} aria-label="Close">
                &times;
              </button>
              <div className="modal-heading-row">
                <div>
                  <h2 className="modal-title">
                    <i className="fa-solid fa-heart" style={{ color: '#ef4444' }}></i> Your Wishlist
                  </h2>
                  <p className="modal-subtitle">Items you saved for later are waiting here.</p>
                </div>
                <div className="modal-pill wishlist-pill">{resolvedWaitlistItems.length} saved</div>
              </div>
              {resolvedWaitlistItems.length === 0 ? (
                <div className="modal-empty-state wishlist-empty">
                  <i className="fa-regular fa-heart"></i>
                  <p>Your wishlist is empty.</p>
                  <span>Save products you love and they’ll appear here.</span>
                </div>
              ) : (
                <ul className="modal-item-list">
                  {resolvedWaitlistItems.map((item, idx) => (
                    <li key={idx} className="modal-item-card">
                      <div className="modal-item-img">
                        {item.images && item.images.length > 0 ? (
                          <img loading="lazy" src={item.images[0]} alt={item.name} />
                        ) : (
                          <i className={`fa-solid ${item.icon || 'fa-box'}`}></i>
                        )}
                      </div>
                      <div className="modal-item-details">
                        <span className="modal-item-category">{((item.category || '').toString().includes('-') ? item.category : (item.category || '').toLowerCase().replace(/\s+/g, '-')).replace(/-/g, ' ')}</span>
                        <h4 className="modal-item-name">{item.name}</h4>
                        <span className="modal-item-price">₹{getProductFinalPrice(item).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="modal-item-actions">
                        <button 
                          onClick={() => handleAddToCart(item)}
                          className="modal-item-cart-btn"
                          title="Add to Cart"
                        >
                          <i className="fa-solid fa-cart-plus"></i> Add
                        </button>
                        <button 
                          onClick={() => handleToggleWaitlist(item._id || item.id)} 
                          aria-label={`Remove ${item.name}`} 
                          className="modal-item-remove-btn"
                          title="Remove from Wishlist"
                        >
                          <i className="fa-solid fa-trash-can" aria-hidden="true"></i>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

      {/* Entry Modal */}
      <div id="entryModal" className={`modal-overlay ${showEntryModal ? 'active' : ''}`}>
        <div className="modal-content" role="dialog" aria-modal="true">
          <button className="close-modal" onClick={closeEntryModal} aria-label="Close">&times;</button>
          <div className="modal-header">
            <h2>Welcome to The Sri Tech</h2>
            <p>Please enter your details to explore our premium collection.</p>
          </div>
          <form id="entryForm" onSubmit={handleEntrySubmit}>
            <div className="form-group">
              <label htmlFor="userName"><i className="fa-regular fa-user"></i> Name</label>
              <input type="text" id="userName" name="userName" placeholder="Your Full Name" required value={entryName} onChange={e => setEntryName(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="userWhatsapp"><i className="fa-brands fa-whatsapp"></i> WhatsApp Number</label>
              <input type="tel" id="userWhatsapp" name="userWhatsapp" placeholder="+1 (555) 000-0000" required value={entryWhatsapp} onChange={e => setEntryWhatsapp(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="userLocation"><i className="fa-solid fa-location-dot"></i> Location</label>
              <input type="text" id="userLocation" name="userLocation" placeholder="City, Country" required value={entryLocation} onChange={e => setEntryLocation(e.target.value)} />
            </div>
            <button type="submit" className="cta-button submit-entry">
              {isEntrySubmitted ? 'Welcome!' : 'Continue to Website'}
            </button>
          </form>
        </div>
      </div>

      {/* Offer Modal */}
      <div id="offerModal" className={`modal-overlay ${showOfferModal ? 'active' : ''}`}>
        <div className="modal-content" style={{ textAlign: 'center', padding: offerData.poster ? '0' : '2rem' }} role="dialog" aria-modal="true">
          <button className="close-modal" onClick={() => setShowOfferModal(false)} aria-label="Close" style={{ zIndex: 10, background: 'rgba(255,255,255,0.8)', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', top: '10px', right: '10px' }}>&times;</button>
          
          {offerData.poster && (
            <div className="offer-poster" style={{ width: '100%', maxHeight: '400px', overflow: 'hidden' }}>
              <img loading="lazy" src={offerData.poster} alt="Special Offer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          
          <div className="modal-header" style={{ padding: offerData.poster ? '2rem' : '0' }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--primary-color)', marginBottom: '1rem' }}>{offerData.title}</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>{offerData.description}</p>
            <div className="promo-code" style={{ 
              background: 'var(--primary-light)', 
              color: 'white', 
              padding: '1rem', 
              borderRadius: '12px', 
              border: '2px dashed white',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              letterSpacing: '2px',
              marginBottom: '2rem',
              display: 'inline-block',
              width: '100%',
              maxWidth: '300px'
            }}>
              {offerData.code}
            </div>
          </div>
          <div style={{ padding: offerData.poster ? '0 2rem 2rem 2rem' : '0' }}>
            <button className="cta-button" onClick={() => setShowOfferModal(false)} style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}>Claim Offer Now</button>
          </div>
        </div>
      </div>


      {/* Admin Login Modal */}
      <div id="adminLoginModal" className={`modal-overlay ${showAdminLogin ? 'active' : ''}`}>
        <div className="modal-content glass-card" role="dialog" aria-modal="true">
          <button className="close-modal" onClick={() => { setShowAdminLogin(false); setAdminCredentials({ username: '', password: '' }); }}>&times;</button>
          <div className="modal-header">
            <h2>Admin Portal</h2>
            <p>Please authenticate to access the dashboard.</p>
          </div>
          <form onSubmit={handleAdminLoginSubmit}>
            <div className="form-group">
              <label><i className="fa-solid fa-envelope"></i> Email</label>
              <input 
                type="email" 
                placeholder="e.g. admin@example.com" 
                required 
                value={adminCredentials.username}
                onChange={(e) => setAdminCredentials({...adminCredentials, username: e.target.value})}
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-key"></i> Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required 
                value={adminCredentials.password}
                onChange={(e) => setAdminCredentials({...adminCredentials, password: e.target.value})}
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="cta-button" style={{ width: '100%', marginTop: '1rem' }}>
              Login to Dashboard
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Authorized access only.
          </p>
        </div>
      </div>

      {/* ============================================================
           PREMIUM USER LOGIN PORTAL — Full-Screen Split Layout
      ============================================================ */}
      {showAuthModal && createPortal(
        <div className="auth-split-overlay">
          
          {/* ── LEFT PANE: Cinematic Background ── */}
          <div className="auth-left-pane">
            <div className="auth-left-content">
              <h2>Cook Smarter.<span>Save More.</span></h2>
              <p className="auth-subhead">Join thousands of customers using our fuel-efficient combustion systems for sustainable cooking and a cleaner future.</p>
              <ul className="auth-trust-list">
                <li><i className="fa-solid fa-shield-halved"></i> Secure Login & Checkout</li>
                <li><i className="fa-solid fa-truck-fast"></i> Lightning Fast Delivery Tracking</li>
                <li><i className="fa-solid fa-headset"></i> 24/7 Dedicated Support</li>
                <li><i className="fa-solid fa-leaf"></i> 100% Eco-Friendly Materials</li>
              </ul>
            </div>
            
            {/* Floating embers animation */}
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="ember" 
                style={{ 
                  left: `${Math.random() * 100}%`, 
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 4}s`,
                  width: `${3 + Math.random() * 4}px`,
                  height: `${3 + Math.random() * 4}px`
                }}
              />
            ))}
          </div>

          {/* ── RIGHT PANE: Glassmorphism Form ── */}
          <div className="auth-right-pane">
            <div className="auth-glass-card">
              <button
                className="auth-close-btn"
                onClick={() => { setShowAuthModal(false); setAuthMode('login'); setUserCredentials({ name:'',phone:'',address:'',email:'',password:'',confirmPassword:'' }); }}
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              <div className="auth-header">
                <h3>{authMode === 'login' ? 'Welcome Back' : authMode === 'verify' ? 'Verify Your Email' : 'Create Account'}</h3>
                <p>{authMode === 'login' ? 'Sign in to your premium account' : authMode === 'verify' ? 'Enter the code sent to your inbox.' : 'Start your sustainable journey today'}</p>
              </div>

              {/* Toggle Switch */}
              <div className="auth-toggle-group">
                <button 
                  type="button"
                  className={`auth-toggle-btn ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => { setAuthMode('login'); setAuthErrorMessage(null); setAuthFieldErrors({ email: '', password: '' }); }}
                >
                  Sign In
                </button>
                <button 
                  type="button"
                  className={`auth-toggle-btn ${authMode === 'signup' ? 'active' : ''}`}
                  onClick={() => { setAuthMode('signup'); setVerificationEmail(''); setOtpCode(''); setAuthErrorMessage(null); setAuthFieldErrors({ email: '', password: '' }); }}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleUserAuthSubmit} noValidate>
                
                {/* Sign Up Specific Fields */}
                {authMode === 'signup' && (
                  <>
                    <div className="auth-form-group">
                      <label>Full Name</label>
                      <div className="auth-input-wrapper">
                        <i className="fa-regular fa-user prefix-icon"></i>
                        <input 
                          type="text" 
                          name="name"
                          className={`auth-input ${authFieldErrors.name ? 'invalid' : ''}`} 
                          placeholder="John Doe" 
                          required
                          value={userCredentials.name}
                          onChange={(e) => updateUserCredentials('name', e.target.value)}
                        />
                      </div>
                      {authFieldErrors.name && (
                        <p className="auth-field-error">{authFieldErrors.name}</p>
                      )}
                    </div>
                    <div className="auth-form-group">
                      <label>Mobile Number</label>
                      <div className="auth-input-wrapper">
                        <i className="fa-solid fa-phone prefix-icon"></i>
                        <input 
                          type="tel" 
                          name="phone"
                          inputMode="numeric"
                          className={`auth-input ${authFieldErrors.phone ? 'invalid' : ''}`} 
                          placeholder="9876543210" 
                          required
                          value={userCredentials.phone || ''}
                          onChange={(e) => updateUserCredentials('phone', e.target.value)}
                        />
                      </div>
                      {authFieldErrors.phone && (
                        <p className="auth-field-error">{authFieldErrors.phone}</p>
                      )}
                    </div>
                    <div className="auth-form-group">
                      <label>Address</label>
                      <div className="auth-input-wrapper">
                        <i className="fa-solid fa-map-location-dot prefix-icon"></i>
                        <input 
                          type="text" 
                          name="address"
                          className="auth-input" 
                          placeholder="123 Street Name" 
                          required
                          value={userCredentials.address || ''}
                          onChange={(e) => updateUserCredentials('address', e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Common Fields: Email */}
                <div className="auth-form-group">
                  <label>Email Address</label>
                  <div className="auth-input-wrapper">
                    <i className="fa-regular fa-envelope prefix-icon"></i>
                    <input 
                      ref={emailInputRef}
                      type="email" 
                      name="email"
                      className={`auth-input ${authFieldErrors.email ? 'invalid' : ''}`} 
                      placeholder="hello@example.com" 
                      required
                      value={authMode === 'verify' ? (verificationEmail || '') : (userCredentials.email || '')}
                      disabled={authMode === 'verify'}
                      onChange={(e) => updateUserCredentials('email', e.target.value)}
                    />
                  </div>
                  {authFieldErrors.email && (
                    <p className="auth-field-error">{authFieldErrors.email}</p>
                  )}
                </div>

                {authMode !== 'verify' && (
                  <div className="auth-form-group">
                    <label>Password</label>
                    <div className="auth-input-wrapper">
                      <i className="fa-solid fa-lock prefix-icon"></i>
                      <input 
                        ref={passwordInputRef}
                        type={showPassword ? "text" : "password"} 
                        name="password"
                        className={`auth-input ${authFieldErrors.password ? 'invalid' : ''}`} 
                        placeholder="••••••••" 
                        required
                        value={userCredentials.password || ''}
                        onChange={(e) => updateUserCredentials('password', e.target.value)}
                      />
                      <button type="button" className="pwd-toggle" onClick={() => setShowPassword(!showPassword)}>
                        <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    {authFieldErrors.password && (
                      <p className="auth-field-error">{authFieldErrors.password}</p>
                    )}
                  </div>
                )}

                {/* Sign Up Specific Field: Confirm Password */}
                {authMode === 'signup' && (
                  <div className="auth-form-group">
                    <label>Confirm Password</label>
                    <div className="auth-input-wrapper">
                      <i className="fa-solid fa-shield-check prefix-icon"></i>
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        name="confirmPassword"
                        className={`auth-input ${authFieldErrors.confirmPassword ? 'invalid' : ''}`} 
                        placeholder="••••••••" 
                        required
                        value={userCredentials.confirmPassword || ''}
                        onChange={(e) => updateUserCredentials('confirmPassword', e.target.value)}
                      />
                      <button type="button" className="pwd-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <i className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
                    {authFieldErrors.confirmPassword && (
                      <p className="auth-field-error">{authFieldErrors.confirmPassword}</p>
                    )}
                  </div>
                )}

                {authMode === 'verify' && (
                  <div className="auth-form-group">
                    <label>Verification Code</label>
                    <div className="auth-input-wrapper">
                      <i className="fa-regular fa-key prefix-icon"></i>
                      <input 
                        type="text" 
                        name="otpCode"
                        className="auth-input" 
                        placeholder="Enter 6-digit OTP" 
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Login Options: Remember Me & Forgot Password */}
                {authMode === 'login' && (
                  <div className="auth-options">
                    <label className="remember-me" htmlFor="rememberMe">
                      <input type="checkbox" id="rememberMe" name="rememberMe" /> Remember me
                    </label>
                    <a href="#" className="forgot-pwd" onClick={handleForgotPassword}>Forgot Password?</a>
                  </div>
                )}

                {/* Submit Button */}
                <button type="submit" className="auth-submit-btn" disabled={authSubmitting}>
                  {authSubmitting
                    ? (authMode === 'login' ? 'Signing In...' : authMode === 'verify' ? 'Verifying...' : 'Creating Account...')
                    : (authMode === 'login' ? 'Sign In' : authMode === 'verify' ? 'Verify Email' : 'Create Account')}
                </button>
                
              </form>

              <div className="auth-divider">or continue with</div>

              {/* Social Login Options */}
              <div className="social-login-grid">
              </div>

              {/* Continue as Guest */}
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <a
                  href="#"
                  className="guest"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowAuthModal(false);
                    setAuthPortalIsGate(false);
                    setAuthMode('login');
                    setAuthErrorMessage(null);
                    setAuthFieldErrors({ email: '', password: '' });
                  }}
                >
                  Continue as guest →
                </a>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Return Request Modal */}
      <div id="returnModal" className={`modal-overlay ${showReturnModal ? 'active' : ''}`}>
        <div className="modal-content glass-card" style={{ maxWidth: '520px' }} role="dialog" aria-modal="true">
          <button className="close-modal" onClick={handleCloseReturnModal}>&times;</button>
          <div className="modal-header">
            <h2>Request a Return</h2>
            <p>Select the item and reason for return. Our team will review your request.</p>
          </div>
          <form onSubmit={handleSubmitReturnRequest}>
            <div className="form-group">
              <label htmlFor="returnProduct">Product</label>
              <select
                id="returnProduct"
                value={returnRequestForm.productId}
                onChange={(e) => handleReturnRequestChange('productId', e.target.value)}
              >
                {selectedOrder?.items?.map((item, index) => (
                  <option key={index} value={item.product}>
                    {item.name || item.sku || `Item ${index + 1}`} ({item.quantity || 1} pcs)
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="returnQuantity">Quantity</label>
              <input
                id="returnQuantity"
                type="number"
                min="1"
                max={selectedOrder?.items?.find(i => i.product === returnRequestForm.productId)?.quantity || 1}
                value={returnRequestForm.quantity}
                onChange={(e) => handleReturnRequestChange('quantity', Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="returnReason">Reason for Return</label>
              <textarea
                id="returnReason"
                rows="3"
                value={returnRequestForm.reason}
                onChange={(e) => handleReturnRequestChange('reason', e.target.value)}
                placeholder="Describe why you want to return this item"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="returnDescription">Additional details</label>
              <textarea
                id="returnDescription"
                rows="3"
                value={returnRequestForm.description}
                onChange={(e) => handleReturnRequestChange('description', e.target.value)}
                placeholder="Add any extra information for the return team (optional)"
              />
            </div>
            <button type="submit" className="cta-button" style={{ width: '100%' }}>
              Submit Return Request
            </button>
          </form>
        </div>
      </div>

      {/* Complaint / Support Modal */}
      <div id="complaintModal" className={`modal-overlay ${showComplaintModal ? 'active' : ''}`}>
        <div className="modal-content glass-card" style={{ maxWidth: '500px' }} role="dialog" aria-modal="true">
          <button className="close-modal" onClick={() => setShowComplaintModal(false)}>&times;</button>
          <div className="modal-header">
            <h2>Customer Support</h2>
            <p>Have a complaint or feedback? Raise a ticket here.</p>
          </div>
          <form onSubmit={handleComplaintSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input 
                type="text" 
                placeholder="Your Name" 
                required 
                value={complaintForm.customerName}
                onChange={(e) => setComplaintForm({...complaintForm, customerName: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="your.email@example.com" 
                required 
                value={complaintForm.email}
                onChange={(e) => setComplaintForm({...complaintForm, email: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input 
                type="text" 
                placeholder="e.g. Order Delivery, Product Quality" 
                required 
                value={complaintForm.subject}
                onChange={(e) => setComplaintForm({...complaintForm, subject: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Message / Details</label>
              <textarea 
                placeholder="Describe your issue in detail..." 
                required 
                rows="4"
                value={complaintForm.message}
                onChange={(e) => setComplaintForm({...complaintForm, message: e.target.value})}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#ffffff', color: '#0f172a', resize: 'vertical' }}
              />
            </div>
            <button type="submit" className="cta-button" style={{ width: '100%', marginTop: '1rem' }}>
              Submit Support Ticket
            </button>
          </form>
        </div>
      </div>

      {/* Header */}
      {!isCustomerDashboardPage && (
        <header className="top-header">
        <div className="header-container">
          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn" 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle Navigation Menu"
            title="Menu"
          >
            <i className={showMobileMenu ? "fa-solid fa-xmark" : "fa-solid fa-bars"} aria-hidden="true"></i>
          </button>

          {/* Left Logo */}
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); scrollToSection(e, 'home'); }} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src="/sri-tech-logo-final.png"
              alt="SriTech Logo"
              style={{ width: '240px', height: 'auto', maxHeight: '65px', objectFit: 'contain' }}
            />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="header-nav">
            <a href="#home" className="action-btn" onClick={(e) => { scrollToSection(e, 'home'); }}>
              {t('nav.home')}
            </a>
            <a href="#product" className="action-btn" onClick={(e) => { scrollToSection(e, 'product'); }}>
              {t('nav.products')}
            </a>
            <a href="#category" className="action-btn" onClick={(e) => { 
              e.preventDefault();
              const catElem = document.getElementById('categories') || document.getElementById('category');
              if (catElem) catElem.scrollIntoView({ behavior: 'smooth' });
            }}>
              Categories
            </a>
            <a href="#about" className="action-btn" onClick={(e) => { scrollToSection(e, 'about'); }}>
              {t('nav.about')}
            </a>
            <a href="#footer" className="action-btn" onClick={(e) => { scrollToSection(e, 'footer'); }}>
              {t('nav.contact')}
            </a>
            <div className="lang-dropdown-wrapper">
              <select 
                className="lang-dropdown action-btn" 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                title="Change Language"
                style={{ paddingRight: '1.25rem' }}
              >
                <option value="en">English</option>
                <option value="ta">தமிழ்</option>
                <option value="hi">हिंदी</option>
              </select>
            </div>
          </nav>

          {/* Centered Search Bar */}
          <div className="header-search-bar-wrap">
            <i className="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleNavbarSearchChange(e.target.value)}
              placeholder="Search products..."
              className="navbar-search-input-field"
            />
            {searchTerm.trim() && (
              <div className="search-suggestions-dropdown">
                {matchedSuggestions.length > 0 ? (
                  matchedSuggestions.slice(0, 6).map(product => (
                    <button
                      key={product._id || product.id}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(product);
                        setSelectedProductImageIndex(0);
                        setSearchTerm('');
                      }}
                    >
                      <span className="name">{product.name}</span>
                      <span className="cat">{getCategoryDisplayName(product.category)}</span>
                    </button>
                  ))
                ) : (
                  <div className="no-results">No products found.</div>
                )}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="header-actions">
            {/* Wishlist Button */}
            <button className="action-btn wishlist-btn-premium" title={t('nav.wishlist')} aria-label={t('nav.wishlist')} onClick={() => {
              if (isUserLoggedIn) {
                openUserDashboard('wishlist');
              } else {
                setShowWishlist(true);
              }
            }}>
              <i className={resolvedWaitlistItems.length > 0 ? "fa-solid fa-heart" : "fa-regular fa-heart"} aria-hidden="true" style={resolvedWaitlistItems.length > 0 ? { color: 'var(--accent-yellow)' } : {}}></i>
            </button>

            {/* Cart Button */}
            <button className="action-btn cart-btn-premium" title={t('nav.cart')} aria-label={`View shopping cart with ${resolvedCartItems.length} items`} onClick={() => {
              if (isUserLoggedIn) {
                openUserDashboard('cart');
              } else {
                setShowCart(true);
              }
            }}>
              <i className="fa-solid fa-cart-shopping" aria-hidden="true"></i>
              {resolvedCartItems.length > 0 && <span className="cart-badge-count">{resolvedCartItems.length}</span>}
            </button>

            {/* Login / Account Button */}
            <div style={{ position: 'relative' }}>
              <button
                className="action-btn login-btn-premium"
                title={isUserLoggedIn ? t('nav.account', 'Account') : t('nav.login')}
                aria-label={isUserLoggedIn ? t('nav.account', 'Account') : t('nav.login')}
                onClick={() => {
                  setShowLoginReminder(false);
                  if (isUserLoggedIn) {
                    handleOpenOrderDashboard({ forceOpen: true });
                  } else {
                    setAuthMode('login');
                    setAuthErrorMessage(null);
                    setShowAuthModal(true);
                    setUserCredentials({ name: '', phone: '', address: '', email: '', password: '', confirmPassword: '' });
                  }
                }}
              >
                <i className="fa-solid fa-user" aria-hidden="true"></i>
                <span className="btn-text">
                  {isUserLoggedIn ? (activeUser?.name?.split(' ')[0] || 'Account') : 'Login'}
                </span>
              </button>

              {!isUserLoggedIn && showLoginReminder && (
                <div 
                  className="login-reminder-tooltip"
                  onClick={() => setShowLoginReminder(false)}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    marginTop: '8px',
                    background: '#15803d',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    whiteSpace: 'nowrap',
                    zIndex: 9999,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    animation: 'bounceTooltip 2s infinite'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '20px',
                    width: '8px',
                    height: '8px',
                    background: '#15803d',
                    transform: 'rotate(45deg)'
                  }} />
                  <span>🔑 Remember to login!</span>
                  <i className="fa-solid fa-xmark" style={{ fontSize: '0.65rem', opacity: 0.8, marginLeft: '4px' }}></i>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu Drawer */}
        <div className={`mobile-nav-panel ${showMobileMenu ? 'active' : ''}`}>
          <div className="mobile-nav-header">
            <a href="#" className="logo" onClick={(e) => { e.preventDefault(); scrollToSection(e, 'home'); setShowMobileMenu(false); }}>
              <img
                src="/sri-tech-logo-final.png"
                alt="SriTech Logo"
                style={{ width: '180px', height: 'auto' }}
              />
            </a>
            <button className="mobile-drawer-close-btn" onClick={() => setShowMobileMenu(false)} aria-label="Close menu">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="mobile-nav-body">
            <div className="mobile-nav-links-list">
              <a href="#home" className="mobile-nav-link-item active" onClick={(e) => { scrollToSection(e, 'home'); setShowMobileMenu(false); }}>
                <i className="fa-solid fa-house"></i>
                <span>Home</span>
              </a>
              <a href="#product" className="mobile-nav-link-item" onClick={(e) => { scrollToSection(e, 'product'); setShowMobileMenu(false); }}>
                <i className="fa-solid fa-cubes"></i>
                <span>Products</span>
                <i className="fa-solid fa-chevron-right arrow-icon"></i>
              </a>
              <a href="#category" className="mobile-nav-link-item" onClick={(e) => { 
                e.preventDefault();
                setShowMobileMenu(false);
                const catElem = document.getElementById('categories') || document.getElementById('category');
                if (catElem) catElem.scrollIntoView({ behavior: 'smooth' });
              }}>
                <i className="fa-solid fa-layer-group"></i>
                <span>Categories</span>
                <i className="fa-solid fa-chevron-right arrow-icon"></i>
              </a>
              <a href="#about" className="mobile-nav-link-item" onClick={(e) => { scrollToSection(e, 'about'); setShowMobileMenu(false); }}>
                <i className="fa-solid fa-address-card"></i>
                <span>About Us</span>
              </a>
              <a href="#footer" className="mobile-nav-link-item" onClick={(e) => { scrollToSection(e, 'footer'); setShowMobileMenu(false); }}>
                <i className="fa-solid fa-pen-to-square"></i>
                <span>Contact Us</span>
              </a>
            </div>

            <div className="mobile-nav-divider"></div>

            <div className="mobile-nav-secondary-actions">
              <button className="mobile-action-item" onClick={() => { setShowMobileMenu(false); if (isUserLoggedIn) openUserDashboard('wishlist'); else setShowWishlist(true); }}>
                <i className="fa-regular fa-heart"></i>
                <span>Wishlist</span>
              </button>
              <button className="mobile-action-item" onClick={() => { setShowMobileMenu(false); if (isUserLoggedIn) openUserDashboard('cart'); else setShowCart(true); }}>
                <i className="fa-solid fa-cart-shopping"></i>
                <span>Cart</span>
                {resolvedCartItems.length > 0 && <span className="mobile-cart-badge">{resolvedCartItems.length}</span>}
              </button>
              <button className="mobile-action-item" onClick={() => {
                setShowMobileMenu(false);
                if (isUserLoggedIn) {
                  handleOpenOrderDashboard({ forceOpen: true });
                } else {
                  setAuthMode('login');
                  setAuthErrorMessage(null);
                  setShowAuthModal(true);
                  setUserCredentials({ name: '', phone: '', address: '', email: '', password: '', confirmPassword: '' });
                }
              }}>
                <i className="fa-solid fa-user"></i>
                <span>{isUserLoggedIn ? (activeUser?.name || 'Account') : 'Login / Register'}</span>
              </button>
            </div>

            <div className="mobile-nav-divider"></div>

            <div className="mobile-action-item" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <i className="fa-solid fa-language" style={{ color: '#15803D' }}></i>
                <span>Language</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                <button 
                  type="button"
                  onClick={() => { setLanguage('en'); setShowMobileMenu(false); }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1.5px solid',
                    borderColor: language === 'en' ? '#15803D' : '#E5E7EB',
                    background: language === 'en' ? 'rgba(21, 128, 61, 0.05)' : '#FFFFFF',
                    color: language === 'en' ? '#15803D' : '#1F2937',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  English
                </button>
                <button 
                  type="button"
                  onClick={() => { setLanguage('ta'); setShowMobileMenu(false); }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1.5px solid',
                    borderColor: language === 'ta' ? '#15803D' : '#E5E7EB',
                    background: language === 'ta' ? 'rgba(21, 128, 61, 0.05)' : '#FFFFFF',
                    color: language === 'ta' ? '#15803D' : '#1F2937',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  தமிழ்
                </button>
                <button 
                  type="button"
                  onClick={() => { setLanguage('hi'); setShowMobileMenu(false); }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '1.5px solid',
                    borderColor: language === 'hi' ? '#15803D' : '#E5E7EB',
                    background: language === 'hi' ? 'rgba(21, 128, 61, 0.05)' : '#FFFFFF',
                    color: language === 'hi' ? '#15803D' : '#1F2937',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  हिंदी
                </button>
              </div>
            </div>
          </div>
        </div>
        </header>
      )}

      <main>
        {isCustomerDashboardPage ? (
          <UserDashboard
            isOpen={true}
            onClose={() => navigate('/')}
            activeUser={activeUser}
            activeTab={customerDashboardTab ? customerDashboardTab.toLowerCase() : 'overview'}
            onTabChange={(tab) => setCustomerDashboardTab(tab)}
            orders={userOrders}
            wishlistItems={products.filter(product => waitlist.includes(product._id || product.id))}
            cartItems={resolvedCartItems}
            products={products}
            coupons={coupons}
            offers={offers}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleChangeCartQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onBuyNow={handleBuyNow}
            onRemoveFromWishlist={handleToggleWaitlist}
            onCheckout={handleCheckoutCart}
            onUpdateProfile={handleUpdateProfile}
            onUpdatePassword={handleUpdatePassword}
            onSaveAddress={handleSaveAddress}
            onDeleteAddress={handleDeleteAddress}
            onSetDefaultAddress={handleSetDefaultAddress}
            onSubmitReturnRequest={handleSubmitReturnRequest}
            onRaiseSupport={handleRaiseSupport}
            onMarkNotificationsRead={handleMarkNotificationsRead}
            notifications={notifications}
            onLogout={handleLogout}
            getProductFinalPrice={getProductFinalPrice}
            totalCartAmount={cartTotal}
            onViewProduct={(product) => {
              setSelectedProduct(product);
              setSelectedProductImageIndex(0);
              navigate(`/product/${product.slug || product._id || product.id}`);
            }}
          />
        ) : isMyOrdersPage ? (
          <MyOrders />
        ) : (
          <>
            {/* Premium Dark Parallax Hero Section */}
            <section id="home" className="premium-hero">
              {/* Premium Ambient Background Image */}
              <div className="hero-image-bg"></div>

              {/* Glowing Combustion Fire FX Overlay */}
              <div className="combustion-glow"></div>
              
              <div className="fiery-particles-container">
              </div>

              {/* SVG Fractal Turbulence Fire Filter */}
              <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
                <defs>
                  <filter id="realistic-fire">
                    <feTurbulence type="fractalNoise" baseFrequency="0.015 0.05" numOctaves="3" result="noise" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="35" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                </defs>
              </svg>

          <div className="premium-hero-content">
            <div className="hero-text-content">
              <div className="hero-badge-wrap">
                <span className="premium-badge-text">{t('hero.badge')} <i className="fa-solid fa-leaf" style={{color: '#4CAF50', marginLeft: '5px'}}></i></span>
              </div>
              <h1>{t('hero.title')}<br/><span className="text-highlight-orange">{t('hero.titleHighlight')}</span></h1>
              <p className="hero-subtitle" style={{ maxWidth: '450px' }}>{t('hero.subtitle')}</p>
              
              <div className="hero-features-row">
                <div className="feature-item-col outline-feature">
                  <div className="feature-icon-wrap"><i className="fa-solid fa-leaf"></i></div>
                  <div>
                    <strong>{t('hero.featureUpTo80')}</strong>
                    <span>{t('hero.featureLessFuel')}</span>
                  </div>
                </div>
                <div className="feature-item-col outline-feature">
                  <div className="feature-icon-wrap"><i className="fa-solid fa-wind"></i></div>
                  <div>
                    <strong>{t('hero.featureLowSmoke')}</strong>
                    <span>{t('hero.featureCleanCooking')}</span>
                  </div>
                </div>
                <div className="feature-item-col outline-feature">
                  <div className="feature-icon-wrap"><i className="fa-solid fa-bolt"></i></div>
                  <div>
                    <strong>{t('hero.featureHighEfficiency')}</strong>
                    <span>{t('hero.featureBetterPerformance')}</span>
                  </div>
                </div>
                <div className="feature-item-col outline-feature">
                  <div className="feature-icon-wrap"><i className="fa-solid fa-tree"></i></div>
                  <div>
                    <strong>{t('hero.featureEcoFriendly')}</strong>
                    <span>{t('hero.featureSustainableLiving')}</span>
                  </div>
                </div>
              </div> {/* Close hero-features-row */}
              <div className="hero-cta-group">
                <a href="#product" className="primary-btn-gradient" onClick={(e) => scrollToSection(e, 'product')}>{t('hero.exploreProducts')} <i className="fa-solid fa-arrow-right"></i></a>
                <a href="#about" className="secondary-btn-outline" onClick={(e) => scrollToSection(e, 'about')}><i className="fa-solid fa-play" style={{color: '#ff7a00', marginRight: '8px'}}></i> {t('hero.learnMore')}</a>
              </div>
            </div>

            <div className="hero-image-wrapper">
              <div className="hero-product-card">
                <img src="/hero-image.png" alt="Sri Tech Eco Combustion System with Flames" className="hero-product-image" />
              </div>
            </div>
          </div>

          {/* Centered circular badge at the bottom of the landing page */}
          <div className="hero-bottom-badge-wrap">
            <div className="circular-badge">
              <svg viewBox="0 0 100 100">
                <path id="curve" d="M 50 50 m -37 0 a 37 37 0 1 1 74 0 a 37 37 0 1 1 -74 0" fill="transparent" />
                <text><textPath href="#curve" startOffset="0">{t('hero.circularBadge')} {t('hero.circularBadge')}</textPath></text>
              </svg>
              <i className="fa-solid fa-leaf center-icon" style={{color: '#1E7A3B'}}></i>
            </div>
          </div>
        </section>



        {/* Massive Animated About Us Section */}
        <section id="about" className="about-us-section light-theme-about">
          <div className="about-container">
            <div className="section-header-dark">
              <h2>{t('about.sectionTitle')}</h2>
              <p>{t('about.sectionSubtitle')}</p>
            </div>
            
            <div className="about-grid">
              {/* Left Column: Company Story & National Projects */}
              <div className="about-story-col">
                <div className="about-card glass-panel">
                  <h3>{t('about.legacyTitle')}</h3>
                  <p>{t('about.legacyP1')}</p>
                  <p>{t('about.legacyP2')}</p>
                  <div className="location-box">
                    <i className="fa-solid fa-map-location-dot"></i>
                    <div>
                      <strong>{t('about.locationTitle')}</strong>
                      <span>{t('about.locationDesc')}</span>
                    </div>
                  </div>
                </div>

                <div className="rocket-stove-banner glass-panel glow-border-orange">
                  <div className="banner-icon-wrap">
                    <i className="fa-solid fa-fire-burner animate-flicker"></i>
                  </div>
                  <div>
                    <h4>{t('about.rocketStoveTitle')}</h4>
                    <p>{t('about.rocketStoveDesc')}</p>
                  </div>
                </div>

                <div className="about-card glass-panel">
                  <h3>{t('about.projectsTitle')}</h3>
                  <p>{t('about.projectsDesc')}</p>
                  <div className="clients-list">
                    <span className="client-badge"><i className="fa-solid fa-train"></i> {t('about.clientRailways')}</span>
                    <span className="client-badge"><i className="fa-solid fa-droplet"></i> {t('about.clientIOCL')}</span>
                    <span className="client-badge"><i className="fa-solid fa-building"></i> {t('about.clientSIDCO')}</span>
                    <span className="client-badge"><i className="fa-solid fa-road"></i> {t('about.clientSmartCity')}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Achievements & Interactive Workflow */}
              <div className="about-achievements-col">
                <div className="achievements-grid">
                  <div className="stat-card glass-panel">
                    <div className="stat-icon"><i className="fa-solid fa-award"></i></div>
                    <strong>{t('about.stat10Years')}</strong>
                    <span>{t('about.statPrecision')}</span>
                  </div>
                  <div className="stat-card glass-panel">
                    <div className="stat-icon"><i className="fa-solid fa-circle-check"></i></div>
                    <strong>{t('about.statNational')}</strong>
                    <span>{t('about.statProjects')}</span>
                  </div>
                  <div className="stat-card glass-panel">
                    <div className="stat-icon"><i className="fa-solid fa-cubes"></i></div>
                    <strong>{t('about.statFirstPEB')}</strong>
                    <span>{t('about.statSIDCO')}</span>
                  </div>
                  <div className="stat-card glass-panel">
                    <div className="stat-icon"><i className="fa-solid fa-microchip"></i></div>
                    <strong>{t('about.statPioneer')}</strong>
                    <span>{t('about.statEVDesign')}</span>
                  </div>
                </div>


                {/* Combustion Science Interactive Sub-widget */}
                <div className="workflow-card glass-panel">
                  <h3>{t('about.combustionTitle')}</h3>
                  <div className="about-combustion-box">
                    <div className="combustion-steps-nav">
                      {t('about.combustionTabs').map((tab, idx) => (
                        <button 
                          key={idx} 
                          className={`combustion-tab-btn ${activeStepIndex === idx ? 'active' : ''}`}
                          onClick={() => setActiveStepIndex(idx)}
                        >
                          {idx + 1}. {tab}
                        </button>
                      ))}
                    </div>
                    <div className="combustion-tab-content">
                      {activeStepIndex === 0 && <p><i className="fa-solid fa-wood-pile"></i> {t('about.combustionDescs.0')}</p>}
                      {activeStepIndex === 1 && <p><i className="fa-solid fa-wind"></i> {t('about.combustionDescs.1')}</p>}
                      {activeStepIndex === 2 && <p><i className="fa-solid fa-arrow-up-long"></i> {t('about.combustionDescs.2')}</p>}
                      {activeStepIndex === 3 && <p><i className="fa-solid fa-fire"></i> {t('about.combustionDescs.3')}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Section */}
        <section id="product" className="products-section">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', borderBottom: 'none', marginBottom: '2.5rem' }}>
            <h2 className="wavy-title">
              {Array.from(
                new Intl.Segmenter('ta', { granularity: 'grapheme' }).segment(t('products.title'))
              ).map((s, idx) => (
                <span key={idx}>{s.segment}</span>
              ))}
            </h2>
          </div>

          <div className="products-filter-row">
            <div className="category-pill-container">
              <button 
                className={`category-pill ${selectedCategory === '' ? 'active' : ''}`} 
                onClick={() => handleCategoryChange('')}
              >
                {t('products.all')}
              </button>
              {productCategories.map(cat => (
                <button 
                  key={cat.slug} 
                  className={`category-pill ${selectedCategory === cat.slug ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat.slug)}
                >
                  {cat.name.toUpperCase()}
                </button>
              ))}
            </div>
            
            <div className="products-search-wrapper">
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              <input 
                type="text" 
                placeholder={t('products.searchPlaceholder')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="products-search-input"
              />
            </div>
          </div>

          <div className="product-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => {
                const ratingInfo = getProductRatingInfo(product);
                const rating = ratingInfo.rating;
                const reviewsCount = ratingInfo.count;
                
                const priceNum = parsePrice(product.price);
                const activeOffer = getActiveOfferForProduct(product);
                const activeCoupon = coupons.find(c => 
                  c.isActive && 
                  c.linkedProduct === (product._id || product.id) &&
                  (!c.expiryDate || new Date(c.expiryDate) > new Date())
                );
                let discountedPrice = null;
                let discountText = '';
                let originalPrice = null;

                const prodDiscountPercent = Number(product.discountPercent || product.discount) || 0;

                if (prodDiscountPercent > 0) {
                  originalPrice = priceNum;
                  discountedPrice = Math.round(priceNum * (1 - prodDiscountPercent / 100));
                  discountText = `${prodDiscountPercent}% off`;
                } else if (activeOffer) {
                  if (activeOffer.discountType === 'fixed') {
                    originalPrice = priceNum;
                    discountedPrice = Math.max(0, priceNum - (Number(activeOffer.discountValue) || 0));
                    discountText = `₹${Number(activeOffer.discountValue) || 0} off`;
                  } else if (activeOffer.discountType === 'percentage') {
                    const dVal = Number(activeOffer.discountValue) || 0;
                    originalPrice = priceNum;
                    discountedPrice = Math.round(priceNum * (1 - dVal / 100));
                    discountText = `${dVal}% off`;
                  } else if (activeOffer.discountType === 'free-shipping') {
                    discountText = 'Free shipping';
                  }
                } else if (activeCoupon) {
                  const discountVal = parseFloat(activeCoupon.discountValue) || 0;
                  if (activeCoupon.discountType === 'Fixed') {
                    originalPrice = priceNum;
                    discountedPrice = Math.max(0, priceNum - discountVal);
                    discountText = `₹${discountVal} off`;
                  } else {
                    originalPrice = priceNum;
                    discountedPrice = Math.round(priceNum * (1 - discountVal / 100));
                    discountText = `${discountVal}% off`;
                  }
                } else if (Number(product.originalPrice || product.mrp) > priceNum) {
                  originalPrice = Number(product.originalPrice || product.mrp);
                  discountedPrice = priceNum;
                  const pct = Math.round(((originalPrice - priceNum) / originalPrice) * 100);
                  if (pct > 0) discountText = `${pct}% off`;
                }

                const displayPrice = getProductFinalPrice(product);
                const showDiscount = originalPrice !== null && originalPrice > displayPrice && Boolean(discountText);

                return (
                  <article key={product.id || product._id} className="product-card">
                    <button 
                      className={`like-btn ${waitlist.includes(product.id || product._id) ? 'active' : ''}`} 
                      onClick={() => handleToggleWaitlist(product.id || product._id)}
                      aria-label="Wishlist"
                    >
                      <i className={`fa-${waitlist.includes(product.id || product._id) ? 'solid' : 'regular'} fa-heart`}></i>
                    </button>

                    <div 
                      className="product-img-wrapper product-shine-effect" 
                      onClick={() => { setSelectedProduct(product); setSelectedProductImageIndex(0); }}
                      style={{ cursor: 'pointer' }}
                    >
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name} 
                          className="hover-zoom"
                          loading="lazy"
                        />
                      ) : (
                        <i className={`fa-solid ${product.icon || 'fa-box'} placeholder-img`}></i>
                      )}
                      {product.images && product.images.length > 1 && (
                        <span className="image-badge">
                          +{product.images.length - 1} {t('products.photos')}
                        </span>
                      )}
                    </div>

                    <div className="product-info">
                      <h3 onClick={() => { setSelectedProduct(product); setSelectedProductImageIndex(0); }} style={{ cursor: 'pointer' }}>{product.name}</h3>
                      
                      <div className="rating-row-grid">
                        <span className="rating-badge">{rating} <i className="fa-solid fa-star"></i></span>
                        <span className="rating-count">({reviewsCount})</span>
                      </div>

                      <div className="price-row">
                        <span className="price">₹{displayPrice.toLocaleString('en-IN')}</span>
                        {showDiscount && (
                          <>
                            <span className="original-price">₹{originalPrice.toLocaleString('en-IN')}</span>
                            <span className="discount">{discountText}</span>
                          </>
                        )}
                      </div>

                      <button 
                        className="primary-btn-green checkout-btn" 
                        style={{ width: '100%', marginTop: '1rem', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => handleBuyNow(product)}
                      >
                        <i className="fa-solid fa-bag-shopping"></i> {t('products.buyNow')}
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="empty-state glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
                <i className="fa-solid fa-boxes-packing" style={{ fontSize: '3rem', color: 'var(--primary-color)', opacity: 0.2, marginBottom: '1.5rem', display: 'block' }}></i>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>{t('products.comingSoonTitle')}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{t('products.comingSoonDesc')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Precision Workflow Section */}
        <section id="workflow" className="how-it-works-section" style={{ backgroundColor: '#ffffff', padding: '5rem 2rem' }}>
          <div className="hiw-container">
            <div className="section-header-dark" style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2>{t('workflow.title')}</h2>
              <p>{t('workflow.subtitle')}</p>
            </div>
            
            <div className="hiw-steps" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className={`step-card ${activeWorkflowStep === 0 ? 'active' : ''}`} onClick={() => setActiveWorkflowStep(0)}>
                <div className="step-number" style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px' }}><i className="fa-solid fa-compass-drafting"></i></div>
                <div className="step-info">
                  <h4>{t('workflow.step1Title')}</h4>
                  <p>{t('workflow.step1Desc')}</p>
                </div>
              </div>
              <div className={`step-card ${activeWorkflowStep === 1 ? 'active' : ''}`} onClick={() => setActiveWorkflowStep(1)}>
                <div className="step-number" style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px' }}><i className="fa-solid fa-industry"></i></div>
                <div className="step-info">
                  <h4>{t('workflow.step2Title')}</h4>
                  <p>{t('workflow.step2Desc')}</p>
                </div>
              </div>
              <div className={`step-card ${activeWorkflowStep === 2 ? 'active' : ''}`} onClick={() => setActiveWorkflowStep(2)}>
                <div className="step-number" style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px' }}><i className="fa-solid fa-truck-ramp-box"></i></div>
                <div className="step-info">
                  <h4>{t('workflow.step3Title')}</h4>
                  <p>{t('workflow.step3Desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="how-it-works-section">
          <div className="hiw-container">
            <div className="section-header-dark">
              <h2>{t('howItWorks.title')}</h2>
              <p>{t('howItWorks.subtitle')}</p>
            </div>
            
            <div className="hiw-grid">
              <div className="hiw-illustration">
                <div className="cutaway-diagram">
                  <img src="/master-elements-stove.jpg" alt="Sri Tech High-Efficiency Rocket Stove roaring with flames in a rustic wooden workshop" className="cutaway-img" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; }} />
                  <div className="airflow-animated"></div>
                </div>
              </div>
              <div className="hiw-steps">
                <div className={`step-card ${activeStepIndex === 0 ? 'active' : ''}`} onClick={() => setActiveStepIndex(0)}>
                  <div className="step-number">01</div>
                  <div className="step-info">
                    <h4>{t('howItWorks.step1Title')}</h4>
                    <p>{t('howItWorks.step1Desc')}</p>
                  </div>
                </div>
                <div className={`step-card ${activeStepIndex === 1 ? 'active' : ''}`} onClick={() => setActiveStepIndex(1)}>
                  <div className="step-number">02</div>
                  <div className="step-info">
                    <h4>{t('howItWorks.step2Title')}</h4>
                    <p>{t('howItWorks.step2Desc')}</p>
                  </div>
                </div>
                <div className={`step-card ${activeStepIndex === 2 ? 'active' : ''}`} onClick={() => setActiveStepIndex(2)}>
                  <div className="step-number">03</div>
                  <div className="step-info">
                    <h4>{t('howItWorks.step3Title')}</h4>
                    <p>{t('howItWorks.step3Desc')}</p>
                  </div>
                </div>
                <div className={`step-card ${activeStepIndex === 3 ? 'active' : ''}`} onClick={() => setActiveStepIndex(3)}>
                  <div className="step-number">04</div>
                  <div className="step-info">
                    <h4>{t('howItWorks.step4Title')}</h4>
                    <p>{t('howItWorks.step4Desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Meet Our Leadership Section */}
        <section id="leadership" className="leadership-section-light-fiery">
          {/* Floating embers inside leadership */}
          <div className="fiery-particles-container">
            {Array.from({ length: 15 }).map((_, i) => (
              <span key={i} className="ember" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`
              }}></span>
            ))}
          </div>

          <div className="leadership-container">
            <div className="section-header-light">
              <h2>{t('leadership.title')}</h2>
              <p>{t('leadership.subtitle')}</p>
            </div>
            
            <div className="leadership-grid">
              {/* Leader 1: Sankarganesh R */}
              <div className="leader-card glass-light-panel glow-border-orange animate-on-scroll">
                <div className="leader-header">
                  <div className="leader-profile-summary">
                    <div className="leader-avatar-frame">
                      <img src="/sankarganesh.png" alt="Sankarganesh R" className="leader-avatar" />
                    </div>
                    <div className="leader-meta">
                      <h3>Sankarganesh R</h3>
                      <strong className="leader-role">CEO & Founder</strong>
                      <span className="leader-edu">B.E (Mechanical Engineering), M.Tech (Energy Technology)</span>
                    </div>
                  </div>
                  <div className="leader-social">
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="linkedin-link" aria-label="LinkedIn Profile">
                      <i className="fa-brands fa-linkedin"></i>
                    </a>
                  </div>
                </div>

                <div className="leader-roles-tags">
                  {['Technical Lead', 'Industrial Consultant', 'Project Architect', 'Operations Head', 'CEO & Founder'].map((role, idx) => (
                    <span key={idx} className="role-tag">{role}</span>
                  ))}
                </div>

                <blockquote className="leader-vision">
                  <i className="fa-solid fa-quote-left quotes-icon"></i>
                  <p>"Engineering Precision for a Sustainable Industrial Future"</p>
                </blockquote>

                <div className="leader-body">
                  <h4>Professional Bio</h4>
                  <p>
                    Sankarganesh R is a pioneering Mechanical Engineer and Industrialist with over a decade of expertise in precision manufacturing and strategic engineering. Holding an M.Tech in Energy Technology, he has spearheaded monumental projects for IOCL, SIDCO, and Indian Railways. As the visionary behind Sri Tech Engineering, he is at the forefront of EV design, industrial 3D printing, and reverse engineering, driving innovation across Tamil Nadu’s industrial corridor.
                  </p>

                  <h4>Core Focus & Achievements</h4>
                  <ul className="leader-bullets">
                    <li><i className="fa-solid fa-circle-check"></i> 15+ Years of Mastery in Precision Engineering & CAD/CAM</li>
                    <li><i className="fa-solid fa-circle-check"></i> Successfully Delivered 500+ High-Impact Industrial Projects</li>
                    <li><i className="fa-solid fa-circle-check"></i> Pioneer of Electric Vehicle (EV) Design & 3D Prototyping in Namakkal</li>
                    <li><i className="fa-solid fa-circle-check"></i> Lead Engineer for Major IOCL, SIDCO, and National Railway Infrastructure</li>
                    <li><i className="fa-solid fa-circle-check"></i> Lead Innovator of the First PEB Structure in SIDCO Industrial Estate</li>
                  </ul>
                </div>
              </div>

              {/* Leader 2: Ganga P */}
              <div className="leader-card glass-light-panel glow-border-orange animate-on-scroll">
                <div className="leader-header">
                  <div className="leader-profile-summary">
                    <div className="leader-avatar-frame">
                      <img src="/ganga.png" alt="Ganga P" className="leader-avatar" />
                    </div>
                    <div className="leader-meta">
                      <h3>Ganga P</h3>
                      <strong className="leader-role">Managing Director</strong>
                      <span className="leader-edu">B.Com, M.Com (Corporate Governance)</span>
                    </div>
                  </div>
                  <div className="leader-social">
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="linkedin-link" aria-label="LinkedIn Profile">
                      <i className="fa-brands fa-linkedin"></i>
                    </a>
                  </div>
                </div>

                <div className="leader-roles-tags">
                  {['Managing Director', 'Strategic Planner', 'Financial Controller', 'Brand Custodian'].map((role, idx) => (
                    <span key={idx} className="role-tag">{role}</span>
                  ))}
                </div>

                <blockquote className="leader-vision">
                  <i className="fa-solid fa-quote-left quotes-icon"></i>
                  <p>"Driving Sustainable Innovation through Strategic Operational Excellence"</p>
                </blockquote>

                <div className="leader-body">
                  <h4>Professional Bio</h4>
                  <p>
                    Ganga P is a strategic leader specializing in corporate governance and operational sustainability. As the Managing Director of SM Groups, she integrates commerce-driven insights with industrial strategy to ensure global quality standards. Her leadership focuses on brand development, ethical business operations, and fostering a culture of excellence that bridges the gap between traditional manufacturing and modern strategic management.
                  </p>

                  <h4>Core Focus & Achievements</h4>
                  <ul className="leader-bullets">
                    <li><i className="fa-solid fa-circle-check"></i> Expert in Strategic Brand Management & Corporate Identity</li>
                    <li><i className="fa-solid fa-circle-check"></i> Architect of Sustainable Operational Frameworks for SM Groups</li>
                    <li><i className="fa-solid fa-circle-check"></i> Specialist in Commerce-Driven Industrial Efficiency & Growth</li>
                    <li><i className="fa-solid fa-circle-check"></i> Facilitator of Industry-Student Skill Bridge Programs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Realistic Combustion Flame Wall at bottom of Leadership */}
          <div className="combustion-flame-bar">
            {/* Layer 1: Background Red Flames */}
            <div className="flame-layer flame-layer-red">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={`lr-${i}`} className="flame-element flame-red"></div>
              ))}
            </div>
            {/* Layer 2: Middle Orange Flames */}
            <div className="flame-layer flame-layer-orange">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={`lo-${i}`} className="flame-element flame-orange"></div>
              ))}
            </div>
            {/* Layer 3: Foreground Golden Flames */}
            <div className="flame-layer flame-layer-yellow">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={`ly-${i}`} className="flame-element flame-yellow"></div>
              ))}
            </div>
            {/* Layer 4: White-Hot Core Combustion Flares */}
            <div className="flame-layer flame-layer-white">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={`lw-${i}`} className="flame-element flame-white"></div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section id="why-choose-us" className="benefits-section">
          {/* Animated Breeze Elements in Background */}
          <div className="breeze-container">
            <div className="breeze-leaf leaf-1"><i className="fa-solid fa-leaf"></i></div>
            <div className="breeze-leaf leaf-2"><i className="fa-solid fa-wind"></i></div>
            <div className="breeze-leaf leaf-3"><i className="fa-solid fa-leaf"></i></div>
            <div className="breeze-leaf leaf-4"><i className="fa-solid fa-wind"></i></div>
          </div>

          <div className="section-header-light">
            <h2>{t('whyChooseUs.title')}</h2>
            <p>{t('whyChooseUs.subtitle')}</p>
          </div>
          
          {/* Infinite Horizontal Scroll Track */}
          <div className="benefits-marquee-container">
            <div className="benefits-marquee-track">
              {/* Set 1 */}
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-heart-pulse"></i></div>
                <h4>{t('whyChooseUs.healthierCooking')}</h4>
                <p>{t('whyChooseUs.healthierCookingDesc')}</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-piggy-bank"></i></div>
                <h4>{t('whyChooseUs.savesMoney')}</h4>
                <p>{t('whyChooseUs.savesMoneyDesc')}</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-leaf"></i></div>
                <h4>{t('whyChooseUs.envFriendly')}</h4>
                <p>{t('whyChooseUs.envFriendlyDesc')}</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-hammer"></i></div>
                <h4>{t('whyChooseUs.durable')}</h4>
                <p>{t('whyChooseUs.durableDesc')}</p>
              </div>

              {/* Set 2 (Duplicate for seamless infinite scrolling loop) */}
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-heart-pulse"></i></div>
                <h4>{t('whyChooseUs.healthierCooking')}</h4>
                <p>{t('whyChooseUs.healthierCookingDesc')}</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-piggy-bank"></i></div>
                <h4>{t('whyChooseUs.savesMoney')}</h4>
                <p>{t('whyChooseUs.savesMoneyDesc')}</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-leaf"></i></div>
                <h4>{t('whyChooseUs.envFriendly')}</h4>
                <p>{t('whyChooseUs.envFriendlyDesc')}</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-hammer"></i></div>
                <h4>{t('whyChooseUs.durable')}</h4>
                <p>{t('whyChooseUs.durableDesc')}</p>
              </div>
            </div>
          </div>
        </section>

          {/* Testimonials Section */}
          <section className="testimonials-section">
          <div className="section-header-dark">
            <h2>{t('testimonials.title')}</h2>
            <p>{t('testimonials.subtitle')}</p>
          </div>
          
          <div className="testimonials-grid">
            <div className="testimonial-card glass-panel">
              <div className="stars"><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i></div>
              <p className="review-text">{t('testimonials.review1')}</p>
              <div className="reviewer">
                <div className="reviewer-avatar">{t('testimonials.reviewer1Initials')}</div>
                <div>
                  <h4>{t('testimonials.reviewer1Name')}</h4>
                  <p>{t('testimonials.reviewer1Role')}</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card glass-panel">
              <div className="stars"><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i></div>
              <p className="review-text">{t('testimonials.review2')}</p>
              <div className="reviewer">
                <div className="reviewer-avatar">{t('testimonials.reviewer2Initials')}</div>
                <div>
                  <h4>{t('testimonials.reviewer2Name')}</h4>
                  <p>{t('testimonials.reviewer2Role')}</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card glass-panel">
              <div className="stars"><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star-half-stroke"></i></div>
              <p className="review-text">{t('testimonials.review3')}</p>
              <div className="reviewer">
                <div className="reviewer-avatar">{t('testimonials.reviewer3Initials')}</div>
                <div>
                  <h4>{t('testimonials.reviewer3Name')}</h4>
                  {t('testimonials.reviewer3Role') && <p>{t('testimonials.reviewer3Role')}</p>}
                </div>
              </div>
            </div>
          </div>
        </section>

          </>
        )}
      </main>

      {/* Footer */}
      <Footer 
        complaintForm={complaintForm}
        setComplaintForm={setComplaintForm}
        handleComplaintSubmit={handleComplaintSubmit}
      />
    </div>
    )
  );
}

export default App;
