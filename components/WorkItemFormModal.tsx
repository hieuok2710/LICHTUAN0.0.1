
import React, { useState } from 'react';
import { WorkItem, Official } from '../types';
import { 
  X, Calendar, Clock, User, AlignLeft, MapPin, 
  BellRing, Info, ChevronRight, Save, Layout 
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

type TabType = 'details' | 'location' | 'reminders';

const WorkItemFormModal: React.FC<WorkItemFormModalProps> = ({
  isOpen, onClose, onSubmit, editingItem, officials, prefill, selectedDate
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('details');

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const time = formData.get('time') as string;
    
    const itemData: WorkItem = {
      id: editingItem ? editingItem.id : Math.random().toString(36).substr(2, 9),
      day: 'Thứ Hai', // Will be calculated based on date in a real app or handled by component
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

  const tabs = [
    { id: 'details', label: 'Thông tin', icon: Layout },
    { id: 'location', label: 'Địa điểm', icon: MapPin },
    { id: 'reminders', label: 'Cài đặt', icon: BellRing },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl max-w-xl w-full overflow-hidden animate-popup-in border border-white/20 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-8 py-6 text-white flex justify-between items-center relative">
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

        {/* Tab Navigation */}
        <div className="flex bg-slate-50 border-b border-slate-100 p-2 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-red-600 shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} className="flex flex-col">
          <div className="p-8 min-h-[350px]">
            {/* Tab 1: Details */}
            {activeTab === 'details' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                      <Clock size={12} className="text-red-500" /> Thời gian
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
              </div>
            )}

            {/* Tab 2: Location */}
            {activeTab === 'location' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center text-red-600">
                    <MapPin size={32} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase text-sm">Vị trí công tác</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Xác định nơi diễn ra sự kiện hoặc cuộc họp</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Nhập địa điểm chi tiết
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                    <input 
                      name="location" 
                      defaultValue={editingItem?.location || ''} 
                      required 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all shadow-inner-sm" 
                      placeholder="Hội trường, phòng họp, địa chỉ..." 
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 flex gap-3">
                  <Info className="text-blue-500 shrink-0" size={18} />
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed italic">
                    Gợi ý: Nếu họp tại cơ quan, hãy ghi rõ số phòng họp để đồng chí phục vụ chuẩn bị tốt hơn.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Reminders */}
            {activeTab === 'reminders' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-600 rounded-xl">
                        <BellRing size={20} />
                      </div>
                      <h4 className="font-black uppercase tracking-tight text-sm">Trợ lý nhắc việc</h4>
                    </div>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                      Hệ thống sẽ tự động quét và hiển thị thông báo nhắc nhở lên màn hình khi sắp đến giờ họp.
                    </p>
                  </div>
                  <BellRing className="absolute -right-8 -bottom-8 text-white/5 w-40 h-40 rotate-12" />
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[24px]">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-600 border border-slate-200">
                      <BellRing size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Kích hoạt thông báo</p>
                      <p className="text-[10px] text-slate-500 font-bold italic">Báo trước 60 phút</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="remind" 
                      className="sr-only peer" 
                      defaultChecked={editingItem?.remind ?? true} 
                    />
                    <div className="w-14 h-7 bg-slate-200 rounded-full peer peer-checked:bg-red-600 transition-all after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-7"></div>
                  </label>
                </div>

                <div className="flex gap-4 p-5 border-2 border-dashed border-slate-200 rounded-[24px]">
                  <div className="text-slate-400 mt-0.5"><Clock size={16} /></div>
                  <div className="text-[11px] text-slate-400 font-bold italic leading-relaxed">
                    Tính năng nhắc nhở yêu cầu bạn giữ tab ứng dụng luôn mở hoặc cho phép quyền gửi thông báo trên trình duyệt.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 text-xs font-black text-slate-500 bg-white border border-slate-200 rounded-2xl uppercase tracking-widest transition-all hover:bg-slate-100 active:scale-95"
            >
              Đóng lại
            </button>
            <button 
              type="submit" 
              className="flex-[1.5] py-4 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-2xl shadow-xl shadow-red-200 uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
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
