import React, { useState, useMemo } from 'react';
import { Device, User, DeviceStatus, TranslationKey, Student } from '../types';
import { Search, RefreshCw, ArrowRightLeft, CheckCircle, Info as InfoIcon, Hash, User as UserIcon, Laptop, CheckSquare, Square } from 'lucide-react';
import { gasHelper } from '../services/gasService';
import { motion, AnimatePresence } from 'framer-motion';
import { formatThaiDate } from '../constants';

interface BorrowReturnProps {
  devices: Device[] & { students?: Student[] };
  currentUser: User;
  onUpdate: () => void;
  t: (key: TranslationKey) => string;
}

const BorrowReturn: React.FC<BorrowReturnProps> = ({ devices, currentUser, onUpdate, t }) => {
  const [mode, setMode] = useState<'borrow' | 'return'>('borrow');
  const [isLoading, setIsLoading] = useState(false);
  
  // Borrow Workflow States
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deviceSearch, setDeviceSearch] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  
  // Form States
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [accessories, setAccessories] = useState({
    charger: true,
    case: true,
    keyboard: false,
    stylus: false
  });

  const students = devices.students || [];

  const filteredStudents = useMemo(() => {
    if (!studentSearch || selectedStudent) return [];
    return students.filter(s => 
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentId.toString().includes(studentSearch)
    ).slice(0, 5);
  }, [students, studentSearch, selectedStudent]);

  const filteredDevices = useMemo(() => {
    if (mode === 'return') {
      return devices.filter(d => 
        d.status === DeviceStatus.Borrowed && (
          d.name?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
          d.serial_number?.toLowerCase().includes(deviceSearch.toLowerCase())
        )
      );
    }
    
    if (!deviceSearch || selectedDevice) return [];
    return devices.filter(d => 
      d.status === DeviceStatus.Available && (
        d.name?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
        d.serial_number?.toLowerCase().includes(deviceSearch.toLowerCase())
      )
    ).slice(0, 5);
  }, [devices, deviceSearch, selectedDevice, mode]);

  const calculateDueDate = (grade: string) => {
    const now = new Date();
    if (grade === 'ม.4') now.setFullYear(now.getFullYear() + 3);
    else if (grade === 'ม.5') now.setFullYear(now.getFullYear() + 2);
    else if (grade === 'ม.6') now.setFullYear(now.getFullYear() + 1);
    else now.setDate(now.getDate() + 14); // Default 14 days for others
    return now.toISOString();
  };

  const handleBorrow = async () => {
    if (!selectedStudent || !selectedDevice) return;
    
    const accList = [];
    if (accessories.charger) accList.push('สายชาร์จ');
    if (accessories.case) accList.push('เคส');
    if (accessories.keyboard) accList.push('คีย์บอร์ด');
    if (accessories.stylus) accList.push('เมาส์ปากกา');

    setIsLoading(true);
    try {
      const result = await gasHelper('borrowDevice', null, {
        deviceId: selectedDevice.id,
        userFid: selectedStudent.studentId,
        userName: selectedStudent.fullName,
        userGrade: selectedStudent.grade,
        userClassroom: selectedStudent.classroom,
        snDevice: selectedDevice.serial_number,
        userRole: 'Student',
        emailId: email || selectedStudent.email,
        borrowNotes: notes,
        accessories: accList.join(', '),
        recorder: currentUser.name
      });

      if (result.success) {
        alert('ทำรายการยืมสำเร็จ!');
        resetForm();
        onUpdate();
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.error);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async (device: Device) => {
    if (!confirm(`ยืนยันการคืนอุปกรณ์ ${device.name} (S/N: ${device.serial_number})?`)) return;
    
    setIsLoading(true);
    try {
      const result = await gasHelper('returnDevice', null, {
        deviceId: device.id,
        snDevice: device.serial_number,
        recorder: currentUser.name
      });

      if (result.success) {
        alert('ทำรายการคืนสำเร็จ!');
        setDeviceSearch('');
        onUpdate();
      } else {
        alert('เกิดข้อผิดพลาด: ' + result.error);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setSelectedDevice(null);
    setStudentSearch('');
    setDeviceSearch('');
    setEmail('');
    setNotes('');
    setAccessories({ charger: true, case: true, keyboard: false, stylus: false });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-spk-blue p-3 rounded-2xl shadow-lg shadow-spk-blue/20">
            <ArrowRightLeft className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-spk-blue tracking-tight">{t('borrowReturn')}</h2>
            <p className="text-gray-500 font-medium">จัดการการยืม-คืนอุปกรณ์ ICT สำหรับนักเรียนและบุคลากร</p>
          </div>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          <button
            onClick={() => { setMode('borrow'); resetForm(); }}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${mode === 'borrow' ? 'bg-spk-blue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            ยืมอุปกรณ์
          </button>
          <button
            onClick={() => { setMode('return'); resetForm(); }}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${mode === 'return' ? 'bg-spk-blue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <RefreshCw className="w-4 h-4" />
            คืนอุปกรณ์
          </button>
        </div>
      </header>

      {mode === 'borrow' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Search & Selection */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Student Search */}
            <div className={`card p-6 transition-all ${selectedStudent ? 'bg-green-50/30 border-green-100' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-spk-blue flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  1. ค้นหาผู้ยืม (นักเรียน)
                </h3>
                {selectedStudent && (
                  <button onClick={() => setSelectedStudent(null)} className="text-xs font-bold text-red-500 hover:underline">เปลี่ยนคน</button>
                )}
              </div>

              {!selectedStudent ? (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อ-นามสกุล หรือ รหัสประจำตัวนักเรียน..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="input-field pl-12 py-4 text-lg"
                  />
                  
                  <AnimatePresence>
                    {filteredStudents.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                      >
                        {filteredStudents.map(student => (
                          <button
                            key={student.studentId}
                            onClick={() => { setSelectedStudent(student); setStudentSearch(''); }}
                            className="w-full px-6 py-4 text-left hover:bg-spk-gray transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-spk-blue/10 flex items-center justify-center text-spk-blue font-bold">
                                {student.fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-gray-800 group-hover:text-spk-blue transition-colors">{student.fullName}</p>
                                <p className="text-xs text-gray-400 font-medium">รหัส: {student.studentId} | ชั้น: {student.grade}/{student.classroom}</p>
                              </div>
                            </div>
                            <ArrowRightLeft className="w-4 h-4 text-gray-300 group-hover:text-spk-blue" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-green-100 shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xl">
                    {selectedStudent.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-gray-800">{selectedStudent.fullName}</h4>
                    <p className="text-sm text-gray-500 font-medium">
                      ชั้น {selectedStudent.grade}/{selectedStudent.classroom} | รหัสประจำตัว: <span className="font-mono font-bold text-spk-blue">{selectedStudent.studentId}</span>
                    </p>
                  </div>
                  <div className="ml-auto">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Device Search */}
            <div className={`card p-6 transition-all ${!selectedStudent ? 'opacity-50 pointer-events-none' : ''} ${selectedDevice ? 'bg-blue-50/30 border-blue-100' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-spk-blue flex items-center gap-2">
                  <Laptop className="w-5 h-5" />
                  2. เลือกอุปกรณ์
                </h3>
                {selectedDevice && (
                  <button onClick={() => setSelectedDevice(null)} className="text-xs font-bold text-red-500 hover:underline">เปลี่ยนเครื่อง</button>
                )}
              </div>

              {!selectedDevice ? (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่ออุปกรณ์ หรือ Serial Number..."
                    value={deviceSearch}
                    onChange={(e) => setDeviceSearch(e.target.value)}
                    className="input-field pl-12 py-4 text-lg"
                  />
                  
                  <AnimatePresence>
                    {filteredDevices.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-10 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                      >
                        {filteredDevices.map(device => (
                          <button
                            key={device.id}
                            onClick={() => { setSelectedDevice(device); setDeviceSearch(''); }}
                            className="w-full px-6 py-4 text-left hover:bg-spk-gray transition-colors flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden">
                                <img src={device.imageUrl || `https://picsum.photos/seed/${device.id}/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-800 group-hover:text-spk-blue transition-colors">{device.name}</p>
                                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">S/N: {device.serial_number}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full uppercase">Available</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                  <div className="w-16 h-16 rounded-xl bg-spk-gray overflow-hidden shadow-inner">
                    <img src={selectedDevice.imageUrl || `https://picsum.photos/seed/${selectedDevice.id}/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-gray-800">{selectedDevice.name}</h4>
                    <p className="text-sm text-gray-500 font-mono uppercase tracking-wider">Serial Number: {selectedDevice.serial_number}</p>
                    <p className="text-xs text-spk-blue font-bold mt-1">ID: {selectedDevice.id}</p>
                  </div>
                  <div className="ml-auto">
                    <CheckCircle className="w-8 h-8 text-spk-blue" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Form & Confirmation */}
          <div className="lg:col-span-5">
            <div className={`card p-8 sticky top-24 transition-all ${(!selectedStudent || !selectedDevice) ? 'opacity-50 pointer-events-none grayscale' : 'shadow-2xl shadow-spk-blue/10 border-spk-blue/20'}`}>
              <h3 className="text-xl font-bold text-spk-blue mb-8 flex items-center gap-2">
                <InfoIcon className="w-6 h-6" />
                3. รายละเอียดการยืม
              </h3>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-spk-gray/50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">วันที่ยืม</p>
                    <p className="font-bold text-gray-700">{formatThaiDate(new Date().toISOString())}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">กำหนดคืน</p>
                    <p className="font-bold text-orange-700">
                      {selectedStudent ? formatThaiDate(calculateDueDate(selectedStudent.grade)) : '-'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">อีเมลติดต่อ</span>
                    <input
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field mt-1"
                    />
                  </label>

                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">อุปกรณ์เสริมที่ได้รับ</span>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {[
                        { id: 'charger', label: 'สายชาร์จ' },
                        { id: 'case', label: 'เคส' },
                        { id: 'keyboard', label: 'คีย์บอร์ด' },
                        { id: 'stylus', label: 'เมาส์ปากกา' }
                      ].map(acc => (
                        <button
                          key={acc.id}
                          onClick={() => setAccessories(prev => ({ ...prev, [acc.id]: !prev[acc.id as keyof typeof prev] }))}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm font-bold ${accessories[acc.id as keyof typeof accessories] ? 'bg-spk-blue border-spk-blue text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                        >
                          {accessories[acc.id as keyof typeof accessories] ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          {acc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">หมายเหตุเพิ่มเติม</span>
                    <textarea
                      rows={3}
                      placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="input-field mt-1 resize-none"
                    />
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm text-gray-400 font-medium">ผู้บันทึกรายการ:</span>
                    <span className="text-sm font-bold text-spk-blue">{currentUser.name}</span>
                  </div>

                  <button
                    onClick={handleBorrow}
                    disabled={isLoading || !selectedStudent || !selectedDevice}
                    className="w-full py-5 bg-spk-blue text-white rounded-2xl font-bold text-lg shadow-xl shadow-spk-blue/20 hover:bg-blue-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:grayscale"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-6 h-6" />
                        ยืนยันการยืมอุปกรณ์
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาอุปกรณ์ที่ต้องการคืน (ชื่อ หรือ S/N)..."
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                className="input-field pl-12 py-4 text-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevices.map(device => (
              <motion.div
                key={device.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-6 border-2 border-transparent hover:border-spk-blue/20 transition-all group"
              >
                <div className="flex gap-4 mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-spk-gray overflow-hidden shadow-inner shrink-0">
                    <img src={device.imageUrl || `https://picsum.photos/seed/${device.id}/200`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-lg text-gray-800 truncate">{device.name}</h4>
                    <p className="text-xs text-gray-400 font-mono uppercase tracking-wider truncate">S/N: {device.serial_number}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">Borrowed</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6 p-4 bg-spk-gray/50 rounded-2xl">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">ID อุปกรณ์</span>
                    <span className="font-bold text-spk-blue">{device.id}</span>
                  </div>
                  {device.borrowedBy && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">ผู้ยืม</span>
                      <span className="font-bold text-gray-700">{device.borrowedBy}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleReturn(device)}
                  disabled={isLoading}
                  className="w-full py-3 bg-white border-2 border-spk-blue text-spk-blue rounded-xl font-bold hover:bg-spk-blue hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  รับคืนอุปกรณ์
                </button>
              </motion.div>
            ))}
            {filteredDevices.length === 0 && deviceSearch && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-spk-gray rounded-full flex items-center justify-center mx-auto text-gray-300">
                  <Search className="w-10 h-10" />
                </div>
                <p className="text-gray-400 font-bold">ไม่พบอุปกรณ์ที่ถูกยืมที่ตรงกับการค้นหา</p>
              </div>
            )}
            {!deviceSearch && filteredDevices.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-spk-gray rounded-full flex items-center justify-center mx-auto text-gray-300">
                  <RefreshCw className="w-10 h-10" />
                </div>
                <p className="text-gray-400 font-bold">กรุณาค้นหาอุปกรณ์ที่ต้องการคืน</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowReturn;

