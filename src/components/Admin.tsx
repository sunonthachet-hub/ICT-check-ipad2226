import React, { useState } from 'react';
import { Device, Category, DeviceStatus, TranslationKey, User, Student, Teacher, ServiceLog, ServiceReport, UserRole } from '../types';
import { Plus, Edit2, Trash2, Package, Tag, Users, X, Settings, GraduationCap, User as UserIcon, RefreshCw } from 'lucide-react';
import { gasHelper } from '../services/gasService';
import { formatThaiDate } from '../constants';

interface AdminPanelProps {
  devices: Device[] & {
    users?: User[];
    teachers?: Teacher[];
    students?: Student[];
    serviceLogs?: ServiceLog[];
    serviceReports?: ServiceReport[];
  };
  categories: Category[];
  onUpdate: () => void;
  t: (key: TranslationKey) => string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ devices, categories, onUpdate, t }) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'categories' | 'serviceLogs' | 'users' | 'students' | 'service' | 'teachers'>('inventory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Device | Category | ServiceLog | User | Teacher | Student | null>(null);
  const [studentGradeFilter, setStudentGradeFilter] = useState<string>('all');
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');

  const handleDelete = async (type: string, id: string, item?: any) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) return;
    
    let sheetName = type;
    if (type === 'Students' && item) {
      if (item.grade === 'ม.5') sheetName = 'StudentsM5';
      else if (item.grade === 'ม.6') sheetName = 'StudentsM6';
    }
    if (type === 'ServiceLog') sheetName = 'serviceLogs';

    const result = await gasHelper('delete', sheetName, { id });
    if (result.success) {
      alert('ลบข้อมูลสำเร็จ');
      onUpdate();
    } else {
      alert('เกิดข้อผิดพลาด: ' + result.error);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-spk-blue">{t('admin')}</h2>
          <p className="text-gray-500">จัดการฐานข้อมูลและตั้งค่าระบบพื้นฐาน</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={onUpdate}
            className="px-4 py-2 rounded-lg text-sm font-bold text-spk-blue hover:bg-spk-gray transition-all flex items-center gap-2 cursor-pointer"
            title="รีเฟรชข้อมูลจาก Google Sheets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'inventory' ? 'bg-spk-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600 cursor-pointer'}`}
          >
            <Package className="w-4 h-4" />
            ครุภัณฑ์
          </button>
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'categories' ? 'bg-spk-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600 cursor-pointer'}`}
          >
            <Tag className="w-4 h-4" />
            หมวดหมู่
          </button>
          <button
            onClick={() => setActiveSubTab('serviceLogs')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'serviceLogs' ? 'bg-spk-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600 cursor-pointer'}`}
          >
            <Settings className="w-4 h-4" />
            Service Logs
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'users' ? 'bg-spk-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600 cursor-pointer'}`}
          >
            <Users className="w-4 h-4" />
            ผู้ใช้งาน
          </button>
          <button
            onClick={() => setActiveSubTab('teachers')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'teachers' ? 'bg-spk-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600 cursor-pointer'}`}
          >
            <GraduationCap className="w-4 h-4" />
            คุณครู
          </button>
          <button
            onClick={() => setActiveSubTab('students')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'students' ? 'bg-spk-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600 cursor-pointer'}`}
          >
            <Users className="w-4 h-4" />
            นักเรียน
          </button>
          <button
            onClick={() => setActiveSubTab('service')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'service' ? 'bg-spk-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600 cursor-pointer'}`}
          >
            <Settings className="w-4 h-4" />
            รายการแจ้งซ่อม
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="card overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-spk-blue capitalize">
              {activeSubTab === 'inventory' ? 'จัดการรายการครุภัณฑ์' : 
               activeSubTab === 'categories' ? 'จัดการหมวดหมู่สินค้า' : 
               activeSubTab === 'serviceLogs' ? 'จัดการข้อมูลซ่อมบำรุง' :
               activeSubTab === 'users' ? 'จัดการข้อมูลผู้ใช้งาน' :
               activeSubTab === 'teachers' ? 'จัดการข้อมูลคุณครู' :
               activeSubTab === 'students' ? 'จัดการข้อมูลนักเรียน' :
               'จัดการรายการแจ้งซ่อม'}
            </h3>
            {activeSubTab === 'students' && (
              <div className="flex gap-2 mt-2">
                <select 
                  value={studentGradeFilter} 
                  onChange={(e) => setStudentGradeFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-spk-blue"
                >
                  <option value="all">ทุกระดับชั้น</option>
                  <option value="ม.4">ม.4</option>
                  <option value="ม.5">ม.5</option>
                  <option value="ม.6">ม.6</option>
                </select>
                <input 
                  type="text" 
                  placeholder="ค้นหาชื่อ/รหัส..." 
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-spk-blue w-40"
                />
              </div>
            )}
          </div>
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
            className="btn-primary flex items-center gap-2 py-2"
          >
            <Plus className="w-4 h-4" />
            เพิ่มข้อมูลใหม่
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-spk-gray text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">ข้อมูล</th>
                <th className="px-6 py-4">รายละเอียด</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeSubTab === 'inventory' && devices.map((device) => (
                <tr key={device.serial_number} className="hover:bg-spk-gray/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-300" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{device.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{device.serial_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-500">หมวดหมู่: <span className="font-medium">{device.categoryName}</span></p>
                    {device.notes && <p className="text-[10px] text-gray-400 italic mt-1">Note: {device.notes}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${device.status === DeviceStatus.Available ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(device); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete('Devices', device.serial_number)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {activeSubTab === 'categories' && categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-spk-gray/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                        <img src={cat.imageUrl || `https://picsum.photos/seed/${cat.id}/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <p className="font-bold text-gray-800">{cat.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-500">สิทธิ์ยืม: <span className="font-medium">{cat.designatedFor}</span></p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-400">{cat.id}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(cat); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete('Categories', cat.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}

              {activeSubTab === 'serviceLogs' && devices.serviceLogs?.map((m) => (
                <tr key={m.id} className="hover:bg-spk-gray/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{m.issue}</p>
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Product ID: {m.product_id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-500">Date: <span className="font-medium">{formatThaiDate(m.report_date)}</span></p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${m.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(m); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete('ServiceLog', m.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {activeSubTab === 'users' && devices.users?.map((user) => (
                <tr key={user.users} className="hover:bg-spk-gray/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{user.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">User: {user.users}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-500">Role: <span className="font-medium">{user.role}</span></p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-400">-</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(user); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete('Users', user.users)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {activeSubTab === 'teachers' && devices.teachers?.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-spk-gray/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                        {teacher.profileImageUrl ? (
                          <img src={teacher.profileImageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50">
                            <UserIcon className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{teacher.fullName}</p>
                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">ID: {teacher.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-500">กลุ่มสาระ: <span className="font-medium">{teacher.department}</span></p>
                    <p className="text-xs text-gray-500">ห้องเรียน: <span className="font-medium">{teacher.classroom || '-'}</span></p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-400">{teacher.email}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(teacher); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete('Teachers', teacher.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {activeSubTab === 'students' && devices.students?.filter(s => {
                const matchesGrade = studentGradeFilter === 'all' || s.grade === studentGradeFilter;
                const matchesSearch = s.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase()) || 
                                    s.studentId.toString().includes(studentSearchTerm);
                return matchesGrade && matchesSearch;
              }).map((student) => (
                <tr key={student.studentId} className="hover:bg-spk-gray/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{student.fullName}</p>
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">ID: {student.studentId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-500">ชั้น: <span className="font-medium">{student.grade}/{student.classroom}</span></p>
                    {student.teacherId && (
                      <p className="text-[10px] text-spk-blue font-bold">
                        ครู: {devices.teachers?.find(t => t.id === student.teacherId)?.fullName || student.teacherId}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-400">{student.email}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(student as any); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete('Students', student.studentId, student)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {activeSubTab === 'service' && devices.serviceReports?.map((report) => (
                <tr key={report.id} className="hover:bg-spk-gray/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{report.issue_type}</p>
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Device: {report.deviceId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-400 truncate max-w-xs">{report.details}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatThaiDate(report.reportedAt, true)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      report.status === 'Resolved' ? 'bg-green-100 text-green-700' : 
                      report.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(report as any); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete('Service', report.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simple Modal Placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-spk-blue p-6 text-white flex justify-between items-center">
              <h4 className="font-bold text-lg">{editingItem ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}</h4>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white cursor-pointer"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8">
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: any = Object.fromEntries(formData.entries());
                
                // Add ID if it's a new item and needs one
                if (!editingItem) {
                  if (activeSubTab === 'categories') data.id = 'CAT-' + Date.now();
                  if (activeSubTab === 'users') data.id = 'USR-' + Date.now();
                  if (activeSubTab === 'serviceLogs') data.id = 'MNT-' + Date.now();
                  if (activeSubTab === 'teachers') data.id = 'TCH-' + Date.now();
                } else {
                  data.id = (editingItem as any).id || (editingItem as any).studentId || (editingItem as any).users || (editingItem as any).serial_number;
                  if (activeSubTab === 'students') data.studentId = (editingItem as any).studentId;
                  if (activeSubTab === 'users') data.users = (editingItem as any).users;
                  if (activeSubTab === 'inventory') data.id = (editingItem as Device).serial_number;
                }

                const action = editingItem ? 'update' : 'append';
                let sheetName = 
                  activeSubTab === 'inventory' ? 'Devices' : 
                  activeSubTab === 'categories' ? 'Categories' : 
                  activeSubTab === 'users' ? 'Users' : 
                  activeSubTab === 'students' ? 'Students' : 
                  activeSubTab === 'teachers' ? 'Teachers' :
                  activeSubTab === 'serviceLogs' ? 'serviceLogs' : 'Service';

                // Special handling for students split across sheets
                if (activeSubTab === 'students') {
                  if (data.grade === 'ม.5') sheetName = 'StudentsM5';
                  else if (data.grade === 'ม.6') sheetName = 'StudentsM6';
                  else sheetName = 'Students';
                }

                const result = await gasHelper(action, sheetName, data);
                if (result.success) {
                  alert('บันทึกข้อมูลสำเร็จ');
                  setIsModalOpen(false);
                  onUpdate();
                } else {
                  alert('เกิดข้อผิดพลาด: ' + result.error);
                }
              }} className="space-y-4">
                {activeSubTab === 'inventory' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Serial Number</label>
                      <input name="serial_number" defaultValue={(editingItem as Device)?.serial_number} className="input-field" required disabled={!!editingItem} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">หมวดหมู่</label>
                      <select name="category_id" defaultValue={(editingItem as Device)?.category_id} className="input-field" required>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">อุปกรณ์เสริมพื้นฐาน</label>
                      <input name="defaultAccessories" defaultValue={(editingItem as Device)?.defaultAccessories} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">สถานะ</label>
                      <select name="status" defaultValue={(editingItem as Device)?.status || DeviceStatus.Available} className="input-field">
                        {Object.values(DeviceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">หมายเหตุ</label>
                      <textarea name="notes" defaultValue={(editingItem as Device)?.notes} className="input-field min-h-[80px]" />
                    </div>
                  </>
                )}

                {activeSubTab === 'categories' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ชื่อหมวดหมู่</label>
                      <input name="name" defaultValue={(editingItem as Category)?.name} className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">คำอธิบาย</label>
                      <input name="description" defaultValue={(editingItem as Category)?.description} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">สิทธิ์การยืม</label>
                      <select name="designatedFor" defaultValue={(editingItem as Category)?.designatedFor || 'Student'} className="input-field">
                        <option value="Student">Student</option>
                        <option value="Teacher">Teacher</option>
                        <option value="Staff">Staff</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">URL รูปภาพ</label>
                      <input name="imageUrl" defaultValue={(editingItem as Category)?.imageUrl} className="input-field" placeholder="https://..." />
                    </div>
                  </>
                )}

                {activeSubTab === 'users' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ชื่อผู้ใช้ (Login)</label>
                      <input name="users" defaultValue={(editingItem as User)?.users} className="input-field" required disabled={!!editingItem} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">รหัสผ่าน</label>
                      <input name="password" type="password" className="input-field" required={!editingItem} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ชื่อ-นามสกุล</label>
                      <input name="name" defaultValue={(editingItem as User)?.name} className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">บทบาท</label>
                      <select name="role" defaultValue={(editingItem as User)?.role || UserRole.Staff} className="input-field">
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {activeSubTab === 'teachers' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">รหัสคุณครู</label>
                      <input name="id" defaultValue={(editingItem as Teacher)?.id} className="input-field" required disabled={!!editingItem} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ชื่อ-นามสกุล</label>
                      <input name="fullName" defaultValue={(editingItem as Teacher)?.fullName} className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">กลุ่มสาระ</label>
                      <input name="department" defaultValue={(editingItem as Teacher)?.department} className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ห้องเรียนที่ดูแล (เช่น ม.4/1)</label>
                      <input name="classroom" defaultValue={(editingItem as Teacher)?.classroom} className="input-field" placeholder="ม.4/1" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">อีเมล</label>
                      <input name="email" type="email" defaultValue={(editingItem as Teacher)?.email} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">URL รูปโปรไฟล์</label>
                      <input name="profileImageUrl" defaultValue={(editingItem as Teacher)?.profileImageUrl} className="input-field" placeholder="https://..." />
                    </div>
                  </>
                )}

                {activeSubTab === 'students' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">รหัสนักเรียน</label>
                      <input name="studentId" defaultValue={(editingItem as Student)?.studentId} className="input-field" required disabled={!!editingItem} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ชื่อ-นามสกุล</label>
                      <input name="fullName" defaultValue={(editingItem as Student)?.fullName} className="input-field" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ระดับชั้น</label>
                        <select name="grade" defaultValue={(editingItem as Student)?.grade || 'ม.4'} className="input-field">
                          <option value="ม.4">ม.4</option>
                          <option value="ม.5">ม.5</option>
                          <option value="ม.6">ม.6</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ห้อง</label>
                        <input name="classroom" defaultValue={(editingItem as Student)?.classroom} className="input-field" placeholder="เช่น 1, 2, 3" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ครูประจำชั้น</label>
                      <select name="teacherId" defaultValue={(editingItem as Student)?.teacherId} className="input-field">
                        <option value="">-- เลือกครูประจำชั้น --</option>
                        {devices.teachers?.map(t => (
                          <option key={t.id} value={t.id}>{t.fullName} ({t.department})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">อีเมล</label>
                      <input name="email" type="email" defaultValue={(editingItem as Student)?.email} className="input-field" />
                    </div>

                    {editingItem && (
                      <div className="mt-4 p-4 bg-spk-gray rounded-xl border border-gray-100">
                        <h5 className="text-xs font-bold text-spk-blue uppercase mb-2">ข้อมูลการยืมอุปกรณ์</h5>
                        {(() => {
                          const borrowed = devices.find(d => d.borrowedBy === (editingItem as Student).fullName);
                          if (borrowed) {
                            return (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-100">
                                  <Package className="w-6 h-6 text-gray-300" />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-800">{borrowed.name}</p>
                                  <p className="text-[10px] text-gray-400 font-mono">S/N: {borrowed.serial_number}</p>
                                </div>
                              </div>
                            );
                          }
                          return <p className="text-xs text-gray-400 italic">ไม่มีอุปกรณ์ที่ยืมอยู่ในขณะนี้</p>;
                        })()}
                      </div>
                    )}
                  </>
                )}

                {activeSubTab === 'serviceLogs' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">รหัสครุภัณฑ์</label>
                      <input name="product_id" defaultValue={(editingItem as ServiceLog)?.product_id} className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">อาการเสีย/ปัญหา</label>
                      <textarea name="issue" defaultValue={(editingItem as ServiceLog)?.issue} className="input-field min-h-[100px]" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">วันที่แจ้ง</label>
                      <input name="report_date" type="date" defaultValue={(editingItem as ServiceLog)?.report_date || new Date().toISOString().split('T')[0]} className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">สถานะ</label>
                      <select name="status" defaultValue={(editingItem as ServiceLog)?.status || 'Pending'} className="input-field">
                        <option value="Pending">รอดำเนินการ</option>
                        <option value="In Progress">กำลังซ่อม</option>
                        <option value="Completed">เสร็จสิ้น</option>
                      </select>
                    </div>
                  </>
                )}

                {activeSubTab === 'service' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">สถานะการแจ้งซ่อม</label>
                      <select name="status" defaultValue={(editingItem as ServiceReport)?.status || 'Pending'} className="input-field">
                        <option value="Pending">รอดำเนินการ</option>
                        <option value="In Progress">กำลังดำเนินการ</option>
                        <option value="Resolved">แก้ไขแล้ว</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-gray-400 italic mt-2">* ข้อมูลอื่นๆ ของการแจ้งซ่อมไม่สามารถแก้ไขได้จากหน้านี้</p>
                  </>
                )}

                <div className="flex gap-4 mt-8">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-grow py-3 border border-gray-200 rounded-xl font-bold text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">ยกเลิก</button>
                  <button type="submit" className="flex-grow py-3 bg-spk-blue text-white rounded-xl font-bold shadow-lg hover:bg-blue-900 cursor-pointer transition-all active:scale-95">บันทึกข้อมูล</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
