import React from 'react';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '916283968189';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

export const WhatsAppButton = ({ className = '', iconOnly = true }) => {
  const baseClassName =
    'flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_24px_rgba(37,211,102,0.25)] transition-transform duration-300 hover:scale-105 hover:bg-[#1ebe5d] focus:outline-none focus:ring-4 focus:ring-[#25D366]/30';

  const sizeClassName = iconOnly ? 'h-10 w-10' : 'px-4 py-2.5 space-x-2';

  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className={`${baseClassName} ${sizeClassName} ${className}`.trim()}
    >
      <MessageCircle size={iconOnly ? 20 : 18} />
      {!iconOnly && <span className="text-sm font-semibold">WhatsApp</span>}
    </a>
  );
};
