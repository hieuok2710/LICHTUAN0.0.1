
export type DayOfWeek = 'Thứ Hai' | 'Thứ Ba' | 'Thứ Tư' | 'Thứ Năm' | 'Thứ Sáu' | 'Thứ Bảy' | 'Chủ Nhật';

export interface Official {
  id: string;
  name: string;
  title: string;
}

export interface WorkItem {
  id: string;
  day: DayOfWeek;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  period: 'Sáng' | 'Chiều';
  description: string;
  location: string;
  officialId: string;
  isCompleted?: boolean;
  remind?: boolean;
}

export interface TaskAlert {
  id: string;
  timestamp: number;
  message: string;
  type: 'urgent' | 'daily' | 'info';
  officialId: string;
  read: boolean;
  relatedItemId?: string;
}

export interface SystemState {
  version: string;
  timestamp: number;
  officials: Official[];
  schedule: WorkItem[];
  settings?: {
    notificationsEnabled: boolean;
  };
}
