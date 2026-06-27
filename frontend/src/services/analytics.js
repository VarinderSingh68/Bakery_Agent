// Enhanced Analytics with Multiple Backend Support
import API_URL from '../lib/api';

class Analytics {
  constructor() {
    this.events = [];
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStart = Date.now();
    this.pageLoadTime = null;
    this.interactions = [];
    
    // Initialize Google Analytics if available
    this.initGoogleAnalytics();
    
    // Start session recording
    this.initSessionRecording();
    
    // Initialize predictive model
    this.userProfile = this.loadUserProfile();
    
    // Track page performance
    this.trackPagePerformance();
  }

  getOrCreateSessionId() {
    try {
      let sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
      }
      return sessionId;
    } catch (error) {
      return `session_fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // Google Analytics Integration
  initGoogleAnalytics() {
    // Check if gtag is available (loaded via script tag in index.html)
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      this.gaEnabled = true;
      console.log('✓ Google Analytics initialized');
    } else {
      this.gaEnabled = false;
      console.log('ℹ Google Analytics not configured (add GA tracking ID to use)');
    }
  }

  sendToGoogleAnalytics(eventName, parameters) {
    if (this.gaEnabled && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  }

  // Custom Backend Integration
  async sendToBackend(event) {
    try {
      // In production, send to your analytics backend
      const response = await fetch(`${API_URL}/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      
      if (!response.ok) {
        console.warn('Analytics backend unavailable, storing locally');
      }
    } catch (error) {
      // Silently fail - analytics should never break the app
      console.debug('Analytics:', error.message);
    }
  }

  // Session Recording for Heatmaps
  initSessionRecording() {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      this.mouseMovements = [];
      this.clicks = [];
      this.scrollDepth = 0;
      return;
    }

    this.mouseMovements = [];
    this.clicks = [];
    this.scrollDepth = 0;
    
    // Track mouse movements (sampled every 100ms)
    let lastTrack = 0;
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastTrack > 100) {
        this.mouseMovements.push({
          x: e.clientX,
          y: e.clientY,
          timestamp: now - this.sessionStart
        });
        lastTrack = now;
        
        // Keep only last 1000 movements
        if (this.mouseMovements.length > 1000) {
          this.mouseMovements.shift();
        }
      }
    });
    
    // Track clicks
    document.addEventListener('click', (e) => {
      this.clicks.push({
        x: e.clientX,
        y: e.clientY,
        target: e.target.tagName,
        className: e.target.className,
        timestamp: Date.now() - this.sessionStart
      });
      
      // Keep only last 200 clicks
      if (this.clicks.length > 200) {
        this.clicks.shift();
      }
    });
    
    // Track scroll depth
    document.addEventListener('scroll', () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      this.scrollDepth = Math.max(this.scrollDepth, scrollPercent);
    });
  }

  // Track page performance metrics
  trackPagePerformance() {
    if (typeof window !== 'undefined' && window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
          this.pageLoadTime = pageLoadTime;
          
          this.track('page_performance', {
            loadTime: pageLoadTime,
            domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
            firstPaint: timing.responseEnd - timing.fetchStart
          });
        }, 0);
      });
    }
  }

  // User Profile for Predictive Analytics
  loadUserProfile() {
    try {
      const stored = localStorage.getItem('user_profile');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      // Ignore storage and parse errors
    }
    
    return {
      totalSessions: 0,
      totalPageViews: 0,
      productsViewed: [],
      categoriesInterested: {},
      avgSessionDuration: 0,
      cartAbandonments: 0,
      purchases: 0,
      avgOrderValue: 0,
      lastVisit: null,
      purchaseIntent: 0 // 0-100 score
    };
  }

  saveUserProfile() {
    try {
      localStorage.setItem('user_profile', JSON.stringify(this.userProfile));
    } catch (error) {
      // Ignore storage errors
    }
  }

  // Calculate Purchase Intent Score (0-100)
  calculatePurchaseIntent() {
    let score = 0;
    
    // Recent visits boost score
    if (this.userProfile.lastVisit) {
      const daysSinceVisit = (Date.now() - new Date(this.userProfile.lastVisit)) / (1000 * 60 * 60 * 24);
      if (daysSinceVisit < 1) score += 30;
      else if (daysSinceVisit < 3) score += 20;
      else if (daysSinceVisit < 7) score += 10;
    }
    
    // Products viewed
    if (this.userProfile.productsViewed.length > 5) score += 20;
    else if (this.userProfile.productsViewed.length > 2) score += 10;
    
    // Cart activity
    const cartEvents = this.events.filter(e => e.event === 'add_to_cart').length;
    if (cartEvents > 0) score += 25;
    
    // Wishlist activity
    const wishlistEvents = this.events.filter(e => e.event === 'add_to_wishlist').length;
    if (wishlistEvents > 0) score += 15;
    
    // Previous purchases
    if (this.userProfile.purchases > 0) score += 20;
    
    // Cart abandonments reduce score
    if (this.userProfile.cartAbandonments > 2) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  // Main tracking function
  track(eventName, properties = {}) {
    const event = {
      event: eventName,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.pathname : '/',
      ...properties
    };

    this.events.push(event);
    
    // Store in localStorage
    try {
      const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      storedEvents.push(event);
      localStorage.setItem('analytics_events', JSON.stringify(storedEvents.slice(-200)));
    } catch (error) {
      // Ignore storage and parse errors
    }

    // Send to backends
    this.sendToGoogleAnalytics(eventName, properties);
    this.sendToBackend(event);

    // Update user profile
    this.updateUserProfile(eventName, properties);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics:', eventName, properties);
    }
  }

  updateUserProfile(eventName, properties) {
    this.userProfile.totalPageViews++;
    this.userProfile.lastVisit = new Date().toISOString();
    
    if (eventName === 'product_view' && properties.productId) {
      if (!this.userProfile.productsViewed.includes(properties.productId)) {
        this.userProfile.productsViewed.push(properties.productId);
      }
      
      // Track category interest
      if (properties.category) {
        this.userProfile.categoriesInterested[properties.category] = 
          (this.userProfile.categoriesInterested[properties.category] || 0) + 1;
      }
    }
    
    if (eventName === 'purchase') {
      this.userProfile.purchases++;
      if (properties.orderTotal) {
        this.userProfile.avgOrderValue = 
          ((this.userProfile.avgOrderValue * (this.userProfile.purchases - 1)) + properties.orderTotal) / 
          this.userProfile.purchases;
      }
    }
    
    // Update purchase intent
    this.userProfile.purchaseIntent = this.calculatePurchaseIntent();
    
    this.saveUserProfile();
  }

  // E-commerce tracking
  pageView(pageName) {
    this.track('page_view', { page: pageName });
  }

  productView(productId, productName, price, category) {
    this.track('product_view', { productId, productName, price, category });
  }

  addToCart(productId, productName, price, quantity) {
    this.track('add_to_cart', { productId, productName, price, quantity, value: price * quantity });
    this.sendToGoogleAnalytics('add_to_cart', {
      currency: 'INR',
      value: price * quantity,
      items: [{ item_id: productId, item_name: productName, price, quantity }]
    });
  }

  removeFromCart(productId, productName) {
    this.track('remove_from_cart', { productId, productName });
  }

  addToWishlist(productId, productName, price) {
    this.track('add_to_wishlist', { productId, productName, price });
    this.sendToGoogleAnalytics('add_to_wishlist', {
      currency: 'INR',
      value: price,
      items: [{ item_id: productId, item_name: productName, price }]
    });
  }

  removeFromWishlist(productId, productName) {
    this.track('remove_from_wishlist', { productId, productName });
  }

  checkout(orderTotal, itemCount, paymentMethod) {
    this.track('checkout_initiated', { orderTotal, itemCount, paymentMethod });
    this.sendToGoogleAnalytics('begin_checkout', {
      currency: 'INR',
      value: orderTotal,
      items: itemCount
    });
  }

  purchase(orderId, orderTotal, items) {
    this.track('purchase', { orderId, orderTotal, itemCount: items.length });
    this.sendToGoogleAnalytics('purchase', {
      transaction_id: orderId,
      currency: 'INR',
      value: orderTotal,
      items: items.map(item => ({
        item_id: item.product_id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    });
  }

  // Exit intent tracking
  exitIntentShown(variant) {
    this.track('exit_intent_shown', { variant });
  }

  exitIntentClaimed(variant, discount) {
    this.track('exit_intent_claimed', { variant, discount });
  }

  exitIntentDismissed(variant) {
    this.track('exit_intent_dismissed', { variant });
  }

  getExitIntentVariant() {
    try {
      return localStorage.getItem('exit_intent_variant') || 'modal-10';
    } catch (error) {
      return 'modal-10';
    }
  }

  // Session Recording Data
  getSessionRecording() {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStart,
      mouseMovements: this.mouseMovements,
      clicks: this.clicks,
      scrollDepth: Math.round(this.scrollDepth),
      pageLoadTime: this.pageLoadTime
    };
  }

  // Get heatmap data
  getHeatmapData() {
    return {
      clicks: this.clicks.map(c => ({ x: c.x, y: c.y })),
      scrollDepth: Math.round(this.scrollDepth)
    };
  }

  // Analytics summary
  getSummary() {
    let events = [];
    try {
      events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    } catch (error) {
      events = [];
    }
    
    return {
      totalEvents: events.length,
      pageViews: events.filter(e => e.event === 'page_view').length,
      productsViewed: events.filter(e => e.event === 'product_view').length,
      cartAdditions: events.filter(e => e.event === 'add_to_cart').length,
      wishlistAdditions: events.filter(e => e.event === 'add_to_wishlist').length,
      checkouts: events.filter(e => e.event === 'checkout_initiated').length,
      purchases: events.filter(e => e.event === 'purchase').length,
      exitIntentShown: events.filter(e => e.event === 'exit_intent_shown').length,
      exitIntentClaimed: events.filter(e => e.event === 'exit_intent_claimed').length,
      exitIntentConversionRate: this.calculateExitIntentConversion(events),
      avgSessionDuration: this.calculateAvgSessionDuration(),
      userProfile: this.userProfile,
      sessionRecording: this.getSessionRecording()
    };
  }

  calculateAvgSessionDuration() {
    const duration = Date.now() - this.sessionStart;
    return Math.round(duration / 1000); // in seconds
  }

  calculateExitIntentConversion(events) {
    const shown = events.filter(e => e.event === 'exit_intent_shown').length;
    const claimed = events.filter(e => e.event === 'exit_intent_claimed').length;
    return shown > 0 ? ((claimed / shown) * 100).toFixed(2) + '%' : '0%';
  }

  getPopularProducts() {
    let events = [];
    try {
      events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    } catch (error) {
      events = [];
    }
    const productViews = events.filter(e => e.event === 'product_view');
    
    const productCounts = {};
    productViews.forEach(event => {
      const { productId, productName } = event;
      if (!productCounts[productId]) {
        productCounts[productId] = { productId, productName, views: 0 };
      }
      productCounts[productId].views++;
    });

    return Object.values(productCounts).sort((a, b) => b.views - a.views).slice(0, 10);
  }

  // Product recommendations based on user behavior
  getRecommendations(allProducts) {
    const categoryInterests = this.userProfile.categoriesInterested;
    const topCategory = Object.keys(categoryInterests).sort((a, b) => 
      categoryInterests[b] - categoryInterests[a]
    )[0];
    
    if (topCategory) {
      return allProducts
        .filter(p => p.category === topCategory)
        .filter(p => !this.userProfile.productsViewed.includes(p.id))
        .slice(0, 4);
    }
    
    return [];
  }
}

// Create singleton
const analytics = new Analytics();

// Track page unload to save session data
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      const sessionData = analytics.getSessionRecording();
      sessionStorage.setItem('last_session', JSON.stringify(sessionData));
    } catch (error) {
      // Ignore storage errors
    }
  });
}

export default analytics;
