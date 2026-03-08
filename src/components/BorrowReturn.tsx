import React, { useState, useEffect, useRef } from 'react';
import { Device, User, DeviceStatus, TranslationKey } from '../types';
import { Search, RefreshCw, ArrowRightLeft, QrCode, CheckCircle, Camera, X } from 'lucide-react';
import { gasHelper } from '../services/gasService';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BorrowReturnProps {
  devices: Device[];
  currentUser: User;
  onUpdate: () => void;
  t: (key: TranslationKey) => string;
}

const BorrowReturn: React.FC<BorrowReturnProps> = ({ devices, currentUser, onUpdate, t }) => {
  const [mode, setMode] = useState<'borrow' | 'return'>('borrow');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render((decodedText) => {
        setSearchTerm(decodedText);
        setIsScannerOpen(false);
        scanner.clear();
      }, () => {
        // Ignore errors during scanning
      });

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [isScannerOpen]);

  const filteredDevices = devices.filter(d => {
    const matchesSearch = 
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    
    if (mode === 'borrow') {
      return matchesSearch && d.status === DeviceStatus.Available;
    } else {
      return matchesSearch && d.status === DeviceStatus.Borrowed;
    }
  });

  const handleAction = async (device: Device) => {
    if (!confirm(`คุณต้องการ${mode === 'borrow' ? 'ยืม' : 'คืน'}อุปกรณ์ "${device.name}" ใช่หรือไม่?`)) return;

    setIsLoading(true);
    try {
      if (mode === 'borrow') {
        const userFid = currentUser.studentId || currentUser.id || 'N/A';
        const userName = currentUser.username || currentUser.email;
        
        const result = await gasHelper('borrowDevice', null, {
          deviceId: device.id,
          userFid,
          userName,
          snDevice: device.serial_number
        });

        if (result.success) {
          alert('ทำรายการยืมสำเร็จ!');
          onUpdate();
        } else {
          alert('เกิดข้อผิดพลาด: ' + result.error);
        }
      } else {
        // Return logic
        const result = await gasHelper('update', 'Devices', {
          id: device.id,
          status: DeviceStatus.Available,
          borrowedBy: '',
          borrowDate: '',
          dueDate: ''
        });

        if (result.success) {
          // Also record in History or Transactions if needed
          alert('ทำรายการคืนสำเร็จ!');
          onUpdate();
        } else {
          alert('เกิดข้อผิดพลาด: ' + result.error);
        }
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-spk-blue">{t('borrowReturn')}</h2>
          <p className="text-gray-500">ดำเนินการยืมหรือคืนอุปกรณ์เข้าคลัง</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
          <button
            onClick={() => { setMode('borrow'); setSearchTerm(''); }}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${mode === 'borrow' ? 'bg-spk-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            ยืมอุปกรณ์
          </button>
          <button
            onClick={() => { setMode('return'); setSearchTerm(''); }}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${mode === 'return' ? 'bg-spk-blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <RefreshCw className="w-4 h-4" />
            คืนอุปกรณ์
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search & Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder={mode === 'borrow' ? "ค้นหาอุปกรณ์ที่ว่าง..." : "ค้นหาอุปกรณ์ที่ถูกยืม..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-12"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="bg-spk-blue text-white p-4 rounded-xl shadow-lg hover:bg-blue-900 transition-all flex items-center justify-center cursor-pointer"
                title="Scan QR/Barcode"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDevices.map((device) => (
              <motion.div
                key={device.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedDevice(device)}
                className={`card p-4 cursor-pointer border-2 transition-all ${selectedDevice?.id === device.id ? 'border-spk-blue bg-blue-50/50' : 'border-transparent hover:border-gray-200'}`}
              >
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    <img src={device.imageUrl || `https://picsum.photos/seed/${device.id}/200`} alt={device.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <h4 className="font-bold text-gray-800 truncate">{device.name}</h4>
                    <p className="text-xs text-gray-400 font-mono truncate">S/N: {device.serial_number}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${device.status === DeviceStatus.Available ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {device.status}
                      </span>
                      {/* @ts-ignore */}
                      {device.borrowedBy && <span className="text-[10px] font-bold text-spk-blue truncate max-w-[80px]">{device.borrowedBy}</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredDevices.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                <p>ไม่พบรายการที่ต้องการ</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <div className="card sticky top-24">
            <h3 className="text-lg font-bold text-spk-blue mb-6 flex items-center gap-2">
              <Info className="w-5 h-5" />
              รายละเอียดการทำรายการ
            </h3>

            {selectedDevice ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto rounded-2xl bg-spk-gray overflow-hidden mb-4 shadow-inner">
                    <img src={selectedDevice.imageUrl || `https://picsum.photos/seed/${selectedDevice.id}/200`} alt={selectedDevice.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <h4 className="font-bold text-xl text-gray-800">{selectedDevice.name}</h4>
                  <p className="text-sm text-gray-400 font-mono">{selectedDevice.serial_number}</p>
                </div>

                <div className="space-y-3 bg-spk-gray/50 p-4 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ผู้ทำรายการ</span>
                    <span className="font-bold text-spk-blue">{currentUser.username}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">วันที่ทำรายการ</span>
                    <span className="font-bold">{new Date().toLocaleDateString('th-TH')}</span>
                  </div>
                  {/* @ts-ignore */}
                  {mode === 'return' && selectedDevice.borrowedBy && (
                    <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                      <span className="text-gray-500">ผู้ยืมเดิม</span>
                      {/* @ts-ignore */}
                      <span className="font-bold text-orange-600">{selectedDevice.borrowedBy}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleAction(selectedDevice)}
                  disabled={isLoading}
                  className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-spk-blue hover:bg-blue-900 active:scale-95'}`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {mode === 'borrow' ? <CheckCircle className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                      ยืนยันการ{mode === 'borrow' ? 'ยืม' : 'คืน'}อุปกรณ์
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="w-full py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="w-20 h-20 mx-auto bg-spk-gray rounded-full flex items-center justify-center text-gray-300">
                  <QrCode className="w-10 h-10" />
                </div>
                <p className="text-sm text-gray-400 px-6">กรุณาเลือกอุปกรณ์จากรายการด้านซ้ายเพื่อดำเนินการ</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scanner Modal */}
      <AnimatePresence>
        {isScannerOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl"
            >
              <div className="bg-spk-blue p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Camera className="w-6 h-6" />
                  <h3 className="font-bold text-lg">แสกน QR / บาร์โค้ด</h3>
                </div>
                <button 
                  onClick={() => setIsScannerOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <div id="reader" className="w-full overflow-hidden rounded-2xl border-2 border-dashed border-gray-200"></div>
                <p className="text-center text-gray-400 text-sm mt-6 font-medium">
                  วางรหัส QR หรือ บาร์โค้ด ให้อยู่ในกรอบเพื่อแสกน
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Info = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);

export default BorrowReturn;
