
import React from 'react';
import { TaskAlert } from '../types';
import { Bell, X, Clock, AlertCircle, Info, ShieldCheck, ShieldAlert } from 'lucide-react';

interface NotificationCenterProps {
  notifications: TaskAlert[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  notifPermission?: string;
  onRequestPermission?: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, onClose, onMarkRead, onClearAll, notifPermission, onRequestPermission 
}) => {
  return (
    <div className="fixed top-20 right-6 z-50 w-80 md:w-96 animate-popup-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[70vh]">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2"><Bell size={18} /><span className="font-bold">Thông báo của bạn</span></div>
          <div className="flex gap-2">
            <button onClick={onClearAll} className="text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-colors">Xóa tất cả</button>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {notifPermission === 'granted' ? <ShieldCheck size={14} className="text-green-600" /> : <ShieldAlert size={14} className="text-orange-500" />}
            <span className="text-[10px] font-black uppercase text-slate-500">Thông báo hệ thống: {notifPermission === 'granted' ? 'Đã bật' : 'Chưa bật'}</span>
          </div>
          {notifPermission !== 'granted' && <button onClick={onRequestPermission} className="text-[10px] font-black text-blue-600 hover:underline uppercase">Bật ngay</button>}
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-10 text-center"><p className="text-slate-400 text-sm font-medium">Không có thông báo mới</p></div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <div key={n.id} className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer group relative ${!n.read ? 'bg-blue-50/30' : ''}`} onClick={() => onMarkRead(n.id)}>
                  <div className="flex gap-3">
                    <div className={`mt-1 p-2 rounded-lg shrink-0 ${n.type === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {n.type === 'urgent' ? <AlertCircle size={16} /> : <Clock size={16} />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm leading-snug ${!n.read ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(n.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    {!n.read && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
