import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiSearch } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getAllDisputes, updateDisputeStatus } from '../services/disputeService';
import { formatDate, getPlaceholderImage } from '../utils/helpers';

const ss = {OPEN:'bg-yellow-100 text-yellow-700',UNDER_REVIEW:'bg-blue-100 text-blue-700',APPROVED:'bg-green-100 text-green-700',REJECTED:'bg-red-100 text-red-700',RESOLVED:'bg-gray-100 text-gray-700'};

const AdminDisputes = () => {
  const [d, setD] = useState([]); const [s, setS] = useState({});
  const [ld, setLd] = useState(true); const [aL, setAL] = useState(null);
  const [f, setF] = useState(''); const [so, setSo] = useState('newest'); const [se, setSe] = useState('');
  const [sl, setSl] = useState(null); const [n, setN] = useState(''); const [rs, setRs] = useState('');
  const [sh, setSh] = useState(false); const [ac, setAc] = useState('');

  useEffect(() => { fetchD(); }, [f, so]);

  const fetchD = async () => {
    setLd(true);
    try {
      const p = {}; if (f) p.status = f; if (so) p.sort = so;
      const r = await getAllDisputes(p);
      setD(r.data || []); setS(r.stats || {});
    } catch(e) { toast.error('Failed'); } finally { setLd(false); }
  };

  const upd = async (id, st) => {
    setAL(id + st);
    try {
      const data = { status: st };
      if (n) data.adminNotes = n;
      if (rs && (st === 'APPROVED' || st === 'RESOLVED')) data.resolution = rs;
      await updateDisputeStatus(id, data);
      toast.success('Updated'); setSh(false); setN(''); setRs(''); setSl(null); fetchD();
    } catch(e) { toast.error(e.message || 'Failed'); } finally { setAL(null); }
  };

  const open = (item, action) => { setSl(item); setAc(action); setSh(true); };

  const filt = se ? d.filter(x =>
    x.reason?.toLowerCase().includes(se.toLowerCase()) ||
    x.booking?.listing?.title?.toLowerCase().includes(se.toLowerCase()) ||
    x.raisedBy?.fullName?.toLowerCase().includes(se.toLowerCase())
  ) : d;

  const fl = [
    { v: '', l: 'All' }, { v: 'OPEN', l: 'Open' }, { v: 'UNDER_REVIEW', l: 'Review' },
    { v: 'APPROVED', l: 'Approved' }, { v: 'REJECTED', l: 'Rejected' }, { v: 'RESOLVED', l: 'Resolved' },
  ];

  const ga = (st) => {
    switch(st) {
      case 'OPEN': return [{ l: 'Review', a: 'UNDER_REVIEW', v: 'primary' }];
      case 'UNDER_REVIEW': case 'MORE_INFORMATION_REQUIRED':
        return [{ l: 'Approve', a: 'APPROVED', v: 'success' }, { l: 'Reject', a: 'REJECTED', v: 'danger' }];
      case 'APPROVED': return [{ l: 'Resolve', a: 'RESOLVED', v: 'primary' }];
      default: return [];
    }
  };

  const cnt = (v) => {
    if (!v) return d.length;
    const key = v.toLowerCase() === 'under_review' ? 'underReview' : v.toLowerCase();
    return s[key] || 0;
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <h1 className='text-2xl font-bold text-gray-900 mb-6'>Admin: Disputes</h1>
        <div className='grid grid-cols-3 md:grid-cols-6 gap-4 mb-6'>
          {fl.map(x => (
            <button key={x.v} onClick={() => setF(x.v)}
              className={'p-4 rounded-xl text-center transition-all ' + (f === x.v ? 'bg-primary-600 text-white shadow-md' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md')}>
              <p className={'text-2xl font-bold ' + (f === x.v ? 'text-white' : 'text-gray-900')}>{cnt(x.v)}</p>
              <p className={'text-xs mt-1 ' + (f === x.v ? 'text-primary-100' : 'text-gray-500')}>{x.l}</p>
            </button>
          ))}
        </div>
        <div className='flex flex-col md:flex-row gap-4 mb-6'>
          <div className='relative flex-1'>
            <HiSearch className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' size={20} />
            <input type='text' value={se} onChange={e => setSe(e.target.value)} placeholder='Search...'
              className='w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all' />
          </div>
          <select value={so} onChange={e => setSo(e.target.value)}
            className='px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all'>
            <option value='newest'>Newest</option>
            <option value='oldest'>Oldest</option>
          </select>
        </div>
        {ld ? (
          <div className='flex items-center justify-center py-20'><div className='w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin' /></div>
        ) : filt.length === 0 ? (
          <div className='bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center'>
            <div className='text-5xl mb-4'>&#128220;</div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>No disputes</h3>
          </div>
        ) : (
          <div className='space-y-4'>
            {filt.map(dp => {
              const acts = ga(dp.status);
              return (
                <div key={dp.id} className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all'>
                  <div className='flex flex-col md:flex-row md:items-start gap-4'>
                    <img src={getPlaceholderImage()} alt='' className='w-16 h-16 rounded-xl object-cover flex-shrink-0' />
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-4'>
                        <div>
                          <h3 className='font-semibold text-gray-900'>{dp.reason}</h3>
                          <p className='text-sm text-gray-600 mt-1'>{dp.booking?.listing?.title}</p>
                        </div>
                        <span className={'px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ' + (ss[dp.status] || '')}>{dp.status.replace(/_/g, ' ')}</span>
                      </div>
                      <p className='text-xs text-gray-500 mt-2'>{dp.raisedBy?.fullName} vs {dp.againstUser?.fullName} | {formatDate(dp.createdAt)}</p>
                      {acts.length > 0 && (
                        <div className='mt-3 flex flex-wrap gap-2'>
                          {acts.map(a => (
                            <button key={a.a} onClick={() => open(dp, a.a)} disabled={aL === dp.id + a.a}
                              className={'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ' + {primary:'bg-primary-600 text-white hover:bg-primary-700',success:'bg-green-600 text-white hover:bg-green-700',danger:'bg-red-600 text-white hover:bg-red-700'}[a.v]}>
                              {aL === dp.id + a.a ? '...' : a.l}
                            </button>
                          ))}
                          <Link to={'/disputes/' + dp.id} className='px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all'>Details</Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {sh && sl && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm' onClick={() => setSh(false)}>
            <div className='bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl' onClick={e => e.stopPropagation()}>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>{ac === 'APPROVED' ? 'Approve' : ac === 'REJECTED' ? 'Reject' : ac === 'UNDER_REVIEW' ? 'Review' : ac === 'RESOLVED' ? 'Resolve' : 'Update'}</h2>
              <p className='text-sm text-gray-600 mb-4'>{sl.reason} - {sl.booking?.listing?.title}</p>
              <div className='space-y-4'>
                <div><label className='block text-sm font-medium text-gray-700 mb-1'>Notes</label>
                  <textarea value={n} onChange={e => setN(e.target.value)} rows={3} placeholder='Optional...'
                    className='w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none' /></div>
                {(ac === 'APPROVED' || ac === 'RESOLVED') && <div><label className='block text-sm font-medium text-gray-700 mb-1'>Resolution</label>
                  <input type='text' value={rs} onChange={e => setRs(e.target.value)} placeholder='Describe...' className='w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all' /></div>}
              </div>
              <div className='flex gap-3 mt-6'>
                <button onClick={() => upd(sl.id, ac)} disabled={aL === sl.id + ac}
                  className='flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50'>{aL === sl.id + ac ? '...' : 'Confirm'}</button>
                <button onClick={() => setSh(false)} className='px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all'>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDisputes;
