import React, { useState } from 'react';
import { Device, Category, DeviceStatus, TranslationKey, User, Student, Teacher, MaintenanceRecord, ServiceReport } from '../types';
import { Plus, Edit2, Trash2, Package, Tag, Users, X, Settings } from 'lucide-react';
import { gasHelper } from '../services/gasService';

interface AdminPanelProps {
  devices: Device[] & {
    users?: User[];
    teachers?: Teacher[];
    students?: Student[];
    maintenance?: MaintenanceRecord[];
    serviceReports?: ServiceReport[];
  };
  categories: Category[];
  onUpdate: () => void;
  t: (key: TranslationKey) => string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ devices, categories, onUpdate, t }) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'categories' | 'maintenance' | 'users' | 'students' | 'service'>('inventory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Device | Category | MaintenanceRecord | User | null>(null);

  const handleDelete = async (type: 'Devices' | 'Categories' | 'Users' | 'Students' | 'Service', id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) return;
    
    const result = await gasHelper('delete', type, { id });
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
            onClick={() => setActiveSubTab('maintenance')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'maintenance' ? 'bg-spk-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600 cursor-pointer'}`}
          >
            <Settings className="w-4 h-4" />
            ซ่อมบำรุง
          </button>
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeSubTab === 'users' ? 'bg-spk-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600 cursor-pointer'}`}
          >
            <Users className="w-4 h-4" />
            ผู้ใช้งาน
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
          <h3 className="text-lg font-bold text-spk-blue capitalize">
            {activeSubTab === 'inventory' ? 'จัดการรายการครุภัณฑ์' : 
             activeSubTab === 'categories' ? 'จัดการหมวดหมู่สินค้า' : 
             activeSubTab === 'maintenance' ? 'จัดการข้อมูลซ่อมบำรุง' :
             activeSubTab === 'users' ? 'จัดการข้อมูลผู้ใช้งาน' :
             activeSubTab === 'students' ? 'จัดการข้อมูลนักเรียน' :
             'จัดการรายการแจ้งซ่อม'}
          </h3>
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
                <tr key={device.id} className="hover:bg-spk-gray/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                        <img src={device.imageUrl || `https://picsum.photos/seed/${device.id}/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{device.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{device.serial_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-500">ID: <span className="font-mono font-bold text-spk-blue">{device.id}</span></p>
                    <p className="text-xs text-gray-500">หมวดหมู่: <span className="font-medium">{device.categoryName}</span></p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${device.status === DeviceStatus.Available ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {device.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(device); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete('Devices', device.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
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

              {activeSubTab === 'maintenance' && devices.maintenance?.map((m) => (
                <tr key={m.id} className="hover:bg-spk-gray/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{m.issue}</p>
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Product ID: {m.product_id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-500">Date: <span className="font-medium">{m.report_date}</span></p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${m.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(m); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete('Maintenance' as unknown as 'Devices', m.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {activeSubTab === 'users' && devices.users?.map((user) => (
                <tr key={user.id} className="hover:bg-spk-gray/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{user.users}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-500">Role: <span className="font-medium">{user.role}</span></p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-400">ID: {user.id}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(user); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete('Users', user.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {activeSubTab === 'students' && devices.students?.map((student) => (
                <tr key={student.studentId} className="hover:bg-spk-gray/30 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{student.fullName}</p>
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">ID: {student.studentId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-500">ชั้น: <span className="font-medium">{student.grade}/{student.classroom}</span></p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-400">{student.email}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(student as any); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete('Students', student.studentId)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
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
                    <p className="text-[10px] text-gray-400 mt-1">{report.reportedAt}</p>
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
              <p className="text-gray-500 text-center py-12">แบบฟอร์มจัดการข้อมูล (กำลังพัฒนา...)</p>
              <div className="flex gap-4 mt-6">
                <button onClick={() => setIsModalOpen(false)} className="flex-grow py-3 border border-gray-200 rounded-xl font-bold text-gray-400 hover:bg-gray-50 cursor-pointer">ยกเลิก</button>
                <button onClick={() => setIsModalOpen(false)} className="flex-grow py-3 bg-spk-blue text-white rounded-xl font-bold shadow-lg cursor-pointer">บันทึกข้อมูล</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
