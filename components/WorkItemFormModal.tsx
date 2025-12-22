
import React from 'react';
import { WorkItem, Official } from '../types';
import { 
  X, Calendar, Clock, User, AlignLeft, MapPin, 
  BellRing, Save
} from 'lucide-react';

interface WorkItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: WorkItem) => void;
  editingItem: WorkItem | null;
  officials: Official[];
  prefill: { date: string, officialId: string } | null;
  selectedDate: Date;
}

const WorkItemFormModal: React.FC<WorkItemFormModalProps> = ({
  isOpen, onClose, onSubmit, editingItem, officials, prefill, selectedDate
}) => {
  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const time = formData.get('time') as string;
    
    const itemData: WorkItem = {
      id: editingItem ? editingItem.id : Math.random().toString(36).substr(2, 9),
      day: 'Thứ Hai', // Sẽ được tính toán lại dựa trên date thực tế hoặc logic cha
      date: formData.get('date') as string, 
      time: time,
      period: time.split(':')[0] < '12' ? 'Sáng' : 'Chiều',
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      officialId: formData.get('officialId') as string,
      remind: formData.get('remind') === 'on',
    };
    
    onSubmit(itemData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-xl w-full overflow-hidden animate-popup-in border border-white/20 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 px-8 py-5 text-white flex justify-between items-center relative shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-900/20">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">
                {editingItem ? 'Cập nhật lịch' : 'Thêm công tác'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Hệ thống quản lý Long Phú</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 md:p-8 space-y-5 overflow-y-auto custom-scrollbar">
            {/* Hàng 1: Ngày & Giờ */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  <Calendar size={12} className="text-red-500" /> Ngày thực hiện
                </label>
                <input 
                  name="date" 
                  type="date" 
                  defaultValue={editingItem?.date || prefill?.date || selectedDate.toISOString().split('T')[0]} 
                  required 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all shadow-inner-sm" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  <Clock size={12} className="text-red-500" /> Thời gian (24h)
                </label>
                <input 
                  name="time" 
                  type="time" 
                  defaultValue={editingItem?.time || ''} 
                  required 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all shadow-inner-sm" 
                />
              </div>
            </div>

            {/* Hàng 2: Cán bộ */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                <User size={12} className="text-red-500" /> Người phụ trách chính
              </label>
              <select 
                name="officialId" 
                defaultValue={editingItem?.officialId || prefill?.officialId || officials[0]?.id} 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all shadow-inner-sm appearance-none"
              >
                {officials.map(o => <option key={o.id} value={o.id}>{o.name} - {o.title}</option>)}
              </select>
            </div>

            {/* Hàng 3: Địa điểm (Đã đưa ra ngoài) */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                <MapPin size={12} className="text-red-500" /> Địa điểm công tác
              </label>
              <div className="relative">
                <input 
                  name="location" 
                  defaultValue={editingItem?.location || ''} 
                  required 
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all shadow-inner-sm" 
                  placeholder="Nhập địa điểm (HT UBND, Phòng họp...)" 
                />
                <MapPin className="absolute left-3.5 top-4 text-slate-400" size={18} />
              </div>
            </div>

            {/* Hàng 4: Nội dung */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                <AlignLeft size={12} className="text-red-500" /> Nội dung công việc
              </label>
              <textarea 
                name="description" 
                defaultValue={editingItem?.description || ''} 
                required 
                rows={4} 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all shadow-inner-sm resize-none" 
                placeholder="Nhập chi tiết nội dung công tác..."
              ></textarea>
            </div>

            {/* Hàng 5: Tùy chọn nhắc nhở */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex gap-3 items-center">
                <div className="p-2 bg-white rounded-lg shadow-sm text-red-600 border border-slate-200">
                  <BellRing size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Thông báo nhắc việc</p>
                  <p className="text-[10px] text-slate-500 font-bold italic">Tự động nhắc trước 60 phút</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="remind" 
                  className="sr-only peer" 
                  defaultChecked={editingItem?.remind ?? true} 
                />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-red-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-3 text-xs font-black text-slate-500 bg-white border border-slate-200 rounded-2xl uppercase tracking-widest transition-all hover:bg-slate-100 active:scale-95"
            >
              Đóng lại
            </button>
            <button 
              type="submit" 
              className="flex-[1.5] py-3 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-2xl shadow-xl shadow-red-200 uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Save size={16} /> {editingItem ? 'Cập nhật' : 'Lưu lịch ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkItemFormModal;
