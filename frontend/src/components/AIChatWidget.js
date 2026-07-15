import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

const QUICK_PROMPTS = ['Cakes', 'Delivery', 'Custom order', 'Contact'];

const buildBotReply = (message) => {
  const text = message.toLowerCase();

  if (text.includes('cake') || text.includes('product') || text.includes('shop')) {
    return 'You can explore all cakes and bakery items in the Shop page. If you want, I can also guide you toward custom cakes or best sellers.';
  }

  if (text.includes('delivery') || text.includes('shipping') || text.includes('date')) {
    return 'We support order placement and delivery scheduling through the site checkout flow. For urgent delivery confirmation, use the WhatsApp button next to me.';
  }

  if (text.includes('custom') || text.includes('birthday') || text.includes('design')) {
    return 'Custom cake orders are available. Share your theme, weight, flavor, and date, then contact the bakery through WhatsApp for faster coordination.';
  }

  if (text.includes('contact') || text.includes('phone') || text.includes('number') || text.includes('whatsapp')) {
    return 'You can contact the bakery directly on WhatsApp at 6283968189, or open the Contact page from the top menu.';
  }

  if (text.includes('login') || text.includes('account') || text.includes('google')) {
    return 'If account sign-in gives trouble, try normal email login first or refresh once before retrying Google sign-in.';
  }

  return 'I can help with products, delivery, custom cake orders, login help, and contact details. Ask me anything about the bakery.';
};

const getBotReply = async (message) => {
  try {
    const response = await axios.post(
      '/api/chat',
      { message },
      { timeout: 8000 }
    );

    const reply = response?.data?.reply;
    if (typeof reply === 'string' && reply.trim()) {
      return reply.trim();
    }
  } catch (error) {
    // Fallback to local reply so chat stays useful during API errors.
  }

  return buildBotReply(message);
};

export const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hi, I am your bakery assistant. Ask about cakes, delivery, custom orders, or contact details.',
    },
  ]);
  const idRef = useRef(1);
  const endRef = useRef(null);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isOpen, isSending]);

  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  const sendMessage = async (rawMessage) => {
    const message = rawMessage.trim();
    if (!message || isSending) {
      return;
    }

    setMessages((current) => [...current, { id: nextId(), role: 'user', content: message }]);
    setInput('');
    setIsSending(true);

    const reply = await getBotReply(message);

    setMessages((current) => [...current, { id: nextId(), role: 'assistant', content: reply }]);
    setIsSending(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="max-w-[15rem] rounded-[1.25rem] rounded-br-md border border-[#E7DDCF] bg-white px-4 py-3 text-left text-sm text-[#2D241E] shadow-[0_18px_40px_rgba(45,36,30,0.14)]"
        >
          Need help finding cakes or placing an order?
        </button>
      )}

      {isOpen && (
        <div className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-[#E7DDCF] bg-white shadow-[0_24px_60px_rgba(45,36,30,0.16)]">
          <div className="bg-[#2D241E] px-5 py-4 text-white">
            <p className="text-sm font-semibold">Bakery AI Assistant</p>
            <p className="mt-1 text-xs text-white/70">Quick help for products, orders, and support</p>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto bg-[#FDF8F1] px-4 py-4" aria-live="polite">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === 'assistant'
                    ? 'bg-white text-[#2D241E] shadow-sm'
                    : 'ml-auto bg-[#C25934] text-white'
                }`}
              >
                {message.content}
              </div>
            ))}
            {isSending && (
              <div className="max-w-[85%] rounded-2xl bg-white px-4 py-3 text-sm text-[#6D5E53] shadow-sm">
                Thinking...
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-[#E7DDCF] bg-white px-4 py-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    void sendMessage(prompt);
                  }}
                  disabled={isSending}
                  className="rounded-full border border-[#E3DCCF] px-3 py-1.5 text-xs font-medium text-[#5C4B40] transition-colors duration-200 hover:border-[#C25934] hover:text-[#C25934]"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void sendMessage(input);
                  }
                }}
                placeholder="Ask the bakery assistant..."
                className="h-11 flex-1 rounded-full border border-[#E3DCCF] px-4 text-sm outline-none transition-colors duration-200 focus:border-[#C25934]"
              />
              <button
                type="button"
                onClick={() => {
                  void sendMessage(input);
                }}
                disabled={!canSend || isSending}
                className="rounded-full bg-[#C25934] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#A84C2A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Open AI chat assistant"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C25934] text-white shadow-[0_16px_32px_rgba(194,89,52,0.35)] transition-transform duration-300 hover:scale-105 hover:bg-[#A84C2A] focus:outline-none focus:ring-4 focus:ring-[#C25934]/30"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current" aria-hidden="true">
          <path d="M12 3c4.97 0 9 3.58 9 8s-4.03 8-9 8c-.74 0-1.46-.08-2.15-.24L5 21l1.42-3.8C4.91 15.77 3 13.54 3 11c0-4.42 4.03-8 9-8Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.5 11h7" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8.5 14h4.5" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};
