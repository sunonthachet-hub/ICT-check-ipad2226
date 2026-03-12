import React, { useState } from 'react';
import { Device, User, TranslationKey } from '../types';
import { gasHelper } from '../services/gasService';
import { Wrench, AlertCircle, CheckCircle2, Loader2, Camera } from 'lucide-react';

interface ServiceProps {
  devices: Device[];
  currentUser: User;
  t: (key: TranslationKey) => string;
}

const Service: React.FC<ServiceProps> = ({ devices, currentUser, t }) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [issueType, setIssueType] = useState('Hardware');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState(currentUser.email || '');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceId) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await gasHelper('reportService', 'Service', {
        deviceId: selectedDeviceId,
        issue_type: issueType,
        details,
        email,
        photo_url: photoBase64
      }, currentUser);

      if (res.success) {
        setMessage({ type: 'success', text: 'ส่งข้อมูลการแจ้งซ่อมเรียบร้อยแล้ว' });
        setSelectedDeviceId('');
        setDetails('');
        setPhotoBase64('');
      } else {
        setMessage({ type: 'error', text: res.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-spk-yellow p-3 rounded-2xl shadow-lg shadow-spk-yellow/20">
          <Wrench className="text-spk-blue w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-spk-blue tracking-tight">{t('service')}</h2>
          <p className="text-gray-500 font-medium">แจ้งปัญหาการใช้งานหรืออุปกรณ์ชำรุด</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">เลือกอุปกรณ์ที่พบปัญหา</label>
                <select
                  required
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-spk-yellow focus:border-transparent transition-all outline-none bg-gray-50 font-medium"
                >
                  <option value="">-- เลือกอุปกรณ์ --</option>
                  {devices.map(device => (
                    <option key={device.id} value={device.id}>
                      {device.name} - {device.serial_number} ({device.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">ประเภทปัญหา</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-spk-yellow focus:border-transparent transition-all outline-none bg-gray-50 font-medium"
                  >
                    <option value="Hardware">ฮาร์ดแวร์ (ตัวเครื่อง/หน้าจอ)</option>
                    <option value="Software">ซอฟต์แวร์ (แอปพลิเคชัน/iOS)</option>
                    <option value="Network">เครือข่าย (Wi-Fi/Internet)</option>
                    <option value="Accessories">อุปกรณ์เสริม (สายชาร์จ/เคส)</option>
                    <option value="Other">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">อีเมลติดต่อกลับ</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-spk-yellow focus:border-transparent transition-all outline-none bg-gray-50 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">รายละเอียดปัญหา</label>
                <textarea
                  required
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="อธิบายปัญหาที่พบอย่างละเอียด..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-spk-yellow focus:border-transparent transition-all outline-none bg-gray-50 font-medium resize-none"
                />
              </div>

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${photoBase64 ? 'bg-spk-blue/5 border-spk-blue text-spk-blue' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-spk-blue hover:border-spk-blue'}`}
                >
                  {photoBase64 ? (
                    <div className="relative w-full max-w-[200px] aspect-video rounded-lg overflow-hidden shadow-md">
                      <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-10 h-10" />
                      <div className="text-center">
                        <p className="font-bold">แนบรูปภาพประกอบ</p>
                        <p className="text-xs opacity-60">คลิกเพื่อเลือกรูปภาพ (ถ้ามี)</p>
                      </div>
                    </>
                  )}
                </label>
              </div>

              {message && (
                <div className={cn(
                  "p-4 rounded-2xl flex items-center gap-3 font-medium",
                  message.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                )}>
                  {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !selectedDeviceId}
                className="w-full py-4 bg-spk-blue text-white rounded-2xl font-bold text-lg shadow-lg shadow-spk-blue/20 hover:bg-spk-blue/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังส่งข้อมูล...
                  </>
                ) : (
                  <>
                    ส่งรายงานการแจ้งซ่อม
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-spk-blue text-white rounded-3xl p-8 shadow-xl shadow-spk-blue/20">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-spk-yellow" />
              คำแนะนำการแจ้งซ่อม
            </h3>
            <ul className="space-y-4 text-white/80 text-sm font-medium">
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] shrink-0">1</span>
                ตรวจสอบ Serial Number ของเครื่องให้ถูกต้องก่อนส่งข้อมูล
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] shrink-0">2</span>
                ระบุรายละเอียดของปัญหาให้ชัดเจน เช่น อาการเสียที่พบ หรือช่วงเวลาที่เกิดปัญหา
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] shrink-0">3</span>
                หากมีรูปภาพประกอบจะช่วยให้เจ้าหน้าที่วิเคราะห์ปัญหาได้รวดเร็วขึ้น
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] shrink-0">4</span>
                เจ้าหน้าที่จะติดต่อกลับผ่านอีเมลที่ระบุไว้ภายใน 1-2 วันทำการ
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-black/5 border border-gray-100">
            <h3 className="text-lg font-bold text-spk-blue mb-4">สถานะการแจ้งซ่อมล่าสุด</h3>
            <div className="space-y-4">
              <p className="text-gray-400 text-sm text-center py-4 italic font-medium">ยังไม่มีประวัติการแจ้งซ่อมของคุณ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default Service;
