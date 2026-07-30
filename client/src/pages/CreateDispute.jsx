import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { HiChevronLeft, HiPhotograph, HiX } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { createDispute } from '../services/disputeService';
import { getBookingById } from '../services/bookingService';
import { formatDate, formatPrice } from '../utils/helpers';

const R = ['Item Damaged','Item Missing','Late Return','Payment Issue','Item Not As Described','Other'];

const CreateDispute = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ reason:'', description:'', evidence:[''], damage:'' });
  const [errs, setErrs] = useState({});

  useEffect(() => { if (bookingId) fetchBook(); }, [bookingId]);

  const fetchBook = async () => {
    try {
      const r = await getBookingById(bookingId);
      if (r.data.status !== 'COMPLETED') {
        toast.error('Only completed bookings');
        navigate('/bookings/' + bookingId);
        return;
      }
      setBooking(r.data);
    } catch(e) {
      toast.error('Failed');
      navigate('/bookings');
    } finally { setLoading(false); }
  };

  const validate = () => {
    const e = {};
    if (!form.reason) e.reason = 'Required';
    if (!form.description || form.description.trim().length < 30) e.description = 'Min 30 chars';
    if (form.damage && (isNaN(parseFloat(form.damage)) || parseFloat(form.damage) < 0)) e.damage = 'Must be positive';
    const imgs = form.evidence.filter(u => u.trim());
    if (imgs.length > 10) e.evidence = 'Max 10';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSending(true);
    try {
      const r = await createDispute({
        bookingId,
        reason: form.reason,
        description: form.description.trim(),
        evidenceImages: form.evidence.filter(u => u.trim()),
        damageAmount: form.damage ? parseFloat(form.damage) : null,
      });
      toast.success('Dispute raised');
      navigate('/disputes/' + r.data.id);
    } catch(e) {
      toast.error(e.message || 'Failed');
    } finally { setSending(false); }
  };

  if (loading) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin' />
    </div>
  );

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <Link to={'/bookings/' + bookingId} className='inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors'>
          <HiChevronLeft size={20} /> Back
        </Link>
        <div className='bg-white rounded-2xl p-8 shadow-sm border border-gray-100'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Raise a Dispute</h1>
          <p className='text-gray-500 mb-6'>Report an issue with your completed rental.</p>
          {booking && (
            <div className='bg-gray-50 rounded-xl p-4 mb-6'>
              <p className='text-sm text-gray-600'><span className='font-medium'>Booking:</span> {booking.listing?.title}</p>
              <p className='text-sm text-gray-500 mt-1'>Total: {formatPrice(booking.totalAmount)}</p>
            </div>
          )}
          <form onSubmit={submit} className='space-y-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Reason *</label>
              <select value={form.reason} onChange={e => setForm(p => ({...p, reason: e.target.value}))}
                className={'w-full px-4 py-2.5 rounded-xl border ' + (errs.reason ? 'border-red-300' : 'border-gray-300') + ' focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all'}>
                <option value=''>Select</option>
                {R.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {errs.reason && <p className='mt-1 text-sm text-red-500'>{errs.reason}</p>}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Description *</label>
              <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                rows={5} maxLength={2000} placeholder='Describe the issue (min 30 chars)...'
                className={'w-full px-4 py-2.5 rounded-xl border ' + (errs.description ? 'border-red-300' : 'border-gray-300') + ' focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none'} />
              <p className='text-xs text-gray-400 text-right mt-1'>{form.description.length}/2000</p>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Damage Amount</label>
              <input type='number' min='0' step='0.01' value={form.damage} onChange={e => setForm(p => ({...p, damage: e.target.value}))}
                placeholder='0.00'
                className={'w-full px-4 py-2.5 rounded-xl border ' + (errs.damage ? 'border-red-300' : 'border-gray-300') + ' focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all'} />
              {errs.damage && <p className='mt-1 text-sm text-red-500'>{errs.damage}</p>}
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Evidence Images (max 10)</label>
              {form.evidence.map((url, i) => (
                <div key={i} className='flex items-center gap-2 mt-2'>
                  <input type='url' value={url} onChange={e => {
                    const u = [...form.evidence]; u[i] = e.target.value; setForm(p => ({...p, evidence: u}));
                  }} placeholder='https://...' className='flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm' />
                  {form.evidence.length > 1 && (
                    <button type='button' onClick={() => setForm(p => ({...p, evidence: p.evidence.filter((_, j) => j !== i)}))}
                      className='p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all'><HiX size={18} /></button>
                  )}
                </div>
              ))}
              <button type='button' onClick={() => setForm(p => ({...p, evidence: [...p.evidence, '']}))}
                className='mt-2 flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors'>
                <HiPhotograph size={16} /> Add image URL
              </button>
              {errs.evidence && <p className='mt-1 text-sm text-red-500'>{errs.evidence}</p>}
            </div>
            <div className='flex gap-3 pt-4'>
              <button type='submit' disabled={sending}
                className='flex-1 px-6 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50'>
                {sending ? 'Submitting...' : 'Submit Dispute'}
              </button>
              <Link to={'/bookings/' + bookingId}
                className='px-6 py-3 text-sm font-semibold text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all'>Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateDispute;
