import { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../lib/api';

export const DEFAULT_SITE_SETTINGS = {
  store_name: 'Artisan Bakery',
  tagline: 'Handcrafted baked goods made with love and the finest ingredients. Experience the art of traditional baking.',
  support_email: 'info@artisanbakery.com',
  support_phone: '+91 98765 43210',
  address: '123 Bakery Street, Mumbai, Maharashtra 400001',
  facebook_url: '',
  instagram_url: '',
  twitter_url: '',
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    axios.get(`${API_URL}/settings`)
      .then((response) => {
        if (!cancelled && response.data) {
          setSettings({ ...DEFAULT_SITE_SETTINGS, ...response.data });
        }
      })
      .catch(() => {
        // Keep defaults if the settings endpoint is unavailable
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
};
