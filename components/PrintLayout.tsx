
import React from 'react';
import { WorkItem, Official, DayOfWeek } from '../types';

interface PrintLayoutProps {
  schedule: WorkItem[];
  officials: Official[];
  weekRange: { start: Date; end: Date; startStr: string; endStr: string };
  orientation?: 'portrait' | 'landscape';
}

const DAYS: DayOfWeek[] = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

const PrintLayout: React.FC<PrintLayoutProps> = ({ 
  schedule, 
  officials, 
  weekRange, 
  orientation = 'portrait' 
}) => {
  const getLocalDateISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDayDateDisplay = (dayIndex: number) => {
    const d = new Date(weekRange.start);
    d.setDate(weekRange.start.getDate() + dayIndex);
    return d.toLocaleDateString('vi-VN');
  };

  const isLandscape = orientation === 'landscape';

  return (
    <div 
      id="print-document" 
      className={`${orientation} bg-white text-black font-['Tinos','Times_New_Roman',serif]`}
    >
      {/* CSS để ép trình duyệt nhận diện khổ giấy khi in */}
      <style>{`
        @media print {
          @page { size: A4 ${orientation}; }
        }
      `}</style>

      {/* Quốc hiệu & Tiêu ngữ */}
      <div className="flex justify-between items-start mb-4">
        <div className="text-center w-[45%]">
          <p className="font-normal text-[13pt] uppercase leading-tight tracking-tighter">ĐẢNG ỦY PHƯỜNG LONG PHÚ</p>
          <p className="font-bold text-[13pt] uppercase leading-tight border-b border-black inline-block px-4 pb-0.5">VĂN PHÒNG</p>
          <p className="mt-1 text-[11pt] italic">Số: .....-TB/VP</p>
        </div>
        <div className="text-center w-[50%]">
          <p className="font-bold text-[12pt] uppercase leading-tight">ĐẢNG CỘNG SẢN VIỆT NAM</p>
          <div className="flex flex-col items-center mt-1">
            <p className="text-[12pt] italic leading-tight">Long Phú, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>

      {/* Tên văn bản */}
      <div className="text-center mb-6 mt-8">
        <h1 className="font-bold text-[14pt] uppercase leading-tight">THÔNG BÁO</h1>
        <h2 className="font-bold text-[13pt] mt-1 leading-tight uppercase">Chương trình công tác của Thường trực Đảng ủy</h2>
        <p className="font-bold text-[13pt] mt-1">(Từ ngày {weekRange.startStr} đến ngày {weekRange.endStr})</p>
        <div className="flex justify-center mt-2">
          <div className="w-24 border-b border-black"></div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <table className="w-full border-collapse border-[1.5pt] border-black text-[11pt]">
        <thead>
          <tr className="bg-gray-50">
            <th className={`border border-black p-2 ${isLandscape ? 'w-[10%]' : 'w-[15%]'} text-center font-bold`}>Thứ/ Ngày</th>
            {officials.map(off => (
              <th key={off.id} className="border border-black p-2 text-center font-bold uppercase">
                {off.title}<br/><span className="capitalize font-bold">Đ/c {off.name.split(' ').pop()}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, idx) => {
            const dateStr = getDayDateDisplay(idx);
            const cellDate = new Date(weekRange.start);
            cellDate.setDate(weekRange.start.getDate() + idx);
            const cellISO = getLocalDateISO(cellDate);

            return (
              <tr key={day}>
                <td className="border border-black p-2 text-center align-middle font-bold">
                  {day}<br/>{dateStr}
                </td>
                {officials.map(official => {
                  const items = schedule.filter(i => {
                    const ids = i.officialIds && i.officialIds.length > 0 
                      ? i.officialIds 
                      : (i as any).officialId ? [(i as any).officialId] : [];
                    return i.date === cellISO && ids.includes(official.id);
                  }).sort((a, b) => a.time.localeCompare(b.time));

                  return (
                    <td key={official.id} className="border border-black p-2 align-top text-justify">
                      {items.length > 0 ? (
                        <div className="space-y-1.5">
                          {items.map(item => (
                            <div key={item.id} className="leading-relaxed">
                              <span className="font-bold">- {item.time}:</span> {item.description} <span className="font-bold">({item.location})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10pt] italic text-gray-400">- Làm việc thường xuyên</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Chữ ký & Nơi nhận */}
      <div className="mt-8 flex justify-between items-start break-inside-avoid">
        <div className="w-[45%] text-[10pt] leading-snug">
          <p className="font-bold italic underline">Nơi nhận:</p>
          <p>- Thường trực Đảng ủy;</p>
          <p>- UBND phường;</p>
          <p>- Các chi bộ trực thuộc;</p>
          <p>- Lưu Văn phòng.</p>
        </div>
        <div className="w-[45%] text-center">
          <p className="font-bold text-[12pt] uppercase leading-tight">CHÁNH VĂN PHÒNG</p>
          <div className="h-20"></div>
          <p className="font-bold text-[13pt]">Nguyễn Thế Anh</p>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;
