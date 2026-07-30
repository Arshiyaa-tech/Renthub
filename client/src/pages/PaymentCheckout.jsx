import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { HiCalendar, HiChevronLeft, HiShieldCheck, HiCreditCard, HiBadgeCheck } from 'react-icons/hi';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { formatPrice, formatDate } from '../utils/helpers';
import { getBookingById } from '../services/bookingService';
import { createPaymentIntent, confirmPayment } from '../services/paymentService';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const CheckoutForm = ({ booking, clientSecret, bookingId, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.origin + '/bookings' },
        redirect: 'if_required',
      });
      if (stripeError) { setError(stripeError.message); toast.error(stripeError.message); setLoading(false); return; }
      if (paymentIntent && paymentIntent.status === 'requires_capture') {
        const response = await confirmPayment(bookingId, paymentIntent.id);
        if (response.success) { toast.success('Payment successful! Booking confirmed.'); onSuccess(); }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        await confirmPayment(bookingId, paymentIntent.id);
        toast.success('Payment successful!'); onSuccess();
      }
    } catch (err) { const msg = err.message || 'Payment failed.'; setError(msg); toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HiCreditCard size={22} className="text-primary-600" /> Payment Details
        </h2>
        <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
          <PaymentElement />
        </div>
        {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        <div className="flex items-center gap-2 text-sm text-gray-500 justify-center mt-4">
          <HiShieldCheck className="text-green-500" size={16} />
          <span>Secured by Stripe. Encrypted.</span>
        </div>
      </div>
      <button type="submit" disabled={!stripe || loading}
        className="btn-primary w-full text-center py-3 text-base">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...
          </span>
        ) : ('Pay ' + formatPrice(booking.totalAmount))}
      </button>
    </form>
  );
};

const PaymentCheckout = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [intentLoading, setIntentLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (bookingId) fetchBooking(); }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await getBookingById(bookingId);
      const data = response.data;
      setBooking(data);
      if (data.status !== 'PENDING') {
        if (data.status === 'CONFIRMED') { toast.success('Already confirmed'); navigate('/bookings'); return; }
        setError('Cannot process payment. Status: ' + data.status);
      }
    } catch (err) { setError(err.message || 'Failed to load booking');
    } finally { setLoading(false); }
  };

  const handleProceedToPayment = async () => {
    setIntentLoading(true);
    try {
      const response = await createPaymentIntent(bookingId);
      setClientSecret(response.data.clientSecret);
    } catch (err) { toast.error(err.message || 'Failed to create payment');
    } finally { setIntentLoading(false); }
  };

  const handlePaymentSuccess = () => navigate('/bookings');

  if (loading) return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);
  if (error && !booking) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-4">{'😕'}</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Checkout unavailable</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <Link to="/bookings" className="btn-primary">My Bookings</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={'/listings/' + (booking?.listing?.id || '')} className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors">
          <HiChevronLeft size={20} /> Back to listing
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Payment</h1>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>
              {booking?.listing && (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={booking.listing.imageUrls?.[0] || '/placeholder.jpg'} alt={booking.listing.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{booking.listing.title}</p>
                    <p className="text-xs text-gray-500">{booking.listing.location}</p>
                  </div>
                </div>
              )}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <HiCalendar size={16} />
                  <span>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                    {booking.numberOfDays} {booking.numberOfDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Price Breakdown</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600"><span>{formatPrice(booking.dailyRate)} x {booking.numberOfDays} days</span><span>{formatPrice(booking.subtotal)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Platform fee (10%)</span><span>{formatPrice(booking.platformFee)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Service fee</span><span>{formatPrice(booking.serviceFee)}</span></div>
                {booking.securityDeposit > 0 && (
                  <div className="flex justify-between text-sm text-gray-600"><span>Security deposit (refundable)</span><span>{formatPrice(booking.securityDeposit)}</span></div>
                )}
                {booking.hasInsurance && (
                  <div className="flex items-center justify-between text-sm bg-green-50 p-2 rounded-lg">
                    <span className="flex items-center gap-1.5 text-green-700 font-medium">
                      <HiBadgeCheck size={16} /> Damage Protection
                    </span>
                    <span className="text-green-700">Included</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 text-base pt-3 border-t border-gray-100">
                  <span>Total</span><span>{formatPrice(booking.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            {!clientSecret ? (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="text-5xl mb-4">{'💳'}</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to pay?</h2>
                <p className="text-gray-500 mb-6">
                  Click below to securely pay <strong>{formatPrice(booking.totalAmount)}</strong> via Stripe.
                  Your payment will be authorized now and captured after return.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                  <HiShieldCheck className="text-green-500" size={18} />
                  <span>Protected by Stripe</span>
                </div>
                <button onClick={handleProceedToPayment} disabled={intentLoading}
                  className="btn-primary px-8 py-3 text-base">
                  {intentLoading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Preparing...
                    </span>
                  ) : ('Pay ' + formatPrice(booking.totalAmount))}
                </button>
              </div>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                <CheckoutForm booking={booking} clientSecret={clientSecret} bookingId={bookingId} onSuccess={handlePaymentSuccess} />
              </Elements>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCheckout;
