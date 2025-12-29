
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { OFFICIALS as DEFAULT_OFFICIALS, INITIAL_SCHEDULE } from './constants';
import { WorkItem, Official, TaskAlert, SystemState } from './types';
import WeeklyScheduleTable from './components/WeeklyScheduleTable';
import ReminderPopup from './components/ReminderPopup';
import NotificationCenter from './components/NotificationCenter';
import PrintLayout from './components/PrintLayout';
import ConfirmationModal from './components/ConfirmationModal';
import OfficialSettingsModal from './components/OfficialSettingsModal';
import WorkItemFormModal from './components/WorkItemFormModal';
import WelcomeHero from './components/WelcomeHero';
import { 
  Bell, Calendar, Plus, User, Printer, Eye,
  ChevronLeft, ChevronRight, CalendarDays, X, BellRing, FileDown, Info, Settings,
  BellOff, MousePointer2, ArrowUp, RefreshCw, Layers, Globe, Check
} from 'lucide-react';

const STORAGE_KEY = 'LONG_PHU_WORK_SCHEDULE_STATE_V1_FIX';
const BANNER_KEY = 'LONG_PHU_WELCOME_BANNER_SHOWN';

// LƯU Ý QUAN TRỌNG: Bạn cần tạo OAuth 2.0 Client ID tại https://console.cloud.google.com/
// 1. Tạo Project mới -> APIs & Services -> Credentials -> Create Credentials -> OAuth client ID
// 2. Application type: Web application
// 3. Authorized JavaScript origins: Thêm domain chạy app (ví dụ http://localhost:5173 hoặc domain vercel)
// 4. Copy Client ID dán vào dưới đây:
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events";

