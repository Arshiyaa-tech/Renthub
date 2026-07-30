import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaLinkedin, FaXTwitter } from 'react-icons/fa6';
import { APP_NAME, APP_TAGLINE, FOOTER_SECTIONS } from '../utils/constants';

/**
 * Professional website footer component.
 *
 * Sections:
 * - Company description and tagline
 * - Quick links (Company, Support, Legal)
 * - Social media icons
 * - Copyright notice
 */
const Footer = () => {
  const socialIcons = {
    FaFacebook: FaFacebook,
    FaInstagram: FaInstagram,
    FaLinkedin: FaLinkedin,
    FaXTwitter: FaXTwitter,
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ========== Main Footer Content ========== */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="bg-primary-600 text-white px-2.5 py-1 rounded-lg text-xl font-bold">RH</span>
              <span className="text-xl font-bold text-white">{APP_NAME}</span>
            </Link>
            <p className="text-gray-400 mb-4 max-w-md leading-relaxed">
              {APP_TAGLINE}. The peer-to-peer marketplace connecting owners and renters
              for everyday gadgets, tools, electronics, and more.
            </p>

          {/* Social Media Icons */}
          <div className="flex gap-3">
            {Object.entries({
              Facebook: FaFacebook,
              Instagram: FaInstagram,
              LinkedIn: FaLinkedin,
              'X Twitter': FaXTwitter,
            }).map(([name, Icon]) => (
              <a
                key={name}
                href="#"
                className="w-10 h-10 rounded-full bg-gray-800 hover:bg-primary-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300"
                aria-label={name}
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {FOOTER_SECTIONS.company.title}
            </h3>
            <ul className="space-y-3">
              {FOOTER_SECTIONS.company.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.path}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {FOOTER_SECTIONS.support.title}
            </h3>
            <ul className="space-y-3">
              {FOOTER_SECTIONS.support.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.path}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {FOOTER_SECTIONS.legal.title}
            </h3>
            <ul className="space-y-3">
              {FOOTER_SECTIONS.legal.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.path}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ========== Bottom Bar ========== */}
        <div className="py-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {currentYear} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
