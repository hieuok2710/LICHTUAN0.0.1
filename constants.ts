
import { Official, WorkItem } from './types';

export const OFFICIALS: Official[] = [
  { id: '1', name: 'Đặng Văn Nê', title: 'Bí thư Đảng ủy - CT HĐND phường' },
  { id: '2', name: 'Trần Thị Hòa Bình', title: 'Phó Bí thư Thường trực đảng ủy' },
  { id: '3', name: 'Phan Hồng Khanh', title: 'Phó Bí thư - CT UBND phường' }
];

export const INITIAL_SCHEDULE: WorkItem[] = [
  // THỨ HAI 15/12/2025
  { id: 'm1', day: 'Thứ Hai', date: '2025-12-15', time: '08:00', period: 'Sáng', description: 'Dự họp kiểm điểm, đánh giá, xếp loại các chi bộ trực thuộc năm 2025, chi bộ Quân sự phường', location: 'HT Đảng ủy phường', officialIds: ['1'] },
  { id: 'm2', day: 'Thứ Hai', date: '2025-12-15', time: '14:00', period: 'Chiều', description: 'Dự họp kiểm điểm, đánh giá, xếp loại các chi bộ trực thuộc năm 2025, chi bộ Các cơ quan Đảng', location: 'HT Đảng ủy phường', officialIds: ['1', '2', '3'] },

  // THỨ BA 16/12/2025
  { id: 't1', day: 'Thứ Ba', date: '2025-12-16', time: '07:30', period: 'Sáng', description: 'Dự Hội nghị kiểm điểm, đánh giá, xếp loại tập thể Ban Thường vụ Đảng ủy năm 2025', location: 'HT Đảng ủy phường', officialIds: ['1', '2', '3'] },
  { id: 't4', day: 'Thứ Ba', date: '2025-12-16', time: '13:30', period: 'Chiều', description: 'Dự Hội nghị kiểm điểm, đánh giá, xếp loại tập thể Ban Thường vụ Đảng ủy năm 2025 (tiếp tục)', location: 'HT Đảng ủy phường', officialIds: ['1', '2', '3'] },

  // THỨ TƯ 17/12/2025
  { id: 'w1', day: 'Thứ Tư', date: '2025-12-17', time: '07:30', period: 'Sáng', description: 'Tham dự Hội thi nghiệp vụ chữa cháy và cứu nạn, cứu hộ "Tổ liên gia an toàn phòng cháy, chữa cháy" Cụm VI - năm 2025', location: 'Quảng trường phường Long Phú khóm Long Thị C', officialIds: ['3'] },
  { id: 'w2', day: 'Thứ Tư', date: '2025-12-17', time: '14:00', period: 'Chiều', description: 'Làm việc với các khóm', location: 'Khóm', officialIds: ['1'] },

  // THỨ NĂM 18/12/2025
  { id: 'th1', day: 'Thứ Năm', date: '2025-12-18', time: '07:30', period: 'Sáng', description: 'Tham dự Kỳ họp thứ 3 (chuyên đề) HĐND phường Long Phú khóa XII', location: 'HT UBND phường', officialIds: ['1', '2'] },
  { id: 'th3', day: 'Thứ Năm', date: '2025-12-18', time: '14:00', period: 'Chiều', description: 'Dự họp thẩm định kiểm điểm và đánh giá, xếp loại tập thể và cá nhân các tổ chức Đảng trực thuộc', location: 'HT Đảng ủy phường', officialIds: ['2'] },
  { id: 'th4', day: 'Thứ Năm', date: '2025-12-18', time: '14:00', period: 'Chiều', description: 'Tiếp công dân', location: 'VP UBND', officialIds: ['3'] },

  // THỨ SÁU 19/12/2025
  { id: 'f1', day: 'Thứ Sáu', date: '2025-12-19', time: '08:30', period: 'Sáng', description: 'Dự Họp mặt kỷ niệm 81 năm Ngày thành lập Quân đội nhân dân Việt Nam', location: 'Đền tưởng niệm các anh hùng, liệt sĩ và người có công - phường Rạch Giá, tỉnh An Giang', officialIds: ['1'] },
  { id: 'f2', day: 'Thứ Sáu', date: '2025-12-19', time: '13:30', period: 'Chiều', description: 'Báo cáo bài lớp Bồi dưỡng chuyên đề Đảng ta thật là vĩ đại - Đợt 5', location: 'Trung tâm chính trị', officialIds: ['2'] },
  { id: 'f3', day: 'Thứ Sáu', date: '2025-12-19', time: '14:00', period: 'Chiều', description: 'Giải quyết công việc cơ quan', location: 'VP UBND', officialIds: ['3'] },

  // THỨ BẢY 20/12/2025
  { id: 's1', day: 'Thứ Bảy', date: '2025-12-20', time: '08:00', period: 'Sáng', description: 'Tham dự Hội nghị tập huấn trực tuyến về công tác bầu cử', location: 'Hội trường trực tuyến UBND', officialIds: ['2'] }
];
