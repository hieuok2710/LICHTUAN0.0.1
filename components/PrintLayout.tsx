
import React from 'react';
import { WorkItem, Official, DayOfWeek } from '../types';

interface PrintLayoutProps {
  schedule: WorkItem[];
  officials: Official[];
  weekRange: { start: Date; end: Date; startStr: string; endStr: string };
}

const DAYS: DayOfWeek[] = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

const PrintLayout: React.FC<PrintLayoutProps> = ({ schedule, officials, weekRange }) => {
  const getDayDate = (dayIndex: number) => {
    const d = new Date(weekRange.start);
    d.setDate(weekRange.start.getDate() + dayIndex);
    return d.toLocaleDateString('vi-VN');
  };

  return (
    <div id="print-document" className="bg-white text-black p-[5mm] mx-auto print:p-0" style={{ width: '100%', maxWidth: '277mm' }}>
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div className="text-center w-[40%]">
          <p className="font-normal text-[14px] uppercase tracking-tighter">ĐẢNG ỦY PHƯỜNG LONG PHÚ</p>
          <p className="font-bold text-[14px] uppercase inline-block px-4 pb-0.5">VĂN PHÒNG</p>
          <p className="mt-0.5 text-[10px]">*</p>
        </div>
        <div className="text-center w-[50%]">
          <p className="font-bold text-[14px] uppercase tracking-tight underline underline-offset-2">ĐẢNG CỘNG SẢN VIỆT NAM</p>
          <p className="mt-2 text-[12px] italic">
            Long Phú, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Title Section */}
      <div className="text-center mb-8">
        <h1 className="font-bold text-[18px] uppercase leading-tight">THÔNG BÁO</h1>
        <h2 className="font-bold text-[16px] mt-1">Chương trình công tác của Thường trực Đảng ủy</h2>
        <p className="font-bold text-[16px] mt-2">(Từ ngày {weekRange.startStr} đến ngày {weekRange.endStr})</p>
        <div className="flex justify-center mt-2">
          <div className="w-16 border-b-2 border-black"></div>
        </div>
      </div>

      {/* Main Table */}
      <table className="w-full border-collapse border border-black text-[12px] table-fixed">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 w-[10%] text-center font-bold">Thứ/<br/>Ngày</th>
            {officials.map(off => (
              <th key={off.id} className="border border-black p-2 text-center font-bold">
                {off.title}<br/>Đ/c {off.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, idx) => {
            const dateStr = getDayDate(idx);
            const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            
            return (
              <tr key={day} className={rowBg}>
                <td className="border border-black p-2 text-center align-top font-bold">
                  {day}<br/>{dateStr}
                </td>
                {officials.map(official => {
                  const cellDate = new Date(weekRange.start);
                  cellDate.setDate(weekRange.start.getDate() + idx);
                  const cellISO = cellDate.toISOString().split('T')[0];
                  
                  const officialItems = schedule.filter(item => {
                    return item.date === cellISO && item.officialId === official.id;
                  }).sort((a, b) => a.time.localeCompare(b.time));

                  return (
                    <td key={official.id} className="border border-black p-2 align-top text-justify">
                      {officialItems.length > 0 ? (
                        <div className="space-y-2">
                          {officialItems.map(item => (
                            <div key={item.id} className="mb-1">
                              <span className="font-bold">- {item.period}: {item.time}</span>, {item.description} <span className="font-bold">({item.location})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] italic text-gray-400">- Làm việc thường xuyên</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer Section */}
      <div className="mt-10 flex justify-between items-start page-break-inside-avoid">
        <div className="w-[40%] text-[10px] leading-relaxed">
          <p className="font-bold italic underline">Nơi nhận:</p>
          <p>- Ban Thường vụ Đảng bộ;</p>
          <p>- Các chi, Đảng bộ trực thuộc;</p>
          <p>- Lưu Văn phòng Đảng ủy.</p>
        </div>
        <div className="w-[40%] text-center">
          <p className="font-bold text-[14px] uppercase">CHÁNH VĂN PHÒNG</p>
          <div className="h-20"></div>
          <p className="font-bold text-[14px] mt-2">Nguyễn Thế Anh</p>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;
