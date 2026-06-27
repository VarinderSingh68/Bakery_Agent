import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingCart, Heart, Gift, Eye, Users, Target, Brain, Zap } from 'lucide-react';
import analytics from '../services/analytics';
import { HeatmapViewer } from './HeatmapViewer';
import { VARIANTS } from './ExitIntentModal';

export const AnalyticsDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [popularProducts, setPopularProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'heatmap', 'abtest', 'predictive'

  useEffect(() => {
    loadAnalytics();
    
    // Refresh every 10 seconds
    const interval = setInterval(loadAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = () => {
    setSummary(analytics.getSummary());
    setPopularProducts(analytics.getPopularProducts());
  };

  if (!summary) return null;

  const stats = [
    {
      icon: Eye,
      label: 'Page Views',
      value: summary.pageViews,
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: TrendingUp,
      label: 'Products Viewed',
      value: summary.productsViewed,
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: ShoppingCart,
      label: 'Cart Additions',
      value: summary.cartAdditions,
      color: 'from-[#C25934] to-[#A84C2A]'
    },
    {
      icon: Heart,
      label: 'Wishlist Additions',
      value: summary.wishlistAdditions,
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: Gift,
      label: 'Exit Intent Shown',
      value: summary.exitIntentShown,
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Users,
      label: 'Exit Intent Claimed',
      value: summary.exitIntentClaimed,
      color: 'from-emerald-500 to-emerald-600'
    }
  ];

  return (
    <div className="space-y-8" data-testid="analytics-dashboard">
      <div>
        <h2 className="text-2xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-6">
          Analytics Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-6 border border-[#E3DCCF] hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <Icon size={24} className="text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-[#2D241E] mb-2">{stat.value}</p>
                <p className="text-[#5C4B40] text-sm">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exit Intent A/B Testing Results */}
      <div className="bg-gradient-to-r from-[#F3EFE6] to-[#F2D780]/20 rounded-2xl p-8 border border-[#E3DCCF]">
        <h3 className="text-xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-4">
          Exit Intent A/B Test Results
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-[#5C4B40] mb-1">Variant</p>
            <p className="text-2xl font-bold text-[#C25934]">
              {analytics.getExitIntentVariant() === 'modal' ? 'Modal' : 'Banner'}
            </p>
          </div>
          <div>
            <p className="text-sm text-[#5C4B40] mb-1">Times Shown</p>
            <p className="text-2xl font-bold text-[#2D241E]">{summary.exitIntentShown}</p>
          </div>
          <div>
            <p className="text-sm text-[#5C4B40] mb-1">Conversion Rate</p>
            <p className="text-2xl font-bold text-[#4A6B53]">{summary.exitIntentConversionRate}</p>
          </div>
        </div>
      </div>

      {/* Popular Products */}
      {popularProducts.length > 0 && (
        <div className="bg-white rounded-2xl p-8 border border-[#E3DCCF]">
          <h3 className="text-xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-6">
            Most Viewed Products
          </h3>
          <div className="space-y-3">
            {popularProducts.map((product, index) => (
              <div key={product.productId} className="flex items-center justify-between p-4 bg-[#F3EFE6] rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-[#C25934] text-white rounded-full font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-[#2D241E]">{product.productName}</p>
                    <p className="text-sm text-[#8A7E74]">Product ID: {product.productId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#C25934]">{product.views}</p>
                  <p className="text-sm text-[#5C4B40]">views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Analytics data is stored locally in browser storage for demonstration purposes. 
          In production, this would be sent to a real analytics backend (Google Analytics, Mixpanel, etc.).
        </p>
      </div>
    </div>
  );
};
