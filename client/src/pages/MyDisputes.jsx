import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiChevronRight, HiCalendar } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getMyDisputes, deleteDispute } from '../services/disputeService';
import { formatDate, getPlaceholderImage } from '../utils/helpers';

const ss = {
  OPEN:'bg-yellow-100 text-yellow-700',
  UNDER_REVIEW:'bg-blue-100 text-blue-700',
  MORE_INFORMATION_REQUIRED:'bg-purple-100 text-purple-700',
  APPROVED:'bg-green-100 text-green-700',
  REJECTED:'bg-red-100 text-red-700',
  RESOLVED:'bg-gray-100 text-gray-700'
};

const MyDisputes = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchD(); }, []);

  const fetchD = async () => {
    try { const r = await getMyDisputes(); setList(r.data || []); }
    catch(e) { toast.error('Failed'); } finally { setLoading(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this dispute?')) return;
    setDeleting(id);
    try { await deleteDispute(id); toast.success('Deleted'); fetchD(); }
    catch(e) { toast.error(e.message || 'Failed'); } finally { setDeleting(null); }
  };

  if (loading) return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin' />
    </div>
  );

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <h1 className='text-2xl font-bold text-gray-900 mb-6'>My Disputes</h1>
        {list.length === 0 ? (
          <div className='bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center'>
            <div className='text-5xl mb-4'>&#128220;</div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>No disputes yet</h3>
            <p className='text-gray-500 mb-6'>Raise a dispute for completed bookings.</p>
            <Link to='/bookings' className='btn-primary'>My Bookings</Link>
          </div>
        ) : (
          <div className='space-y-4'>
            {list.map(d => (
              <div key={d.id} className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-start gap-4 flex-1 min-w-0'>
                    <img src={getPlaceholderImage()} alt='' className='w-16 h-16 rounded-xl object-cover flex-shrink-0' />
                    <div className='min-w-0'>
                      <h3 className='font-semibold text-gray-900 truncate'>{d.booking?.listing?.title || 'Listing'}</h3>
                      <p className='text-sm text-gray-500 mt-1'>{d.reason}</p>
                      <div className='flex items-center gap-2 mt-2 text-xs text-gray-400'>
                        <HiCalendar size={14} /> <span>{formatDate(d.createdAt)}</span>
                        <span className='text-gray-300'>|</span> <span>vs {d.againstUser?.fullName}</span>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-3 flex-shrink-0'>
                    <span className={'px-3 py-1 rounded-full text-xs font-semibold ' + (ss[d.status] || 'bg-gray-100')}>
                      {d.status.replace(/_/g, ' ')}
                    </span>
                    <Link to={'/disputes/' + d.id} className='p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all'>
                      <HiChevronRight size={20} />
                    </Link>
                  </div>
                </div>
                {d.status === 'OPEN' && (
                  <div className='mt-4 pt-4 border-t border-gray-100'>
                    <button onClick={() => del(d.id)} disabled={deleting === d.id}
                      className='text-sm text-red-600 hover:text-red-700 font-medium transition-colors'>
                      {deleting === d.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDisputes;
