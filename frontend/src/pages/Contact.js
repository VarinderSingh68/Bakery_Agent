import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import API_URL from '../lib/api';

export const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/contact`, { name, email, subject, message });
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12" data-testid="contact-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-['Playfair_Display'] font-bold text-[#2D241E] tracking-tight mb-4">
            Get in Touch
          </h1>
          <p className="text-base text-[#5C4B40]">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 border border-[#E3DCCF]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[#2D241E] font-medium mb-2">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
                  placeholder="Your name"
                  data-testid="name-input"
                />
              </div>

              <div>
                <label className="block text-[#2D241E] font-medium mb-2">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
                  placeholder="your@email.com"
                  data-testid="email-input"
                />
              </div>

              <div>
                <label className="block text-[#2D241E] font-medium mb-2">Subject *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
                  placeholder="How can we help?"
                  data-testid="subject-input"
                />
              </div>

              <div>
                <label className="block text-[#2D241E] font-medium mb-2">Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows="6"
                  className="w-full px-4 py-3 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none resize-none"
                  placeholder="Your message..."
                  data-testid="message-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#C25934] text-white hover:bg-[#A84C2A] rounded-full px-8 py-4 font-medium transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                data-testid="submit-button"
              >
                <Send size={20} />
                <span>{loading ? 'Sending...' : 'Send Message'}</span>
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 border border-[#E3DCCF]">
              <h3 className="text-2xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-6">
                Contact Information
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-[#F3EFE6] p-3 rounded-full">
                    <Phone size={24} className="text-[#C25934]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2D241E] mb-1">Phone</p>
                    <p className="text-[#5C4B40]">+91 98765 43210</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-[#F3EFE6] p-3 rounded-full">
                    <Mail size={24} className="text-[#C25934]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2D241E] mb-1">Email</p>
                    <p className="text-[#5C4B40]">info@artisanbakery.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-[#F3EFE6] p-3 rounded-full">
                    <MapPin size={24} className="text-[#C25934]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2D241E] mb-1">Address</p>
                    <p className="text-[#5C4B40]">
                      123 Bakery Street<br />
                      Mumbai, Maharashtra 400001
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#F3EFE6] rounded-2xl p-8">
              <h3 className="text-xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-4">
                Business Hours
              </h3>
              <div className="space-y-2 text-[#5C4B40]">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="font-semibold">7:00 AM - 10:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-semibold">8:00 AM - 11:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-semibold">8:00 AM - 9:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};