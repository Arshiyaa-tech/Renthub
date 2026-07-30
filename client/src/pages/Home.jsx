import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiSearch, HiLocationMarker, HiStar } from 'react-icons/hi';
import { FaArrowRight, FaCheckCircle, FaShieldAlt, FaUsers, FaMoneyBillWave, FaCalendarCheck, FaHeadset } from 'react-icons/fa';
import {
  CATEGORIES,
  HOW_IT_WORKS,
  WHY_RENTHUB,
  TESTIMONIALS,
  APP_NAME,
  APP_TAGLINE,
  APP_DESCRIPTION,
} from '../utils/constants';
import { formatPrice, getPlaceholderImage } from '../utils/helpers';

/**
 * Home page — the main landing page for RentHub.
 *
 * Sections:
 * 1. Hero — Gradient background, search bar, CTA buttons
 * 2. Popular Categories — Responsive grid of category cards
 * 3. Featured Listings — 8 placeholder rental cards
 * 4. How It Works — 3-step process cards
 * 5. Why Choose RentHub — Feature grid
 * 6. Testimonials — Customer reviews
 * 7. Call to Action — Final conversion section
 */

// ========== Placeholder featured listings data ==========
const FEATURED_LISTINGS = [
  { id: 1, title: 'Sony A7 III Camera', category: 'photography', price: 1500, location: 'Mumbai, MH', rating: 4.8, reviews: 24 },
  { id: 2, title: 'Bosch Power Drill Kit', category: 'tools', price: 500, location: 'Delhi, DL', rating: 4.6, reviews: 18 },
  { id: 3, title: 'MacBook Pro M3', category: 'electronics', price: 2500, location: 'Bangalore, KA', rating: 4.9, reviews: 32 },
  { id: 4, title: 'Mountain Bike (Trek)', category: 'sports', price: 800, location: 'Pune, MH', rating: 4.7, reviews: 15 },
  { id: 5, title: 'Camping Tent (4-person)', category: 'camping', price: 600, location: 'Manali, HP', rating: 4.5, reviews: 21 },
  { id: 6, title: 'PS5 Gaming Console', category: 'gaming', price: 1200, location: 'Hyderabad, TS', rating: 4.9, reviews: 45 },
  { id: 7, title: 'Yamaha Acoustic Guitar', category: 'musical', price: 400, location: 'Chennai, TN', rating: 4.4, reviews: 12 },
  { id: 8, title: 'Bluetooth Speaker System', category: 'event', price: 2000, location: 'Jaipur, RJ', rating: 4.7, reviews: 28 },
];

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // ========== Helper: render star ratings ==========
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<HiStar key={`full-${i}`} className="text-accent-400 fill-current" size={16} />);
    }
    if (hasHalf) {
      stars.push(<HiStar key="half" className="text-accent-400 fill-current opacity-50" size={16} />);
    }
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<HiStar key={`empty-${i}`} className="text-gray-300" size={16} />);
    }
    return stars;
  };

  return (
    <div>
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-400/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-primary-200 mb-8 border border-white/20">
              <FaCheckCircle className="text-green-400" size={14} />
              India's Trusted Rental Marketplace
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6">
              Rent What You Need.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-300 to-accent-500">
                Save More.
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-primary-100/90 max-w-3xl mx-auto mb-10 leading-relaxed">
              {APP_DESCRIPTION} From cameras to power tools, gaming consoles to camping gear — pay only for what you use.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-10">
              <div className="flex items-center bg-white rounded-xl shadow-2xl shadow-primary-900/30 p-1.5">
                <div className="flex-1 flex items-center px-4">
                  <HiSearch className="text-gray-400 text-xl mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search for items to rent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-3 text-gray-800 placeholder-gray-400 focus:outline-none text-base"
                  />
                </div>
                <div className="hidden sm:flex items-center px-4 border-l border-gray-200">
                  <HiLocationMarker className="text-gray-400 mr-2" />
                  <select className="py-3 text-gray-600 bg-transparent focus:outline-none text-sm">
                    <option>All Locations</option>
                    <option>Mumbai</option>
                    <option>Delhi</option>
                    <option>Bangalore</option>
                    <option>Pune</option>
                  </select>
                </div>
                <Link
                  to="/listings"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3.5 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-primary-600/30 hover:shadow-primary-600/50"
                >
                  <HiSearch size={20} className="sm:hidden" />
                  <span className="hidden sm:inline">Search</span>
                </Link>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/listings"
                className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl shadow-accent-500/30 hover:shadow-accent-500/50 hover:scale-105 flex items-center gap-2"
              >
                Browse Rentals
                <FaArrowRight size={16} />
              </Link>
              <Link
                to="/create-listing"
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 border border-white/30 hover:border-white/50 flex items-center gap-2"
              >
                List Your Item
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: '10K+', label: 'Items Available' },
              { value: '50K+', label: 'Happy Renters' },
              { value: '5K+', label: 'Verified Owners' },
              { value: '4.8★', label: 'Average Rating' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-primary-200 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== POPULAR CATEGORIES ==================== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-heading">Popular Categories</h2>
            <p className="section-subheading">
              Browse thousands of items across our curated categories
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {CATEGORIES.map((category, index) => (
              <Link
                key={category.slug}
                to={`/listings?category=${category.slug}`}
                className="group card p-6 text-center hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {category.icon}
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURED LISTINGS ==================== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="section-heading">Featured Listings</h2>
              <p className="section-subheading text-left mx-0">
                Popular items people are renting right now
              </p>
            </div>
            <Link
              to="/listings"
              className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-2 whitespace-nowrap"
            >
              View All <FaArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_LISTINGS.map((item, index) => (
              <Link
                key={item.id}
                to={`/listings/${item.id}`}
                className="group card overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Image Placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-50 overflow-hidden">
                  <img
                    src={getPlaceholderImage(item.category)}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-primary-700 px-2.5 py-1 rounded-full capitalize">
                    {item.category}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors mb-2 truncate">
                    {item.title}
                  </h3>

                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <HiLocationMarker size={14} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    {renderStars(item.rating)}
                    <span className="text-sm font-medium text-gray-700 ml-1">{item.rating}</span>
                    <span className="text-sm text-gray-400">({item.reviews})</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-lg font-bold text-primary-600">
                      {formatPrice(item.price)}
                      <span className="text-sm font-normal text-gray-500">/day</span>
                    </span>
                    <span className="text-sm font-medium text-primary-600 group-hover:translate-x-1 transition-transform duration-200">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-heading">How It Works</h2>
            <p className="section-subheading">
              Renting items on {APP_NAME} is as simple as 1-2-3
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step, index) => (
              <div
                key={step.step}
                className="relative card p-8 text-center animate-fade-in-up group hover:-translate-y-2"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-50 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
                  {step.icon}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== WHY CHOOSE RENTHUB ==================== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-heading">Why Choose {APP_NAME}?</h2>
            <p className="section-subheading">
              We make peer-to-peer renting safe, easy, and affordable
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Secure Rentals', description: 'All transactions are protected with our secure payment system and rental protection.', icon: FaShieldAlt, color: 'text-blue-600', bg: 'bg-blue-50' },
              { title: 'Verified Users', description: 'Every user is verified with government ID and phone number for a trusted community.', icon: FaUsers, color: 'text-green-600', bg: 'bg-green-50' },
              { title: 'Affordable Pricing', description: 'Rent premium items at a fraction of retail price. Pay by the day, week, or month.', icon: FaMoneyBillWave, color: 'text-accent-600', bg: 'bg-orange-50' },
              { title: 'Flexible Booking', description: 'Book with flexible dates, modify or cancel with our easy rental policy.', icon: FaCalendarCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
              { title: 'Quality Guarantee', description: 'Items are inspected and guaranteed to work. Get replacements if something goes wrong.', icon: FaCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { title: '24/7 Support', description: 'Our support team is available around the clock to help you with any issues.', icon: FaHeadset, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="card p-8 animate-fade-in-up group hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-xl ${feature.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`${feature.color} text-2xl`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-heading">What Our Users Say</h2>
            <p className="section-subheading">
              Join thousands of satisfied renters and owners
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <div
                key={testimonial.name}
                className="card p-8 animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <HiStar
                      key={i}
                      className={`${i < testimonial.rating ? 'text-accent-400 fill-current' : 'text-gray-300'}`}
                      size={18}
                    />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-600 leading-relaxed mb-6 italic">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                    <p className="text-gray-500 text-xs">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CALL TO ACTION ==================== */}
      <section className="py-20 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6">
            Ready to Start Renting?
          </h2>
          <p className="text-lg text-primary-200 mb-10 max-w-2xl mx-auto">
            Join India's fastest growing rental marketplace. Whether you want to rent or earn from your idle items, we've got you covered.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl shadow-accent-500/30 hover:shadow-accent-500/50 hover:scale-105"
            >
              Get Started Free
            </Link>
            <Link
              to="/listings"
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 border border-white/30"
            >
              Explore Rentals
            </Link>
          </div>

          <p className="text-primary-300 text-sm mt-6">
            No credit card required. Free to join.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
