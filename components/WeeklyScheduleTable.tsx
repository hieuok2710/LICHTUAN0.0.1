
import React, { useMemo } from 'react';
import { WorkItem, Official, DayOfWeek } from '../types';
import { Clock, MapPin, Bell, Edit2, Trash2, Plus, CalendarPlus } from 'lucide-react';

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
  0: 'bg-blue-50/60',    // Thứ Hai
  1: 'bg-emerald-50/60', // Thứ Ba
  2: 'bg-amber-50/60',   // Thứ Tư
  3: 'bg-indigo-50/60',  // Thứ Năm
  4: 'bg-rose-50/60',    // Thứ Sáu
  5: 'bg-sky-50/60',     // Thứ Bảy
  6: 'bg-orange-50/60'   // Chủ Nhật
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
      className="relative pl-3 border-l-4 border-red-500 py-2 bg-white rounded-r-lg shadow-sm border border-slate-200 group/item hover:border-red-400 hover:shadow-md transition-all mb-2 last:mb-0"
    >
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity no-print z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
          className="p-1.5 text-slate-500 hover:text-white hover:bg-blue-600 rounded-md transition-all shadow-sm bg-white border border-slate-100"
          title="Chỉnh sửa"
        >
          <Edit2 size={13} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDeleteRequest(item); }}
          className="p-1.5 text-slate-500 hover:text-white hover:bg-red-600 rounded-md transition-all shadow-sm bg-white border border-slate-100"
          title="Xóa lịch"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex items-center justify-between mb-1.5 pr-2">
        <div className="flex items-center gap-1.5 text-[10px] font-black text-red-700 uppercase">
          <Clock size={12} className="shrink-0" />
          <span>{item.period}: {item.time}</span>
        </div>
        {item.remind && (
          <div className="flex items-center gap-1 text-[8px] font-black text-white bg-red-600 px-1.5 py-0.5 rounded-full uppercase shadow-sm">
            <Bell size={8} fill="white" />
            <span className="hidden lg:inline">NHẮC</span>
          </div>
        )}
      </div>
      <p className="text-xs lg:text-sm text-slate-800 leading-relaxed mb-1.5 font-bold pr-2 text-justify">
        {item.description}
      </p>
      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold italic bg-slate-50/80 px-2 py-1 rounded inline-flex border border-slate-100 max-w-full">
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
      if (!map[item.date][item.officialId]) map[item.date][item.officialId] = [];
      map[item.date][item.officialId].push(item);
    });
    Object.keys(map).forEach(date => {
      Object.keys(map[date]).forEach(offId => {
        map[date][offId].sort((a, b) => a.time.localeCompare(b.time));
      });
    });
    return map;
  }, [schedule]);

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-xl border border-slate-200">
      <table className="w-full border-collapse table-fixed min-w-[1000px]">
        <thead>
          <tr className="bg-slate-900 text-white">
            <th className="p-4 border border-slate-700 text-center w-28 lg:w-32 z-10 sticky left-0 bg-slate-900 shadow-md">Thứ / Ngày</th>
            {officials.map(off => (
              <th key={off.id} className="p-4 border border-slate-700 text-center">
                <div className="font-bold text-xs lg:text-sm leading-tight uppercase tracking-tight">{off.title}</div>
                <div className="text-[10px] lg:text-[11px] text-blue-400 mt-1 font-black uppercase tracking-widest">Đ/c {off.name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, index) => {
            const currentDate = weekDates[index];
            const dateDisplay = currentDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            const fullDateISO = currentDate.toISOString().split('T')[0];
            const rowColorClass = DAY_COLORS[index] || 'bg-white';
            
            return (
              <tr key={day} className={`${rowColorClass} transition-colors`}>
                <td className="p-4 border border-slate-200 text-center align-top sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  <span className="font-black text-slate-800 block text-base lg:text-lg">{day}</span>
                  <span className="text-sm lg:text-base text-red-600 font-black block mt-1">{dateDisplay}</span>
                </td>
                {officials.map(official => {
                  const officialItems = groupedSchedule[fullDateISO]?.[official.id] || [];
                  return (
                    <td 
                      key={official.id} 
                      className="p-2 border border-slate-200 align-top group/cell hover:bg-white/50 transition-colors"
                    >
                      <div className="flex flex-col h-full min-h-[100px]">
                        {/* List Items */}
                        <div className="flex-1 flex flex-col gap-2 mb-2">
                          {officialItems.map(item => (
                            <WorkItemCard 
                              key={item.id} 
                              item={item} 
                              onEdit={onEdit} 
                              onDeleteRequest={onDeleteRequest} 
                            />
                          ))}
                        </div>

                        {/* Add Button Area */}
                        <div className="mt-auto no-print">
                          {officialItems.length === 0 ? (
                            <button
                              onClick={() => onAddAt(fullDateISO, official.id)}
                              className="w-full h-full min-h-[80px] border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-400 hover:bg-red-50/50 transition-all gap-1 group/btn"
                            >
                              <CalendarPlus size={24} className="group-hover/btn:scale-110 transition-transform" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Thêm lịch</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onAddAt(fullDateISO, official.id)}
                              className="w-full py-2 border-2 border-dashed border-transparent hover:border-red-300 rounded-lg flex items-center justify-center text-transparent hover:text-red-600 hover:bg-red-50/50 transition-all gap-2 group/btn opacity-0 group-hover/cell:opacity-100"
                            >
                              <Plus size={16} />
                              <span className="text-[10px] font-bold uppercase">Thêm công tác</span>
                            </button>
                          )}
                        </div>
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
