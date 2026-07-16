import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './index.css'
import { createPortal } from 'react-dom'
import AdminDashboard from './AdminDashboard'
import UserDashboard from './components/UserDashboard'
import Footer from './components/Footer'
import MyOrders from './pages/MyOrders.jsx'

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '/api' : 'https://website-sritech.onrender.com/api');

const DEFAULT_BANNERS = [
  { _id: 'default-1', image: '/hero-image.png', caption: 'Premium Sustainable Engineering Solutions' },
  { _id: 'default-2', image: '/hero-banner.png', caption: 'Precision Agro, Food & Poultry Machineries' },
  { _id: 'default-3', image: '/rocket-stove.png', caption: 'Eco-Friendly High Efficiency Combustion Solutions' }
];

const FALLBACK_PRODUCTS = [];

function App() {
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
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
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
  const [userCredentials, setUserCredentials] = useState({ name: '', phone: '', address: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState(null);
  const [authFieldErrors, setAuthFieldErrors] = useState({ email: '', password: '' });
  const [activeUser, setActiveUser] = useState(null);
  const [authPortalIsGate, setAuthPortalIsGate] = useState(false); // true = portal is mandatory gate on /

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
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

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
    if (activeUser) {
      setCart(activeUser.cart || []);
      setWaitlist(activeUser.waitlist || []);
    } else {
      setCart(loadGuestCart());
      setWaitlist(loadGuestWaitlist());
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
      if (!Array.isArray(prodData) || prodData.length === 0) {
        const fallbackProducts = FALLBACK_PRODUCTS;
        setProducts(fallbackProducts);
        return fallbackProducts;
      }

      setProducts(prodData);
      return prodData;
    } catch (err) {
      console.error('Error refreshing products:', err);
      setProducts(FALLBACK_PRODUCTS);
      return FALLBACK_PRODUCTS;
    }
  };

  // Initial Popup and Data Fetching
  // Fetch Initial Data
  const fetchData = async () => {
    const t = Date.now();
    let productsLoaded = false;

    // Fetch products
    try {
      const prodData = await refreshProducts();
      productsLoaded = Array.isArray(prodData) && prodData.length >= 0;
    } catch (err) {
      console.error('Error fetching products:', err);
      showToast('Backend unavailable. Please try again later.', 'error');
    }

    // Fetch categories
    try {
      const catRes = await fetch(`${API_URL}/categories?t=${t}`);
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData); // store full objects with _id, name, slug
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }

    // Fetch offers
    try {
      const offerRes = await fetch(`${API_URL}/offers?t=${t}`);
      if (offerRes.ok) {
        const offerPayload = await offerRes.json();
        const normalizedOffers = Array.isArray(offerPayload) ? offerPayload : [offerPayload].filter(Boolean);
        setOffers(normalizedOffers);
        const activeOffer = normalizedOffers.find(offer => offer?.isPublished !== false && offer?.isActive !== false) || normalizedOffers[0] || null;
        setOfferData(activeOffer || {
          title: 'Special Offer! 🎉',
          description: 'Get 20% off your first purchase.',
          code: 'SRITECH20',
          poster: null
        });
      }
    } catch (err) {
      console.error("Error fetching offers:", err);
    }

    // Fetch admin orders (admin-only endpoint)
    if (isAdmin) {
      try {
        const orderRes = await fetch(`${API_URL}/orders?t=${t}`, { headers: getAdminHeaders() });
        if (orderRes.ok) {
          setOrders(await orderRes.json());
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    }

    // Fetch logged-in user orders
    if (activeUser) {
      try {
        const userOrderRes = await fetch(`${API_URL}/orders/me?t=${t}`, {
          headers: getUserHeaders()
        });
        if (userOrderRes.ok) {
          setUserOrders(await userOrderRes.json());
        }
      } catch (err) {
        console.error("Error fetching user orders:", err);
      }
    }

    // Fetch coupons
    try {
      const couponRes = await fetch(`${API_URL}/coupons?t=${t}`);
      if (couponRes.ok) {
        setCoupons(await couponRes.json());
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
    }

    // Fetch support queries (admin-only)
    if (isAdmin) {
      try {
        const supportRes = await fetch(`${API_URL}/support?t=${t}`, { headers: getAdminHeaders() });
        if (supportRes.ok) {
          setSupportQueries(await supportRes.json());
        }
      } catch (err) {
        console.error("Error fetching support queries:", err);
      }
    }

    const adminHeaders = getAdminHeaders();

    if (isAdmin && adminHeaders.Authorization) {
      try {
        const returnRes = await fetch(`${API_URL}/returns?t=${t}`, { headers: adminHeaders });
        if (returnRes.ok) {
          setReturnRequests(await returnRes.json());
        }
      } catch (err) {
        console.error("Error fetching return requests:", err);
      }

      try {
        const refundRes = await fetch(`${API_URL}/refunds?t=${t}`, { headers: adminHeaders });
        if (refundRes.ok) {
          setRefundRequests(await refundRes.json());
        }
      } catch (err) {
        console.error("Error fetching refund requests:", err);
      }
    }

    // Fetch activity logs
    if (isAdmin && adminHeaders.Authorization) {
      try {
        const logRes = await fetch(`${API_URL}/logs?t=${t}`, { headers: adminHeaders });
        if (logRes.ok) {
          setActivityLogs(await logRes.json());
        }
      } catch (err) {
        console.error("Error fetching activity logs:", err);
      }
    }

    // Fetch visitor leads
    if (isAdmin && adminHeaders.Authorization) {
      try {
        const leadsRes = await fetch(`${API_URL}/leads?t=${t}`, { headers: adminHeaders });
        if (leadsRes.ok) {
          setLeads(await leadsRes.json());
        }
      } catch (err) {
        console.error("Error fetching visitor leads:", err);
      }
    }

    // Fetch registered users
    if (isAdmin && adminHeaders.Authorization) {
      try {
        const usersRes = await fetch(`${API_URL}/users?t=${t}`, { headers: adminHeaders });
        if (usersRes.ok) {
          setUsers(await usersRes.json());
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    }

    // Fetch hero banners
    try {
      const heroRes = await fetch(`${API_URL}/hero-banners?t=${t}`);
      if (heroRes.ok) {
        setHeroBanners(await heroRes.json());
      }
    } catch (err) {
      console.error("Error fetching hero banners:", err);
    }
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
        if (res.ok) {
          setIsAdmin(true);
          setIsViewingPublicProducts(false);
        } else {
          const errorBody = await res.json().catch(() => ({}));
          console.warn('Admin session invalid:', errorBody.message || res.statusText);
          clearAdminSession();
          setIsAdmin(false);
          setIsViewingPublicProducts(false);
        }
      } catch (err) {
        console.error('Admin session validation failed:', err);
        clearAdminSession();
        setIsAdmin(false);
        setIsViewingPublicProducts(false);
      } finally {
        setAdminAuthReady(true);
      }
    };

    const initializeApp = async () => {
      await restoreUserSession();
      await validateAdminSession();
      await fetchData();
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (!adminAuthReady) return;

    const isAdminPath = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
    if (isAdminPath && !isAdmin) {
      setShowAdminLogin(true);
    } else {
      setShowAdminLogin(false);
    }
  }, [adminAuthReady, location.pathname, isAdmin]);

  useEffect(() => {
    if (location.pathname === '/my-orders' && !isUserLoggedIn) {
      setAuthMode('login');
      setShowAuthModal(true);
    }
  }, [location.pathname, isUserLoggedIn]);

  // Synchronize URL path /product/:id with selectedProduct state
  useEffect(() => {
    if (!Array.isArray(products) || products.length === 0) return;

    let targetProductId = null;
    if (location.pathname.startsWith('/product/')) {
      targetProductId = location.pathname.split('/product/')[1];
    } else {
      const params = new URLSearchParams(location.search);
      targetProductId = params.get('product');
    }

    if (targetProductId) {
      const found = products.find(p => String(p._id || p.id) === targetProductId || (p.slug && String(p.slug) === targetProductId));
      if (found) {
        if (!selectedProduct || (selectedProduct._id || selectedProduct.id) !== found._id) {
          setSelectedProduct(found);
        }
      }
    }
  }, [location.pathname, location.search, products]);

  // Sync selectedProduct state changes back to the URL
  useEffect(() => {
    if (selectedProduct) {
      const targetPath = `/product/${selectedProduct._id || selectedProduct.id}`;
      if (location.pathname !== targetPath) {
        navigate(targetPath);
      }
    } else {
      if (location.pathname.startsWith('/product/')) {
        navigate('/');
      }
    }
  }, [selectedProduct]);

  // Fetch reviews when product is selected
  useEffect(() => {
    if (selectedProduct) {
      trackGAEvent('view_item', 'ecommerce', selectedProduct.name, Number(String(selectedProduct.price).replace(/[^0-9]/g, '')) || 0);
      setSelectedProductImageIndex(0);
      const fetchReviews = async () => {
        try {
          const res = await fetch(`${API_URL}/products/${selectedProduct._id || selectedProduct.id}/reviews?t=${Date.now()}`);
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

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isUserLoggedIn) {
      showToast("Please login to leave a review.", 'error');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/products/${selectedProduct._id || selectedProduct.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: activeUser.name,
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
        stock: Number(newProduct?.stock || 0),
        icon: String(newProduct?.icon || 'fa-box').trim(),
        isNewArrival: Boolean(newProduct?.isNewArrival),
        images: Array.isArray(newProduct?.images)
          ? newProduct.images.filter(Boolean).map((img) => String(img))
          : []
      };

      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: getAuthHeaders({ contentType: true, admin: true }),
        body: JSON.stringify(normalizedPayload)
      });

      if (res.ok) {
        await refreshProducts();
        showToast('Product added successfully!', 'success');
        return true;
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
    try {
      const res = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (res.ok) {
        await refreshProducts();
        setSelectedProduct(prev => (prev && (prev._id || prev.id) === productId ? null : prev));
        showToast('Product deleted successfully!', 'success');
        const logRes = await fetch(`${API_URL}/logs`, { headers: getAdminHeaders() });
        if (logRes.ok) setActivityLogs(await logRes.json());
      } else {
        const error = await res.json();
        showToast(error.message || 'Failed to delete product.', 'error');
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      showToast('Error deleting product. Please try again.', 'error');
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
    setOrderDashboardLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders/me?t=${Date.now()}`, {
        headers: getUserHeaders()
      });
      if (res.ok) {
        const fetchedOrders = await res.json();
        if (!fetchedOrders.length && import.meta.env.DEV) {
          const mockOrder = {
            _id: 'test-order-001',
            orderId: 'ORD-20260709-001',
            invoiceNumber: 'INV-20260709-001',
            customerName: activeUser.name || 'Hemalatha',
            customerEmail: activeUser.email || 'hemalatha@example.com',
            orderDate: new Date('2026-07-09T10:30:00Z').toISOString(),
            createdAt: new Date('2026-07-09T10:30:00Z').toISOString(),
            estimatedDelivery: new Date('2026-07-12T00:00:00Z').toISOString(),
            status: 'Shipped',
            paymentStatus: 'Completed',
            paymentMethod: 'Razorpay',
            carrier: 'SriTech Express',
            trackingNumber: 'TRACK1234567890',
            trackingUrl: 'https://track.example.com/TRACK1234567890',
            shippingAddress: {
              name: activeUser.name || 'Hemalatha',
              phone: activeUser.phone || '+91 90000 00000',
              addressLine1: '11/1 Gurusamipalayam Road',
              addressLine2: 'Near Rasipuram Market',
              city: 'Rasipuram',
              state: 'Tamil Nadu',
              zipCode: '637403',
              country: 'India'
            },
            grandTotal: 1250,
            items: [
              {
                product: 'test-product-001',
                sku: 'SKU-T1',
                name: 'Sri Tech Combustion Unit',
                quantity: 1,
                price: 1250,
                totalPrice: 1250
              }
            ],
            timelineHistory: [
              { status: 'Order Placed', note: 'Your order has been placed successfully.', timestamp: new Date('2026-07-09T10:30:00Z').toISOString() },
              { status: 'Payment Confirmed', note: 'Payment received.', timestamp: new Date('2026-07-09T10:31:00Z').toISOString() },
              { status: 'Packed', note: 'Package packed.', timestamp: new Date('2026-07-09T18:00:00Z').toISOString() },
              { status: 'Shipped', note: 'Package left the warehouse.', timestamp: new Date('2026-07-10T09:15:00Z').toISOString() }
            ]
          };
          setUserOrders([mockOrder]);
        } else {
          setUserOrders(fetchedOrders);
        }
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
    setCustomerDashboardOpen(true);
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
          acc.push({ ...item, quantity: updatedQuantity });
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
        await fetch(`${API_URL}/users/${activeUser._id}/cart/${productId}`, {
          method: 'DELETE',
          headers: getUserHeaders()
        });
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
    const checkoutAddress = (userCredentials.address || activeUser?.address || '').trim();

    if (!itemsForCheckout || itemsForCheckout.length === 0) {
      showToast('Your cart is empty.', 'error');
      return;
    }

    if (!checkoutName || !checkoutPhone || !checkoutAddress) {
      showToast('Please enter your name, phone number, and address before paying.', 'error');
      return;
    }

    if (!/^\d{10}$/.test(checkoutPhone)) {
      showToast('Phone number must be exactly 10 digits.', 'error');
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Step 1: Create Razorpay order
      const orderRes = await fetch(`${API_URL}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalForCheckout,
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

      // Step 2: Get Razorpay key from backend or use hardcoded
      const keyRes = await fetch(`${API_URL}/payments/get-key`).catch(() => null);
      const razorpayKey = keyRes ? (await keyRes.json()).key : import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        showToast('Razorpay key not configured. Please contact support.', 'error');
        setIsProcessingPayment(false);
        return;
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
        currency: 'INR',
        name: 'SriTech',
        description: 'Product Purchase',
        order_id: razorpayOrder.id,
        handler: async (response) => {
          console.log(response);
          await handleVerifyPayment(response);
        },
        prefill: {
          name: activeUser?.name || '',
          email: activeUser?.email || '',
          contact: activeUser?.phone || ''
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
      const checkoutAddress = (userCredentials.address || activeUser?.address || '').trim();

      const orderData = {
        customerId: activeUser?._id,
        customerName: checkoutName,
        customerEmail: activeUser?.email || '',
        customerPhone: checkoutPhone,
        shippingAddress: {
          name: checkoutName,
          phone: checkoutPhone,
          addressLine1: checkoutAddress,
          country: 'India'
        },
        billingAddress: {
          name: checkoutName,
          phone: checkoutPhone,
          addressLine1: checkoutAddress,
          country: 'India'
        },
        items: orderItems,
        subtotal: totalForCheckout,
        grandTotal: totalForCheckout,
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
        showToast(payload?.message || 'Wishlist updated locally. Please refresh if needed.', 'success');
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

    const confirmOrder = window.confirm(`Confirm purchase for ${product.name} at ₹${getProductFinalPrice(product)}?`);
    if (!confirmOrder) return;

    setCheckoutMode('buy-now');
    setCheckoutItems([product]);
    setShowCheckout(true);
    showToast('Secure checkout is ready. Complete payment to place your order.', 'success');
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
        if (currentValues.password !== currentValues.confirmPassword) {
          showToast('Passwords do not match!', 'error');
          return;
        }
        if (!/^\d{10}$/.test(currentValues.phone || '')) {
          showToast('Phone number must be exactly 10 digits.', 'error');
          return;
        }
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
          const errorData = await res.json().catch(() => ({}));
          const message = errorData?.error || errorData?.message || 'Signup failed';
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
              if (!isAdmin) {
                setTimeout(() => openUserDashboard('Overview'), 0);
              }
              showToast('✅ Email verified successfully!', 'success');
              return;
            }

            showToast('Your email has been verified. Please log in.', 'success');
            setAuthMode('login');
          } else {
            showToast(data.error || data.message || 'OTP verification failed.', 'error');
          }
          return;
        }

        const adminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'thesmgroups@gmail.com';
        const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'TSMGPVT@2026';
        const isEnteredAdminEmail = currentValues.email === adminUsername || currentValues.email === 'thesmgroups@gamil.com';
        if (isEnteredAdminEmail && currentValues.password === adminPassword) {
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

        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, password: currentValues.password })
        });
        if (res.ok) {
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
          const error = await res.json().catch(() => ({}));
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
    clearAuthSession();
    clearAdminSession();
    setIsUserLoggedIn(false);
    setActiveUser(null);
    setIsAdmin(false);
    setIsViewingPublicProducts(false);
    setShowAdminLogin(false);
    setShowAuthModal(false);
    setCustomerDashboardOpen(false);
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

  if (isAdmin && !isViewingPublicProducts) {
    return (
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

    );
  }


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
    const activeOffer = getActiveOfferForProduct(product);
    const activeCoupon = coupons.find(c => 
      c.isActive && 
      c.linkedProduct === (product._id || product.id) &&
      (!c.expiryDate || new Date(c.expiryDate) > new Date())
    );

    let finalPrice = priceNum;
    let bestDiscount = 0;

    if (activeOffer) {
      if (activeOffer.discountType === 'fixed') {
        finalPrice = Math.max(0, priceNum - (Number(activeOffer.discountValue) || 0));
        bestDiscount = Number(activeOffer.discountValue) || 0;
      } else if (activeOffer.discountType === 'percentage') {
        finalPrice = Math.round(priceNum * (1 - (Number(activeOffer.discountValue) || 0) / 100));
        bestDiscount = Math.round(priceNum * ((Number(activeOffer.discountValue) || 0) / 100));
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

const resolvedCartItems = cart
    .map((cartEntry) => {
      const normalized = normalizeCartEntry(cartEntry);
      if (!normalized) return null;
      const product = normalized.product || products.find(p => (p._id || p.id)?.toString() === normalized.productId?.toString());
      if (!product) return null;
      return { ...product, quantity: Number(normalized.quantity) || 1, _cartEntryId: normalized.productId };
    })
    .filter(Boolean);

  const cartTotal = resolvedCartItems.reduce((sum, item) => sum + (getProductFinalPrice(item) * (Number(item.quantity) || 1)), 0);
  const checkoutItemsForDisplay = checkoutItems.length > 0 ? checkoutItems : resolvedCartItems;
  const checkoutTotal = checkoutItemsForDisplay.reduce((sum, item) => sum + (getProductFinalPrice(item) * (Number(item.quantity) || 1)), 0);
  const discountPercent = 20;
  const discountAmount = Math.round(checkoutTotal * discountPercent / 100);
  const shippingFee = 500;
  const gstAmount = Math.round((checkoutTotal - discountAmount + shippingFee) * 0.18);
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

    const matchesCategory = selectedCatClean === 'all' || 
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

  return (
    <div className="app-wrapper">
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
            <button className="close-modal" onClick={() => setSelectedProduct(null)} aria-label="Close">&times;</button>
            
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
                <div className="price-tag">
                  {(() => {
                    const priceNum = parsePrice(selectedProduct.price);
                    const activeCoupon = coupons.find(c => 
                      c.isActive && 
                      c.linkedProduct === (selectedProduct._id || selectedProduct.id) &&
                      (!c.expiryDate || new Date(c.expiryDate) > new Date())
                    );
                    if (activeCoupon) {
                      const discountVal = parseFloat(activeCoupon.discountValue) || 0;
                      let discountedPrice;
                      let discountText;
                      if (activeCoupon.discountType === 'Fixed') {
                        discountedPrice = Math.max(0, priceNum - discountVal);
                        discountText = `₹${discountVal} off`;
                      } else {
                        discountedPrice = Math.round(priceNum * (1 - discountVal / 100));
                        discountText = `${discountVal}% off`;
                      }
                      return (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-dark)' }}>₹{discountedPrice.toLocaleString('en-IN')}</span>
                          <span style={{ fontSize: '1.1rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{priceNum.toLocaleString('en-IN')}</span>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#388e3c' }}>{discountText} (Coupon: {activeCoupon.code})</span>
                        </div>
                      );
                    }
                    return selectedProduct.price.toString().startsWith('₹') ? selectedProduct.price : `₹${selectedProduct.price}`;
                  })()}
                </div>
                {typeof selectedProduct.stock === 'number' && (
                  <div className="stock-info" style={{ marginBottom: '1rem', fontWeight: 600, color: selectedProduct.stock > 0 ? '#15803d' : '#b91c1c' }}>
                    {selectedProduct.stock > 0 ? `In stock: ${selectedProduct.stock}` : 'Out of stock'}
                  </div>
                )}
                <p className="description-text">
                  {selectedProduct.description || `Experience top-tier quality and premium design with our ${selectedProduct.name}. Crafted carefully to blend cutting-edge performance with eco-friendly efficiency.`}
                </p>
                <div className="actions-row">
                  <button className="buy-now-btn" onClick={() => { setSelectedProduct(null); handleBuyNow(selectedProduct); }}>Buy Now</button>
                  <button className="add-to-cart" onClick={() => handleAddToCart(selectedProduct)}>Add to Cart</button>
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
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'left' }}>No reviews yet. Be the first to share your thoughts!</p>
                  )}
                </div>

                {/* Submit Review Form (Only for buyers) */}
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
            <div className="related-products-section">
              <h3>Related Products</h3>
              <div className="related-products-grid">
                {products
                  .filter(p => (p.category || '').toLowerCase().trim().replace(/\s+/g, '-') === (selectedProduct.category || '').toLowerCase().trim().replace(/\s+/g, '-') && ((p._id || p.id) !== (selectedProduct._id || selectedProduct.id)))
                  .slice(0, 4)
                  .map(relatedProduct => (
                    <div 
                      key={relatedProduct._id || relatedProduct.id} 
                      className="related-product-card"
                      onClick={() => {
                        setSelectedProduct(relatedProduct);
                        setSelectedProductImageIndex(0);
                      }}
                    >
                      <div className="related-product-img">
                        {relatedProduct.images && relatedProduct.images.length > 0 ? (
                          <img loading="lazy" src={relatedProduct.images[0]} alt={relatedProduct.name} />
                        ) : (
                          <i className={`fa-solid ${relatedProduct.icon || 'fa-box'}`} style={{ fontSize: '2rem', color: 'var(--primary-color)' }}></i>
                        )}
                      </div>
                      <div className="related-product-info">
                        <h4>{relatedProduct.name}</h4>
                        <p>{relatedProduct.price.toString().startsWith('₹') ? relatedProduct.price : `₹${relatedProduct.price}`}</p>
                      </div>
                    </div>
                  ))}
                {products.filter(p => (p.category || '').toLowerCase().trim().replace(/\s+/g, '-') === (selectedProduct.category || '').toLowerCase().trim().replace(/\s+/g, '-') && (p._id !== selectedProduct._id && p.id !== selectedProduct.id)).length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'left', gridColumn: '1 / -1' }}>No related products found in this category.</p>
                )}
              </div>
            </div>

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
             <h2 style={{ fontSize: '1.8rem', color: '#ffffff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <i className="fa-solid fa-credit-card"></i> Order Checkout
             </h2>

             {/* Order Summary */}
             <div className="checkout-summary-card">
               <h3>Order Summary</h3>
               <div className="checkout-summary-userinfo">
                 <div>
                   <label className="checkout-summary-label">Name</label>
                   <input
                     type="text"
                     value={userCredentials.name}
                     onChange={(e) => updateUserCredentials('name', e.target.value)}
                     placeholder="Enter your name"
                     className="checkout-summary-input"
                   />
                 </div>
                 <div>
                   <label className="checkout-summary-label">Phone</label>
                   <input
                     type="tel"
                     value={userCredentials.phone}
                     onChange={(e) => updateUserCredentials('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                     placeholder="Enter mobile number"
                     className="checkout-summary-input"
                   />
                 </div>
                 <div>
                   <label className="checkout-summary-label">Address</label>
                   <textarea
                     value={userCredentials.address}
                     onChange={(e) => updateUserCredentials('address', e.target.value)}
                     placeholder="Enter delivery address"
                     rows={3}
                     className="checkout-summary-textarea"
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
               <div className="checkout-summary-row">
                 <span>Subtotal</span>
                 <strong>₹{checkoutTotal.toLocaleString('en-IN')}</strong>
               </div>
               <div className="checkout-summary-row">
                 <span>Discount ({discountPercent}%)</span>
                 <strong>-₹{discountAmount.toLocaleString('en-IN')}</strong>
               </div>
               <div className="checkout-summary-row">
                 <span>Shipping</span>
                 <strong>₹{shippingFee.toLocaleString('en-IN')}</strong>
               </div>
               <div className="checkout-summary-row">
                 <span>GST (18%)</span>
                 <strong>₹{gstAmount.toLocaleString('en-IN')}</strong>
               </div>
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
                <div className="modal-pill wishlist-pill">{waitlist.length} saved</div>
              </div>
              {waitlist.length === 0 ? (
                <div className="modal-empty-state wishlist-empty">
                  <i className="fa-regular fa-heart"></i>
                  <p>Your wishlist is empty.</p>
                  <span>Save products you love and they’ll appear here.</span>
                </div>
              ) : (
                <ul className="modal-item-list">
                  {products.filter(p => waitlist.includes(p._id || p.id)).map((item, idx) => (
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

        {/* Premium User Dashboard Modal */}
        {customerDashboardOpen && (
          <UserDashboard
            isOpen={customerDashboardOpen}
            onClose={handleCloseOrderDashboard}
            activeUser={activeUser}
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
          />
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

              <form onSubmit={handleUserAuthSubmit}>
                
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
                          className="auth-input" 
                          placeholder="John Doe" 
                          required
                          value={userCredentials.name}
                          onChange={(e) => updateUserCredentials('name', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="auth-form-group">
                      <label>Mobile Number</label>
                      <div className="auth-input-wrapper">
                        <i className="fa-solid fa-phone prefix-icon"></i>
                        <input 
                          type="tel" 
                          name="phone"
                          inputMode="numeric"
                          className="auth-input" 
                          placeholder="9876543210" 
                          required
                          value={userCredentials.phone || ''}
                          onChange={(e) => updateUserCredentials('phone', e.target.value)}
                        />
                      </div>
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
                        className="auth-input" 
                        placeholder="••••••••" 
                        required
                        value={userCredentials.confirmPassword || ''}
                        onChange={(e) => updateUserCredentials('confirmPassword', e.target.value)}
                      />
                      <button type="button" className="pwd-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <i className={`fa-regular ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                      </button>
                    </div>
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
                  {authSubmitting ? (authMode === 'login' ? 'Signing In...' : 'Creating Account...') : (authMode === 'login' ? 'Sign In' : 'Create Account')}
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
      <header className="top-header">
        <div className="header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              className="mobile-menu-btn" 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle Navigation Menu"
              title="Menu"
            >
              <i className={showMobileMenu ? "fa-solid fa-xmark" : "fa-solid fa-bars"} aria-hidden="true"></i>
            </button>
            <a href="#" className="logo" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img
                src="/sri-tech-logo-final.png"
                alt="SriTech Logo"
                style={{
                  height: '130px',
                  width: 'auto',
                  objectFit: 'contain',
                  background: 'transparent',
                  filter: 'hue-rotate(12deg) saturate(1.08) drop-shadow(0 2px 4px rgba(0,0,0,0.12))'
                }}
              />
            </a>
          </div>

          <nav className="header-nav">
            <a href="#home" className="action-btn" onClick={(e) => { scrollToSection(e, 'home'); }}>
              Home
            </a>
            <a href="#product" className="action-btn" onClick={(e) => { scrollToSection(e, 'product'); }}>
              Products
            </a>
            <a href="#about" className="action-btn" onClick={(e) => { scrollToSection(e, 'about'); }}>
              About
            </a>
            <a href="#footer" className="action-btn" onClick={(e) => { scrollToSection(e, 'footer'); }}>
              Contact
            </a>
          </nav>

          <div className="header-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="action-btn header-search-btn"
                title="Search products"
                aria-label="Search products"
                onClick={handleNavbarSearchToggle}
              >
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
              </button>
              <button className="action-btn cart-btn" title="Cart" aria-label={`View shopping cart with ${cart.length} items`} onClick={() => setShowCart(true)}>
                <i className="fa-solid fa-cart-shopping" aria-hidden="true"></i>
                <span className="btn-text" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Cart</span>
                {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
              </button>
              <button className="action-btn" title="Wishlist" aria-label="Wishlist" onClick={() => setShowWishlist(true)}>
                <i className={waitlist.length > 0 ? "fa-solid fa-heart" : "fa-regular fa-heart"} aria-hidden="true" style={waitlist.length > 0 ? { color: 'var(--accent-yellow)' } : {}}></i>
                <span className="btn-text" style={{ fontSize: '0.9rem', fontWeight: 600, marginLeft: '0.35rem' }}>Wishlist</span>
              </button>
              <button
                className="action-btn header-login-btn"
                title="Login"
                aria-label="Login"
                onClick={() => {
                  setAuthMode('login');
                  setAuthErrorMessage(null);
                  setShowAuthModal(true);
                  setUserCredentials({ name: '', phone: '', address: '', email: '', password: '', confirmPassword: '' });
                }}
              >
                <i className="fa-solid fa-user" aria-hidden="true"></i>
                <span className="btn-text" style={{ fontSize: '0.9rem', fontWeight: 600, marginLeft: '0.35rem' }}>Login</span>
              </button>
            </div>

            {showNavbarSearch && (
              <div className="navbar-search-container" style={{ position: 'relative', marginLeft: '0.4rem' }}>
                <input
                  type="text"
                  ref={navbarSearchInputRef}
                  value={searchTerm}
                  onChange={(e) => handleNavbarSearchChange(e.target.value)}
                  placeholder="Search products"
                  style={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '999px',
                    padding: '0.45rem 0.8rem',
                    minWidth: '220px',
                    color: '#0f172a',
                    background: '#fff'
                  }}
                  autoFocus
                />
                {searchTerm.trim() && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.35rem)',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)',
                    zIndex: 60,
                    maxHeight: '280px',
                    overflowY: 'auto'
                  }}>
                    {matchedSuggestions.length > 0 ? (
                      matchedSuggestions.slice(0, 6).map(product => (
                        <button
                          key={product._id || product.id}
                          type="button"
                          onClick={() => {
                            setSelectedProduct(product);
                            setSelectedProductImageIndex(0);
                            setShowNavbarSearch(false);
                            setSearchTerm('');
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '0.2rem',
                            padding: '0.7rem 0.8rem',
                            border: 'none',
                            background: 'transparent',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: '#0f172a'
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{product.name}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {getCategoryDisplayName(product.category)}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div style={{ padding: '0.7rem 0.8rem', color: '#64748b' }}>
                        No matching products found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu Panel */}
        <div className={`mobile-nav-panel ${showMobileMenu ? 'active' : ''}`}>
          <a href="#home" className="action-btn" onClick={(e) => { scrollToSection(e, 'home'); setShowMobileMenu(false); }}>
            Home
          </a>
          <a href="#product" className="action-btn" onClick={(e) => { scrollToSection(e, 'product'); setShowMobileMenu(false); }}>
            Products
          </a>
          <a href="#about" className="action-btn" onClick={(e) => { scrollToSection(e, 'about'); setShowMobileMenu(false); }}>
            About
          </a>
          <a href="#footer" className="action-btn" onClick={(e) => { scrollToSection(e, 'footer'); setShowMobileMenu(false); }}>
            Contact
          </a>
        </div>
      </header>

      <main>
        {isMyOrdersPage ? (
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
                {Array.from({ length: 30 }).map((_, i) => (
                  <span key={i} className="ember" style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${2 + Math.random() * 4}s`,
                    width: `${2 + Math.random() * 6}px`,
                    height: `${2 + Math.random() * 6}px`
                  }}></span>
                ))}
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

              <div className="combustion-flame-bar">
                {/* Layer 1: Background Red Flames */}
                <div className="flame-layer flame-layer-red">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={`r-${i}`} className="flame-element flame-red"></div>
                  ))}
                </div>
                {/* Layer 2: Middle Orange Flames */}
                <div className="flame-layer flame-layer-orange">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={`o-${i}`} className="flame-element flame-orange"></div>
                  ))}
                </div>
                {/* Layer 3: Foreground Golden Flames */}
                <div className="flame-layer flame-layer-yellow">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={`y-${i}`} className="flame-element flame-yellow"></div>
                  ))}
                </div>
                {/* Layer 4: White-Hot Core Combustion Flares */}
                <div className="flame-layer flame-layer-white">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={`w-${i}`} className="flame-element flame-white"></div>
                  ))}
                </div>
              </div>

          <div className="premium-hero-content">
            <div className="hero-text-content">
              <div className="hero-badge-wrap">
                <span className="premium-badge-text">COOK SMART. SAVE FUEL. SAVE NATURE.</span>
              </div>
              <h1>Efficient Cooking.<br/><span className="text-highlight-orange">Fiery Efficiency.</span></h1>
              <p className="hero-subtitle">Our systems use less fuel, produce less smoke, and deliver higher efficiency for a sustainable tomorrow.</p>
              
              <div className="hero-features-row">
                <div className="feature-item-col">
                  <i className="fa-solid fa-fire-leaf"></i>
                  <div>
                    <strong>Up to 80%</strong>
                    <span>Less Fuel</span>
                  </div>
                </div>
                <div className="feature-item-col">
                  <i className="fa-solid fa-cloud-slash"></i>
                  <div>
                    <strong>Low Smoke</strong>
                    <span>Clean Cooking</span>
                  </div>
                </div>
                <div className="feature-item-col">
                  <i className="fa-solid fa-bolt"></i>
                  <div>
                    <strong>High Efficiency</strong>
                    <span>Better Performance</span>
                  </div>
                </div>
                <div className="feature-item-col">
                  <i className="fa-solid fa-tree"></i>
                  <div>
                    <strong>Eco Friendly</strong>
                    <span>Sustainable Living</span>
                  </div>
                </div>
              </div> {/* Close hero-features-row */}
              <div className="hero-cta-group">
                <a href="#product" className="primary-btn-green" onClick={(e) => scrollToSection(e, 'product')}>Explore Products <i className="fa-solid fa-arrow-right"></i></a>
                <a href="#about" className="secondary-btn-outline" onClick={(e) => scrollToSection(e, 'about')}>Learn More</a>
              </div>
            </div>

            <div className="hero-image-wrapper">
              <div className="hero-product-card">
                <img src="/rocket-stove-user.png" alt="Sri Tech Eco Combustion System with Flames" className="hero-product-image" />
              </div>
            </div>
          </div>

          {/* Centered circular badge at the bottom of the landing page */}
          <div className="hero-bottom-badge-wrap">
            <div className="circular-badge">
              <svg viewBox="0 0 100 100">
                <path id="curve" d="M 50 50 m -37 0 a 37 37 0 1 1 74 0 a 37 37 0 1 1 -74 0" fill="transparent" />
                <text><textPath href="#curve" startOffset="0">COOK FASTER • SAVE MORE • LIVE BETTER • </textPath></text>
              </svg>
              <i className="fa-solid fa-leaf center-icon" style={{color: '#1E7A3B'}}></i>
            </div>
          </div>
        </section>



        {/* Massive Animated About Us Section */}
        <section id="about" className="about-us-section">
          <div className="about-container">
            <div className="section-header-dark">
              <h2>About Sri Tech Engineering</h2>
              <p>Pioneering innovation, sustainability, and engineering excellence since 2020.</p>
            </div>
            
            <div className="about-grid">
              {/* Left Column: Company Story & National Projects */}
              <div className="about-story-col">
                <div className="about-card glass-panel">
                  <h3>Our Legacy & Specialization</h3>
                  <p>
                    Sri Tech Engineering (SM Group) is a precision manufacturing company founded in 2020. 
                    We specialize in <strong>Agro, Food & Poultry Machineries</strong>, <strong>Material Fabrication</strong>, and <strong>Engineering Works</strong>.
                  </p>
                  <p>
                    Led by <strong>Sankarganesh R (CEO)</strong> and <strong>Ganga (MD)</strong>, we focus on delivering excellence through innovation, sustainability, and quality. We bridge the gap between students and industry through technical skill development.
                  </p>
                  <div className="location-box">
                    <i className="fa-solid fa-map-location-dot"></i>
                    <div>
                      <strong>Based in Namakkal, Tamil Nadu</strong>
                      <span>2 Advanced Manufacturing Units: Athanoor & Vaiyappamalai</span>
                    </div>
                  </div>
                </div>

                <div className="rocket-stove-banner glass-panel glow-border-orange">
                  <div className="banner-icon-wrap">
                    <i className="fa-solid fa-fire-burner animate-flicker"></i>
                  </div>
                  <div>
                    <h4>Eco-Friendly Rocket Stoves</h4>
                    <p>We are proudly manufacturing high-efficiency rocket stoves and <strong>delivering all over India!</strong></p>
                  </div>
                </div>

                <div className="about-card glass-panel">
                  <h3>Prestigious Projects & Stature</h3>
                  <p>We have successfully executed complex national-scale engineering projects for:</p>
                  <div className="clients-list">
                    <span className="client-badge"><i className="fa-solid fa-train"></i> Indian Railways</span>
                    <span className="client-badge"><i className="fa-solid fa-droplet"></i> IOCL</span>
                    <span className="client-badge"><i className="fa-solid fa-building"></i> SIDCO</span>
                    <span className="client-badge"><i className="fa-solid fa-road"></i> Smart City Highways</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Achievements & Interactive Workflow */}
              <div className="about-achievements-col">
                <div className="achievements-grid">
                  <div className="stat-card glass-panel">
                    <div className="stat-icon"><i className="fa-solid fa-award"></i></div>
                    <strong>10+ Years</strong>
                    <span>Precision Experience</span>
                  </div>
                  <div className="stat-card glass-panel">
                    <div className="stat-icon"><i className="fa-solid fa-circle-check"></i></div>
                    <strong>National</strong>
                    <span>Projects Stature</span>
                  </div>
                  <div className="stat-card glass-panel">
                    <div className="stat-icon"><i className="fa-solid fa-cubes"></i></div>
                    <strong>First PEB</strong>
                    <span>Structure at SIDCO Estate</span>
                  </div>
                  <div className="stat-card glass-panel">
                    <div className="stat-icon"><i className="fa-solid fa-microchip"></i></div>
                    <strong>Pioneer</strong>
                    <span>EV Design & 3D Printing</span>
                  </div>
                </div>

                {/* Workflow section */}
                <div className="workflow-card glass-panel">
                  <h3>Our Precision Workflow</h3>
                  <div className="workflow-steps-row">
                    <div className="workflow-step">
                      <div className="step-icon-circle"><i className="fa-solid fa-compass-drafting"></i></div>
                      <strong>Design</strong>
                      <span>CAD/CAM validated designs</span>
                    </div>
                    <div className="workflow-arrow"><i className="fa-solid fa-arrow-right-long"></i></div>
                    <div className="workflow-step">
                      <div className="step-icon-circle"><i className="fa-solid fa-industry"></i></div>
                      <strong>Manufacture</strong>
                      <span>2 precision units</span>
                    </div>
                    <div className="workflow-arrow"><i className="fa-solid fa-arrow-right-long"></i></div>
                    <div className="workflow-step">
                      <div className="step-icon-circle"><i className="fa-solid fa-truck-ramp-box"></i></div>
                      <strong>Deliver</strong>
                      <span>On-time, every time</span>
                    </div>
                  </div>
                </div>

                {/* Combustion Science Interactive Sub-widget */}
                <div className="workflow-card glass-panel">
                  <h3>Combustion Science Inside Our Stoves</h3>
                  <div className="about-combustion-box">
                    <div className="combustion-steps-nav">
                      {['Feed Wood', 'Airflow Ignites', 'Heat Rises', 'Clean Cooking'].map((tab, idx) => (
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
                      {activeStepIndex === 0 && <p><i className="fa-solid fa-wood-pile"></i> Load biomass or wood easily from the top or side intake port.</p>}
                      {activeStepIndex === 1 && <p><i className="fa-solid fa-wind"></i> Oxygen is rapidly pulled through the bottom draft, creating a powerful draft.</p>}
                      {activeStepIndex === 2 && <p><i className="fa-solid fa-arrow-up-long"></i> The insulated combustion chamber forces fire up, burning excess smoke gases.</p>}
                      {activeStepIndex === 3 && <p><i className="fa-solid fa-fire"></i> Concentrated high-velocity heat hits the cooking surface directly for 80% thermal efficiency.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="how-it-works-section">
          <div className="hiw-container">
            <div className="section-header-dark">
              <h2>Master the Elements</h2>
              <p>The science of perfect combustion inside every Sri Tech unit.</p>
            </div>
            
            <div className="hiw-grid">
              <div className="hiw-illustration">
                <div className="cutaway-diagram">
                  <img src="/rocket-stove.png" alt="Cutaway Diagram" className="cutaway-img" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; }} />
                  <div className="airflow-animated"></div>
                </div>
              </div>
              <div className="hiw-steps">
                <div className={`step-card ${activeStepIndex === 0 ? 'active' : ''}`} onClick={() => setActiveStepIndex(0)}>
                  <div className="step-number">01</div>
                  <div className="step-info">
                    <h4>Feed Wood</h4>
                    <p>Load biomass or wood easily from the top or side intake port.</p>
                  </div>
                </div>
                <div className={`step-card ${activeStepIndex === 1 ? 'active' : ''}`} onClick={() => setActiveStepIndex(1)}>
                  <div className="step-number">02</div>
                  <div className="step-info">
                    <h4>Airflow Ignites</h4>
                    <p>Oxygen is rapidly pulled through the bottom draft, creating a powerful draft.</p>
                  </div>
                </div>
                <div className={`step-card ${activeStepIndex === 2 ? 'active' : ''}`} onClick={() => setActiveStepIndex(2)}>
                  <div className="step-number">03</div>
                  <div className="step-info">
                    <h4>Heat Rises</h4>
                    <p>The insulated combustion chamber forces fire up, burning excess smoke gases.</p>
                  </div>
                </div>
                <div className={`step-card ${activeStepIndex === 3 ? 'active' : ''}`} onClick={() => setActiveStepIndex(3)}>
                  <div className="step-number">04</div>
                  <div className="step-info">
                    <h4>Efficient Cooking</h4>
                    <p>Concentrated high-velocity heat hits the cooking surface directly.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Meet Our Leadership Section */}
        <section id="leadership" className="leadership-section-dark">
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
            <div className="section-header-dark">
              <h2>Meet Our Leadership</h2>
              <p>The visionaries guiding Sri Tech Engineering toward sustainable precision manufacturing.</p>
            </div>
            
            <div className="leadership-grid">
              {/* Leader 1: Sankarganesh R */}
              <div className="leader-card glass-panel glow-border-orange animate-on-scroll">
                <div className="leader-header">
                  <div className="leader-meta">
                    <h3>Sankarganesh R</h3>
                    <strong className="leader-role">CEO & Founder</strong>
                    <span className="leader-edu">B.E (Mechanical Engineering), M.Tech (Energy Technology)</span>
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
              <div className="leader-card glass-panel glow-border-orange animate-on-scroll">
                <div className="leader-header">
                  <div className="leader-meta">
                    <h3>Ganga P</h3>
                    <strong className="leader-role">Managing Director</strong>
                    <span className="leader-edu">B.Com, M.Com (Corporate Governance)</span>
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
            <h2>Better for You. Better for Nature.</h2>
            <p>Designed to outlast the harshest environments while protecting the planet.</p>
          </div>
          
          {/* Infinite Horizontal Scroll Track */}
          <div className="benefits-marquee-container">
            <div className="benefits-marquee-track">
              {/* Set 1 */}
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-heart-pulse"></i></div>
                <h4>Healthier Cooking</h4>
                <p>Significantly reduces toxic smoke inhalation compared to traditional fires.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-piggy-bank"></i></div>
                <h4>Saves Money</h4>
                <p>Uses up to 80% less fuel, paying for itself in a matter of months.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-leaf"></i></div>
                <h4>Environment Friendly</h4>
                <p>Lower carbon footprint and reduced deforestation through massive efficiency.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-hammer"></i></div>
                <h4>Durable & Long Lasting</h4>
                <p>Industrial-grade materials built for intense continuous heat.</p>
              </div>

              {/* Set 2 (Duplicate for seamless infinite scrolling loop) */}
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-heart-pulse"></i></div>
                <h4>Healthier Cooking</h4>
                <p>Significantly reduces toxic smoke inhalation compared to traditional fires.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-piggy-bank"></i></div>
                <h4>Saves Money</h4>
                <p>Uses up to 80% less fuel, paying for itself in a matter of months.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-leaf"></i></div>
                <h4>Environment Friendly</h4>
                <p>Lower carbon footprint and reduced deforestation through massive efficiency.</p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon"><i className="fa-solid fa-hammer"></i></div>
                <h4>Durable & Long Lasting</h4>
                <p>Industrial-grade materials built for intense continuous heat.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Product Section */}
        <section id="product" className="products-section">
          <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center', borderBottom: 'none', marginBottom: '2.5rem' }}>
            <h2 className="wavy-title">
              <span>P</span><span>R</span><span>O</span><span>D</span><span>U</span><span>C</span><span>T</span><span>S</span>
            </h2>
          </div>

          <div className="products-filter-row">
            <div className="category-pill-container">
              <button 
                className={`category-pill ${selectedCategory === '' ? 'active' : ''}`} 
                onClick={() => handleCategoryChange('')}
              >
                ALL
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
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="products-search-input"
              />
            </div>
          </div>

          <div className="product-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(product => {
                const charSum = (product._id || product.id || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
                const rating = (4.1 + (charSum % 8) / 10).toFixed(1);
                const reviewsCount = 12 + (charSum % 340);
                
                const priceNum = parsePrice(product.price);
                const activeOffer = getActiveOfferForProduct(product);
                const activeCoupon = coupons.find(c => 
                  c.isActive && 
                  c.linkedProduct === (product._id || product.id) &&
                  (!c.expiryDate || new Date(c.expiryDate) > new Date())
                );
                let discountedPrice = priceNum;
                let discountText = '';

                if (activeOffer) {
                  if (activeOffer.discountType === 'fixed') {
                    discountedPrice = Math.max(0, priceNum - (Number(activeOffer.discountValue) || 0));
                    discountText = `₹${Number(activeOffer.discountValue) || 0} off`;
                  } else if (activeOffer.discountType === 'percentage') {
                    discountedPrice = Math.round(priceNum * (1 - (Number(activeOffer.discountValue) || 0) / 100));
                    discountText = `${Number(activeOffer.discountValue) || 0}% off`;
                  } else if (activeOffer.discountType === 'free-shipping') {
                    discountText = 'Free shipping';
                  }
                } else if (activeCoupon) {
                  const discountVal = parseFloat(activeCoupon.discountValue) || 0;
                  if (activeCoupon.discountType === 'Fixed') {
                    discountedPrice = Math.max(0, priceNum - discountVal);
                    discountText = `₹${discountVal} off`;
                  } else {
                    discountedPrice = Math.round(priceNum * (1 - discountVal / 100));
                    discountText = `${discountVal}% off`;
                  }
                }
                const displayPrice = discountedPrice || priceNum;

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
                          +{product.images.length - 1} photos
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
                        <span className="original-price">₹{priceNum.toLocaleString('en-IN')}</span>
                        <span className="discount">{discountText || '20% off'}</span>
                      </div>



                      <button 
                        className="primary-btn-green checkout-btn" 
                        style={{ width: '100%', marginTop: '1rem', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => handleBuyNow(product)}
                      >
                        <i className="fa-solid fa-bag-shopping"></i> Buy Now
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="empty-state glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
                <i className="fa-solid fa-boxes-packing" style={{ fontSize: '3rem', color: 'var(--primary-color)', opacity: 0.2, marginBottom: '1.5rem', display: 'block' }}></i>
                <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem' }}>Premium Products Coming Soon</h3>
                <p style={{ color: 'var(--text-muted)' }}>Our team is currently updating our sustainable technology collection. Please check back shortly.</p>
              </div>
            )}
          </div>
        </section>


          {/* Testimonials Section */}
          <section className="testimonials-section">
          <div className="section-header-dark">
            <h2>Trusted by Professionals</h2>
            <p>See what our early adopters are saying about the Sri Tech difference.</p>
          </div>
          
          <div className="testimonials-grid">
            <div className="testimonial-card glass-panel">
              <div className="stars"><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i></div>
              <p className="review-text">"The heat output is incredible. We use 80% less wood than our traditional open fire setup. Truly a game changer for our catering business."</p>
              <div className="reviewer">
                <div className="reviewer-avatar">RA</div>
                <div>
                  <h4>Rajesh A.</h4>
                  <p>Commercial Caterer</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card glass-panel">
              <div className="stars"><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i></div>
              <p className="review-text">"Zero smoke once it gets going. It's built like a tank and the stainless steel finish looks premium in our outdoor kitchen."</p>
              <div className="reviewer">
                <div className="reviewer-avatar">SM</div>
                <div>
                  <h4>Sarah M.</h4>
                  <p>Eco-Resort Owner</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card glass-panel">
              <div className="stars"><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star-half-stroke"></i></div>
              <p className="review-text">"I was skeptical about the fuel savings, but the airflow design is pure genius. Boiling water takes a fraction of the time now."</p>
              <div className="reviewer">
                <div className="reviewer-avatar">KV</div>
                <div>
                  <h4>Karthik V.</h4>
                  <p>Homestead Enthusiast</p>
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
  );
}

export default App;