const App: React.FC = () => {
  // --- State & Storage ---
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

  const [globalNotificationsEnabled, setGlobalNotificationsEnabled] = useState(true);
  const [showWelcome, setShowWelcome] = useState(() => !sessionStorage.getItem(BANNER_KEY));
  const [currentUser, setCurrentUser] = useState<Official | null>(null);
  
  // CẬP NHẬT: Sử dụng new Date() để lấy ngày hiện tại của hệ thống làm mặc định
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [view, setView] = useState<'weekly' | 'personal'>('weekly');
  
  const [activePopup, setActivePopup] = useState<{item: WorkItem, official: Official, type: 'daily' | 'upcoming'} | null>(null);
  const [taskAlerts, setTaskAlerts] = useState<TaskAlert[]>([]);
  const [showNotiCenter, setShowNotiCenter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<WorkItem | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean }>({ x: 0, y: 0, visible: false });
  const [formPrefill, setFormPrefill] = useState<{date: string, officialId: string} | null>(null);
  const [notifPermission, setNotifPermission] = useState('default');

  const mainContentRef = useRef<HTMLDivElement>(null);
  const tokenClient = useRef<any>(null);
  const lastCheckedMinute = useRef<number>(-1);
  const notifiedIds = useRef<Set<string>>(new Set());

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
      start, 
      end,
      startStr: start.toLocaleDateString('vi-VN'),
      endStr: end.toLocaleDateString('vi-VN')
    };
  }, [selectedDate]);

  // --- Google API Initialization ---
  useEffect(() => {
    const initGis = () => {
      const google = (window as any).google;
      if (google && google.accounts) {
        tokenClient.current = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: '', // Sẽ được gán động khi gọi sync
        });
      }
    };

    const initGapi = () => {
      const gapi = (window as any).gapi;
      if (gapi) {
        gapi.load('client', async () => {
          try {
            // KHẮC PHỤC LỖI: Không truyền apiKey vào gapi.client.init nếu không chắc chắn key hợp lệ cho Calendar API.
            // Chúng ta sẽ dựa vào OAuth2 Access Token để xác thực và gọi API.
            await gapi.client.init({
              discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
            });
            console.log("GAPI client initialized success");
          } catch (e: any) { 
            const errorMsg = e?.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
            console.error("Gapi init error:", errorMsg); 
          }
        });
      }
    };

    // Kiểm tra định kỳ cho đến khi script Google được tải xong
    const checkGoogleScripts = setInterval(() => {
      if ((window as any).gapi && (window as any).google) {
        initGapi();
        initGis();
        clearInterval(checkGoogleScripts);
      }
    }, 500);

    if (typeof window !== 'undefined' && (window as any).Notification) {
      setNotifPermission((window as any).Notification.permission);
    }

    return () => clearInterval(checkGoogleScripts);
  }, []);

  useEffect(() => {
    if (!currentUser && officials.length > 0) setCurrentUser(officials[0]);
  }, [officials, currentUser]);

  useEffect(() => {
    const state: SystemState = { version: '1.4', timestamp: Date.now(), officials, schedule };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [officials, schedule]);

  // Nhắc việc
  useEffect(() => {
    const interval = setInterval(() => {
      if (!currentUser || !globalNotificationsEnabled) return;
      const now = new Date();
      if (lastCheckedMinute.current === now.getMinutes()) return;
      lastCheckedMinute.current = now.getMinutes();
      const todayISO = now.toISOString().split('T')[0];
      
      if (now.getHours() === 7 && now.getMinutes() === 0) {
        const todays = schedule.filter(i => i.date === todayISO && i.officialId === currentUser.id);
        if (todays.length > 0 && !notifiedIds.current.has(`daily-${todayISO}`)) {
          setActivePopup({ item: todays[0], official: currentUser, type: 'daily' });
          notifiedIds.current.add(`daily-${todayISO}`);
        }
      }

      schedule.forEach(item => {
        if (item.officialId !== currentUser.id || item.date !== todayISO || !item.remind) return;
        const [h, m] = item.time.split(':').map(Number);
        const itemTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
        const diff = Math.floor((itemTime.getTime() - now.getTime()) / 60000);
        
        if (diff === 60 && !notifiedIds.current.has(`remind-${item.id}`)) {
          setActivePopup({ item, official: currentUser, type: 'upcoming' });
          setTaskAlerts(prev => [{
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            message: `Sắp đến giờ: ${item.description}`,
            type: 'urgent',
            officialId: currentUser.id,
            read: false,
            relatedItemId: item.id
          }, ...prev]);
          notifiedIds.current.add(`remind-${item.id}`);
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [schedule, currentUser, globalNotificationsEnabled]);

  useEffect(() => {
    const hideMenu = () => setContextMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener('click', hideMenu);
    window.addEventListener('scroll', hideMenu);
    return () => {
      window.removeEventListener('click', hideMenu);
      window.removeEventListener('scroll', hideMenu);
    };
  }, []);

  // --- Handlers ---
  const handleBackup = () => {
    const data = JSON.stringify({ version: '1.4', officials, schedule }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lich_PhuongLongPhu_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.json`;
    a.click();
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data.officials) && Array.isArray(data.schedule)) {
          setOfficials(data.officials);
          setSchedule(data.schedule);
          alert("Khôi phục dữ liệu thành công!");
          setShowSettings(false);
        }
      } catch (err) { alert("File không hợp lệ."); }
    };
    reader.readAsText(file);
  };

  const handleSyncToGoogle = async () => {
    if (GOOGLE_CLIENT_ID.includes("YOUR_GOOGLE_CLIENT_ID")) {
      alert("Lỗi cấu hình: Bạn chưa thiết lập GOOGLE_CLIENT_ID trong mã nguồn. Vui lòng cập nhật hằng số này trong file App.tsx bằng Client ID từ Google Cloud Console.");
      return;
    }

    if (!tokenClient.current) { 
      alert("Dịch vụ Google chưa sẵn sàng. Vui lòng đợi giây lát và thử lại."); 
      return; 
    }
    
    setIsSyncing(true);
    setSyncStatus('idle');

    tokenClient.current.callback = async (resp: any) => {
      if (resp.error) { 
        console.error("Auth error:", resp.error);
        setIsSyncing(false); 
        setSyncStatus('error'); 
        alert("Lỗi xác thực Google: " + JSON.stringify(resp.error));
        return; 
      }
      
      try {
        const gapi = (window as any).gapi;
        const itemsToSync = schedule.filter(i => 
          i.officialId === currentUser?.id && 
          i.date >= weekRange.start.toISOString().split('T')[0] && 
          i.date <= weekRange.end.toISOString().split('T')[0]
        );

        if (itemsToSync.length === 0) {
          alert("Không có lịch cá nhân nào trong tuần này để đồng bộ.");
          setIsSyncing(false);
          return;
        }

        let successCount = 0;
        for (const item of itemsToSync) {
          const [h, m] = item.time.split(':').map(Number);
          const start = new Date(item.date); start.setHours(h, m, 0);
          const end = new Date(start); end.setHours(start.getHours() + 1);
          
          try {
            await gapi.client.calendar.events.insert({
              calendarId: 'primary',
              resource: {
                summary: `[LỊCH PHƯỜNG] ${item.description}`,
                location: item.location,
                description: `Công tác của: ${currentUser?.name} (${currentUser?.title})`,
                start: { dateTime: start.toISOString(), timeZone: 'Asia/Ho_Chi_Minh' },
                end: { dateTime: end.toISOString(), timeZone: 'Asia/Ho_Chi_Minh' },
              }
            });
            successCount++;
          } catch (insertError: any) {
            console.error("Error inserting item:", item.id, insertError);
          }
        }
        
        if (successCount > 0) {
          setSyncStatus('success');
          alert(`Đã đồng bộ thành công ${successCount} sự kiện lên Google Calendar!`);
        } else {
          setSyncStatus('error');
          alert("Không thể đồng bộ sự kiện nào. Vui lòng kiểm tra Console.");
        }
      } catch (e: any) { 
        console.error("Sync execution error:", e);
        setSyncStatus('error');
        const errorMsg = e?.result?.error?.message || e?.message || "Lỗi không xác định";
        alert("Lỗi khi đồng bộ: " + errorMsg);
      }
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 3000);
    };

    try {
      if ((window as any).gapi.client.getToken() === null) {
        tokenClient.current.requestAccessToken({ prompt: 'consent' });
      } else {
        tokenClient.current.requestAccessToken({ prompt: '' });
      }
    } catch (err: any) {
      console.error("Request token error:", err);
      setIsSyncing(false);
      setSyncStatus('error');
    }
  };

  const handleExportPDF = () => {
    const win = window.open('', '_blank');
    const printContent = document.getElementById('print-document')?.innerHTML;
    if (win && printContent) {
      win.document.write(`
        <html>
          <head>
            <title>Lịch Công Tác Phường Long Phú</title>
            <style>
              body { font-family: 'Times New Roman', serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid black; padding: 8px; font-size: 13px; text-align: justify; vertical-align: top; }
              th { background-color: #f2f2f2; text-align: center; }
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .title { text-align: center; margin-bottom: 20px; }
              .title h1 { font-size: 18px; text-transform: uppercase; margin: 0; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.close();
      }, 500);
    }
  };

  const changeWeek = (offset: number) => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset);
      return next;
    });
  };

  return (
    <div 
      className="min-h-screen bg-slate-100 pb-20 selection:bg-red-100 selection:text-red-900" 
      onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, visible: true }); }}
    >
      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="fixed z-[999] bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-2xl rounded-3xl py-2.5 min-w-[260px] animate-popup-in ring-1 ring-black/5" 
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 300), left: Math.min(contextMenu.x, window.innerWidth - 280) }}
        >
          <div className="px-5 py-2.5 flex items-center gap-3 border-b border-slate-100 mb-1.5">
            <MousePointer2 size={16} className="text-red-600" />
            <span className="text-xs font-bold text-slate-800">Menu Nhanh</span>
          </div>
          <div className="px-2 space-y-0.5">
            <button onClick={() => { setShowPreviewModal(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all text-sm font-bold"><Eye size={18} /> Xem trước / In PDF</button>
            <button onClick={handleSyncToGoogle} className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all text-sm font-bold"><Globe size={18} /> Đồng bộ Google Calendar</button>
            <button onClick={() => { setEditingItem(null); setFormPrefill(null); setIsFormOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all text-sm font-bold"><Plus size={18} /> Thêm lịch mới</button>
            <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl transition-all text-sm font-bold"><Settings size={18} /> Cấu hình hệ thống</button>
          </div>
        </div>
      )}

      {/* Main UI */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm h-16 no-print">
        <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white p-2 rounded-lg shadow-lg"><Calendar size={22} /></div>
            <h1 className="text-lg font-black text-slate-900 uppercase hidden sm:block">Phường Long Phú</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button disabled={isSyncing} onClick={handleSyncToGoogle} className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${syncStatus === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-blue-700 border-blue-200'}`}>
              {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : syncStatus === 'success' ? <Check size={14} /> : <Globe size={14} />}
              {isSyncing ? 'SYNCING...' : syncStatus === 'success' ? 'ĐÃ ĐỒNG BỘ' : 'SYNC GOOGLE'}
            </button>
            
            <div className="flex items-center gap-2 bg-slate-50 rounded-full px-3 py-1 border border-slate-200">
              <User size={14} className="text-slate-400" />
              <select className="text-[11px] bg-transparent border-none font-bold outline-none cursor-pointer" onChange={(e) => setCurrentUser(officials.find(o => o.id === e.target.value) || null)} value={currentUser?.id || ''}>
                {officials.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>

            <button onClick={() => setShowNotiCenter(!showNotiCenter)} className="relative p-2 text-slate-500 hover:text-red-600">
              <Bell size={20} className={taskAlerts.some(n => !n.read && n.officialId === currentUser?.id) ? 'animate-pulse text-red-600' : ''} />
              {taskAlerts.filter(n => !n.read && n.officialId === currentUser?.id).length > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">{taskAlerts.filter(n => !n.read && n.officialId === currentUser?.id).length}</span>}
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500 hover:text-blue-600"><Settings size={20} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-8 no-print">
        {showWelcome && <WelcomeHero onDismiss={() => { setShowWelcome(false); sessionStorage.setItem(BANNER_KEY, 'true'); }} />}
        
        <div ref={mainContentRef} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => changeWeek(-7)} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronLeft size={20}/></button>
            <div className="px-4 py-2 bg-slate-50 rounded-lg border font-bold flex items-center gap-3 text-sm">
              <CalendarDays size={18} className="text-red-600" />
              Tuần: {weekRange.startStr} - {weekRange.endStr}
            </div>
            <button onClick={() => changeWeek(7)} className="p-2 hover:bg-slate-50 rounded-lg"><ChevronRight size={20}/></button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button onClick={() => setView('weekly')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${view === 'weekly' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>Toàn bộ</button>
              <button onClick={() => setView('personal')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${view === 'personal' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>Cá nhân</button>
            </div>
            <button onClick={() => { setEditingItem(null); setFormPrefill(null); setIsFormOpen(true); }} className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg text-xs font-black hover:bg-red-700 shadow-lg shadow-red-100 transition-all"><Plus size={16} />THÊM LỊCH</button>
          </div>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-2xl border shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
          <div className="text-center mb-10 border-b pb-8">
            <h2 className="text-3xl font-black text-red-700 uppercase tracking-tighter">THÔNG BÁO</h2>
            <h3 className="text-xl font-bold text-slate-800 mt-1">Chương trình công tác của Thường trực Đảng ủy</h3>
            <div className="mt-4 text-slate-700 font-black text-[15px] bg-red-50 px-8 py-2.5 rounded-full border border-red-100 inline-block">
              (Từ {weekRange.startStr} đến {weekRange.endStr})
            </div>
          </div>
          
          <WeeklyScheduleTable 
            schedule={view === 'personal' && currentUser ? schedule.filter(i => i.officialId === currentUser.id) : schedule} 
            officials={officials} 
            selectedDate={selectedDate} 
            onEdit={(item) => { setEditingItem(item); setIsFormOpen(true); }} 
            onDeleteRequest={setItemToDelete} 
            onAddAt={(date, officialId) => { setEditingItem(null); setFormPrefill({ date, officialId }); setIsFormOpen(true); }} 
          />
        </div>
      </main>

      {/* Hidden Print Content */}
      <div id="print-document-wrapper">
        <PrintLayout schedule={schedule} weekRange={weekRange} officials={officials} />
      </div>

      {/* Modals */}
      {showNotiCenter && <NotificationCenter notifications={taskAlerts.filter(n => n.officialId === currentUser?.id)} onClose={() => setShowNotiCenter(false)} onMarkRead={(id) => setTaskAlerts(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} onClearAll={() => setTaskAlerts([])} notifPermission={notifPermission} onRequestPermission={() => {}} />}
      {showSettings && <OfficialSettingsModal officials={officials} onUpdateOfficials={setOfficials} onBackup={handleBackup} onRestore={handleRestore} onClose={() => setShowSettings(false)} />}
      <ConfirmationModal isOpen={!!itemToDelete} message="Bạn có chắc chắn muốn xóa mục lịch này?" onConfirm={() => { setSchedule(prev => prev.filter(i => i.id !== itemToDelete?.id)); setItemToDelete(null); }} onCancel={() => setItemToDelete(null)} />
      
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[60] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl shadow-2xl max-w-[95vw] w-[1100px] max-h-[95vh] flex flex-col border overflow-hidden animate-popup-in">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <span className="text-xs font-black text-slate-800 uppercase">Xem trước bản in công tác</span>
              <div className="flex items-center gap-3">
                <button onClick={handleExportPDF} className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-red-100"><Printer size={16} />XUẤT PDF / IN</button>
                <button onClick={() => setShowPreviewModal(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-all"><X size={24} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50 flex flex-col items-center">
              <div className="bg-white shadow-2xl w-full min-w-[900px] p-12 ring-1 ring-slate-300">
                 <PrintLayout schedule={schedule} weekRange={weekRange} officials={officials} />
              </div>
            </div>
          </div>
        </div>
      )}

      <WorkItemFormModal 
        isOpen={isFormOpen} 
        onClose={() => {setIsFormOpen(false); setEditingItem(null); setFormPrefill(null);}} 
        onSubmit={(item) => { 
          if (editingItem) setSchedule(prev => prev.map(i => i.id === editingItem.id ? item : i));
          else setSchedule(prev => [...prev, item]);
          setIsFormOpen(false);
        }} 
        editingItem={editingItem} officials={officials} prefill={formPrefill} selectedDate={selectedDate} 
      />
      {activePopup && <ReminderPopup item={activePopup.item} official={activePopup.official} type={activePopup.type} onClose={() => setActivePopup(null)} />}
    </div>
  );
};

export default App;
