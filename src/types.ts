import { translations } from './constants';

export type TranslationKey = keyof typeof translations.th;

export enum UserRole {
  Admin = 'Admin',
  Staff = 'Staff',
  Student = 'Student',
  Teacher = 'Teacher'
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
  id: string;
  users: string;
  password?: string;
  role: UserRole;
  username?: string;
  email?: string;
  fullName?: string;
  studentId?: string;
  department?: string;
  grade?: string;
  classroom?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  designatedFor: UserRole;
  imageUrl: string;
}

export interface Device {
  id: string;
  category_id: string;
  serial_number: string;
  defaultAccessories: string;
  status: DeviceStatus;
  // Hydrated fields for UI
  name?: string;
  categoryName?: string;
  imageUrl?: string;
  designatedFor?: UserRole;
}

export interface Student {
  studentId: string;
  fullName: string;
  grade: string;
  classroom: string;
  email: string;
  note?: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  department: string;
  email: string;
}

export interface MaintenanceRecord {
  id: string;
  product_id: string;
  issue: string;
  report_date: string;
  status: string;
}

export interface ServiceReport {
  id?: string;
  device_id: string;
  issue_type: string;
  details: string;
  image_url?: string;
  report_date: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
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
