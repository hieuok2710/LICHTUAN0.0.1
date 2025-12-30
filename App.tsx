
import React, { useState, useEffect, useMemo } from 'react';
import { OFFICIALS as DEFAULT_OFFICIALS, INITIAL_SCHEDULE } from './constants';
import { WorkItem, Official, SystemState } from './types';
import WeeklyScheduleTable from './components/WeeklyScheduleTable';
import PrintLayout from './components/PrintLayout';
import ConfirmationModal from './components/ConfirmationModal';
import OfficialSettingsModal from './components/OfficialSettingsModal';
import WorkItemFormModal from './components/WorkItemFormModal';
import WelcomeHero from './components/WelcomeHero';
import { 
  Calendar, Plus, Printer, Eye, ChevronLeft, ChevronRight, X, Settings, FileText, 
  DownloadCloud, Layout, Maximize2
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
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
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
    window.print();
  };

  const handleExportDocx = () => {
    const dateNow = new Date();
    const dateStr = `${dateNow.getDate()} tháng ${dateNow.getMonth() + 1} năm ${dateNow.getFullYear()}`;
    const isLandscape = printOrientation === 'landscape';
    
    // Thiết lập CSS đặc thù cho Microsoft Word (Mso)
    const css = `
      <style>
        @page WordSection1 {
          size: ${isLandscape ? '29.7cm 21cm' : '21cm 29.7cm'};
          margin: 1.5cm 1.5cm 1.5cm ${isLandscape ? '1.5cm' : '2.5cm'};
          mso-page-orientation: ${isLandscape ? 'landscape' : 'portrait'};
        }
        div.WordSection1 { page: WordSection1; }
        table { border-collapse: collapse; width: 100%; border: 1.0pt solid black; mso-table-lspace: 7pt; mso-table-rspace: 7pt; }
        th, td { border: 1.0pt solid black; padding: 5pt; font-family: "Times New Roman", serif; font-size: 11pt; color: black; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .italic { font-style: italic; }
      </style>
    `;

    const getLocalDateISO = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const htmlContent = `
      <div class="WordSection1">
        <table border="0" style="border:none; width:100%; margin-bottom: 20pt;">
          <tr>
            <td style="border:none; width:45%; text-align:center; vertical-align: top;">
              <p class="uppercase" style="margin:0;">ĐẢNG ỦY PHƯỜNG LONG PHÚ</p>
              <p class="font-bold uppercase" style="margin:0; text-decoration: underline;">VĂN PHÒNG</p>
              <p class="italic" style="margin:5pt 0 0 0; font-size: 10pt;">Số: .....-TB/VP</p>
            </td>
            <td style="border:none; text-align:center; vertical-align: top;">
              <p class="font-bold uppercase" style="margin:0;">ĐẢNG CỘNG SẢN VIỆT NAM</p>
              <p class="italic" style="margin:5pt 0 0 0;">Long Phú, ngày ${dateStr}</p>
            </td>
          </tr>
        </table>

        <div class="text-center" style="margin-bottom:20pt;">
          <p class="font-bold" style="font-size:14pt; text-transform:uppercase; margin:0;">THÔNG BÁO</p>
          <p class="font-bold" style="font-size:13pt; text-transform:uppercase; margin:5pt 0 0 0;">Chương trình công tác của Thường trực Đảng ủy</p>
          <p class="font-bold" style="font-size:13pt; margin:2pt 0 0 0;">(Từ ngày ${weekRange.startStr} đến ngày ${weekRange.endStr})</p>
        </div>

        <table style="width:100%;">
          <tr style="background-color:#f3f3f3;">
            <th style="width:12%; text-align:center;">Thứ/Ngày</th>
            ${officials.map(o => `<th style="text-align:center;">${o.title.toUpperCase()}<br/>Đ/c ${o.name}</th>`).join('')}
          </tr>
          ${['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'].map((day, idx) => {
            const d = new Date(weekRange.start);
            d.setDate(weekRange.start.getDate() + idx);
            const cellISO = getLocalDateISO(d);
            const dateStrCol = d.toLocaleDateString('vi-VN');
            
            return `
              <tr>
                <td class="text-center font-bold" style="vertical-align: middle;">${day}<br/>${dateStrCol}</td>
                ${officials.map(off => {
                  const items = schedule.filter(i => {
                    const ids = i.officialIds && i.officialIds.length > 0 
                      ? i.officialIds 
                      : (i as any).officialId ? [(i as any).officialId] : [];
                    return i.date === cellISO && ids.includes(off.id);
                  }).sort((a,b) => a.time.localeCompare(b.time));
                  return `
                    <td style="vertical-align:top; text-align:justify;">
                      ${items.length > 0 ? items.map(item => `<div style="margin-bottom:4pt;">- <b>${item.time}:</b> ${item.description} <b>(${item.location})</b></div>`).join('') : '<i style="color:#666; font-size:10pt;">- Làm việc thường xuyên</i>'}
                    </td>
                  `;
                }).join('')}
              </tr>
            `;
          }).join('')}
        </table>

        <table border="0" style="border:none; width:100%; margin-top:30pt;">
          <tr>
            <td style="border:none; width:50%; vertical-align: top;">
              <p class="font-bold italic" style="text-decoration:underline; margin:0;">Nơi nhận:</p>
              <p style="margin:2pt 0;">- Thường trực Đảng ủy;</p>
              <p style="margin:2pt 0;">- UBND phường;</p>
              <p style="margin:2pt 0;">- Lưu Văn phòng.</p>
            </td>
            <td style="border:none; text-align:center; vertical-align: top;">
              <p class="font-bold uppercase" style="margin:0;">CHÁNH VĂN PHÒNG</p>
              <div style="height:60pt;"></div>
              <p class="font-bold" style="margin:0;">Nguyễn Thế Anh</p>
            </td>
          </tr>
        </table>
      </div>
    `;

    // Sử dụng định dạng .doc (HTML-based) tương thích cao nhất với Word
    const fullDoc = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        ${css}
      </head>
      <body>${htmlContent}</body>
      </html>
    `;

    // Xuất file với MIME type và extension đồng bộ để tránh báo lỗi Corrupted
    const blob = new Blob(['\ufeff', fullDoc], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lich_Cong_Tac_${weekRange.startStr.replace(/\//g, '-')}.doc`;
    link.click();
    URL.revokeObjectURL(url);
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
      
      {/* VÙNG IN ẨN */}
      <div className="print-only">
        <PrintLayout schedule={schedule} officials={officials} weekRange={weekRange} orientation={printOrientation} />
      </div>

      <header className="bg-white border-b sticky top-0 z-40 shadow-sm h-16 no-print">
        <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white p-2 rounded-lg"><Calendar size={22} /></div>
            <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Long Phú Admin</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setShowPreviewModal(true)} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] md:text-[11px] font-black uppercase hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">
              <Eye size={16} /> <span className="hidden sm:inline">Xem trước</span>
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] md:text-[11px] font-black uppercase hover:bg-black shadow-lg shadow-slate-200 transition-all">
              <Printer size={16} /> <span className="hidden sm:inline">In nhanh</span>
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
          <button onClick={() => { setEditingItem(null); setFormPrefill(null); setIsFormOpen(true); }} className="bg-red-600 text-white px-8 py-3 rounded-2xl text-xs font-black shadow-xl shadow-red-200 hover:bg-red-700 transition-all flex items-center gap-2 uppercase tracking-widest"><Plus size={18} /> Thêm công tác</button>
        </div>

        <div className="bg-white p-1 rounded-3xl border shadow-2xl relative overflow-hidden overflow-x-auto">
          <WeeklyScheduleTable 
            schedule={schedule} officials={officials} selectedDate={selectedDate} 
            onEdit={(item) => { setEditingItem(item); setFormPrefill(null); setIsFormOpen(true); }} 
            onDeleteRequest={setItemToDelete} 
            onAddAt={(date, officialId) => { setEditingItem(null); setFormPrefill({ date, officialId }); setIsFormOpen(true); }} 
          />
        </div>
      </main>

      {/* MODAL XEM TRƯỚC BẢN IN */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/90 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-100 rounded-[40px] w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden animate-popup-in shadow-2xl ring-1 ring-white/10">
            <div className="p-6 border-b flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-200 shadow-sm"><Eye size={24} /></div>
                <div>
                   <h2 className="font-black text-lg uppercase tracking-tight text-slate-900">Xem trước bản in</h2>
                   <div className="flex items-center gap-2">
                     <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest italic">Sẵn sàng xuất PDF/Word</span>
                   </div>
                </div>
              </div>
              
              {/* BỘ CHUYỂN ĐỔI ĐỊNH DẠNG */}
              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
                <button 
                  onClick={() => setPrintOrientation('portrait')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${printOrientation === 'portrait' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Layout size={14} className="rotate-0" /> Khổ dọc
                </button>
                <button 
                  onClick={() => setPrintOrientation('landscape')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all ${printOrientation === 'landscape' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Maximize2 size={14} className="rotate-90" /> Khổ ngang
                </button>
              </div>

              <div className="flex gap-3">
                <button onClick={handleExportDocx} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"><FileText size={18} /> Xuất Word (.doc)</button>
                <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-300"><Printer size={18} /> In nhanh (PDF)</button>
                <button onClick={() => setShowPreviewModal(false)} className="ml-2 p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-all"><X size={24} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-slate-200 flex justify-center custom-scrollbar">
              <div 
                className={`bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-slate-300 transition-all duration-500 ease-in-out ${
                  printOrientation === 'portrait' 
                  ? 'w-[210mm] min-h-[297mm] p-[20mm]' 
                  : 'w-[297mm] min-h-[210mm] p-[15mm]'
                }`}
              >
                <PrintLayout schedule={schedule} weekRange={weekRange} officials={officials} orientation={printOrientation} />
              </div>
            </div>

            <div className="p-4 bg-white border-t flex justify-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Hệ thống hỗ trợ in ấn thông minh v1.1 - Văn phòng Phường Long Phú</p>
            </div>
          </div>
        </div>
      )}

      <WorkItemFormModal isOpen={isFormOpen} onClose={() => {setIsFormOpen(false); setEditingItem(null); setFormPrefill(null);}} 
        onSubmit={(item) => { 
          if (editingItem) setSchedule(prev => prev.map(i => i.id === editingItem.id ? item : i));
          else setSchedule(prev => [...prev, item]);
          setIsFormOpen(false);
          setEditingItem(null);
          setFormPrefill(null);
        }} 
        editingItem={editingItem} officials={officials} prefill={formPrefill} selectedDate={selectedDate} 
      />
      <ConfirmationModal isOpen={!!itemToDelete} message="Bạn có chắc xóa mục lịch này khỏi hệ thống?" onConfirm={() => { setSchedule(prev => prev.filter(i => i.id !== itemToDelete?.id)); setItemToDelete(null); }} onCancel={() => setItemToDelete(null)} />
      {showSettings && <OfficialSettingsModal officials={officials} onUpdateOfficials={setOfficials} onBackup={() => {}} onRestore={() => {}} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default App;
