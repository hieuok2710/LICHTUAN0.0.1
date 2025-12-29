
import React, { useMemo } from 'react';
import { WorkItem, Official } from '../types';
import { 
  X, Calendar, Clock, User, AlignLeft, MapPin, 
  BellRing, Save, ChevronDown
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
  // Tạo danh sách giờ tinh gọn: 30 phút/lần cho giờ hành chính
  const timeOptions = useMemo(() => {
    const options = [
      '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
      '18:00', '19:00', '20:00'
    ];
    if (editingItem?.time && !options.includes(editingItem.time)) {
      options.push(editingItem.time);
      options.sort();
    }
    return options;
  }, [editingItem]);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const time = formData.get('time') as string;
    
    const itemData: WorkItem = {
      id: editingItem ? editingItem.id : Math.random().toString(36).substr(2, 9),
      day: 'Thứ Hai', // Logic tính thứ sẽ được xử lý khi render hoặc lưu
      date: formData.get('date') as string, 
      time: time,
      period: parseInt(time.split(':')[0]) < 12 ? 'Sáng' : 'Chiều',
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
        <div className="bg-slate-900 px-8 py-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600 rounded-2xl">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">
                {editingItem ? 'Cập nhật lịch' : 'Thêm công tác'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Văn phòng Phường Long Phú</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 text-slate-400 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 md:p-8 space-y-5 overflow-y-auto custom-scrollbar">
            {/* Ngày & Giờ */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  <Calendar size={12} className="text-red-500" /> Ngày
                </label>
                <input 
                  name="date" 
                  type="date" 
                  defaultValue={editingItem?.date || prefill?.date || selectedDate.toISOString().split('T')[0]} 
                  required 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  <Clock size={12} className="text-red-500" /> Giờ (24h)
                </label>
                <div className="relative">
                  <select 
                    name="time" 
                    defaultValue={editingItem?.time || '07:30'} 
                    required 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none appearance-none cursor-pointer" 
                  >
                    {timeOptions.map(t => (
                      <option key={t} value={t}>{t} {parseInt(t.split(':')[0]) < 12 ? 'Sáng' : 'Chiều'}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            {/* Cán bộ */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                <User size={12} className="text-red-500" /> Cán bộ phụ trách
              </label>
              <div className="relative">
                <select 
                  name="officialId" 
                  defaultValue={editingItem?.officialId || prefill?.officialId || officials[0]?.id} 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none appearance-none cursor-pointer"
                >
                  {officials.map(o => <option key={o.id} value={o.id}>{o.name} - {o.title}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* ĐỊA ĐIỂM (HIỂN THỊ NGAY) */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                <MapPin size={12} className="text-red-500" /> Địa điểm
              </label>
              <div className="relative">
                <input 
                  name="location" 
                  defaultValue={editingItem?.location || ''} 
                  required 
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all" 
                  placeholder="Hội trường UBND, Phòng họp..." 
                />
                <MapPin className="absolute left-3.5 top-4 text-slate-400" size={18} />
              </div>
            </div>

            {/* Nội dung */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                <AlignLeft size={12} className="text-red-500" /> Nội dung công việc
              </label>
              <textarea 
                name="description" 
                defaultValue={editingItem?.description || ''} 
                required 
                rows={3} 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none" 
                placeholder="Nhập nội dung công tác..."
              ></textarea>
            </div>

            {/* Tùy chọn nhắc nhở */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex gap-3 items-center">
                <div className="p-2 bg-white rounded-lg text-red-600 border border-slate-200">
                  <BellRing size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Thông báo nhắc việc</p>
                  <p className="text-[10px] text-slate-500 font-bold italic">Tự động nhắc trước 60 phút</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="remind" className="sr-only peer" defaultChecked={editingItem?.remind ?? true} />
                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-red-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-xs font-black text-slate-500 bg-white border border-slate-200 rounded-2xl uppercase tracking-widest hover:bg-slate-100">Hủy</button>
            <button type="submit" className="flex-[1.5] py-3 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-2xl shadow-xl shadow-red-200 uppercase tracking-widest flex items-center justify-center gap-2">
              <Save size={16} /> {editingItem ? 'Cập nhật' : 'Lưu ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkItemFormModal;
