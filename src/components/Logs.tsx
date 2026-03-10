import React, { useState, useEffect } from 'react';
import { ActivityLog, TranslationKey } from '../types';
import { gasHelper } from '../services/gasService';
import { History, Search, Filter, Calendar, User as UserIcon, Tag, Info, Loader2 } from 'lucide-react';
import { formatThaiDate } from '../constants';

interface LogsProps {
  t: (key: TranslationKey) => string;
}

const Logs: React.FC<LogsProps> = ({ t }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const res = await gasHelper('read', 'Logs');
        if (res.success) {
          // Sort logs by timestamp descending
          const sortedLogs = (res.data as ActivityLog[]).sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setLogs(sortedLogs);
        }
      } catch (error) {
        console.error('Failed to fetch logs', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'APPEND': return 'bg-green-100 text-green-700';
      case 'UPDATE': return 'bg-blue-100 text-blue-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      case 'BORROW': return 'bg-purple-100 text-purple-700';
      case 'RETURN': return 'bg-orange-100 text-orange-700';
      case 'IMPORT': return 'bg-indigo-100 text-indigo-700';
      case 'REPORT_SERVICE': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-spk-yellow p-3 rounded-2xl shadow-lg shadow-spk-yellow/20">
            <History className="text-spk-blue w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-spk-blue tracking-tight">{t('logs')}</h2>
            <p className="text-gray-500 font-medium">บันทึกกิจกรรมการใช้งานระบบทั้งหมด</p>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-spk-yellow transition-colors" />
          <input
            type="text"
            placeholder="ค้นหาประวัติ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-spk-yellow focus:border-transparent outline-none transition-all w-full md:w-80 font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-spk-yellow animate-spin" />
            <p className="text-gray-400 font-bold">กำลังโหลดข้อมูลประวัติ...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> วันที่-เวลา</div>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2"><UserIcon className="w-3 h-3" /> ผู้ใช้งาน</div>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2"><Tag className="w-3 h-3" /> การกระทำ</div>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2"><Filter className="w-3 h-3" /> เป้าหมาย</div>
                  </th>
                  <th className="px-6 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center gap-2"><Info className="w-3 h-3" /> รายละเอียด</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-600">
                      {formatThaiDate(log.timestamp, true)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-spk-blue/10 flex items-center justify-center text-spk-blue text-xs font-bold">
                          {log.user.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-spk-blue">{log.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-500">
                      {log.target}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-400 max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="bg-gray-50 p-6 rounded-full">
              <History className="w-12 h-12 text-gray-200" />
            </div>
            <p className="text-gray-400 font-bold">ไม่พบข้อมูลประวัติที่ค้นหา</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
