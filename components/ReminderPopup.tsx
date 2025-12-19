
import React from 'react';
import { WorkItem, Official } from '../types';
import { Bell, X, MapPin, Clock, Calendar, CheckCircle, Coffee, AlertTriangle } from 'lucide-react';

interface ReminderPopupProps {
  item: WorkItem;
  official: Official;
  type?: 'daily' | 'upcoming';
  onClose: () => void;
}

const ReminderPopup: React.FC<ReminderPopupProps> = ({ item, official, type = 'upcoming', onClose }) => {
  const isDaily = type === 'daily';

  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-popup-in max-w-[400px] w-full">
      <div className="glass-effect border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.25)] rounded-2xl overflow-hidden ring-1 ring-slate-900/5">
        {/* Header with status-based gradient indicator */}
        <div className={`h-2 bg-gradient-to-r ${isDaily ? 'from-blue-500 to-indigo-600' : 'from-red-500 to-orange-600'}`}></div>
        
        <div className="p-6">
          {/* Top Row: Icon & Actions */}
          <div className="flex justify-between items-start mb-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`${isDaily ? 'bg-blue-50 text-blue-600 ring-blue-50/50' : 'bg-red-50 text-red-600 ring-red-50/50'} p-3 rounded-2xl ring-4`}>
                  {isDaily ? <Coffee size={24} className="animate-bounce" /> : <AlertTriangle size={24} className="animate-pulse" />}
                </div>
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDaily ? 'bg-blue-400' : 'bg-red-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white ${isDaily ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                  {isDaily ? 'Chào buổi sáng!' : 'Nhắc lịch sắp diễn ra'}
                </h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  {isDaily ? 'Lịch công tác trong ngày' : 'Còn 60 phút nữa'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Profile Summary */}
          <div className="flex items-center gap-3 mb-5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className={`w-11 h-11 ${isDaily ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'} rounded-full flex items-center justify-center font-black text-lg shrink-0 border-2 border-white shadow-sm`}>
              {official.name.split(' ').pop()?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{official.name}</p>
              <p className="text-[10px] text-slate-500 font-bold truncate tracking-tight uppercase">{official.title}</p>
            </div>
          </div>

          {/* Content Details */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-inner-sm">
              <div className={`flex items-center gap-2 text-[11px] font-black mb-2 tracking-widest uppercase ${isDaily ? 'text-blue-600' : 'text-red-600'}`}>
                <Calendar size={13} />
                <span>{item.day}, {item.date.split('-').reverse().join('/')}</span>
              </div>
              <p className="text-[16px] text-slate-800 leading-snug font-bold">
                {item.description}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 bg-slate-900 text-white p-4 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Clock size={16} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Thời gian</p>
                  <p className="text-sm font-black">{item.time} ({item.period})</p>
                </div>
              </div>
              <div className="h-px bg-white/5 w-full"></div>
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                  <MapPin size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Địa điểm</p>
                  <p className="text-sm font-bold truncate max-w-[280px]">{item.location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all active:scale-95 uppercase tracking-widest"
            >
              Để sau
            </button>
            <button 
              onClick={onClose}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 ${isDaily ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'} text-white text-xs font-black rounded-xl transition-all shadow-lg active:scale-95 uppercase tracking-widest`}
            >
              <CheckCircle size={16} />
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderPopup;
