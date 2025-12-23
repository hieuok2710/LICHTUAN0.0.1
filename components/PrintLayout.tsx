
import React from 'react';
import { WorkItem, Official, DayOfWeek } from '../types';

interface PrintLayoutProps {
  schedule: WorkItem[];
  officials: Official[];
  weekRange: { start: Date; end: Date; startStr: string; endStr: string };
  hideWeekend?: boolean;
}

const DAYS: DayOfWeek[] = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

const PrintLayout: React.FC<PrintLayoutProps> = ({ schedule, officials, weekRange, hideWeekend }) => {
  
  // Hàm lấy chuỗi ngày hiển thị (VD: 15/12/2025)
  const getDayDisplay = (dayIndex: number) => {
    const d = new Date(weekRange.start);
    d.setDate(weekRange.start.getDate() + dayIndex);
    return d.toLocaleDateString('vi-VN');
  };

  // Hàm lấy chuỗi ISO Local (YYYY-MM-DD) để so sánh chính xác với dữ liệu nhập
  // Không dùng toISOString() vì sẽ bị lệch múi giờ khi giờ là 00:00
  const getIsoDate = (dayIndex: number) => {
    const d = new Date(weekRange.start);
    d.setDate(weekRange.start.getDate() + dayIndex);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div id="print-document" className="bg-white text-black mx-auto print:p-0 pr-4" style={{ width: '100%', fontFamily: '"Times New Roman", Times, serif' }}>
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4">
        <div className="text-center w-[40%]">
          <p className="font-normal text-[14px] uppercase tracking-tighter">ĐẢNG ỦY PHƯỜNG LONG PHÚ</p>
          <p className="font-bold text-[14px] uppercase inline-block px-4 pb-0.5">VĂN PHÒNG</p>
          <p className="mt-0.5 text-[10px]">*</p>
        </div>
        <div className="text-center w-[50%]">
          <p className="font-bold text-[14px] uppercase tracking-tight underline underline-offset-2">ĐẢNG CỘNG SẢN VIỆT NAM</p>
          <p className="mt-1 text-[13px] italic">
            Long Phú, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Title Section */}
      <div className="text-center mb-6">
        <h1 className="font-bold text-[20px] uppercase leading-tight">THÔNG BÁO</h1>
        <h2 className="font-bold text-[16px] mt-1">Chương trình công tác của Thường trực Đảng ủy</h2>
        <p className="font-bold text-[15px] mt-1">(Từ ngày {weekRange.startStr} đến ngày {weekRange.endStr})</p>
        <div className="flex justify-center mt-1">
          <div className="w-24 border-b border-black"></div>
        </div>
      </div>

      {/* Main Table */}
      <table className="w-full border-collapse border border-black text-[13px] table-fixed">
        <thead>
          <tr className="bg-gray-100 print:bg-transparent">
            {/* Cột Thứ/Ngày: Canh giữa ngang và dọc */}
            <th className="border border-black p-2 w-[10%] text-center align-middle font-bold">Thứ/<br/>Ngày</th>
            {officials.map(off => (
              <th key={off.id} className="border border-black p-2 text-center align-middle font-bold">
                {off.title}<br/>Đ/c {off.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, idx) => {
            // Nếu tùy chọn ẩn cuối tuần được bật và ngày hiện tại là T7 hoặc CN, bỏ qua không render
            if (hideWeekend && (day === 'Thứ Bảy' || day === 'Chủ Nhật')) return null;

            const dateStr = getDayDisplay(idx);
            const cellISO = getIsoDate(idx);
            
            return (
              <tr key={day}>
                {/* Ô Thứ/Ngày: Canh giữa ngang và dọc */}
                <td className="border border-black p-2 text-center align-middle font-bold">
                  {day}<br/>{dateStr}
                </td>
                {officials.map(official => {
                  const officialItems = schedule.filter(item => {
                    return item.date === cellISO && item.officialId === official.id;
                  }).sort((a, b) => {
                     // Sắp xếp theo giờ tăng dần
                     const timeCompare = a.time.localeCompare(b.time);
                     if (timeCompare !== 0) return timeCompare;
                     // Nếu trùng giờ thì giữ nguyên thứ tự nhập (hoặc sắp theo mô tả nếu cần)
                     return 0;
                  });

                  return (
                    // Các ô dữ liệu: Canh trên (align-top) để nội dung chạy từ trên xuống, text canh đều (justify) hoặc trái
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
                        <div className="text-[12px] italic text-gray-500 print:text-gray-400 text-center mt-2">- Làm việc thường xuyên</div>
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
      <div className="mt-6 flex justify-between items-start page-break-inside-avoid">
        <div className="w-[40%] text-[12px] leading-relaxed ml-2">
          <p className="font-bold italic underline">Nơi nhận:</p>
          <p>- Ban Thường vụ Đảng bộ;</p>
          <p>- Các chi, Đảng bộ trực thuộc;</p>
          <p>- Lưu Văn phòng Đảng ủy.</p>
        </div>
        <div className="w-[40%] text-center">
          <p className="font-bold text-[14px] uppercase">CHÁNH VĂN PHÒNG</p>
          <div className="h-24"></div>
          <p className="font-bold text-[14px] mt-2">Nguyễn Thế Anh</p>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;
