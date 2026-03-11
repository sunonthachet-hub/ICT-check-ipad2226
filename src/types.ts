import { translations } from './constants';

export type TranslationKey = keyof typeof translations.th;

export enum UserRole {
  Admin = 'Admin',
  Staff = 'Staff'
}

export enum DeviceStatus {
  Available = 'Available',
  Borrowed = 'Borrowed',
  Maintenance = 'Maintenance',
  PendingApproval = 'PendingApproval',
  Lost = 'Lost'
}

export enum DeviceCategory {
  iPad = 'iPad',
  Laptop = 'Laptop',
  Projector = 'Projector',
  Camera = 'Camera',
  Others = 'Others'
}

export interface User {
  users: string;
  password?: string;
  name: string;
  role: UserRole;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  designatedFor: string; // Changed to string to support flexible roles if needed, or keep it as UserRole if strictly Admin/Staff
  imageUrl: string;
}

export interface Device {
  id: string;
  category_id: string;
  serial_number: string;
  defaultAccessories: string;
  status: DeviceStatus;
  borrowedBy?: string; // Added to track who currently has the device
  // Hydrated fields for UI
  name?: string;
  categoryName?: string;
  imageUrl?: string;
  designatedFor?: string;
}

export interface Student {
  studentId: string;
  fullName: string;
  grade: string;
  classroom: string;
  email: string;
  teacherId?: string;
  note?: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  department: string;
  email: string;
  profileImageUrl?: string;
  classroom?: string; // Added for mapping to students
}

export interface ServiceLog {
  id: string;
  product_id: string;
  issue: string;
  report_date: string;
  status: string;
}

export interface ServiceReport {
  id: string;
  deviceId: string;
  issue_type: string;
  details: string;
  email: string;
  photo_url: string;
  reportedAt: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
}

export interface ActivityLog {
  timestamp: string;
  user: string;
  action: string;
  target: string;
  details: string;
}

export interface Transaction {
  borrowerId: number;
  fid: string;
  fname: string;
  snDevice: string;
  borrow_date: string;
  borrowTime: string;
  due_date: string;
  return_date: string;
  recorder: string;
  status: string;
}
