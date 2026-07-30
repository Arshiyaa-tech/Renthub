/**
 * Application-wide constants and configuration values.
 */

// ========== Categories ==========
export const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', description: 'Phones, laptops, tablets & more', color: 'from-blue-500 to-blue-700', icon: '📱' },
  { name: 'Tools', slug: 'tools', description: 'Power tools, hand tools & equipment', color: 'from-orange-500 to-orange-700', icon: '🔧' },
  { name: 'Photography', slug: 'photography', description: 'Cameras, lenses & accessories', color: 'from-purple-500 to-purple-700', icon: '📷' },
  { name: 'Sports', slug: 'sports', description: 'Sports gear & fitness equipment', color: 'from-green-500 to-green-700', icon: '⚽' },
  { name: 'Camping', slug: 'camping', description: 'Tents, backpacks & outdoor gear', color: 'from-emerald-500 to-emerald-700', icon: '🏕️' },
  { name: 'Gaming', slug: 'gaming', description: 'Consoles, games & accessories', color: 'from-red-500 to-red-700', icon: '🎮' },
  { name: 'Musical Instruments', slug: 'musical', description: 'Instruments & audio equipment', color: 'from-pink-500 to-pink-700', icon: '🎵' },
  { name: 'Home Appliances', slug: 'home-appliances', description: 'Kitchen, cleaning & home gadgets', color: 'from-teal-500 to-teal-700', icon: '🏠' },
  { name: 'Party Equipment', slug: 'party-equipment', description: 'Tents, chairs, speakers & more', color: 'from-yellow-500 to-yellow-700', icon: '🎉' },
  { name: 'Construction Equipment', slug: 'construction-equipment', description: 'Heavy tools & machinery', color: 'from-stone-500 to-stone-700', icon: '🏗️' },
  { name: 'Other', slug: 'other', description: 'Miscellaneous items', color: 'from-gray-500 to-gray-700', icon: '📦' },
];

// ========== Conditions ==========
export const CONDITIONS = [
  { label: 'New', value: 'NEW' },
  { label: 'Like New', value: 'LIKE_NEW' },
  { label: 'Good', value: 'GOOD' },
  { label: 'Fair', value: 'FAIR' },
];

// ========== How It Works Steps ==========
export const HOW_IT_WORKS = [
  {
    step: 1,
    title: 'Browse & Find',
    description: 'Explore thousands of items available for rent near you. Filter by category, price, and location.',
    icon: '🔍',
  },
  {
    step: 2,
    title: 'Book & Pay',
    description: 'Select your dates, book instantly, and pay securely through our platform.',
    icon: '📅',
  },
  {
    step: 3,
    title: 'Return & Review',
    description: 'Use the item, return it on time, and leave a review for the community.',
    icon: '⭐',
  },
];

// ========== Why Choose RentHub ==========
export const WHY_RENTHUB = [
  {
    title: 'Secure Rentals',
    description: 'All transactions are protected. We verify every user and listing.',
    icon: '🛡️',
  },
  {
    title: 'Verified Users',
    description: 'Trustworthy community with verified identities and reviews.',
    icon: '✅',
  },
  {
    title: 'Affordable Pricing',
    description: 'Rent premium items at a fraction of the retail price.',
    icon: '💰',
  },
  {
    title: 'Flexible Booking',
    description: 'Rent by the day, week, or month. Cancel anytime with our flexible policy.',
    icon: '📋',
  },
  {
    title: 'Fast Support',
    description: '24/7 customer support to help you with any issues or questions.',
    icon: '💬',
  },
];

// ========== Testimonials ==========
export const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Photography Enthusiast',
    content: 'RentHub saved me thousands! Rented a professional camera for my wedding shoot. The process was smooth and the owner was very helpful.',
    avatar: 'PS',
    rating: 5,
  },
  {
    name: 'Rahul Verma',
    role: 'DIY Homeowner',
    content: 'Instead of buying expensive power tools I use once, I rent them on RentHub. It\'s convenient, affordable, and the tools are always in great condition.',
    avatar: 'RV',
    rating: 5,
  },
  {
    name: 'Ananya Patel',
    role: 'Event Planner',
    content: 'As an event planner, RentHub is a lifesaver. I can rent speakers, tents, and decorations for each event without storing them permanently.',
    avatar: 'AP',
    rating: 4,
  },
];

// ========== Footer Links ==========
export const FOOTER_SECTIONS = {
  company: {
    title: 'Company',
    links: [
      { label: 'About Us', path: '#' },
      { label: 'Careers', path: '#' },
      { label: 'Blog', path: '#' },
    ],
  },
  support: {
    title: 'Support',
    links: [
      { label: 'Help Center', path: '#' },
      { label: 'FAQs', path: '#' },
      { label: 'Contact Us', path: '#' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', path: '#' },
      { label: 'Terms & Conditions', path: '#' },
      { label: 'Cookie Policy', path: '#' },
    ],
  },
};

// ========== App Info ==========
export const APP_NAME = 'RentHub';
export const APP_TAGLINE = 'Rent Anything, Anytime';
export const APP_DESCRIPTION = 'The peer-to-peer rental marketplace for gadgets, tools, electronics, and more.';
