
import React, { useMemo, useState, useEffect } from 'react';
import { WorkItem, Official } from '../types';
import { 
  X, Calendar, Clock, User, AlignLeft, MapPin, 
  BellRing, Save, ChevronDown, CheckSquare, Square,
  ChevronLeft, ChevronRight
} from 'lucide-react';

interface WorkItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: WorkItem, officialIds: string[]) => void;
  editingItem: WorkItem | null;
  officials: Official[];
  prefill: { date: string, officialId: string } | null;
  selectedDate: Date;
}

// --- CUSTOM CALENDAR PICKER COMPONENT ---
const CalendarPicker = ({ name, value, onChange }: { name: string, value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse giá trị hiện tại hoặc mặc định là hôm nay
  const dateValue = value ? new Date(value) : new Date();
  
  // State quản lý tháng đang xem (Navigational View)
  const [viewDate, setViewDate] = useState(new Date(dateValue.getFullYear(), dateValue.getMonth(), 1));

  // Đồng bộ view khi value thay đổi (ví dụ khi mở modal lại)
  useEffect(() => {
      if(value) {
          const d = new Date(value);
          setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
      }
  }, [value]);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); 
  // Điều chỉnh để Thứ 2 là đầu tuần (0: Mon, ..., 6: Sun) theo hiển thị T2-CN
  // getDay(): 0 Sun, 1 Mon. 
  // T2(1) -> Index 0. CN(0) -> Index 6.
  const startOffset = (firstDayOfMonth + 6) % 7;

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const selectDate = (day: number) => {
     const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
     // Format thủ công YYYY-MM-DD để tránh lỗi múi giờ
     const year = d.getFullYear();
     const month = String(d.getMonth() + 1).padStart(2, '0');
     const dayStr = String(d.getDate()).padStart(2, '0');
     onChange(`${year}-${month}-${dayStr}`);
     setIsOpen(false);
  };

  // Format hiển thị trên input
  const displayValue = value ? value.split('-').reverse().join('/') : '';

  return (
      <div className="relative w-full">
          <input type="hidden" name={name} value={value} />
          
          {/* Trigger Button */}
          <div 
             onClick={() => setIsOpen(!isOpen)}
             className={`w-full p-4 bg-slate-50 border rounded-2xl text-sm font-bold flex items-center justify-between cursor-pointer transition-all shadow-inner-sm ${isOpen ? 'bg-white ring-2 ring-red-500/20 border-red-500' : 'border-slate-100 hover:bg-white hover:border-red-200'}`}
          >
             <span className={value ? "text-slate-900" : "text-slate-400"}>
                {displayValue || 'Chọn ngày'}
             </span>
             <Calendar size={18} className={isOpen ? "text-red-600" : "text-red-500"} />
          </div>
          
          {/* Dropdown Calendar */}
          {isOpen && (
              <>
                {/* Backdrop vô hình để đóng khi click ra ngoài */}
                <div className="fixed inset-0 z-20 cursor-default" onClick={() => setIsOpen(false)} />
                
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 p-4 animate-popup-in">
                    {/* Header: Tháng/Năm & Nav */}
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 rounded-xl transition-colors"><ChevronLeft size={18} /></button>
                        <span className="font-black text-slate-800 text-sm uppercase tracking-wide">Tháng {viewDate.getMonth() + 1}, {viewDate.getFullYear()}</span>
                        <button type="button" onClick={() => changeMonth(1)} className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 rounded-xl transition-colors"><ChevronRight size={18} /></button>
                    </div>
                    
                    {/* Thứ trong tuần */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                           <span key={d} className={`text-[10px] font-black ${d === 'CN' || d === 'T7' ? 'text-red-400' : 'text-slate-400'}`}>{d}</span>
                        ))}
                    </div>
                    
                    {/* Lưới ngày */}
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: startOffset }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                            const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                            
                            const isSelected = value === dStr;
                            const isToday = new Date().toISOString().split('T')[0] === dStr;
                            
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => selectDate(day)}
                                    className={`
                                      h-9 w-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all relative
                                      ${isSelected 
                                        ? 'bg-red-600 text-white shadow-md shadow-red-200 scale-105 z-10' 
                                        : 'hover:bg-red-50 text-slate-700 hover:text-red-700'
                                      } 
                                      ${isToday && !isSelected ? 'text-red-600 bg-red-50/50 border border-red-100' : ''}
                                    `}
                                >
                                    {day}
                                    {isToday && !isSelected && <span className="absolute bottom-1 w-1 h-1 bg-red-500 rounded-full"></span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
              </>
          )}
      </div>
  );
};

