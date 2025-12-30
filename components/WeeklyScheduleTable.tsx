
import React, { useMemo } from 'react';
import { WorkItem, Official, DayOfWeek } from '../types';
import { Clock, MapPin, Bell, Edit2, Trash2, Plus } from 'lucide-react';

interface Props {
  schedule: WorkItem[];
  officials: Official[];
  selectedDate: Date;
  onEdit: (item: WorkItem) => void;
  onDeleteRequest: (item: WorkItem) => void;
  onAddAt: (date: string, officialId: string) => void;
}

const DAYS: DayOfWeek[] = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

const DAY_COLORS: Record<number, string> = {
  0: 'bg-blue-50/40',    // Thứ Hai
  1: 'bg-emerald-50/40', // Thứ Ba
  2: 'bg-amber-50/40',   // Thứ Tư
  3: 'bg-indigo-50/40',  // Thứ Năm
  4: 'bg-rose-50/40',    // Thứ Sáu
  5: 'bg-sky-50/40',     // Thứ Bảy
  6: 'bg-orange-50/40'   // Chủ Nhật
};

const WorkItemCard = React.memo(({ 
  item, 
  onEdit, 
  onDeleteRequest 
}: { 
  item: WorkItem, 
  onEdit: (item: WorkItem) => void, 
  onDeleteRequest: (item: WorkItem) => void 
}) => {
  return (
    <div 
      className="relative pl-3 border-l-4 border-red-500 py-2.5 bg-white rounded-r-xl shadow-sm border border-slate-200 group/item hover:border-red-400 hover:shadow-md transition-all mb-3 last:mb-0"
      onClick={(e) => e.stopPropagation()} 
    >
      {/* Nút thao tác nhanh */}
      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity no-print">
        <button 
          onClick={() => onEdit(item)}
          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          title="Chỉnh sửa"
        >
          <Edit2 size={13} />
        </button>
        <button 
          onClick={() => onDeleteRequest(item)}
          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          title="Xóa lịch"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-1.5 pr-14">
        <div className="flex items-center gap-1.5 text-[10px] font-black text-red-700 uppercase">
          <Clock size={12} className="shrink-0" />
          <span>{item.time} ({item.period})</span>
        </div>
        {item.remind && (
          <div className="flex items-center gap-1 text-[8px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded-full uppercase shadow-sm">
            <Bell size={8} fill="white" />
          </div>
        )}
      </div>
      
      <p className="text-xs lg:text-[13px] text-slate-800 leading-snug mb-2 font-bold pr-3 text-justify">
        {item.description}
      </p>

      <div className="flex items-center gap-1 text-[9px] text-slate-500 font-bold italic bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
        <MapPin size={10} className="shrink-0" />
        <span className="truncate">{item.location}</span>
      </div>
    </div>
  );
});

const WeeklyScheduleTable: React.FC<Props> = ({ schedule, officials, selectedDate, onEdit, onDeleteRequest, onAddAt }) => {
  const weekDates = useMemo(() => {
    const dates = [];
    const start = new Date(selectedDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [selectedDate]);

  const groupedSchedule = useMemo(() => {
    const map: Record<string, Record<string, WorkItem[]>> = {};
    schedule.forEach(item => {
      if (!map[item.date]) map[item.date] = {};
      
      let ids: string[] = [];
      if (item.officialIds && item.officialIds.length > 0) {
        ids = item.officialIds;
      } else if ((item as any).officialId) {
        ids = [(item as any).officialId];
      }

      ids.forEach(offId => {
        if (!map[item.date][offId]) map[item.date][offId] = [];
        map[item.date][offId].push(item);
      });
    });

    Object.keys(map).forEach(date => {
      Object.keys(map[date]).forEach(offId => {
        map[date][offId].sort((a, b) => a.time.localeCompare(b.time));
      });
    });
    return map;
  }, [schedule]);

  const specialOfficials = ['Đặng Văn Nê', 'Trần Thị Hòa Bình', 'Phan Hồng Khanh'];

  return (
    <div className="overflow-x-auto bg-white rounded-3xl shadow-2xl border border-slate-200">
      <table className="w-full border-collapse table-fixed min-w-[1100px]">
        <thead>
          <tr className="bg-slate-900 text-white shadow-lg">
            <th className="p-5 border-b border-slate-700 text-center w-28 lg:w-36 z-20 sticky left-0 bg-slate-900">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Thời gian</span>
              <div className="h-px bg-slate-700 w-full mb-1"></div>
              <span className="text-xs font-black uppercase tracking-tight text-white">Thứ / Ngày</span>
            </th>
            {officials.map(off => {
              const isSpecial = specialOfficials.includes(off.name);
              return (
                <th key={off.id} className="p-5 border-b border-slate-700 text-center">
                  <div className="font-black text-xs lg:text-[13px] leading-tight uppercase tracking-tight text-white/70">{off.title}</div>
                  <div className={`mt-1.5 font-black uppercase tracking-widest bg-white/5 py-1 px-3 rounded-xl inline-block ${isSpecial ? 'special-official-tag' : 'text-[10px] text-red-500'}`}>
                    Đ/c {off.name}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, index) => {
            const currentDate = weekDates[index];
            const dateDisplay = currentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            const fullDateISO = currentDate.toISOString().split('T')[0];
            const isToday = new Date().toISOString().split('T')[0] === fullDateISO;
            const rowColorClass = DAY_COLORS[index] || 'bg-white';
            
            return (
              <tr key={day} className={`${rowColorClass} transition-all relative group`}>
                <td className={`p-5 border-r border-slate-200 text-center align-top sticky left-0 z-10 ${isToday ? 'bg-red-50' : 'bg-inherit'} shadow-[4px_0_10px_rgba(0,0,0,0.03)]`}>
                  <div className={`text-base lg:text-xl font-black ${isToday ? 'text-red-700' : 'text-slate-800'}`}>{day}</div>
                  <div className={`text-sm lg:text-base font-black block mt-1 ${isToday ? 'text-red-600 bg-white px-2 py-1 rounded-full shadow-sm' : 'text-slate-500'}`}>{dateDisplay}</div>
                  {isToday && <div className="mt-3 inline-block px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded-full uppercase tracking-widest">Hôm nay</div>}
                </td>

                {officials.map(official => {
                  const officialItems = groupedSchedule[fullDateISO]?.[official.id] || [];
                  return (
                    <td 
                      key={official.id} 
                      className="p-3 border-r border-slate-200 align-top group/cell relative"
                    >
                      <div className="flex flex-col h-full min-h-[120px]">
                        <div className="flex-1">
                          {officialItems.length > 0 ? (
                            <div className="flex flex-col">
                              {officialItems.map(item => (
                                <WorkItemCard 
                                  key={item.id} 
                                  item={item} 
                                  onEdit={onEdit} 
                                  onDeleteRequest={onDeleteRequest} 
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="h-20 flex items-center justify-center border border-dashed border-slate-300 rounded-2xl mb-3">
                              <span className="text-[10px] text-slate-400 font-bold italic">Làm việc thường xuyên</span>
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => onAddAt(fullDateISO, official.id)}
                          className="w-full mt-2 py-2 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50/50 transition-all no-print group/add-btn"
                        >
                          <Plus size={14} className="group-hover/add-btn:scale-125 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/cell:opacity-100 transition-opacity">Thêm công tác</span>
                        </button>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default WeeklyScheduleTable;
