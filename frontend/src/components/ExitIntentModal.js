import React, { useState, useEffect } from 'react';
import { X, Gift, ArrowRight, Percent, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import analytics from '../services/analytics';

const VARIANTS = [
  { id: 'modal-10', type: 'modal', discount: 10, code: 'WELCOME10', minOrder: 500 },
  { id: 'modal-15', type: 'modal', discount: 15, code: 'SAVE15', minOrder: 800 },
  { id: 'modal-20', type: 'modal', discount: 20, code: 'SAVE20', minOrder: 1000 },
  { id: 'banner-10', type: 'banner', discount: 10, code: 'WELCOME10', minOrder: 500 },
  { id: 'banner-15', type: 'banner', discount: 15, code: 'SAVE15', minOrder: 800 },
  { id: 'banner-20', type: 'banner', discount: 20, code: 'SAVE20', minOrder: 1000 }
];

export const ExitIntentModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [variant, setVariant] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let assignedVariant = localStorage.getItem('exit_intent_variant');
    if (!assignedVariant) {
      const randomIndex = Math.floor(Math.random() * VARIANTS.length);
      assignedVariant = VARIANTS[randomIndex].id;
      localStorage.setItem('exit_intent_variant', assignedVariant);
      analytics.track('ab_test_assigned', { test: 'exit_intent', variant: assignedVariant });
    }
    
    const variantConfig = VARIANTS.find(v => v.id === assignedVariant);
    setVariant(variantConfig);

    const shown = sessionStorage.getItem('exitIntentShown');
    if (shown) {
      setHasShown(true);
      return;
    }

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !hasShown && !isOpen) {
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem('exitIntentShown', 'true');
        analytics.exitIntentShown(assignedVariant);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown, isOpen]);

  const handleClaim = () => {
    navigator.clipboard.writeText(variant.code);
    toast.success(`Coupon ${variant.code} copied! ${variant.discount}% off`);
    setIsOpen(false);
    analytics.exitIntentClaimed(variant.id, variant.discount);
    navigate('/shop');
  };

  const handleClose = () => {
    setIsOpen(false);
    analytics.exitIntentDismissed(variant.id);
  };

  if (!isOpen || !variant) return null;

  if (variant.type === 'banner') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#C25934] to-[#A84C2A] text-white p-6 shadow-2xl z-50 animate-slide-up" data-testid="exit-banner">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-full animate-pulse">
              <Gift size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-['Playfair_Display'] font-bold mb-1">
                Wait! Get {variant.discount}% OFF
              </h3>
              <p className="text-white/90">
                Use code <span className="font-mono font-bold bg-white/20 px-3 py-1 rounded">{variant.code}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={handleClaim} className="bg-white text-[#C25934] hover:bg-[#FDFBF7] rounded-full px-8 py-3 font-semibold transition-all duration-300 flex items-center space-x-2 transform hover:scale-105 shadow-lg" data-testid="claim-banner-button">
              <span>Claim {variant.discount}% Off</span>
              <ArrowRight size={20} />
            </button>
            <button onClick={handleClose} className="text-white hover:text-white/70 transition-colors duration-300 p-2" data-testid="close-banner-button">
              <X size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" onClick={handleClose} data-testid="exit-modal-backdrop" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl pointer-events-auto animate-scale-in relative overflow-hidden" data-testid="exit-modal">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#F2D780]/30 to-[#C25934]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <button onClick={handleClose} className="absolute top-4 right-4 text-[#5C4B40] hover:text-[#C25934] transition-colors duration-300 z-10" data-testid="exit-modal-close">
            <X size={24} />
          </button>
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#C25934] to-[#A84C2A] rounded-2xl mb-6 animate-bounce">
              <Percent size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-3">Wait! Special Offer</h2>
            <p className="text-lg text-[#5C4B40] mb-6 leading-relaxed">
              Get <span className="text-[#C25934] font-bold text-3xl">{variant.discount}% OFF</span> your order!
            </p>
            <div className="bg-gradient-to-r from-[#F3EFE6] to-[#F2D780]/20 rounded-xl p-6 mb-6 border-2 border-dashed border-[#C25934]">
              <div className="flex items-center justify-between mb-3">
                <Tag className="text-[#C25934]" size={24} />
                <p className="text-sm text-[#5C4B40]">Coupon code:</p>
              </div>
              <p className="text-3xl font-bold text-[#C25934] tracking-wider font-mono text-center">{variant.code}</p>
            </div>
            <div className="space-y-3">
              <button onClick={handleClaim} className="w-full bg-[#C25934] text-white hover:bg-[#A84C2A] rounded-full px-8 py-4 font-semibold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl" data-testid="claim-offer-button">
                <span>Claim {variant.discount}% Discount</span>
                <ArrowRight size={20} />
              </button>
              <button onClick={handleClose} className="w-full text-[#5C4B40] hover:text-[#C25934] py-2 font-medium transition-colors duration-300" data-testid="exit-modal-dismiss">
                No thanks, I will pay full price
              </button>
            </div>
            <p className="text-xs text-[#8A7E74] mt-4 text-center">* One-time use only</p>
          </div>
        </div>
      </div>
    </>
  );
};

export { VARIANTS };
