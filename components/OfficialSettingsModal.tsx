
import React, { useState } from 'react';
import { Official, SystemState, WorkItem } from '../types';
import { X, UserPlus, Trash2, Save, Download, Upload, RefreshCcw, AlertTriangle } from 'lucide-react';

interface Props {
  officials: Official[];
  onUpdateOfficials: (officials: Official[]) => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
  onClose: () => void;
}

const OfficialSettingsModal: React.FC<Props> = ({ officials, onUpdateOfficials, onBackup, onRestore, onClose }) => {
  const [localOfficials, setLocalOfficials] = useState<Official[]>([...officials]);

  const handleAdd = () => {
    const newOfficial: Official = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Họ tên cán bộ',
      title: 'Chức vụ'
    };
    setLocalOfficials([...localOfficials, newOfficial]);
  };

  const handleUpdate = (id: string, field: keyof Official, value: string) => {
    setLocalOfficials(localOfficials.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const handleDelete = (id: string) => {
    if (localOfficials.length <= 1) {
      alert("Hệ thống phải có ít nhất một cán bộ hiển thị.");
      return;
    }
    setLocalOfficials(localOfficials.filter(o => o.id !== id));
  };

  const handleSave = () => {
    onUpdateOfficials(localOfficials);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-popup-in border border-white/20 flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <RefreshCcw size={20} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight">Cấu hình hệ thống</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          {/* Quản lý cán bộ */}
          <section>
            <div className="flex justify-between items-end mb-4">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Danh sách cán bộ hiển thị</h4>
                <p className="text-xs text-slate-500 font-medium mt-1 italic">Thay đổi này sẽ cập nhật tiêu đề cột trong bảng lịch tuần.</p>
              </div>
              <button 
                onClick={handleAdd}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all"
              >
                <UserPlus size={14} /> Thêm mới
              </button>
            </div>
            <div className="space-y-3">
              {localOfficials.map((off, idx) => (
                <div key={off.id} className="flex gap-3 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                  <span className="text-xs font-black text-slate-400 w-4">{idx + 1}.</span>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      value={off.title} 
                      onChange={(e) => handleUpdate(off.id, 'title', e.target.value)}
                      placeholder="Chức vụ"
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input 
                      type="text" 
                      value={off.name} 
                      onChange={(e) => handleUpdate(off.id, 'name', e.target.value)}
                      placeholder="Họ và tên"
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => handleDelete(off.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Backup & Restore */}
          <section>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4 text-center">Sao lưu & Khôi phục dữ liệu</h4>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={onBackup}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-blue-400 transition-all group"
              >
                <Download size={28} className="text-slate-400 group-hover:text-blue-600 mb-2" />
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Backup hệ thống</span>
                <span className="text-[10px] text-slate-400 mt-1 font-medium italic">Tải xuống file .json</span>
              </button>
              
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-red-400 transition-all group cursor-pointer">
                <Upload size={28} className="text-slate-400 group-hover:text-red-600 mb-2" />
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Restore dữ liệu</span>
                <span className="text-[10px] text-slate-400 mt-1 font-medium italic">Chọn file đã backup</span>
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onRestore(file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <AlertTriangle className="text-amber-600 shrink-0" size={18} />
              <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                Lưu ý: Việc khôi phục (Restore) sẽ GHI ĐÈ toàn bộ lịch trình và cán bộ hiện tại. Hãy chắc chắn bạn đã sao lưu dữ liệu quan trọng trước đó.
              </p>
            </div>
          </section>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-xs font-black text-slate-500 bg-white border border-slate-200 rounded-xl uppercase tracking-widest transition-all hover:bg-slate-100">Đóng</button>
          <button 
            onClick={handleSave} 
            className="flex-1 py-3 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Save size={16} /> Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfficialSettingsModal;
