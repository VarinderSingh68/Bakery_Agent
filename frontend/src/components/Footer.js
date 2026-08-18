import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';

export const Footer = () => {
  const settings = useSiteSettings();

  return (
    <footer className="bg-[#2D241E] text-[#FDFBF7] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* About */}
          <div>
            <h3 className="text-2xl font-['Playfair_Display'] font-bold mb-4 text-[#F2D780]">
              {settings.store_name}
            </h3>
            <p className="text-[#8A7E74] leading-relaxed">
              {settings.tagline}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#F2D780]">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-[#8A7E74] hover:text-[#F2D780] transition-colors duration-300">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-[#8A7E74] hover:text-[#F2D780] transition-colors duration-300">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#8A7E74] hover:text-[#F2D780] transition-colors duration-300">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#F2D780]">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2 text-[#8A7E74]">
                <Phone size={16} />
                <span>{settings.support_phone}</span>
              </li>
              <li className="flex items-center space-x-2 text-[#8A7E74]">
                <Mail size={16} />
                <span>{settings.support_email}</span>
              </li>
              <li className="flex items-start space-x-2 text-[#8A7E74]">
                <MapPin size={16} className="mt-1" />
                <span>{settings.address}</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#F2D780]">Follow Us</h4>
            <div className="flex space-x-4">
              <a
                href={settings.facebook_url || '#'}
                target={settings.facebook_url ? '_blank' : undefined}
                rel={settings.facebook_url ? 'noopener noreferrer' : undefined}
                className="bg-[#FDFBF7]/10 p-3 rounded-full hover:bg-[#C25934] transition-all duration-300"
              >
                <Facebook size={20} />
              </a>
              <a
                href={settings.instagram_url || '#'}
                target={settings.instagram_url ? '_blank' : undefined}
                rel={settings.instagram_url ? 'noopener noreferrer' : undefined}
                className="bg-[#FDFBF7]/10 p-3 rounded-full hover:bg-[#C25934] transition-all duration-300"
              >
                <Instagram size={20} />
              </a>
              <a
                href={settings.twitter_url || '#'}
                target={settings.twitter_url ? '_blank' : undefined}
                rel={settings.twitter_url ? 'noopener noreferrer' : undefined}
                className="bg-[#FDFBF7]/10 p-3 rounded-full hover:bg-[#C25934] transition-all duration-300"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#FDFBF7]/10 text-center">
          <p className="text-[#8A7E74]">
            &copy; {new Date().getFullYear()} {settings.store_name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};