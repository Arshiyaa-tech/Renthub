import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiSearch, HiChevronRight, HiPhotograph } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getAllDisputes, updateDisputeStatus } from '../services/disputeService';
import { formatDate, getPlaceholderImage } from '../utils/helpers';

var ss = {OPEN:'bg-yellow-100 text-yellow-700',UNDER_REVIEW:'bg-blue-100 text-blue-700',APPROVED:'bg-green-100 text-green-700',REJECTED:'bg-red-100 text-red-700',RESOLVED:'bg-gray-100 text-gray-700'};

var AdminDisputes = () => {
  var [d,setD]=useState([]);var[s,setS]=useState({});var[ld,setLd]=useState(true);var[aL,setAL]=useState(null);
  var [f,setF]=useState('');var[so,setSo]=useState('newest');var[se,setSe]=useState('');
  var [sl,setSl]=useState(null);var[n,setN]=useState('');var[rs,setRs]=useState('');var[sh,setSh]=useState(false);var[ac,setAc]=useState('');
  useEffect(()=>{fetchD()},[f,so]);
  var fetchD=async()=>{setLd(true);try{var p={};if(f)p.status=f;if(so)p.sort=so;var r=await getAllDisputes(p);setD(r.data||[]);setS(r.stats||{})}catch(e){toast.error('Failed')}finally{setLd(false)}};
  var upd=async(id,st)=>{setAL(id+st);try{var data={status:st};if(n)data.adminNotes=n;if(rs&&(st==='APPROVED'||st==='RESOLVED'))data.resolution=rs;await updateDisputeStatus(id,data);toast.success('Updated');setSh(false);setN('');setRs('');setSl(null);fetchD()}catch(e){toast.error(e.message||'Failed')}finally{setAL(null)}};
  var open=(d,a)=>{setSl(d);setAc(a);setSh(true)};
  var filt=se?d.filter(x=>x.reason?.toLowerCase().includes(se.toLowerCase())||x.booking?.listing?.title?.toLowerCase().includes(se.toLowerCase())||x.raisedBy?.fullName?.toLowerCase().includes(se.toLowerCase())):d;
  var fl=[{v:'',l:'All'},{v:'OPEN',l:'Open'},{v:'UNDER_REVIEW',l:'Review'},{v:'APPROVED',l:'Approved'},{v:'REJECTED',l:'Rejected'},{v:'RESOLVED',l:'Resolved'}];
  var ga=(s)=>{switch(s){case'OPEN':return[{l:'Review',a:'UNDER_REVIEW',v:'primary'}];case'UNDER_REVIEW':return[{l:'Approve',a:'APPROVED',v:'success'},{l:'Reject',a:'REJECTED',v:'danger'}];case'APPROVED':return[{l:'Resolve',a:'RESOLVED',v:'primary'}];default:return[];}};
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <h1 className='text-2xl font-bold text-gray-900 mb-6'>Admin: Disputes</h1>
        <div className='grid grid-cols-3 md:grid-cols-6 gap-4 mb-6'>{fl.map(x=>(
          <button key={x.v} onClick={()=>setF(x.v)} className={'p-4 rounded-xl text-center transition-all '+(f===x.v?'bg-primary-600 text-white shadow-md':'bg-white border shadow-sm')}>
          <p className={'text-2xl font-bold '+(f===x.v?'text-white':'text-gray-900')}>{x.v?(s[x.v.toLowerCase()]||0):(d.length||0)}</p>
          <p className={'text-xs mt-1 '+(f===x.v?'text-primary-100':'text-gray-500')}>{x.l}</p></button>))}</div>
        <div className='flex gap-4 mb-6'><input type='text' value={se} onChange={e=>setSe(e.target.value)} placeholder='Search...' className='flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500' />
        <select value={so} onChange={e=>setSo(e.target.value)} className='px-4 py-3 rounded-xl border border-gray-300'><option value='newest'>Newest</option><option value='oldest'>Oldest</option></select></div>
        {ld?<div className='py-20 text-center'><div className='w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto'/></div>
        :filt.length===0?<div className='bg-white rounded-2xl p-12 text-center'><div className='text-5xl mb-4'>&#128220;</div><h3>No disputes</h3></div>
        :<div className='space-y-4'>{filt.map(dp=>{var acts=ga(dp.status);return(
          <div key={dp.id} className='bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md'>
            <div className='flex gap-4'>
              <img src={getPlaceholderImage()} alt='' className='w-16 h-16 rounded-xl object-cover' />
              <div className='flex-1'>
                <div className='flex justify-between'>
                  <div><h3 className='font-semibold'>{dp.reason}</h3><p className='text-sm text-gray-600'>{dp.booking?.listing?.title}</p></div>
                  <span className={'px-3 py-1 rounded-full text-xs font-semibold '+(ss[dp.status]||'')}>{dp.status.replace(/_/g,' ')}</span></div>
                <p className='text-xs text-gray-500 mt-2'>{dp.raisedBy?.fullName} vs {dp.againstUser?.fullName} | {formatDate(dp.createdAt)}</p>
                {acts.length>0&&<div className='mt-3 flex gap-2'>{acts.map(a=>(
                  <button key={a.a} onClick={()=>open(dp,a.a)} disabled={aL===dp.id+a.a}
                    className={'px-3 py-1 text-xs font-semibold rounded-lg '+{primary:'bg-primary-600 text-white',success:'bg-green-600 text-white',danger:'bg-red-600 text-white'}[a.v]}>
                    {aL===dp.id+a.a?'...':a.l}</button>))}
                  <Link to={'/disputes/'+dp.id} className='px-3 py-1 text-xs text-gray-600 border rounded-lg'>Details</Link></div>}</div></div>);})}</div>}
        {sh&&sl&&<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40' onClick={()=>setSh(false)}>
          <div className='bg-white rounded-2xl p-6 max-w-lg w-full mx-4' onClick={e=>e.stopPropagation()}>
            <h2 className='text-lg font-semibold mb-4'>{ac==='APPROVED'?'Approve':ac==='REJECTED'?'Reject':ac==='UNDER_REVIEW'?'Review':ac==='RESOLVED'?'Resolve':'Update'}</h2>
            <p className='text-sm text-gray-600 mb-4'>{sl.reason} - {sl.booking?.listing?.title}</p>
            <textarea value={n} onChange={e=>setN(e.target.value)} rows={3} placeholder='Admin notes...' className='w-full px-4 py-2.5 rounded-xl border resize-none mb-4' />
            {(ac==='APPROVED'||ac==='RESOLVED')&&<input type='text' value={rs} onChange={e=>setRs(e.target.value)} placeholder='Resolution...' className='w-full px-4 py-2.5 rounded-xl border mb-4' />}
            <div className='flex gap-3'>
              <button onClick={()=>upd(sl.id,ac)} disabled={aL===sl.id+ac}
                className='flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700'>{aL===sl.id+ac?'...':'Confirm'}</button>
              <button onClick={()=>setSh(false)} className='px-4 py-2.5 text-sm border rounded-xl'>Cancel</button></div></div></div>}
      </div></div>);};export default AdminDisputes;