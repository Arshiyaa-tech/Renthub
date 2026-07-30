import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiChevronLeft, HiCalendar, HiPhotograph, HiShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getDisputeById } from '../services/disputeService';
import { formatDate, formatPrice, getInitials } from '../utils/helpers';

var ss = {OPEN:'bg-yellow-100 text-yellow-700',UNDER_REVIEW:'bg-blue-100 text-blue-700',MORE_INFORMATION_REQUIRED:'bg-purple-100 text-purple-700',APPROVED:'bg-green-100 text-green-700',REJECTED:'bg-red-100 text-red-700',RESOLVED:'bg-gray-100 text-gray-700'};
var st = ['OPEN','UNDER_REVIEW','MORE_INFORMATION_REQUIRED','APPROVED','REJECTED','RESOLVED'];

var DisputeDetails = () => {
  var {id} = useParams(); var [d,setD] = useState(null); var [loading,setLoading] = useState(true); var [error,setError] = useState('');
  useEffect(()=>{fetchD()},[id]);
  var fetchD = async()=>{try{var r=await getDisputeById(id);setD(r.data)}catch(e){setError(e.message||'Failed')}finally{setLoading(false)}};
  if(loading) return <div className='min-h-screen bg-gray-50 flex items-center justify-center'><div className='w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin'/></div>;
  if(error||!d) return <div className='min-h-screen bg-gray-50 flex items-center justify-center text-center'><div><div className='text-5xl mb-4'>&#128533;</div><h2 className='text-2xl font-semibold text-gray-900 mb-2'>Not found</h2><Link to='/disputes' className='btn-primary'>My Disputes</Link></div></div>;
  var ci = st.indexOf(d.status); var ri = getInitials(d.raisedBy?.fullName); var ai = getInitials(d.againstUser?.fullName);
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <Link to='/disputes' className='inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6'><HiChevronLeft size={20} /> Back</Link>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2 space-y-6'>
            <div className='bg-white rounded-2xl p-8 shadow-sm border border-gray-100'>
              <div className='flex items-start justify-between mb-4'>
                <div><h1 className='text-2xl font-bold text-gray-900'>Dispute: {d.reason}</h1><p className='text-gray-500 mt-1'>{d.booking?.listing?.title}</p></div>
                <span className={'px-4 py-1.5 rounded-full text-sm font-semibold '+(ss[d.status]||'')}>{d.status.replace(/_/g,' ')}</span></div>
              <div className='flex items-center gap-4 text-sm text-gray-500'><HiCalendar size={16} /> {formatDate(d.createdAt)} <span>ID: {d.id.slice(0,8)}</span></div></div>
            <div className='bg-white rounded-2xl p-8 shadow-sm border border-gray-100'>
              <h2 className='text-lg font-semibold text-gray-900 mb-6'>Timeline</h2>
              {st.map((s,i)=>{var a=i<=ci;var cur=i===ci;return(
                <div key={s} className='flex items-start gap-4 pb-6 relative'>
                  {i<st.length-1&&<div className={'absolute left-[15px] top-8 w-0.5 h-[calc(100%-24px)] '+(a&&ci>i?'bg-primary-400':'bg-gray-200')} />}
                  <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 z-10 '+(cur?'bg-primary-600 text-white ring-4 ring-primary-100':a?'bg-primary-400 text-white':'bg-gray-200 text-gray-400')}>{cur?i+1:a?String.fromCharCode(10003):i+1}</div>
                  <div className='pt-1'><p className={'text-sm font-medium '+(a?'text-gray-900':'text-gray-400')}>{s.replace(/_/g,' ')}</p></div></div>);})}</div>
            <div className='bg-white rounded-2xl p-8 shadow-sm border border-gray-100'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'>Description</h2>
              <p className='text-gray-700 leading-relaxed whitespace-pre-wrap'>{d.description}</p>
              {d.damageAmount>0&&<div className='mt-4 p-4 bg-orange-50 rounded-xl'><p className='text-sm font-medium text-orange-700'>Damage: {formatPrice(d.damageAmount)}</p></div>}</div>
            {d.evidenceImages?.length>0&&<div className='bg-white rounded-2xl p-8 shadow-sm border border-gray-100'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'><HiPhotograph size={20} className='inline' /> Evidence ({d.evidenceImages.length})</h2>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                {d.evidenceImages.map((u,i)=><a key={i} href={u} target='_blank' className='block aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-90'><img src={u} alt={'E'+(i+1)} className='w-full h-full object-cover'/></a>)}</div></div>}
            {d.adminNotes&&<div className='bg-white rounded-2xl p-8 shadow-sm border border-gray-100'>
              <h2 className='text-lg font-semibold text-gray-900 mb-4'><HiShieldCheck size={20} className='text-primary-600 inline' /> Admin</h2>
              <p className='text-gray-700 leading-relaxed'>{d.adminNotes}</p>
              {d.resolution&&<div className='mt-4 p-4 bg-blue-50 rounded-xl'><p className='text-sm font-medium text-blue-700'>Resolution: {d.resolution}</p></div>}</div>}</div>
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24 space-y-6'>
              <div><h3 className='text-sm font-medium text-gray-500 mb-4'>Participants</h3>
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'><div className='w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm'>{ri}</div><div><p className='font-medium text-sm text-gray-900'>{d.raisedBy?.fullName}</p><p className='text-xs text-gray-500'>Raised</p></div></div>
                  <div className='flex items-center gap-3'><div className='w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-sm'>{ai}</div><div><p className='font-medium text-sm text-gray-900'>{d.againstUser?.fullName}</p><p className='text-xs text-gray-500'>Respondent</p></div></div></div></div>
              <div className='pt-4 border-t border-gray-100'>
                <h3 className='text-sm font-medium text-gray-500 mb-3'>Booking</h3>
                <div className='text-sm text-gray-700 space-y-2'>
                  <p><span className='font-medium'>Item:</span> {d.booking?.listing?.title}</p>
                  <p><span className='font-medium'>Total:</span> {formatPrice(d.booking?.totalAmount)}</p></div></div></div></div></div></div></div>); }; export default DisputeDetails;