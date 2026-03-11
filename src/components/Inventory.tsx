import React, { useState, useMemo } from 'react';
import { Device, Category, DeviceStatus, TranslationKey } from '../types';
import { Search, Filter, Package, Tag, Info, User, Calendar, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatThaiDate } from '../constants';

interface InventoryProps {
  devices: Device[];
  categories: Category[];
  t: (key: TranslationKey) => string;
}

const Inventory: React.FC<InventoryProps> = ({ devices, t }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  const categoryOptions = useMemo(() => {
    const cats = new Set(devices.map(d => d.categoryName).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [devices]);

  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchesSearch = 
        device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.id?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || device.categoryName === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || device.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [devices, searchTerm, selectedCategory, selectedStatus]);

  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case DeviceStatus.Available:
        return <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">พร้อมใช้งาน</span>;
      case DeviceStatus.Borrowed:
        return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">ถูกยืม</span>;
      case DeviceStatus.Maintenance:
        return <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wider">ซ่อมบำรุง</span>;
      case DeviceStatus.PendingApproval:
        return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider">รออนุมัติ</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-spk-blue">{t('inventory')}</h2>
        <p className="text-gray-500">จัดการและตรวจสอบรายการครุภัณฑ์ทั้งหมด</p>
      </header>

      {/* Filters & Search */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow relative">
            <input
              type="text"
              placeholder="ค้นหาด้วยชื่อ, S/N, หรือรหัสครุภัณฑ์..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-spk-gray px-4 py-3 pr-10 rounded-xl border border-transparent focus:ring-2 focus:ring-spk-blue outline-none text-sm font-medium text-gray-700 transition-all cursor-pointer"
              >
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'ทุกหมวดหมู่' : cat}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none bg-spk-gray px-4 py-3 pr-10 rounded-xl border border-transparent focus:ring-2 focus:ring-spk-blue outline-none text-sm font-medium text-gray-700 transition-all cursor-pointer"
              >
                <option value="All">ทุกสถานะ</option>
                {Object.values(DeviceStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <Tag className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredDevices.map((device) => (
            <motion.div
              layout
              key={device.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="card p-0 overflow-hidden hover:shadow-lg transition-shadow group border-l-4 border-l-transparent hover:border-l-spk-blue"
            >
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                <img 
                  src={device.imageUrl || `https://picsum.photos/seed/${device.id}/400/300`} 
                  alt={device.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3">
                  {getStatusBadge(device.status)}
                </div>
                <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-mono">
                  {device.serial_number}
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h4 className="font-bold text-lg text-gray-800 line-clamp-1">{device.name}</h4>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{device.categoryName}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      Asset ID
                    </p>
                    <p className="text-sm font-mono font-bold text-spk-blue">{device.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Status
                    </p>
                    <p className="text-sm font-bold text-gray-700">{device.status}</p>
                  </div>
                </div>

                {/* @ts-ignore */}
                {device.borrowedBy && (
                  <div className="bg-spk-gray/50 p-3 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>ผู้ยืมปัจจุบัน</span>
                      </div>
                      {/* @ts-ignore */}
                      <span className="text-xs font-bold text-spk-blue">{device.borrowedBy}</span>
                    </div>
                    {/* @ts-ignore */}
                    {device.borrowDate && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>วันที่ยืม</span>
                        </div>
                        {/* @ts-ignore */}
                        <span className="text-xs font-medium text-gray-600">{formatThaiDate(device.borrowDate)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredDevices.length === 0 && (
        <div className="text-center py-24 card">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-xl font-bold text-gray-400">ไม่พบอุปกรณ์ที่ตรงตามเงื่อนไข</h3>
          <p className="text-gray-400">ลองเปลี่ยนคำค้นหาหรือตัวกรองข้อมูล</p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setSelectedStatus('All'); }}
            className="mt-6 text-spk-blue font-bold hover:underline cursor-pointer"
          >
            ล้างการค้นหาทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
};

export default Inventory;
