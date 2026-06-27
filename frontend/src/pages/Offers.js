import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { BadgePercent, ExternalLink, Instagram, Sparkles } from 'lucide-react';
import API_URL from '../lib/api';

const normalizeItems = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => ({
      ...row,
      id: row.id || `${row.kind}-${row.title}`,
      kind: row.kind === 'reel' ? 'reel' : 'offer',
      title: row.title || 'Special Offer',
      description: row.description || '',
      badge: row.badge || '',
      image_url: row.image_url || '',
      reel_url: row.reel_url || '',
      embed_url: row.embed_url || '',
      cta_label: row.cta_label || '',
      cta_url: row.cta_url || '',
    }))
    .filter((row) => row.id);
};

export const Offers = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfferMedia = async () => {
      try {
        const response = await axios.get(`${API_URL}/offer-media`, { timeout: 10000 });
        setItems(normalizeItems(response.data));
      } catch (error) {
        console.error('Failed to fetch offers and reels:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferMedia();
  }, []);

  const offers = useMemo(() => items.filter((item) => item.kind === 'offer'), [items]);
  const reels = useMemo(() => items.filter((item) => item.kind === 'reel'), [items]);

  return (
    <div className="min-h-screen bg-[#FDFBF7]" data-testid="offers-page">
      <section className="border-b border-[#E3DCCF] bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E3DCCF] bg-[#FDFBF7] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[#C25934]">
              <Sparkles size={16} />
              Fresh picks from the bakery
            </div>
            <h1 className="font-['Playfair_Display'] text-4xl font-bold tracking-tight text-[#2D241E] sm:text-5xl">
              Offers & Reels
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#5C4B40]">
              Browse current bakery offers and watch the latest behind-the-counter moments.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#C25934] border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-2xl border border-[#E3DCCF] bg-white p-10 text-center">
              <BadgePercent className="mx-auto mb-4 text-[#C25934]" size={42} />
              <h2 className="font-['Playfair_Display'] text-3xl font-bold text-[#2D241E]">
                New offers are baking
              </h2>
              <p className="mt-3 text-[#5C4B40]">
                Check back soon for fresh deals, seasonal boxes, and bakery reels.
              </p>
              <Link
                to="/shop"
                className="mt-7 inline-flex items-center justify-center rounded-full bg-[#C25934] px-7 py-3 font-semibold text-white transition-colors duration-300 hover:bg-[#A84C2A]"
              >
                Shop Products
              </Link>
            </div>
          ) : (
            <div className="space-y-16">
              {offers.length > 0 && (
                <div>
                  <div className="mb-7 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-[#C25934]">
                        Limited time
                      </p>
                      <h2 className="mt-2 font-['Playfair_Display'] text-3xl font-bold text-[#2D241E]">
                        Bakery Offers
                      </h2>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" data-testid="offers-grid">
                    {offers.map((offer) => (
                      <article
                        key={offer.id}
                        className="overflow-hidden rounded-2xl border border-[#E3DCCF] bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-[#F3EFE6]">
                          <img
                            src={offer.image_url}
                            alt={offer.title}
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                        <div className="p-6">
                          {offer.badge && (
                            <span className="mb-4 inline-flex rounded-full bg-[#4A6B53] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                              {offer.badge}
                            </span>
                          )}
                          <h3 className="font-['Playfair_Display'] text-2xl font-bold text-[#2D241E]">
                            {offer.title}
                          </h3>
                          {offer.description && (
                            <p className="mt-3 min-h-[3.5rem] text-sm leading-6 text-[#5C4B40]">
                              {offer.description}
                            </p>
                          )}
                          {offer.cta_url && (
                            <a
                              href={offer.cta_url}
                              className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#C25934] px-5 py-2.5 text-sm font-semibold text-[#C25934] transition-colors duration-300 hover:bg-[#C25934] hover:text-white"
                            >
                              <span>{offer.cta_label || 'View Offer'}</span>
                              <ExternalLink size={15} />
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {reels.length > 0 && (
                <div>
                  <div className="mb-7 flex items-center gap-3">
                    <Instagram className="text-[#C25934]" size={28} />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-[#C25934]">
                        Instagram
                      </p>
                      <h2 className="mt-1 font-['Playfair_Display'] text-3xl font-bold text-[#2D241E]">
                        Latest Reels
                      </h2>
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="reels-grid">
                    {reels.map((reel) => (
                      <article key={reel.id} className="rounded-2xl border border-[#E3DCCF] bg-white p-4 shadow-sm">
                        <div className="aspect-[9/16] overflow-hidden rounded-xl bg-[#2D241E]">
                          {reel.embed_url ? (
                            <iframe
                              title={reel.title}
                              src={reel.embed_url}
                              className="h-full w-full border-0"
                              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                            />
                          ) : (
                            <img src={reel.image_url} alt={reel.title} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="pt-4">
                          <h3 className="font-semibold text-[#2D241E]">{reel.title}</h3>
                          {reel.description && (
                            <p className="mt-2 text-sm leading-6 text-[#5C4B40]">{reel.description}</p>
                          )}
                          {reel.reel_url && (
                            <a
                              href={reel.reel_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#C25934] hover:text-[#A84C2A]"
                            >
                              <span>Open on Instagram</span>
                              <ExternalLink size={15} />
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
