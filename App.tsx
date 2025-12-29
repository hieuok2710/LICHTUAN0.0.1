
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { OFFICIALS as DEFAULT_OFFICIALS, INITIAL_SCHEDULE } from './constants';
import { WorkItem, Official, TaskAlert, SystemState, DayOfWeek } from './types';
import WeeklyScheduleTable from './components/WeeklyScheduleTable';
import ReminderPopup from './components/ReminderPopup';
import PrintLayout from './components/PrintLayout';
import ConfirmationModal from './components/ConfirmationModal';
import OfficialSettingsModal from './components/OfficialSettingsModal';
import WorkItemFormModal from './components/WorkItemFormModal';
import WelcomeHero from './components/WelcomeHero';
import { 
  Calendar, Plus, Printer, Eye, ChevronLeft, ChevronRight, X, Settings, FileText, DownloadCloud
} from 'lucide-react';

const STORAGE_KEY = 'LONG_PHU_WORK_SCHEDULE_STATE_V1_FIX';
const BANNER_KEY = 'LONG_PHU_WELCOME_BANNER_SHOWN';

const App: React.FC = () => {
  const [officials, setOfficials] = useState<Official[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SystemState;
        return parsed.officials || DEFAULT_OFFICIALS;
      } catch (e) { return DEFAULT_OFFICIALS; }
    }
    return DEFAULT_OFFICIALS;
  });

  const [schedule, setSchedule] = useState<WorkItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SystemState;
        return (parsed.schedule || INITIAL_SCHEDULE).map(i => ({ ...i, remind: i.remind ?? true }));
      } catch (e) { return INITIAL_SCHEDULE.map(i => ({ ...i, remind: true })); }
    }
    return INITIAL_SCHEDULE.map(i => ({ ...i, remind: true }));
  });

  const [showWelcome, setShowWelcome] = useState(() => !sessionStorage.getItem(BANNER_KEY));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<WorkItem | null>(null);
  const [formPrefill, setFormPrefill] = useState<{date: string, officialId: string} | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean }>({ x: 0, y: 0, visible: false });

  const weekRange = useMemo(() => {
    const start = new Date(selectedDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { 
      start, end,
      startStr: start.toLocaleDateString('vi-VN'),
      endStr: end.toLocaleDateString('vi-VN')
    };
  }, [selectedDate]);

  // Lưu trữ dữ liệu
  useEffect(() => {
    const state: SystemState = {
      version: '1.0',
      timestamp: Date.now(),
      officials,
      schedule
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [officials, schedule]);

  const handlePrint = () => {
    // 1. Render PrintLayout vào wrapper ẩn để in
    const wrapper = document.getElementById('print-document-wrapper');
    if (wrapper) {
      const root = ReactDOM.createRoot(wrapper);
      root.render(<PrintLayout schedule={schedule} officials={officials} weekRange={weekRange} />);
      
      // 2. Kích hoạt lệnh in hệ thống sau khi render
      setTimeout(() => {
        window.print();
        // Xóa sau khi in
        setTimeout(() => wrapper.innerHTML = '', 1000);
      }, 500);
    }
  };

  const handleExportDocx = () => {
    const dateNow = new Date();
    const dateStr = `${dateNow.getDate()} tháng ${dateNow.getMonth() + 1} năm ${dateNow.getFullYear()}`;
    
    // Header & Styles for Word 2016+
    const css = `
      <style>
        @page WordSection1 { size: 595.3pt 841.9pt; margin: 56.7pt 42.5pt 56.7pt 85.05pt; }
        div.WordSection1 { page: WordSection1; }
        table { border-collapse: collapse; width: 100%; border: 1px solid black; }
        th, td { border: 1px solid black; padding: 5pt; font-family: "Times New Roman", serif; font-size: 11pt; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
      </style>
    `;

    const htmlContent = `
      <div class="WordSection1">
        <table border="0" style="border:none; width:100%;">
          <tr>
            <td style="border:none; width:45%; text-align:center;">
              <p class="uppercase">ĐẢNG ỦY PHƯỜNG LONG PHÚ</p>
              <p class="font-bold uppercase" style="text-decoration: underline;">VĂN PHÒNG</p>
            </td>
            <td style="border:none; text-align:center;">
              <p class="font-bold uppercase">ĐẢNG CỘNG SẢN VIỆT NAM</p>
              <p style="font-style:italic;">Long Phú, ngày ${dateStr}</p>
            </td>
          </tr>
        </table>

        <div class="text-center" style="margin-top:20pt; margin-bottom:20pt;">
          <p class="font-bold" style="font-size:14pt; text-transform:uppercase;">THÔNG BÁO</p>
          <p class="font-bold" style="font-size:13pt; text-transform:uppercase;">Chương trình công tác của Thường trực Đảng ủy</p>
          <p class="font-bold" style="font-size:13pt;">(Từ ngày ${weekRange.startStr} đến ngày ${weekRange.endStr})</p>
        </div>

        <table>
          <tr style="background-color:#f3f3f3;">
            <th style="width:10%;">Thứ/Ngày</th>
            ${officials.map(o => `<th>${o.title.toUpperCase()}<br/>Đ/c ${o.name}</th>`).join('')}
          </tr>
          ${['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'].map((day, idx) => {
            const d = new Date(weekRange.start);
            d.setDate(weekRange.start.getDate() + idx);
            const cellISO = d.toISOString().split('T')[0];
            const dateStrCol = d.toLocaleDateString('vi-VN');
            
            return `
              <tr>
                <td class="text-center font-bold">${day}<br/>${dateStrCol}</td>
                ${officials.map(off => {
                  const items = schedule.filter(i => i.date === cellISO && i.officialId === off.id).sort((a,b) => a.time.localeCompare(b.time));
                  return `
                    <td style="vertical-align:top; text-align:justify;">
                      ${items.length > 0 ? items.map(item => `<div>- <b>${item.time}:</b> ${item.description} <b>(${item.location})</b></div>`).join('') : '<i style="color:#999;">- Làm việc thường xuyên</i>'}
                    </td>
                  `;
                }).join('')}
              </tr>
            `;
          }).join('')}
        </table>

        <table border="0" style="border:none; width:100%; margin-top:30pt;">
          <tr>
            <td style="border:none; width:50%;">
              <p class="font-bold" style="text-decoration:underline; font-style:italic;">Nơi nhận:</p>
              <p>- Thường trực Đảng ủy;</p>
              <p>- Lưu Văn phòng.</p>
            </td>
            <td style="border:none; text-align:center;">
              <p class="font-bold uppercase">CHÁNH VĂN PHÒNG</p>
              <br/><br/><br/><br/>
              <p class="font-bold">Nguyễn Thế Anh</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    const fullDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'>${css}</head>
      <body>${htmlContent}</body></html>
    `;

    const blob = new Blob(['\ufeff', fullDoc], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lich_Cong_Tac_${weekRange.startStr.replace(/\//g, '-')}.docx`;
    link.click();
  };

  const changeWeek = (offset: number) => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-20" onClick={() => setContextMenu(prev => ({...prev, visible: false}))} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, visible: true }); }}>
      
      {/* Quick Menu */}
      {contextMenu.visible && (
        <div className="fixed z-[999] bg-white border shadow-2xl rounded-2xl py-2 min-w-[240px] animate-popup-in" style={{ top: Math.min(contextMenu.y, window.innerHeight - 250), left: Math.min(contextMenu.x, window.innerWidth - 250) }}>
           <button onClick={() => { setShowPreviewModal(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-sm font-bold text-slate-700"><Eye size={18} /> Xem trước & In ấn</button>
           <button onClick={handleExportDocx} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-sm font-bold text-slate-700"><FileText size={18} /> Xuất Word (.docx)</button>
           <hr className="my-1 border-slate-100" />
           <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-sm font-bold text-slate-700"><Settings size={18} /> Cấu hình hệ thống</button>
        </div>
      )}

      <header className="bg-white border-b sticky top-0 z-40 shadow-sm h-16 no-print">
        <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white p-2 rounded-lg"><Calendar size={22} /></div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Long Phú Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExportDocx} className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
              <DownloadCloud size={16} /> Tải .DOCX
            </button>
            <button onClick={handlePrint} className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase hover:bg-black shadow-lg shadow-slate-200 transition-all">
              <Printer size={16} /> In nhanh (PDF)
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500 hover:text-red-600"><Settings size={20} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-8 no-print">
        {showWelcome && <WelcomeHero onDismiss={() => { setShowWelcome(false); sessionStorage.setItem(BANNER_KEY, 'true'); }} />}
        
        <div className="bg-white p-4 rounded-2xl border shadow-sm mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => changeWeek(-7)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronLeft size={24}/></button>
            <div className="px-6 py-2.5 bg-slate-50 rounded-xl border-2 border-slate-100 font-black text-sm tracking-tight text-slate-700">
              TUẦN: {weekRange.startStr} — {weekRange.endStr}
            </div>
            <button onClick={() => changeWeek(7)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronRight size={24}/></button>
          </div>
          <button onClick={() => { setEditingItem(null); setIsFormOpen(true); }} className="bg-red-600 text-white px-8 py-3 rounded-2xl text-xs font-black shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2 uppercase tracking-widest"><Plus size={18} /> Thêm công tác mới</button>
        </div>

        <div className="bg-white p-1 rounded-3xl border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-orange-500"></div>
          <WeeklyScheduleTable 
            schedule={schedule} officials={officials} selectedDate={selectedDate} 
            onEdit={(item) => { setEditingItem(item); setIsFormOpen(true); }} 
            onDeleteRequest={setItemToDelete} 
            onAddAt={(date, officialId) => { setEditingItem(null); setFormPrefill({ date, officialId }); setIsFormOpen(true); }} 
          />
        </div>
      </main>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/95 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden animate-popup-in shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center"><Printer size={24} /></div>
                <div>
                   <h2 className="font-black text-lg uppercase tracking-tight">Xem trước bản in công tác</h2>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Định dạng A4 - Tiêu chuẩn Nghị định 30</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleExportDocx} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"><FileText size={18} /> Tải .DOCX</button>
                <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-300"><Printer size={18} /> In ngay (PDF)</button>
                <button onClick={() => setShowPreviewModal(false)} className="ml-4 p-3 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-all"><X size={24} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-12 bg-slate-200/50 flex justify-center custom-scrollbar">
              <div className="bg-white p-[20mm] shadow-2xl w-[210mm] min-h-[297mm] ring-1 ring-slate-300">
                <PrintLayout schedule={schedule} weekRange={weekRange} officials={officials} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forms & Popups */}
      <WorkItemFormModal isOpen={isFormOpen} onClose={() => {setIsFormOpen(false); setEditingItem(null); setFormPrefill(null);}} 
        onSubmit={(item) => { 
          if (editingItem) setSchedule(prev => prev.map(i => i.id === editingItem.id ? item : i));
          else setSchedule(prev => [...prev, item]);
          setIsFormOpen(false);
        }} 
        editingItem={editingItem} officials={officials} prefill={formPrefill} selectedDate={selectedDate} 
      />
      <ConfirmationModal isOpen={!!itemToDelete} message="Bạn có chắc xóa mục lịch này khỏi hệ thống?" onConfirm={() => { setSchedule(prev => prev.filter(i => i.id !== itemToDelete?.id)); setItemToDelete(null); }} onCancel={() => setItemToDelete(null)} />
      {showSettings && <OfficialSettingsModal officials={officials} onUpdateOfficials={setOfficials} onBackup={() => {}} onRestore={() => {}} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default App;
