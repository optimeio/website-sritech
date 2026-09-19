import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import './ProductDetailPage.css';

export default function ProductDetailPage({
  product,
  products = [],
  selectedProductImageIndex = 0,
  setSelectedProductImageIndex,
  reviews = [],
  newReviewRating = 5,
  setNewReviewRating,
  newReviewComment = '',
  setNewReviewComment,
  onSubmitReview,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  waitlist = [],
  getProductFinalPrice,
  parsePrice,
  getProductRatingInfo,
  getProductSpecsInfo,
  getActiveOfferForProduct,
  coupons = [],
  isUserLoggedIn = false,
  onOpenAuthModal,
  onSelectProduct,
  t: propT
}) {
  const navigate = useNavigate();
  const { language, t: ctxT, translateKey, translateVal, translateCat } = useLanguage();
  const t = propT || ctxT;
  const [showMobileFloatingThumb, setShowMobileFloatingThumb] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCartWithAnim = () => {
    if (isAddingToCart) return;
    setIsAddingToCart(true);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 2200);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [product?._id, product?.id]);

  useEffect(() => {
    const rootEl = document.getElementById('root');
    const appWrapper = document.querySelector('.app-wrapper');
    if (rootEl) rootEl.style.overflowX = 'clip';
    if (appWrapper) appWrapper.style.overflowX = 'clip';
    document.body.style.overflowX = 'clip';
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth <= 960) {
        setShowMobileFloatingThumb(window.scrollY > 280);
      } else {
        setShowMobileFloatingThumb(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const currentProdId = (product?._id || product?.id)?.toString();
  const productCategory = product?.category || '';

  const relatedProducts = useMemo(() => {
    if (!product || !Array.isArray(products) || products.length === 0) return [];
    const otherProducts = products.filter(p => {
      const pId = (p._id || p.id)?.toString();
      return pId && pId !== currentProdId;
    });
    const currentCatSlug = (productCategory || '').toString().toLowerCase().trim().replace(/\s+/g, '-');
    const sameCategory = otherProducts.filter(p =>
      (p.category || '').toString().toLowerCase().trim().replace(/\s+/g, '-') === currentCatSlug
    );
    const diffCategory = otherProducts.filter(p =>
      (p.category || '').toString().toLowerCase().trim().replace(/\s+/g, '-') !== currentCatSlug
    );
    return [...sameCategory, ...diffCategory];
  }, [products, currentProdId, productCategory]);

  if (!product) {
    return (
      <div className="product-page-container product-page-loading">
        <div className="product-page-loading-card">
          <i className="fa-solid fa-spinner fa-spin product-loading-icon"></i>
          <h3>{t('productDetail.loadingTitle', 'Loading Product Details...')}</h3>
          <p>{t('productDetail.loadingSubtitle', 'Finding the perfect eco-efficient stove for you.')}</p>
          <button className="product-page-back-btn" onClick={() => navigate('/')}>
            <i className="fa-solid fa-arrow-left"></i> {t('productDetail.backToProducts', 'Back to Products')}
          </button>
        </div>
      </div>
    );
  }

  const ratingInfo = getProductRatingInfo ? getProductRatingInfo(product) : { rating: '4.7', count: 290 };
  const specsInfo = getProductSpecsInfo ? getProductSpecsInfo(product) : {};
  const priceNum = parsePrice ? parsePrice(product.price) : Number(product.price || 0);
  const activeOffer = getActiveOfferForProduct ? getActiveOfferForProduct(product) : null;
  const activeCoupon = Array.isArray(coupons)
    ? coupons.find(c =>
        c.isActive &&
        c.linkedProduct === (product._id || product.id) &&
        (!c.expiryDate || new Date(c.expiryDate) > new Date())
      )
    : null;

  const prodDiscountPercent = Number(product.discountPercent || product.discount) || 0;
  const prodOrigPrice = Number(product.originalPrice || product.mrp) || 0;
  let discountedPrice = null;
  let discountText = '';
  let originalPrice = null;

  if (activeOffer) {
    if (activeOffer.discountType === 'fixed') {
      originalPrice = prodOrigPrice > priceNum ? prodOrigPrice : priceNum;
      discountedPrice = Math.max(0, priceNum - (Number(activeOffer.discountValue) || 0));
      discountText = `₹${Number(activeOffer.discountValue) || 0} off`;
    } else if (activeOffer.discountType === 'percentage') {
      const dVal = Number(activeOffer.discountValue) || 0;
      originalPrice = prodOrigPrice > priceNum ? prodOrigPrice : priceNum;
      discountedPrice = Math.round(priceNum * (1 - dVal / 100));
      discountText = `${dVal}% off`;
    }
  } else if (activeCoupon) {
    const discountVal = parseFloat(activeCoupon.discountValue) || 0;
    if (activeCoupon.discountType === 'Fixed') {
      originalPrice = prodOrigPrice > priceNum ? prodOrigPrice : priceNum;
      discountedPrice = Math.max(0, priceNum - discountVal);
      discountText = `₹${discountVal} off`;
    } else {
      originalPrice = prodOrigPrice > priceNum ? prodOrigPrice : priceNum;
      discountedPrice = Math.round(priceNum * (1 - discountVal / 100));
      discountText = `${discountVal}% off`;
    }
  } else if (prodOrigPrice > priceNum) {
    originalPrice = prodOrigPrice;
    discountedPrice = priceNum;
    const pct = prodDiscountPercent > 0 ? prodDiscountPercent : Math.round(((prodOrigPrice - priceNum) / prodOrigPrice) * 100);
    if (pct > 0) discountText = `${pct}% off`;
  } else if (prodDiscountPercent > 0) {
    originalPrice = Math.round(priceNum / (1 - prodDiscountPercent / 100));
    discountedPrice = priceNum;
    discountText = `${prodDiscountPercent}% off`;
  } else {
    originalPrice = Math.round(priceNum * 1.18);
    discountText = '15% off';
  }

  const displayPrice = discountedPrice !== null ? discountedPrice : (getProductFinalPrice ? getProductFinalPrice(product) : priceNum);
  const saveAmount = originalPrice && originalPrice > displayPrice ? (originalPrice - displayPrice) : 0;
  const isWishlisted = waitlist.includes(product._id || product.id);
  const totalMediaCount = (product.images?.length || 0) + (product.video ? 1 : 0);

  const rawCategory = ((product.category || '').toString().includes('-')
    ? product.category
    : (product.category || 'Stoves').toString().toLowerCase().replace(/\s+/g, '-'))
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const categoryName = translateCat ? translateCat(rawCategory) : rawCategory;

  return (
    <div className="product-page-wrapper">

      {/* Mobile Floating Thumbnail */}
      <div
        className={`mobile-floating-product-thumb ${showMobileFloatingThumb ? 'visible' : ''}`}
        onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        title="Tap to scroll to top"
        aria-label="Product thumbnail, tap to return to gallery"
      >
        {product.images && product.images.length > 0 ? (
          <img src={product.images[selectedProductImageIndex] || product.images[0]} alt={product.name} className="mobile-floating-thumb-img" />
        ) : (
          <i className={`fa-solid ${product.icon || 'fa-box'} mobile-floating-thumb-icon`} aria-hidden="true"></i>
        )}
        <span className="mobile-floating-thumb-badge" aria-hidden="true"><i className="fa-solid fa-arrow-up"></i></span>
      </div>

      {/* Breadcrumb Bar */}
      <div className="product-page-breadcrumb-bar">
        <div className="product-page-container">
          <nav className="breadcrumb-nav" aria-label="Breadcrumb">
            <Link to="/" className="breadcrumb-link"><i className="fa-solid fa-house"></i> {t('productDetail.home', 'Home')}</Link>
            <span className="breadcrumb-separator"><i className="fa-solid fa-chevron-right"></i></span>
            <Link to="/#product" className="breadcrumb-link">{categoryName}</Link>
            <span className="breadcrumb-separator"><i className="fa-solid fa-chevron-right"></i></span>
            <span className="breadcrumb-current">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Showcase: Sticky Image on Left, Scrollable Content on Right */}
      <div className="product-page-container">
        <div className="product-main-showcase">

          {/* LEFT: Sticky Media Column */}
          <div className="product-media-column">
            <div className="product-main-media-card">
              {product.video && selectedProductImageIndex === (product.images?.length || 0) ? (
                product.video.includes('youtube.com') || product.video.includes('youtu.be') ? (
                  (() => {
                    let embedId = '';
                    if (product.video.includes('youtube.com/watch?v=')) embedId = product.video.split('watch?v=')[1]?.split('&')[0];
                    else if (product.video.includes('youtu.be/')) embedId = product.video.split('youtu.be/')[1]?.split('?')[0];
                    else if (product.video.includes('youtube.com/embed/')) embedId = product.video.split('embed/')[1]?.split('?')[0];
                    return (
                      <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${embedId}?autoplay=1`} title="Product Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="product-media-frame" />
                    );
                  })()
                ) : product.video.includes('vimeo.com') ? (
                  (() => {
                    const vimeoId = product.video.split('vimeo.com/')[1]?.split('?')[0];
                    return (
                      <iframe src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1`} width="100%" height="100%" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="product-media-frame" />
                    );
                  })()
                ) : (
                  <video src={product.video} controls autoPlay className="product-media-video" />
                )
              ) : product.images && product.images.length > 0 ? (
                <img fetchPriority="high" src={product.images[selectedProductImageIndex] || product.images[0]} alt={product.name} className="product-media-img" />
              ) : (
                <i className={`fa-solid ${product.icon || 'fa-box'} product-media-placeholder`} aria-hidden="true"></i>
              )}
              {totalMediaCount > 1 && (
                <>
                  <button className="product-slider-arrow prev" onClick={() => setSelectedProductImageIndex(prev => (prev === 0 ? totalMediaCount - 1 : prev - 1))} aria-label="Previous image"><i className="fa-solid fa-chevron-left"></i></button>
                  <button className="product-slider-arrow next" onClick={() => setSelectedProductImageIndex(prev => (prev === totalMediaCount - 1 ? 0 : prev + 1))} aria-label="Next image"><i className="fa-solid fa-chevron-right"></i></button>
                </>
              )}
              <button className={`product-floating-wishlist ${isWishlisted ? 'active' : ''}`} onClick={() => onToggleWishlist && onToggleWishlist(product._id || product.id)} aria-label="Toggle wishlist" title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
                <i className={`fa-${isWishlisted ? 'solid' : 'regular'} fa-heart`}></i>
              </button>
            </div>
            {totalMediaCount > 1 && (
              <div className="product-thumbnails-strip">
                {product.images && product.images.map((img, idx) => (
                  <button key={idx} className={`product-thumb-item ${selectedProductImageIndex === idx ? 'active' : ''}`} onClick={() => setSelectedProductImageIndex(idx)} aria-label={`Thumbnail ${idx + 1}`}>
                    <img loading="lazy" src={img} alt={`${product.name} thumb ${idx + 1}`} />
                  </button>
                ))}
                {product.video && (
                  <button className={`product-thumb-item video-thumb ${selectedProductImageIndex === product.images.length ? 'active' : ''}`} onClick={() => setSelectedProductImageIndex(product.images.length)} aria-label="Video thumbnail">
                    <div className="video-thumb-overlay"><i className="fa-solid fa-play"></i></div>
                  </button>
                )}
              </div>
            )}
          </div>
          {/* END LEFT: Sticky Media Column */}

          {/* RIGHT: Scrollable Product Details, Specs, Usages, How to Use, CTAs, Trust Badges */}
          <div className="product-info-column">

            {/* Badge Row */}
            <div className="product-badge-row">
              <span className="product-category-tag"><i className="fa-solid fa-fire-burner"></i> {categoryName}</span>
              <span className="product-stock-pill in-stock"><span className="stock-dot"></span>{t('productDetail.inStockUnits', 'In stock: 10')}</span>
            </div>

            {/* Title */}
            <h1 className="product-page-title">{product.name}</h1>

            {/* Rating & Verified Purchase */}
            <div className="product-rating-verified-row">
              <span className="product-rating-badge">{ratingInfo.rating} <i className="fa-solid fa-star"></i></span>
              <span className="product-rating-count-text">{ratingInfo.count} {t('productDetail.ratingsAndReviews', 'Ratings & 97 Reviews')}</span>
              <span className="rating-dot-separator">•</span>
              <span className="product-verified-badge"><i className="fa-solid fa-circle-check"></i> {t('productDetail.verifiedPurchase', 'Verified Purchase')}</span>
            </div>

            {/* Pricing Card */}
            <div className="product-pricing-card">
              <div className="price-values-group">
                <span className="price-main-tag">₹{displayPrice.toLocaleString('en-IN')}</span>
                {originalPrice && originalPrice > displayPrice && (
                  <span className="price-mrp-strikethrough">
                    <span className="mrp-label">M.R.P.: </span>
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {discountText && (
                  <span className="price-discount-pill ecom-offer-badge"><i className="fa-solid fa-tag"></i> {discountText}</span>
                )}
              </div>
              {saveAmount > 0 && (
                <div className="product-save-highlight ecom-save-pill">
                  <span className="save-accent-dot"></span>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>{t('productDetail.youSave', 'You Save')} ₹{saveAmount.toLocaleString('en-IN')}</span>
                  <span className="save-order-text">{t('productDetail.onThisOrder', 'on this order')}</span>
                </div>
              )}
              <div className="product-stock-inline-status">
                <span className="stock-in-text">{t('productDetail.inStockLabel', 'In stock: 10')}</span>
              </div>
            </div>

            {/* 4 Specifications Cards in 2x2 Grid */}
            <div className="product-spec-grid-wrapper">
              <div className="spec-card">
                <div className="spec-icon-wrap burner"><i className="fa-solid fa-fire-burner"></i></div>
                <div className="spec-info"><span className="spec-label">{t('productDetail.burnerSize', 'Burner Size')}</span><strong className="spec-value">{translateVal ? translateVal(specsInfo.burnerSize || '8 × 8 Inches & 10 × 10 Inches') : (specsInfo.burnerSize || '8 × 8 Inches & 10 × 10 Inches')}</strong></div>
              </div>
              <div className="spec-card">
                <div className="spec-icon-wrap weight"><i className="fa-solid fa-weight-hanging"></i></div>
                <div className="spec-info"><span className="spec-label">{t('productDetail.stoveWeight', 'Stove Weight')}</span><strong className="spec-value">{translateVal ? translateVal(specsInfo.stoveWeight || 'Up to 40 kg (40 - 75 Persons)') : (specsInfo.stoveWeight || 'Up to 40 kg (40 - 75 Persons)')}</strong></div>
              </div>
              <div className="spec-card">
                <div className="spec-icon-wrap dimensions"><i className="fa-solid fa-ruler-combined"></i></div>
                <div className="spec-info"><span className="spec-label">{t('productDetail.dimensions', 'Dimensions')}</span><strong className="spec-value">{translateVal ? translateVal(specsInfo.dimensions || '36×16×16') : (specsInfo.dimensions || '36×16×16')}</strong></div>
              </div>
              <div className="spec-card">
                <div className="spec-icon-wrap material"><i className="fa-solid fa-cubes"></i></div>
                <div className="spec-info"><span className="spec-label">{t('productDetail.material', 'Material')}</span><strong className="spec-value">{translateVal ? translateVal(specsInfo.material || 'Mild Steel (MS)') : (specsInfo.material || 'Mild Steel (MS)')}</strong></div>
              </div>
            </div>

            {/* Usages & Features */}
            <div className="product-content-box usages-box">
              <h3 className="content-box-title"><i className="fa-solid fa-layer-group"></i> {t('productDetail.usagesAndFeatures', 'Usages & Features')}</h3>
              {specsInfo.usagePairs && specsInfo.usagePairs.length > 0 ? (
                <div className="usage-pairs-list">
                  {specsInfo.usagePairs.map((pair, pIdx) => (
                    <div key={pIdx} className="usage-pair-item">
                      <span className="usage-pair-key">{translateKey ? translateKey(pair.key) : pair.key}</span>
                      <span className="usage-pair-val">{translateVal ? translateVal(pair.val) : pair.val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="usage-pairs-list">
                  <div className="usage-pair-item">
                    <span className="usage-pair-key">{t('productDetail.usageKey', 'USAGE')}</span>
                    <span className="usage-pair-val">{specsInfo.rawDescription || 'Crafted for Temples, Hotels, Restaurants, Bakeries, Cafes, Tea Shops, Catering Services, Cloud Kitchens, Street Food Businesses, and Every Professional Kitchen.'}</span>
                  </div>
                  <div className="usage-pair-item">
                    <span className="usage-pair-key">{t('productDetail.fuelTypeKey', 'FUEL TYPE')}</span>
                    <span className="usage-pair-val">{t('productDetail.fuelTypeVal', 'Wood, Coconut shell & husk, Charcoal & Biomass')}</span>
                  </div>
                  <div className="usage-pair-item">
                    <span className="usage-pair-key">{t('productDetail.cookingSurfaceKey', 'COOKING SURFACE')}</span>
                    <span className="usage-pair-val">{t('productDetail.cookingSurfaceVal', 'Flat')}</span>
                  </div>
                  <div className="usage-pair-item">
                    <span className="usage-pair-key">{t('productDetail.cookingCapacityKey', 'COOKING CAPACITY')}</span>
                    <span className="usage-pair-val">{t('productDetail.cookingCapacityVal', 'Up to 90 kg (150 - 300+ Persons / Mega Commercial & Temples)')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* How to Use */}
            <div className="product-content-box how-to-use-box">
              <h3 className="content-box-title"><i className="fa-solid fa-circle-info"></i> {t('productDetail.howToUse', 'How to Use')}</h3>
              <div className="how-to-use-steps-text">
                <p>1. {t('productDetail.step1', 'Place stove on a stable, non-combustible surface.')}</p>
                <p>2. {t('productDetail.step2', 'Fill combustion chamber with fuel (wood, coconut shell, husk or biomass).')}</p>
                <p>3. {t('productDetail.step3', 'Connect & switch on air regulator blower for clean combustion.')}</p>
                <p>4. {t('productDetail.step4', 'Light fuel from top/side port and adjust fan speed for flame intensity.')}</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="product-cta-buttons-row">
              <button className="btn-product-buynow" onClick={() => onBuyNow && onBuyNow(product)}>
                <i className="fa-solid fa-bolt-lightning buy-bolt-icon"></i> {t('productDetail.buyNow', 'BUY NOW')}
              </button>
              <button 
                type="button"
                className={`btn-product-addcart ${isAddingToCart ? 'animating-cart' : ''}`} 
                onClick={handleAddToCartWithAnim}
                disabled={isAddingToCart}
                aria-label={isAddingToCart ? t('productDetail.addedToCart', 'Added to Cart!') : t('productDetail.addToCart', 'ADD TO CART')}
              >
                {/* Default label shown when unhovered */}
                <span className="addcart-default-label">
                  <i className="fa-solid fa-cart-shopping default-cart-icon"></i>
                  <span>{t('productDetail.addToCart', 'ADD TO CART')}</span>
                </span>

                {/* Animated Cart Tray Track: only shows centered on hover, catches parcel, drives full right */}
                <div className="cart-anim-track" aria-hidden="true">
                  {/* Dropping product parcel */}
                  <span className="cart-dropping-product">
                    <i className="fa-solid fa-box"></i>
                  </span>
                  {/* Cart Tray */}
                  <span className="cart-tray">
                    <i className="fa-solid fa-cart-shopping"></i>
                  </span>
                </div>

                {/* Generated reveal text: unrolls from left to right as tray moves */}
                <div className="addcart-reveal-container" aria-live="polite">
                  <span className="reveal-check"><i className="fa-solid fa-circle-check"></i></span>
                  <span className="reveal-words">{t('productDetail.addedToCart', 'ADDED TO CART!')}</span>
                </div>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="product-trust-banner">
              <div className="trust-badge-item">
                <div className="trust-badge-icon"><i className="fa-solid fa-truck-fast"></i></div>
                <div className="trust-badge-text">
                  <strong>{t('productDetail.secureDelivery', 'Secure Delivery')}</strong>
                  <span>{t('productDetail.insuredTransit', 'Insured Transit Across India')}</span>
                </div>
              </div>
              <div className="trust-badge-item">
                <div className="trust-badge-icon"><i className="fa-solid fa-shield-halved"></i></div>
                <div className="trust-badge-text">
                  <strong>{t('productDetail.secureCheckout', '100% Secure Checkout')}</strong>
                  <span>{t('productDetail.razorpayGateway', 'Direct Razorpay Payment')}</span>
                </div>
              </div>
              <div className="trust-badge-item">
                <div className="trust-badge-icon"><i className="fa-solid fa-rotate-left"></i></div>
                <div className="trust-badge-text">
                  <strong>{t('productDetail.guarantee', 'SriTech Guarantee')}</strong>
                  <span>{t('productDetail.qualitySupport', 'Certified Quality Support')}</span>
                </div>
              </div>
              <div className="trust-badge-item">
                <div className="trust-badge-icon"><i className="fa-solid fa-award"></i></div>
                <div className="trust-badge-text">
                  <strong>{t('productDetail.heavyDuty', 'Heavy-Duty MS')}</strong>
                  <span>{t('productDetail.flameResistant', 'Flame-Resistant Build')}</span>
                </div>
              </div>
            </div>

          </div>
          {/* END RIGHT: Product Info */}

        </div>
      </div>

      {/* FULL-WIDTH SECTION: Customer Reviews (Below Showcase) */}
      <div className="product-page-container">
        <section className="product-reviews-container">
          <h2 className="reviews-main-title">{t('productDetail.customerReviews', 'Customer Reviews')}</h2>

          <div className="reviews-columns-grid">
            {/* Left Column: Customer Reviews / Friendly No Reviews Box */}
            <div className="reviews-list-col">
              {reviews && reviews.length > 0 ? (
                <div className="reviews-cards-stack">
                  {reviews.map((rev, index) => (
                    <div key={rev._id || index} className="customer-review-card">
                      <div className="review-card-top">
                        <div className="reviewer-info">
                          <div className="reviewer-avatar">{(rev.customerName || 'Customer').charAt(0).toUpperCase()}</div>
                          <div>
                            <strong className="reviewer-name">{rev.customerName}</strong>
                            <span className="review-verified-tag"><i className="fa-solid fa-circle-check"></i> {t('productDetail.verifiedBuyer', 'Verified Buyer')}</span>
                          </div>
                        </div>
                        <span className="review-date">{new Date(rev.createdAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="review-stars-row">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <i key={i} className={`${i < rev.rating ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
                        ))}
                      </div>
                      <p className="review-body-text">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-reviews-box">
                  <i className="fa-regular fa-comment-dots"></i>
                  <h4>{t('productDetail.noReviewsYet', 'No customer reviews yet')}</h4>
                  <p>{t('productDetail.firstReviewPrompt', 'Be the first verified customer to share your cooking experience with this model.')}</p>
                </div>
              )}
            </div>

            {/* Right Column: Share Your Experience Card */}
            <div className="review-form-col">
              <div className="write-review-card">
                <h3>{t('productDetail.shareExperience', 'Share Your Experience')}</h3>
                <p>{t('productDetail.sharePrompt', 'You can rate this product below.')}</p>

                {isUserLoggedIn ? (
                  <form onSubmit={onSubmitReview} className="review-form">
                    <div className="form-rating-group">
                      <label>{t('productDetail.yourRating', 'Your Rating')}</label>
                      <div className="star-rating-selector">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button type="button" key={star} className={`star-select-btn ${star <= newReviewRating ? 'active' : ''}`} onClick={() => setNewReviewRating && setNewReviewRating(star)} aria-label={`${star} star`}>
                            <i className="fa-solid fa-star"></i>
                          </button>
                        ))}
                        <span className="star-rating-label">{newReviewRating} {t('productDetail.outOf5Stars', 'out of 5 Stars')}</span>
                      </div>
                    </div>
                    <div className="form-comment-group">
                      <label htmlFor="reviewCommentInput">{t('productDetail.yourFeedback', 'Your Feedback')}</label>
                      <textarea id="reviewCommentInput" rows="4" placeholder={t('productDetail.reviewPlaceholder', 'Write your review here...')} required value={newReviewComment} onChange={(e) => setNewReviewComment && setNewReviewComment(e.target.value)} />
                    </div>
                    <button type="submit" className="submit-review-cta"><i className="fa-solid fa-paper-plane"></i> {t('productDetail.submitReview', 'Submit Verified Review')}</button>
                  </form>
                ) : (
                  <div className="login-to-review-prompt">
                    <i className="fa-solid fa-lock"></i>
                    <p>{t('productDetail.loginToReview', 'Please log in to submit a verified customer review.')}</p>
                    <button type="button" className="review-login-btn" onClick={() => onOpenAuthModal && onOpenAuthModal()}>{t('productDetail.loginToWriteReview', 'Login to Write Review')}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FULL-WIDTH SECTION: Related Products & Catalog Recommendations */}
      {relatedProducts.length > 0 && (
        <div className="product-page-container">
          <section className="product-page-related-section">
            <div className="related-section-header">
              <div>
                <span className="related-section-badge"><i className="fa-solid fa-fire"></i> {t('productDetail.catalogBadge', 'SriTech Catalog')}</span>
                <h2 className="related-section-title">{t('productDetail.relatedProducts', 'Related Products & Recommendations')}</h2>
                <p className="related-section-subtitle">{t('productDetail.relatedSubtitle', 'Discover more high-efficiency rocket stoves and eco-friendly kitchen machineries')}</p>
              </div>
            </div>
            <div className="related-products-grid">
              {relatedProducts.map((relProduct, relIdx) => {
                const relRatingInfo = getProductRatingInfo ? getProductRatingInfo(relProduct) : { rating: '4.7', count: 120 };
                const relPriceNum = parsePrice ? parsePrice(relProduct.price) : Number(relProduct.price || 0);
                const relActiveOffer = getActiveOfferForProduct ? getActiveOfferForProduct(relProduct) : null;
                const relActiveCoupon = Array.isArray(coupons)
                  ? coupons.find(c =>
                      c.isActive &&
                      c.linkedProduct === (relProduct._id || relProduct.id) &&
                      (!c.expiryDate || new Date(c.expiryDate) > new Date())
                    )
                  : null;

                const relProdDiscountPercent = Number(relProduct.discountPercent || relProduct.discount) || 0;
                const relProdOrigPrice = Number(relProduct.originalPrice || relProduct.mrp) || 0;
                let relDiscountedPrice = null;
                let relDiscountText = '';
                let relOriginalPrice = null;

                if (relActiveOffer) {
                  if (relActiveOffer.discountType === 'fixed') {
                    relOriginalPrice = relProdOrigPrice > relPriceNum ? relProdOrigPrice : relPriceNum;
                    relDiscountedPrice = Math.max(0, relPriceNum - (Number(relActiveOffer.discountValue) || 0));
                    relDiscountText = `₹${Number(relActiveOffer.discountValue) || 0} off`;
                  } else if (relActiveOffer.discountType === 'percentage') {
                    const dVal = Number(relActiveOffer.discountValue) || 0;
                    relOriginalPrice = relProdOrigPrice > relPriceNum ? relProdOrigPrice : relPriceNum;
                    relDiscountedPrice = Math.round(relPriceNum * (1 - dVal / 100));
                    relDiscountText = `${dVal}% off`;
                  }
                } else if (relActiveCoupon) {
                  const discountVal = parseFloat(relActiveCoupon.discountValue) || 0;
                  if (relActiveCoupon.discountType === 'Fixed') {
                    relOriginalPrice = relProdOrigPrice > relPriceNum ? relProdOrigPrice : relPriceNum;
                    relDiscountedPrice = Math.max(0, relPriceNum - discountVal);
                    relDiscountText = `₹${discountVal} off`;
                  } else {
                    relOriginalPrice = relProdOrigPrice > relPriceNum ? relProdOrigPrice : relPriceNum;
                    relDiscountedPrice = Math.round(relPriceNum * (1 - discountVal / 100));
                    relDiscountText = `${discountVal}% off`;
                  }
                } else if (relProdOrigPrice > relPriceNum) {
                  relOriginalPrice = relProdOrigPrice;
                  relDiscountedPrice = relPriceNum;
                  const pct = relProdDiscountPercent > 0 ? relProdDiscountPercent : Math.round(((relProdOrigPrice - relPriceNum) / relProdOrigPrice) * 100);
                  if (pct > 0) relDiscountText = `${pct}% off`;
                } else if (relProdDiscountPercent > 0) {
                  relOriginalPrice = Math.round(relPriceNum / (1 - relProdDiscountPercent / 100));
                  relDiscountedPrice = relPriceNum;
                  relDiscountText = `${relProdDiscountPercent}% off`;
                } else {
                  relOriginalPrice = Math.round(relPriceNum * 1.18);
                  relDiscountText = '15% off';
                }

                const relDisplayPrice = relDiscountedPrice !== null ? relDiscountedPrice : (getProductFinalPrice ? getProductFinalPrice(relProduct) : relPriceNum);
                const relSaveAmount = relOriginalPrice && relOriginalPrice > relDisplayPrice ? (relOriginalPrice - relDisplayPrice) : 0;
                const relEffectiveDiscountPercent = relOriginalPrice && relOriginalPrice > relDisplayPrice
                  ? Math.round(((relOriginalPrice - relDisplayPrice) / relOriginalPrice) * 100)
                  : 0;

                const rawRelCat = ((relProduct.category || '').toString().includes('-') ? relProduct.category : (relProduct.category || 'Stoves').toString().toLowerCase().replace(/\s+/g, '-')).replace(/-/g, ' ');
                const relCategory = translateCat ? translateCat(rawRelCat) : rawRelCat;
                return (
                  <article key={relProduct._id || relProduct.id} className="related-product-card" onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }); if (onSelectProduct) onSelectProduct(relProduct); }}>
                    <div className="rel-card-image-box">
                      {relIdx % 2 === 0 ? (
                        <span className="rel-card-badge best-seller"><i className="fa-solid fa-fire"></i> {t('products.bestSeller', 'Best Seller')}</span>
                      ) : (
                        <span className="rel-card-badge top-rated"><i className="fa-solid fa-star"></i> {t('products.popular', 'Top Rated')}</span>
                      )}
                      {relProduct.images && relProduct.images.length > 0 ? (<img loading="lazy" src={relProduct.images[0]} alt={relProduct.name} className="rel-card-img" />) : (<div className="rel-card-placeholder"><i className={`fa-solid ${relProduct.icon || 'fa-box'}`}></i></div>)}
                      <div className="rel-card-hover-overlay"><span className="view-product-cta">{t('productDetail.viewDetails', 'View Details')} <i className="fa-solid fa-arrow-right"></i></span></div>
                    </div>
                    <div className="rel-card-body">
                      <span className="rel-card-category">{relCategory}</span>
                      <h4 className="rel-card-title" title={relProduct.name}>{relProduct.name}</h4>
                      <div className="rel-card-rating-line"><span className="rel-rating-badge">{relRatingInfo.rating} <i className="fa-solid fa-star"></i></span><span className="rel-rating-count">({relRatingInfo.count})</span></div>
                      <div className="rel-card-pricing-block">
                        <div className="rel-card-price-line">
                          <strong className="rel-price-now">₹{relDisplayPrice.toLocaleString('en-IN')}</strong>
                          {relOriginalPrice && relOriginalPrice > relDisplayPrice && (
                            <span className="rel-price-mrp">
                              <span className="mrp-label">M.R.P.: </span>
                              ₹{relOriginalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                          {relDiscountText && (
                            <span className="rel-discount-badge">{relDiscountText}</span>
                          )}
                        </div>
                        {relSaveAmount > 0 ? (
                          <div className="rel-save-pill">
                            <span className="save-accent-dot"></span>
                            <span>Save ₹{relSaveAmount.toLocaleString('en-IN')}</span>
                          </div>
                        ) : (
                          <div className="rel-save-placeholder"></div>
                        )}
                      </div>
                      <button type="button" className="rel-card-buy-btn" onClick={(e) => { e.stopPropagation(); if (onBuyNow) onBuyNow(relProduct); }}><i className="fa-solid fa-bolt-lightning buy-bolt-icon"></i> {t('productDetail.buyNow', 'Buy Now')}</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
