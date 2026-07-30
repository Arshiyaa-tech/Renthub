import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiCalendar, HiChevronLeft, HiCheck, HiX, HiShieldCheck, HiCreditCard } from 'react-icons/hi';
import { formatPrice, formatDate, getInitials } from '../utils/helpers';
import { getPaymentById } from '../services/paymentService';
import useAuth from '../hooks/useAuth';

const PaymentDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchPayment(); }, [id]);

  const fetchPayment = async () => {
    try {
      const response = await getPaymentById(id);
      setPayment(response.data);
    } catch (err) { setError(err.message || 'Failed to load payment');
    } finally { setLoading(false); }
  };

  if (loading) return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);
  if (error || !payment) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-4">😕</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment not found</h2>
        <Link to="/payments" className="btn-primary">Payment History</Link>
      </div>
    </div>
  );

  const statusStyles = {
    PENDING: 'bg-yellow-100 text-yellow-700', AUTHORIZED: 'bg-blue-100 text-blue-700',
    CAPTURED: 'bg-green-100 text-green-700', REFUNDED: 'bg-purple-100 text-purple-700',
    FAILED: 'bg-red-100 text-red-700', CANCELLED: 'bg-gray-100 text-gray-700',
  };

  const statusTimeline = ['PENDING', 'AUTHORIZED', 'CAPTURED'];
  const currentIdx = statusTimeline.indexOf(payment.status);
  const isOwner = user?.id === payment.owner?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/payments" className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors">
          <HiChevronLeft size={20} /> Back
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{payment.listing?.title}</h1>
                  <div className="flex items-center gap-2 mt-2 text-gray-600">
                    <HiCreditCard size={18} />
                    <span>ID: {payment.paymentIntentId?.slice(0, 16)}...</span>
                  </div>
                </div>
                <span className={'px-4 py-1.5 rounded-full text-sm font-semibold ' + (statusStyles[payment.status] || '')}>{payment.status}</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Status</h2>
              <div className="flex items-start gap-0">
                {statusTimeline.map((s, i) => (
                  <div key={s} className="flex-1 flex flex-col items-center">
                    <div className={'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ' + (i <= currentIdx ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400')}>
                      {i < currentIdx ? <HiCheck size={20} /> : i === currentIdx ? i + 1 : <HiX size={20} />}
                    </div>
                    <p className={'text-xs mt-2 font-medium ' + (i <= currentIdx ? 'text-primary-600' : 'text-gray-400')}>{s}</p>
                    <p className="text-[10px] text-gray-400 text-center mt-0.5">
                      {i === 0 && formatDate(payment.createdAt)}
                      {i === 2 && payment.capturedAt && formatDate(payment.capturedAt)}
                    </p>
                    {i < statusTimeline.length - 1 && (
                      <div className={'h-1 w-full max-w-[40px] -mt-5 ' + (i < currentIdx ? 'bg-primary-400' : 'bg-gray-200')} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Participants</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">{getInitials(payment.owner?.fullName)}</div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{payment.owner?.fullName}</p>
                    <p className="text-xs text-gray-500">{isOwner ? 'You (Owner)' : 'Owner'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">{getInitials(payment.renter?.fullName)}</div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{payment.renter?.fullName}</p>
                    <p className="text-xs text-gray-500">{!isOwner ? 'You (Renter)' : 'Renter'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Amount Breakdown</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600"><span>Total</span><span className="font-medium">{formatPrice(payment.amount)}</span></div>
                {payment.securityDeposit > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Deposit</span><span>{formatPrice(payment.securityDeposit)}</span></div>}
                {payment.platformFee > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Platform fee</span><span>{formatPrice(payment.platformFee)}</span></div>}
                {payment.serviceFee > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Service fee</span><span>{formatPrice(payment.serviceFee)}</span></div>}
                <div className="flex justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                  <span>Currency</span><span className="uppercase">{payment.currency}</span>
                </div>
                {payment.paymentIntentId && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 break-all">Stripe: {payment.paymentIntentId}</p>
                  </div>
                )}
              </div>
              {payment.booking && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Booking</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <HiCalendar size={16} />
                    <span>{formatDate(payment.booking.startDate)} - {formatDate(payment.booking.endDate)}</span>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">{payment.booking.numberOfDays}d {` \u00B7 ${formatPrice(payment.booking.dailyRate)}/day`}</span>
                </div>
              )}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <button disabled className="w-full text-center text-sm text-gray-400 py-2 border border-dashed border-gray-300 rounded-lg cursor-not-allowed">Receipt (Coming Soon)</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;