
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { OFFICIALS as DEFAULT_OFFICIALS, INITIAL_SCHEDULE, DEFAULT_HERO_CONFIG } from './constants';
import { WorkItem, Official, TaskAlert, SystemState, HeroConfig } from './types';
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
  BellOff, MousePointer2, ArrowUp, RefreshCw, Layers, Globe, Check, CheckSquare, Square, Download, Loader2,
  LayoutGrid, List, ChevronDown, CheckCircle2, Terminal
} from 'lucide-react';

const STORAGE_KEY = 'LONG_PHU_WORK_SCHEDULE_STATE_V1_FIX';
const BANNER_KEY = 'LONG_PHU_WELCOME_BANNER_SHOWN';
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

  // State cấu hình Banner
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SystemState;
        return parsed.heroConfig || DEFAULT_HERO_CONFIG;
      } catch (e) { return DEFAULT_HERO_CONFIG; }
    }
    return DEFAULT_HERO_CONFIG;
  });

  // State mới cho Google Client ID
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SystemState;
        return parsed.settings?.googleClientId || '';
      } catch (e) { return ''; }
    }
    return '';
  });

  const [globalNotificationsEnabled, setGlobalNotificationsEnabled] = useState(true);
  const [showWelcome, setShowWelcome] = useState(() => !sessionStorage.getItem(BANNER_KEY));
  const [currentUser, setCurrentUser] = useState<Official | null>(null);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [view, setView] = useState<'weekly' | 'personal'>('weekly');
  
  const [activePopup, setActivePopup] = useState<{item: WorkItem, official: Official, type: 'daily' | 'upcoming'} | null>(null);
  const [taskAlerts, setTaskAlerts] = useState<TaskAlert[]>([]);
  const [showNotiCenter, setShowNotiCenter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // State ẩn thứ 7 chủ nhật khi in
  const [hideWeekend, setHideWeekend] = useState(false);
  // State loading cho xuất PDF
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  // State loading cho In
  const [isPrinting, setIsPrinting] = useState(false);
  // State quản lý dropdown chọn user
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

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
  // Sử dụng Portal container để render bản in ra ngoài root div
  const printWrapperRef = useRef<HTMLElement | null>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    printWrapperRef.current = document.getElementById('print-document-wrapper');
  }, []);

  // Đóng dropdown user khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    const initGapi = () => {
      const gapi = (window as any).gapi;
      if (gapi) {
        gapi.load('client', async () => {
          try {
            await gapi.client.init({
              discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
            });
            console.log("GAPI client initialized success");
          } catch (e: any) { 
            console.error("Gapi init error:", e); 
          }
        });
      }
    };

    const checkGoogleScripts = setInterval(() => {
      if ((window as any).gapi && (window as any).google) {
        initGapi();
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
    const state: SystemState = { 
      version: '1.4', 
      timestamp: Date.now(), 
      officials, 
      schedule,
      settings: {
        notificationsEnabled: globalNotificationsEnabled,
        googleClientId: googleClientId 
      },
      heroConfig: heroConfig // Lưu cấu hình banner
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [officials, schedule, googleClientId, globalNotificationsEnabled, heroConfig]);

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
    const data = JSON.stringify({ 
      version: '1.4', 
      officials, 
      schedule,
      settings: { googleClientId },
      heroConfig
    }, null, 2);
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
          if (data.settings?.googleClientId) {
            setGoogleClientId(data.settings.googleClientId);
          }
          if (data.heroConfig) {
            setHeroConfig(data.heroConfig);
          }
          alert("Khôi phục dữ liệu thành công!");
          setShowSettings(false);
        }
      } catch (err) { alert("File không hợp lệ."); }
    };
    reader.readAsText(file);
  };

  const handleSyncToGoogle = async () => {
    if (!googleClientId || googleClientId.includes("YOUR_GOOGLE_CLIENT_ID")) {
      const confirmSetup = window.confirm("Bạn chưa cấu hình Google Client ID. Bạn có muốn mở cài đặt để nhập ID không?");
      if (confirmSetup) {
        setShowSettings(true);
      }
      return;
    }

    const google = (window as any).google;
    const gapi = (window as any).gapi;

    if (!google || !gapi) { 
      alert("Dịch vụ Google chưa tải xong. Vui lòng kiểm tra kết nối mạng và thử lại sau."); 
      return; 
    }
    
    setIsSyncing(true);
    setSyncStatus('idle');

    try {
      if (!tokenClient.current) {
        tokenClient.current = google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: SCOPES,
          callback: '', 
        });
      }
    } catch (e) {
      console.error("Lỗi khởi tạo Token Client:", e);
      alert("Lỗi cấu hình Google ID không hợp lệ.");
      setIsSyncing(false);
      return;
    }

    tokenClient.current.callback = async (resp: any) => {
      if (resp.error) { 
        console.error("Auth error:", resp.error);
        setIsSyncing(false); 
        setSyncStatus('error'); 
        if (resp.error === 'popup_closed_by_user') return;
        alert("Lỗi xác thực Google: " + JSON.stringify(resp.error));
        return; 
      }
      
      try {
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
          const start = new Date(item.date); 
          start.setHours(h, m, 0);
          const end = new Date(start); 
          end.setHours(start.getHours() + 1);
          
          try {
            await gapi.client.calendar.events.insert({
              calendarId: 'primary',
              resource: {
                summary: `[LỊCH PHƯỜNG] ${item.description}`,
                location: item.location,
                description: `Công tác của: ${currentUser?.name} (${currentUser?.title})\nNgười tạo: Hệ thống Lịch Long Phú`,
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
          alert("Có lỗi xảy ra, không thể thêm sự kiện nào.");
        }
      } catch (e: any) { 
        console.error("Sync execution error:", e);
        setSyncStatus('error');
        const errorMsg = e?.result?.error?.message || e?.message || "Lỗi không xác định";
        alert("Lỗi khi đồng bộ: " + errorMsg);
      }
      setIsSyncing(false);
      setTimeout(() => setSyncStatus('idle'), 5000);
    };

    try {
      if (gapi.client.getToken() === null) {
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

  // --- HÀM IN ẤN TỐI ƯU SỬ DỤNG IFRAME ---
  const handlePrint = () => {
    const content = document.getElementById('print-document');
    if (!content) {
      alert("Không tìm thấy dữ liệu để in");
      return;
    }

    setIsPrinting(true);

    // 1. Tạo iframe ẩn
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // 2. Viết nội dung HTML vào iframe
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Lịch Công Tác - Phường Long Phú</title>
            <!-- Load Tailwind CSS -->
            <script src="https://cdn.tailwindcss.com"></script>
            <!-- Load Fonts -->
            <link href="https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
            <style>
              @page { size: A4 landscape; margin: 10mm; }
              body { 
                font-family: 'Tinos', serif; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact;
                background: white;
                margin: 0;
                padding: 10px;
              }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid black !important; padding: 4px; }
            </style>
          </head>
          <body>
            ${content.innerHTML}
          </body>
        </html>
      `);
      doc.close();

      // 3. Đợi tải xong rồi in
      iframe.onload = () => {
        // Thêm timeout ngắn để đảm bảo Tailwind parse xong classes
        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
          // Dọn dẹp iframe sau khi in (hoặc sau 1 khoảng thời gian)
          setTimeout(() => {
             document.body.removeChild(iframe);
             setIsPrinting(false);
          }, 1000);
        }, 500);
      };
    } else {
      setIsPrinting(false);
    }
  };

  // --- HÀM XUẤT PDF SỬ DỤNG HTML2PDF ---
  const handleExportPDF = () => {
    const element = document.getElementById('print-document'); // ID của phần tử trong PrintLayout
    if (!element) {
      alert("Không tìm thấy nội dung để in.");
      return;
    }

    setIsExportingPDF(true);
    
    // Cấu hình cho html2pdf
    const opt = {
      margin: 5,
      filename: `Lich_Cong_Tac_Tuan_${weekRange.startStr.replace(/\//g,'-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // Sử dụng window.html2pdf (được load từ CDN)
    const worker = (window as any).html2pdf().set(opt).from(element).save();
    
    worker.then(() => {
      setIsExportingPDF(false);
    }).catch((err: any) => {
      console.error("Export PDF error:", err);
      alert("Có lỗi khi xuất file PDF. Vui lòng thử lại.");
      setIsExportingPDF(false);
    });
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
            <button onClick={() => { setShowPreviewModal(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all text-sm font-bold"><Eye size={18} /> Xem trước / In ấn</button>
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
            <button onClick={() => setShowNotiCenter(!showNotiCenter)} className="relative p-2 text-slate-500 hover:text-red-600">
              <Bell size={20} className={taskAlerts.some(n => !n.read && n.officialId === currentUser?.id) ? 'animate-pulse text-red-600' : ''} />
              {taskAlerts.filter(n => !n.read && n.officialId === currentUser?.id).length > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">{taskAlerts.filter(n => !n.read && n.officialId === currentUser?.id).length}</span>}
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500 hover:text-blue-600"><Settings size={20} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-8 no-print">
        {showWelcome && <WelcomeHero config={heroConfig} onDismiss={() => { setShowWelcome(false); sessionStorage.setItem(BANNER_KEY, 'true'); }} />}
        
        {/* THANH CÔNG CỤ TẬP TRUNG */}
        <div ref={mainContentRef} className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 mb-8 flex flex-col xl:flex-row items-center justify-between gap-6 sticky top-20 z-30 transition-all">
          
          {/* Cụm 1: Điều hướng Tuần */}
          <div className="flex items-center bg-slate-50 rounded-2xl p-1.5 border border-slate-100 shadow-inner w-full xl:w-auto justify-between xl:justify-start">
            <button onClick={() => changeWeek(-7)} className="p-3 hover:bg-white hover:text-red-600 hover:shadow-sm rounded-xl transition-all text-slate-500"><ChevronLeft size={20}/></button>
            <div className="px-6 py-2 flex flex-col items-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian hiển thị</div>
              <div className="flex items-center gap-2 text-sm font-black text-slate-800">
                <CalendarDays size={16} className="text-red-600" />
                {weekRange.startStr} - {weekRange.endStr}
              </div>
            </div>
            <button onClick={() => changeWeek(7)} className="p-3 hover:bg-white hover:text-red-600 hover:shadow-sm rounded-xl transition-all text-slate-500"><ChevronRight size={20}/></button>
          </div>

          {/* Cụm 2: Các nút chức năng */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto">
            {/* Toggle View & User Select */}
            <div className={`flex bg-slate-100 p-1 rounded-xl border border-slate-200 col-span-2 md:col-span-1 transition-all ${view === 'personal' ? 'ring-2 ring-blue-100' : ''}`}>
               <button 
                onClick={() => setView('weekly')} 
                className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'weekly' ? 'bg-white text-red-600 shadow-sm flex-[1.5]' : 'text-slate-400 hover:text-slate-600 flex-1'}`}
                title="Xem toàn bộ"
              >
                 <LayoutGrid size={14} /> Toàn bộ
               </button>

               {view === 'personal' ? (
                 // CUSTOM DROPDOWN
                 <div ref={userDropdownRef} className="relative flex-[2] ml-1">
                    <button 
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="w-full flex items-center justify-between bg-white rounded-lg shadow-sm border border-blue-100 py-1.5 pl-2 pr-2 hover:border-blue-300 transition-all active:scale-95"
                    >
                       <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
                            {currentUser?.name.split(' ').pop()?.charAt(0)}
                          </div>
                          <span className="text-[10px] font-black text-blue-700 uppercase truncate text-left leading-tight">
                            {currentUser?.name}
                          </span>
                       </div>
                       <ChevronDown size={14} className={`text-blue-400 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isUserDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-[60] animate-popup-in origin-top-right">
                         <div className="px-3 py-2 border-b border-slate-50 mb-1">
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chọn cán bộ</span>
                         </div>
                         <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                           {officials.map(o => (
                             <button
                               key={o.id}
                               onClick={() => {
                                 setCurrentUser(o);
                                 setIsUserDropdownOpen(false);
                               }}
                               className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all group ${currentUser?.id === o.id ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'}`}
                             >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-colors ${currentUser?.id === o.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-sm'}`}>
                                  {o.name.split(' ').pop()?.charAt(0)}
                                </div>
                                <div className="flex-1 text-left overflow-hidden">
                                  <p className={`text-xs font-bold truncate ${currentUser?.id === o.id ? 'text-blue-700' : 'text-slate-700'}`}>{o.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">{o.title}</p>
                                </div>
                                {currentUser?.id === o.id && <CheckCircle2 size={16} className="text-blue-600" />}
                             </button>
                           ))}
                         </div>
                      </div>
                    )}
                 </div>
               ) : (
                 <button 
                  onClick={() => setView('personal')} 
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                  title="Xem cá nhân"
                >
                   <User size={14} /> Cá nhân
                 </button>
               )}
            </div>

            {/* Sync Button */}
            <button 
              disabled={isSyncing} 
              onClick={handleSyncToGoogle} 
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black border transition-all shadow-sm active:scale-95 ${syncStatus === 'success' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300'}`}
            >
              {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : syncStatus === 'success' ? <Check size={16} /> : <Globe size={16} />}
              {isSyncing ? 'ĐANG ĐỒNG BỘ...' : syncStatus === 'success' ? 'ĐỒNG BỘ XONG' : 'ĐỒNG BỘ GOOGLE'}
            </button>

            {/* Preview / Print Button */}
            <button 
              onClick={() => setShowPreviewModal(true)} 
              className="flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-[10px] font-black hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all active:scale-95 border border-slate-700"
            >
              <Printer size={16} /> XEM TRƯỚC / IN
            </button>

            {/* Add Button */}
            <button 
              onClick={() => { setEditingItem(null); setFormPrefill(null); setIsFormOpen(true); }} 
              className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black hover:bg-red-700 shadow-lg shadow-red-100 transition-all active:scale-95 border border-red-500"
            >
              <Plus size={16} /> THÊM LỊCH MỚI
            </button>
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

        {/* --- FOOTER --- */}
        <footer className="max-w-7xl mx-auto px-4 py-8 text-center mb-8 no-print flex justify-center">
           <div className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full border-2 border-red-600 bg-white shadow-lg shadow-red-200/50 animate-pulse">
             <Terminal size={24} className="text-red-600" />
             <p className="text-[20px] font-black text-red-600 uppercase tracking-widest leading-none">
               MỘT SẢN PHẨM CỦA TRUNG HIẾU_CS_ SĐT 0916499.916
             </p>
           </div>
        </footer>
      </main>

      {/* Portal chứa nội dung in ấn - Luôn render trong DOM nhưng bị ẩn bởi CSS cho đến khi in */}
      {printWrapperRef.current && createPortal(
        <PrintLayout schedule={schedule} weekRange={weekRange} officials={officials} hideWeekend={hideWeekend} />,
        printWrapperRef.current
      )}

      {/* Modals */}
      {showNotiCenter && <NotificationCenter notifications={taskAlerts.filter(n => n.officialId === currentUser?.id)} onClose={() => setShowNotiCenter(false)} onMarkRead={(id) => setTaskAlerts(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} onClearAll={() => setTaskAlerts([])} notifPermission={notifPermission} onRequestPermission={() => {}} />}
      
      {showSettings && (
        <OfficialSettingsModal 
          officials={officials} 
          onUpdateOfficials={setOfficials} 
          onBackup={handleBackup} 
          onRestore={handleRestore} 
          onClose={() => setShowSettings(false)}
          googleClientId={googleClientId}
          onUpdateGoogleClientId={setGoogleClientId}
          heroConfig={heroConfig}
          onUpdateHeroConfig={setHeroConfig}
        />
      )}
      
      <ConfirmationModal isOpen={!!itemToDelete} message="Bạn có chắc chắn muốn xóa mục lịch này?" onConfirm={() => { setSchedule(prev => prev.filter(i => i.id !== itemToDelete?.id)); setItemToDelete(null); }} onCancel={() => setItemToDelete(null)} />
      
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[60] flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl shadow-2xl max-w-[95vw] w-[1100px] max-h-[95vh] flex flex-col border overflow-hidden animate-popup-in">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <span className="text-xs font-black text-slate-800 uppercase">Xem trước bản in công tác</span>
              <div className="flex items-center gap-4">
                {/* Checkbox ẩn hiện thứ 7 chủ nhật */}
                <div 
                  className="flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors select-none"
                  onClick={() => setHideWeekend(!hideWeekend)}
                >
                  {hideWeekend ? <CheckSquare size={18} className="text-red-600" /> : <Square size={18} className="text-slate-400" />}
                  <span className="text-xs font-bold text-slate-700">Ẩn Thứ 7 & CN</span>
                </div>

                <div className="h-6 w-px bg-slate-200 mx-1"></div>

                {/* Nút Xuất PDF */}
                <button 
                  onClick={handleExportPDF} 
                  disabled={isExportingPDF}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExportingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
                  {isExportingPDF ? 'ĐANG TẠO PDF...' : 'XUẤT FILE PDF'}
                </button>

                {/* Nút In Trực Tiếp - Cải tiến Robust */}
                <button 
                  onClick={handlePrint} 
                  disabled={isPrinting}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-red-100 transition-all disabled:opacity-70 disabled:cursor-wait"
                >
                  {isPrinting ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} 
                  {isPrinting ? 'ĐANG XỬ LÝ...' : 'IN NGAY'}
                </button>
                
                <button onClick={() => setShowPreviewModal(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-all"><X size={24} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100/50 flex flex-col items-center">
              <div className="bg-white shadow-2xl w-full min-w-[900px] p-12 ring-1 ring-slate-300 transform scale-90 origin-top">
                 {/* Đây là bản xem trước trên màn hình */}
                 <PrintLayout schedule={schedule} weekRange={weekRange} officials={officials} hideWeekend={hideWeekend} />
              </div>
            </div>
          </div>
        </div>
      )}

      <WorkItemFormModal 
        isOpen={isFormOpen} 
        onClose={() => {setIsFormOpen(false); setEditingItem(null); setFormPrefill(null);}} 
        onSubmit={(baseItem, selectedOfficialIds) => { 
          if (editingItem) {
             const firstId = selectedOfficialIds[0];
             const updatedItem = { ...baseItem, id: editingItem.id, officialId: firstId };
             const newItems = selectedOfficialIds.slice(1).map(oid => ({
               ...baseItem,
               id: Math.random().toString(36).substr(2, 9),
               officialId: oid
             }));
             setSchedule(prev => prev.map(i => i.id === editingItem.id ? updatedItem : i).concat(newItems));
          } else {
             const newItems = selectedOfficialIds.map(oid => ({
               ...baseItem,
               id: Math.random().toString(36).substr(2, 9),
               officialId: oid
             }));
             setSchedule(prev => [...prev, ...newItems]);
          }
          setIsFormOpen(false);
        }} 
        editingItem={editingItem} officials={officials} prefill={formPrefill} selectedDate={selectedDate} 
      />
      {activePopup && <ReminderPopup item={activePopup.item} official={activePopup.official} type={activePopup.type} onClose={() => setActivePopup(null)} />}
    </div>
  );
};

export default App;