const WorkItemFormModal: React.FC<WorkItemFormModalProps> = ({
  isOpen, onClose, onSubmit, editingItem, officials, prefill, selectedDate
}) => {
  // State lưu danh sách các cán bộ được chọn
  const [selectedOfficialIds, setSelectedOfficialIds] = useState<string[]>([]);
  // State lưu ngày được chọn
  const [formDate, setFormDate] = useState<string>('');

  // Khởi tạo dữ liệu khi mở modal
  useEffect(() => {
    if (isOpen) {
      // Set Date
      const initialDate = editingItem?.date || prefill?.date || selectedDate.toISOString().split('T')[0];
      setFormDate(initialDate);

      // Set Officials
      if (editingItem) {
        setSelectedOfficialIds([editingItem.officialId]);
      } else if (prefill) {
        setSelectedOfficialIds([prefill.officialId]);
      } else if (officials.length > 0) {
        // Mặc định chọn người đầu tiên nếu tạo mới hoàn toàn
        setSelectedOfficialIds([officials[0].id]);
      }
    }
  }, [isOpen, editingItem, prefill, officials, selectedDate]);

  // Tạo danh sách giờ tinh gọn cho hành chính
  const timeOptions = useMemo(() => {
    const baseOptions = [
      // Sáng: 07:00 -> 11:30
      '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      // Chiều: 13:00 -> 17:00
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
      // Tối/Ngoài giờ
      '18:00', '19:00', '20:00'
    ];

    if (editingItem?.time && !baseOptions.includes(editingItem.time)) {
      baseOptions.push(editingItem.time);
      baseOptions.sort();
    }

    return baseOptions;
  }, [editingItem]);

  const toggleOfficial = (id: string) => {
    setSelectedOfficialIds(prev => {
      if (prev.includes(id)) {
        // Không cho phép bỏ chọn hết (phải có ít nhất 1 người)
        if (prev.length === 1) return prev; 
        return prev.filter(oid => oid !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const time = formData.get('time') as string;
    
    // Tạo object mẫu, officialId sẽ được xử lý ở App.tsx dựa trên mảng selectedOfficialIds
    const itemData: WorkItem = {
      id: editingItem ? editingItem.id : Math.random().toString(36).substr(2, 9),
      day: 'Thứ Hai', // Sẽ được tính lại hoặc không quan trọng vì logic render dùng date
      date: formData.get('date') as string, 
      time: time,
      period: parseInt(time.split(':')[0]) < 12 ? 'Sáng' : 'Chiều',
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      officialId: selectedOfficialIds[0] || '', // Placeholder
      remind: formData.get('remind') === 'on',
    };
    
    onSubmit(itemData, selectedOfficialIds);
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
                {/* Thay thế Input cũ bằng CalendarPicker */}
                <CalendarPicker name="date" value={formDate} onChange={setFormDate} />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                  <Clock size={12} className="text-red-500" /> Thời gian (24h)
                </label>
                <div className="relative">
                  <select 
                    name="time" 
                    defaultValue={editingItem?.time || '07:30'} 
                    required 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all shadow-inner-sm appearance-none cursor-pointer" 
                  >
                    {timeOptions.map(t => (
                      <option key={t} value={t}>
                        {t} {parseInt(t.split(':')[0]) < 12 ? '(Sáng)' : '(Chiều)'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            {/* Hàng 2: Chọn cán bộ (Multi-select) */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                <User size={12} className="text-red-500" /> Người phụ trách (Có thể chọn nhiều)
              </label>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2 max-h-40 overflow-y-auto custom-scrollbar grid grid-cols-1 gap-1">
                {officials.map(o => {
                  const isSelected = selectedOfficialIds.includes(o.id);
                  return (
                    <div 
                      key={o.id}
                      onClick={() => toggleOfficial(o.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected 
                          ? 'bg-white border-red-200 shadow-sm' 
                          : 'border-transparent hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${isSelected ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-bold ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>{o.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{o.title}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hàng 3: Địa điểm */}
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
                <MapPin className="absolute left-3.5 top-4 text-slate-400 pointer-events-none" size={18} />
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
              <Save size={16} /> 
              {selectedOfficialIds.length > 1 ? `Lưu cho ${selectedOfficialIds.length} người` : (editingItem ? 'Cập nhật' : 'Lưu lịch ngay')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkItemFormModal;
