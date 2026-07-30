import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiCalendar, HiEye, HiCreditCard } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { formatPrice, formatDate, getPlaceholderImage } from '../utils/helpers';
import { getMyPayments } from '../services/paymentService';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      const response = await getMyPayments();
      setPayments(response.data || []);
    } catch (error) { toast.error('Failed to load payment history');
    } finally { setLoading(false); }
  };

  const statusStyles = {
    PENDING: 'bg-yellow-100 text-yellow-700', AUTHORIZED: 'bg-blue-100 text-blue-700',
    CAPTURED: 'bg-green-100 text-green-700', REFUNDED: 'bg-purple-100 text-purple-700',
    FAILED: 'bg-red-100 text-red-700', CANCELLED: 'bg-gray-100 text-gray-700',
  };

  if (loading) return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600 mt-2">View all your transactions</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {payments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">💳</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No payments yet</h2>
            <p className="text-gray-500 mb-6">Your payment history will appear here after you book an item</p>
            <Link to="/listings" className="btn-primary inline-flex items-center gap-2">Browse Rentals</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all animate-fade-in">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={payment.listing?.imageUrls?.[0] || getPlaceholderImage(payment.listing?.category)}
                      alt={payment.listing?.title} className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = getPlaceholderImage('default'); }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">{payment.listing?.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                          <HiCreditCard size={14} />
                          <span className="truncate">ID: {payment.paymentIntentId?.slice(0, 12)}...</span>
                        </div>
                      </div>
                      <span className={'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ' + (statusStyles[payment.status] || 'bg-gray-100 text-gray-700')}>
                        {payment.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                      {payment.booking && (
                        <span className="flex items-center gap-1">
                          <HiCalendar size={16} />
                          {formatDate(payment.booking.startDate)} - {formatDate(payment.booking.endDate)}
                        </span>
                      )}
                      {payment.capturedAt && (
                        <span className="flex items-center gap-1 text-green-600">Captured: {formatDate(payment.capturedAt)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div>
                        <span className="text-xl font-bold text-primary-600">{formatPrice(payment.amount)}</span>
                        {payment.securityDeposit > 0 && (
                          <span className="text-xs text-gray-400 ml-2">(Deposit: {formatPrice(payment.securityDeposit)})</span>
                        )}
                      </div>
                      <Link to={'/payments/' + payment.id}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 transition-colors px-4 py-2 border border-gray-200 rounded-lg hover:border-primary-200">
                        <HiEye size={16} /> Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;