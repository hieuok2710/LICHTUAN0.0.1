
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { OFFICIALS as DEFAULT_OFFICIALS, INITIAL_SCHEDULE } from './constants';
import { WorkItem, Official, Notification, SystemState } from './types';
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
  BellOff
} from 'lucide-react';

const STORAGE_KEY = 'LONG_PHU_WORK_SCHEDULE_STATE';
const BANNER_KEY = 'LONG_PHU_WELCOME_BANNER_SHOWN';

const App: React.FC = () => {
  // Load data from localStorage or use defaults
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
        return parsed.schedule || INITIAL_SCHEDULE.map(item => ({ ...item, remind: true }));
      } catch (e) { return INITIAL_SCHEDULE.map(item => ({ ...item, remind: true })); }
    }
    return INITIAL_SCHEDULE.map(item => ({ ...item, remind: true }));
  });

  const [globalNotificationsEnabled, setGlobalNotificationsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SystemState;
        return parsed.settings?.notificationsEnabled ?? true;
      } catch (e) { return true; }
    }
    return true;
  });

  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    // Show banner on every reload if not dismissed in current session
    return !sessionStorage.getItem(BANNER_KEY);
  });

  const [activePopup, setActivePopup] = useState<{item: WorkItem, official: Official, type: 'daily' | 'upcoming'} | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotiCenter, setShowNotiCenter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentUser, setCurrentUser] = useState<Official | null>(null);
  const [view, setView] = useState<'weekly' | 'personal'>('weekly');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<WorkItem | null>(null);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' ? window.Notification.permission : 'default'
  );
  
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 11, 15)); 
  const [formPrefill, setFormPrefill] = useState<{date: string, officialId: string} | null>(null);

  const lastCheckedMinute = useRef<number>(-1);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const dismissWelcome = () => {
    setShowWelcome(false);
    sessionStorage.setItem(BANNER_KEY, 'true');
    // Scroll to table smoothly
    mainContentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Hệ thống khuyến nghị bạn sao lưu dữ liệu trước khi thoát để đảm bảo an toàn tuyệt đối. Bạn có chắc chắn muốn rời đi?";
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!currentUser || !officials.find(o => o.id === currentUser.id)) {
      setCurrentUser(officials[0]);
    }
  }, [officials]);

  useEffect(() => {
    const state: SystemState = {
      version: '1.0',
      timestamp: Date.now(),
      officials,
      schedule,
      settings: {
        notificationsEnabled: globalNotificationsEnabled
      }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [officials, schedule, globalNotificationsEnabled]);

  const weekRange = useMemo(() => {
    const start = new Date(selectedDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [selectedDate]);

  const sendSystemNotification = (title: string, body: string, item?: WorkItem) => {
    if (globalNotificationsEnabled && notifPermission === 'granted') {
      const options: NotificationOptions = {
        body: body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        tag: item?.id || 'general-notif'
      };
      
      const n = new Notification(title, options);
      n.onclick = () => {
        window.focus();
        n.close();
      };
    }
  };

  const requestNotifPermission = async () => {
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      sendSystemNotification("Đã bật thông báo", "Hệ thống sẽ gửi nhắc nhở công việc trực tiếp lên màn hình của bạn.");
    }
  };

  const handleBackup = () => {
    const state: SystemState = {
      version: '1.0',
      timestamp: Date.now(),
      officials,
      schedule,
      settings: { notificationsEnabled: globalNotificationsEnabled }
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_lich_cong_tac_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as SystemState;
        if (data.officials && data.schedule) {
          setOfficials(data.officials);
          setSchedule(data.schedule);
          if (data.settings) setGlobalNotificationsEnabled(data.settings.notificationsEnabled);
          alert("Khôi phục dữ liệu thành công!");
          setShowSettings(false);
        } else {
          throw new Error("File không đúng định dạng backup.");
        }
      } catch (err) {
        alert("Lỗi: Không thể khôi phục dữ liệu. Vui lòng kiểm tra lại file backup.");
      }
    };
    reader.readAsText(file);
  };

  const handleExportPDF = () => {
    const startStr = weekRange.start.toLocaleDateString('vi-VN');
    const endStr = weekRange.end.toLocaleDateString('vi-VN');
    const today = new Date();
    
    const tableRows = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'].map((day, idx) => {
      const cellDate = new Date(weekRange.start);
      cellDate.setDate(weekRange.start.getDate() + idx);
      const dateStr = cellDate.toLocaleDateString('vi-VN');
      const isoDate = cellDate.toISOString().split('T')[0];

      const columns = officials.map(off => {
        const items = schedule.filter(item => item.date === isoDate && item.officialId === off.id);
        const content = items.length > 0 
          ? items.map(item => `<div><span style="font-weight:bold">- ${item.period}: ${item.time.replace(':', 'h')}</span>, ${item.description} <span style="font-weight:bold">(${item.location})</span></div>`).join('<div style="margin-top:4px;"></div>')
          : '<div style="font-style:italic; font-size:11px; color:#666;">- Làm việc thường xuyên</div>';
        return `<td style="border:1px solid black; padding:8px; vertical-align:top; text-align:justify; width: ${88/officials.length}%;">${content}</td>`;
      }).join('');

      return `<tr>
        <td style="border:1px solid black; padding:8px; text-align:center; vertical-align:top; font-weight:bold; width:12%;">${day}<br/>${dateStr}</td>
        ${columns}
      </tr>`;
    }).join('');

    const headerCols = officials.map(off => `
      <th style="border:1px solid black; padding:8px; text-align:center; font-weight:bold; background-color:#f2f2f2;">
        ${off.title}<br/>Đ/c ${off.name}
      </th>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lịch Công Tác Tuần - Phường Long Phú</title>
        <link href="https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Tinos', serif; line-height: 1.4; color: black; margin: 0; padding: 10mm 15mm; }
          .header { display: flex; justify-content: space-between; margin-bottom: 25px; }
          .header-left { text-align: center; width: 40%; }
          .header-right { text-align: center; width: 50%; }
          .title { text-align: center; margin-bottom: 25px; }
          .title h1 { font-size: 19px; margin: 0; text-transform: uppercase; }
          .title h2 { font-size: 17px; margin: 5px 0; }
          .date-range { font-size: 17px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .footer-left { width: 40%; font-size: 11px; font-style: italic; }
          .footer-right { width: 40%; text-align: center; }
          @media print {
            body { padding: 0; }
            @page { size: A4 landscape; margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <p style="margin:0; font-size:12px; text-transform:uppercase;">ĐẢNG ỦY PHƯỜNG LONG PHÚ</p>
            <p style="margin:0; font-size:12px; font-weight:bold;">VĂN PHÒNG</p>
            <p style="margin:3px 0 0 0;">*</p>
          </div>
          <div class="header-right">
            <p style="margin:0; font-size:12px; font-weight:bold; text-transform:uppercase; text-decoration:underline; text-underline-offset: 3px;">ĐẢNG CỘNG SẢN VIỆT NAM</p>
            <p style="margin:10px 0 0 0; font-style:italic; font-size:11px;">Long Phú, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}</p>
          </div>
        </div>

        <div class="title">
          <h1>THÔNG BÁO</h1>
          <h2>Chương trình công tác của Thường trực Đảng ủy</h2>
          <div class="date-range">(Từ ngày ${startStr} đến ngày ${endStr})</div>
          <div style="width:60px; border-bottom:2px solid black; margin: 10px auto;"></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="border:1px solid black; padding:8px; width:10%; background-color:#f2f2f2;">Thứ/Ngày</th>
              ${headerCols}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          <div class="footer-left">
            <p style="font-weight:bold; text-decoration:underline; margin-bottom:5px;">Nơi nhận:</p>
            <p style="margin:2px 0;">- Ban Thường vụ Đảng bộ;</p>
            <p style="margin:2px 0;">- Các chi bộ trực thuộc;</p>
            <p style="margin:2px 0;">- Lưu VP Đảng ủy.</p>
          </div>
          <div class="footer-right">
            <p style="font-weight:bold; font-size:13px; text-transform:uppercase; margin-bottom:80px;">CHÁNH VĂN PHÒNG</p>
            <p style="font-weight:bold; font-size:13px;">Nguyễn Thế Anh</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => { window.print(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép trình duyệt mở cửa sổ mới để xuất PDF.');
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  useEffect(() => {
    const checkReminders = () => {
      if (!currentUser || !globalNotificationsEnabled) return;
      const now = new Date();
      const todayISO = now.toISOString().split('T')[0];
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      if (lastCheckedMinute.current === currentMinutes) return;
      lastCheckedMinute.current = currentMinutes;

      if (currentHours === 7 && currentMinutes === 0) {
        const dailyKey = `daily-${todayISO}-${currentUser.id}`;
        if (!notifiedIds.has(dailyKey)) {
          const todaysItems = schedule.filter(item => item.date === todayISO && item.officialId === currentUser.id);
          if (todaysItems.length > 0) {
            const msg = `Hôm nay bạn có ${todaysItems.length} công việc cần thực hiện.`;
            setNotifications(prev => [{
              id: Math.random().toString(36).substr(2, 9),
              timestamp: Date.now(),
              message: `[NHẮC LỊCH SÁNG] ${msg}`,
              type: 'daily',
              officialId: currentUser.id,
              read: false
            }, ...prev]);
            setActivePopup({ item: todaysItems[0], official: currentUser, type: 'daily' });
            sendSystemNotification("Chào buổi sáng!", msg);
            setNotifiedIds(prev => new Set(prev).add(dailyKey));
          }
        }
      }

      schedule.forEach(item => {
        if (item.officialId !== currentUser.id || item.date !== todayISO || !item.remind) return;
        const [itemH, itemM] = item.time.split(':').map(Number);
        const itemDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), itemH, itemM);
        const diffInMinutes = Math.floor((itemDate.getTime() - now.getTime()) / 60000);
        
        if (diffInMinutes === 60) {
          const upcomingKey = `upcoming-60-${item.id}`;
          if (!notifiedIds.has(upcomingKey)) {
            const msg = `"${item.description}" sẽ bắt đầu sau 60 phút tại ${item.location}.`;
            setNotifications(prev => [{
              id: Math.random().toString(36).substr(2, 9),
              timestamp: Date.now(),
              message: `[NHẮC VIỆC] ${msg}`,
              type: 'urgent',
              officialId: currentUser.id,
              read: false,
              relatedItemId: item.id
            }, ...prev]);
            setActivePopup({ item, official: currentUser, type: 'upcoming' });
            sendSystemNotification("Nhắc nhở công tác", msg, item);
            setNotifiedIds(prev => new Set(prev).add(upcomingKey));
          }
        }
      });
    };
    const timer = setInterval(checkReminders, 10000);
    return () => clearInterval(timer);
  }, [currentUser, schedule, notifiedIds, notifPermission, globalNotificationsEnabled]);

  const handleMarkNotiRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const nextWeek = () => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + 7);
    setSelectedDate(next);
  };
  const prevWeek = () => {
    const prev = new Date(selectedDate);
    prev.setDate(selectedDate.getDate() - 7);
    setSelectedDate(prev);
  };

  const handleFormSubmit = (itemData: WorkItem) => {
    if (editingItem) {
      setSchedule(prev => prev.map(item => item.id === editingItem.id ? itemData : item));
    } else {
      setSchedule(prev => [...prev, itemData]);
    }
    setIsFormOpen(false);
    setEditingItem(null);
    setFormPrefill(null);
  };

  const handleEditWork = (item: WorkItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleAddAtCell = (date: string, officialId: string) => {
    setEditingItem(null);
    setFormPrefill({ date, officialId });
    setIsFormOpen(true);
  };

  const confirmDeleteWork = () => {
    if (itemToDelete) {
      setSchedule(prev => prev.filter(item => item.id !== itemToDelete.id));
      setItemToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-20 overflow-x-hidden">
      <div className="no-print">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <div className="bg-red-600 text-white p-2 rounded-lg shadow-lg shadow-red-200">
                  <Calendar size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Phường Long Phú</h1>
                  <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">Hệ Thống Lịch Công Tác</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all"
                  title="Cấu hình hệ thống"
                >
                  <Settings size={20} />
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

                <button 
                  onClick={() => setShowPreviewModal(true)}
                  className="hidden md:flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 transition-all active:scale-95"
                >
                  <Eye size={16} />
                  XEM TRƯỚC
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="hidden md:flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg shadow-slate-200 transition-all active:scale-95"
                >
                  <FileDown size={16} />
                  XUẤT PDF
                </button>
                
                <div className="ml-2 flex items-center gap-2 bg-slate-50 rounded-full px-3 py-1.5 border border-slate-200">
                  <User size={14} className="text-slate-400" />
                  <select 
                    className="text-xs bg-transparent border-none rounded-full focus:ring-0 outline-none font-bold cursor-pointer pr-2"
                    onChange={(e) => {
                      const user = officials.find(o => o.id === e.target.value);
                      setCurrentUser(user || null);
                    }}
                    value={currentUser?.id || ''}
                  >
                    {officials.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Global Notification Toggle */}
                <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 rounded-full border border-slate-200 ml-2">
                  <div 
                    className={`p-1 rounded-full transition-colors ${globalNotificationsEnabled ? 'text-red-600' : 'text-slate-400'}`}
                    title={globalNotificationsEnabled ? "Thông báo đang bật" : "Thông báo đang tắt"}
                  >
                    {globalNotificationsEnabled ? <BellRing size={14} /> : <BellOff size={14} />}
                  </div>
                  <button 
                    onClick={() => setGlobalNotificationsEnabled(!globalNotificationsEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${globalNotificationsEnabled ? 'bg-red-600' : 'bg-slate-300'}`}
                    aria-label="Bật/tắt toàn bộ thông báo"
                  >
                    <span 
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${globalNotificationsEnabled ? 'translate-x-4' : 'translate-x-0'}`} 
                    />
                  </button>
                </div>

                <button 
                  onClick={() => setShowNotiCenter(!showNotiCenter)}
                  className="relative p-2 text-slate-500 hover:text-red-600 transition-colors ml-1" 
                >
                  <Bell size={20} className={notifications.filter(n => !n.read && n.officialId === currentUser?.id).length > 0 ? 'animate-pulse text-red-600' : ''} />
                  {notifications.filter(n => !n.read && n.officialId === currentUser?.id).length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center">
                      {notifications.filter(n => !n.read && n.officialId === currentUser?.id).length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {showWelcome && <WelcomeHero onDismiss={dismissWelcome} />}

          {notifPermission !== 'granted' && globalNotificationsEnabled && (
            <div className="max-w-7xl mx-auto mb-6 bg-blue-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl shadow-blue-100">
              <div className="flex items-center gap-3">
                <BellRing size={24} />
                <p className="text-sm font-bold">Hãy bật thông báo hệ thống để không bỏ lỡ lịch công tác quan trọng.</p>
              </div>
              <button 
                onClick={requestNotifPermission}
                className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Kích hoạt ngay
              </button>
            </div>
          )}

          <div ref={mainContentRef} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button onClick={prevWeek} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"><ChevronLeft size={20}/></button>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 font-bold text-slate-700">
                <CalendarDays size={18} className="text-red-600" />
                <span className="text-base font-black">Tuần: {weekRange.start.toLocaleDateString('vi-VN')} - {weekRange.end.toLocaleDateString('vi-VN')}</span>
              </div>
              <button onClick={nextWeek} className="p-2 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"><ChevronRight size={20}/></button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
                <button 
                    onClick={() => setView('weekly')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${view === 'weekly' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Toàn bộ
                </button>
                <button 
                    onClick={() => setView('personal')}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${view === 'personal' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Cá nhân
                </button>
              </div>
              <button 
                onClick={() => {setEditingItem(null); setFormPrefill(null); setIsFormOpen(true);}}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 shadow-lg shadow-red-100 transition-all"
              >
                <Plus size={16} />
                THÊM LỊCH
              </button>
            </div>
          </div>

          <div className="bg-white p-6 md:p-10 rounded-2xl border border-slate-200 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
              <div className="flex flex-col items-center mb-10 border-b border-slate-100 pb-8 text-center">
                <h2 className="text-3xl font-black text-red-700 uppercase tracking-tighter">THÔNG BÁO</h2>
                <h3 className="text-xl font-bold text-slate-800 mt-1">Chương trình công tác của Thường trực Đảng ủy</h3>
                <div className="mt-4 text-slate-700 font-black text-[16px] bg-red-50 px-8 py-2.5 rounded-full border border-red-100 shadow-sm">
                  (Từ ngày {weekRange.start.toLocaleDateString('vi-VN')} đến ngày {weekRange.end.toLocaleDateString('vi-VN')})
                </div>
              </div>

              <WeeklyScheduleTable 
                schedule={view === 'personal' && currentUser ? schedule.filter(i => i.officialId === currentUser.id) : schedule} 
                officials={officials}
                selectedDate={selectedDate}
                onEdit={handleEditWork}
                onDeleteRequest={setItemToDelete}
                onAddAt={handleAddAtCell}
              />
          </div>
        </main>

        {showNotiCenter && (
          <NotificationCenter 
            notifications={notifications.filter(n => n.officialId === currentUser?.id)}
            onClose={() => setShowNotiCenter(false)}
            onMarkRead={handleMarkNotiRead}
            onClearAll={() => setNotifications([])}
            notifPermission={notifPermission}
            onRequestPermission={requestNotifPermission}
          />
        )}

        {showSettings && (
          <OfficialSettingsModal 
            officials={officials}
            onUpdateOfficials={setOfficials}
            onBackup={handleBackup}
            onRestore={handleRestore}
            onClose={() => setShowSettings(false)}
          />
        )}

        <ConfirmationModal
          isOpen={!!itemToDelete}
          message="Bạn có chắc chắn muốn xóa mục lịch này không?"
          onConfirm={confirmDeleteWork}
          onCancel={() => setItemToDelete(null)}
        />

        {showPreviewModal && (
          <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-[95vw] w-[1100px] max-h-[95vh] flex flex-col animate-popup-in border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                    <Eye size={18} />
                  </div>
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Xem trước văn bản (Khổ ngang)</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-red-700 shadow-lg shadow-red-100 transition-all active:scale-95"
                  >
                    <Printer size={16} />
                    XUẤT PDF / IN NGAY
                  </button>
                  <button 
                    onClick={() => setShowPreviewModal(false)} 
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-12 bg-slate-100/50 flex flex-col items-center">
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
          onSubmit={handleFormSubmit}
          editingItem={editingItem}
          officials={officials}
          prefill={formPrefill}
          selectedDate={selectedDate}
        />

        {activePopup && (
          <ReminderPopup 
            item={activePopup.item} 
            official={activePopup.official} 
            type={activePopup.type}
            onClose={() => setActivePopup(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default App;
