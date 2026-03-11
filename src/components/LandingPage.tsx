import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Tablet, Smartphone, LogIn, AlertTriangle, Package, FileText, Phone, Facebook, MapPin, Send, Camera, CheckCircle2 } from 'lucide-react';
import { Category, Device } from '../types';
import { gasHelper } from '../services/gasService';

interface LandingPageProps {
  onStart: () => void;
  onAdminLogin: () => void;
  dbConnected: boolean | null;
  categories: Category[];
  devices: Device[];
}

type Section = 'home' | 'report' | 'products' | 'rules' | 'contact';

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onAdminLogin, dbConnected, categories, devices }) => {
  const [activeSection, setActiveSection] = useState<Section>('home');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [reportForm, setReportForm] = useState({
    device_id: '',
    issue_type: '',
    details: '',
  });

  const navItems = [
    { label: 'หน้าแรก', id: 'home' as Section },
    { label: 'แจ้งปัญหา', id: 'report' as Section },
    { label: 'รายการสินค้า', id: 'products' as Section },
    { label: 'ระเบียบการยืม', id: 'rules' as Section },
    { label: 'ติดต่อสอบถาม', id: 'contact' as Section },
  ];

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.device_id || !reportForm.issue_type || !reportForm.details) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await gasHelper('append', 'Service', {
        ...reportForm,
        report_date: new Date().toLocaleString('th-TH'),
        status: 'Pending'
      });
      if (res.success) {
        setSubmitSuccess(true);
        setReportForm({ device_id: '', issue_type: '', details: '' });
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        alert('เกิดข้อผิดพลาดในการส่งรายงาน: ' + res.error);
      }
    } catch (error) {
      console.error('Report error:', error);
      alert('ไม่สามารถเชื่อมต่อกับระบบได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return (
          <div className="pt-20">
            <div className="text-center mb-20">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-7xl font-black text-white mb-8 leading-tight flex flex-col items-center gap-6"
              >
                <div className="flex items-center gap-6 mb-2">
                  <img src="https://www.spk.ac.th/home/wp-content/uploads/2025/10/spk-logo-png-new-1.png" alt="SPK Logo" className="w-20 h-20 md:w-28 md:h-28 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]" referrerPolicy="no-referrer" />
                  <span className="text-white">ระบบยืมอุปกรณ์</span>
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-spk-yellow via-white to-spk-yellow bg-[length:200%_auto] animate-gradient">Apple iPad เพื่อการศึกษา</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-slate-400 text-lg md:text-2xl font-medium max-w-3xl mx-auto mb-12 leading-relaxed"
              >
                Sarakham Pittayakhom School Modern Equipment Loan System <br/>
                ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร โรงเรียนสารคามพิทยาคม
              </motion.p>
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStart}
                className="px-12 py-6 bg-spk-yellow text-spk-blue rounded-2xl font-black text-xl shadow-[0_20px_50px_rgba(255,204,0,0.3)] hover:bg-white transition-all cursor-pointer"
              >
                เริ่มต้นใช้งาน
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: RefreshCw, title: "รองรับ iOS ล่าสุด", desc: "อุปกรณ์ทุกเครื่องของเรามาพร้อมกับ iOS เวอร์ชันล่าสุด เพื่อความปลอดภัยและประสิทธิภาพสูงสุด" },
                { icon: Tablet, title: "iPad หลากหลายรุ่น", desc: "เรามี iPad ให้เลือกยืมหลากหลายรุ่น ตั้งแต่ iPad Air, Pro ไปจนถึง Mini ตอบโจทย์ทุกการใช้งาน" },
                { icon: Smartphone, title: "มี iPhone ด้วย", desc: "นอกจาก iPad แล้ว เรายังมี iPhone สำหรับการใช้งานที่ต้องการความคล่องตัวสูง" }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-spk-yellow/50 transition-all group backdrop-blur-sm"
                >
                  <div className="w-16 h-16 rounded-2xl bg-spk-blue shadow-lg flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-spk-yellow transition-all">
                    <feature.icon className="text-white group-hover:text-spk-blue w-8 h-8 transition-colors" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed text-lg">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        );
      case 'report':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl mx-auto pt-10"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 md:p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="text-red-500 w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white">แจ้งปัญหาการใช้งาน</h2>
                  <p className="text-slate-400">พบปัญหาเกี่ยวกับตัวเครื่อง iPad หรือซอฟต์แวร์? แจ้งเราได้ที่นี่</p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-10">
                <h4 className="text-red-400 font-bold flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  แจ้งซ่อมด่วน
                </h4>
                <p className="text-red-400/80 text-sm">
                  หากอุปกรณ์เกิดความเสียหายรุนแรง กรุณานำเครื่องมาที่ศูนย์ ICT ทันที
                </p>
              </div>

              {submitSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                    <CheckCircle2 className="text-white w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">ส่งรายงานสำเร็จ</h3>
                  <p className="text-slate-400 mb-8">เจ้าหน้าที่จะดำเนินการตรวจสอบและติดต่อกลับโดยเร็วที่สุด</p>
                  <button 
                    onClick={() => setSubmitSuccess(false)}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    แจ้งปัญหาเพิ่ม
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleReportSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">เลือกอุปกรณ์ที่มีปัญหา</label>
                      <div className="flex gap-2">
                        <select 
                          value={reportForm.device_id}
                          onChange={(e) => setReportForm({...reportForm, device_id: e.target.value})}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-spk-yellow outline-none transition-all appearance-none cursor-pointer"
                        >
                          <option value="">-- เลือกอุปกรณ์ --</option>
                          {devices.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.serial_number})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">ประเภทปัญหา</label>
                      <select 
                        value={reportForm.issue_type}
                        onChange={(e) => setReportForm({...reportForm, issue_type: e.target.value})}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-spk-yellow outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="">-- เลือกประเภทปัญหา --</option>
                        <option value="Screen Damage">หน้าจอแตก/เสียหาย</option>
                        <option value="Battery/Power">แบตเตอรี่/ระบบไฟ</option>
                        <option value="Software/Apps">ซอฟต์แวร์/แอปพลิเคชัน</option>
                        <option value="Accessories">อุปกรณ์เสริมชำรุด</option>
                        <option value="Other">อื่นๆ</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">รายละเอียดปัญหา</label>
                    <textarea 
                      value={reportForm.details}
                      onChange={(e) => setReportForm({...reportForm, details: e.target.value})}
                      placeholder="อธิบายอาการเสียหรือปัญหาที่พบอย่างละเอียด..."
                      rows={5}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-spk-yellow outline-none transition-all resize-none"
                    ></textarea>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">แนบรูปภาพประกอบ (ถ้ามี)</label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-xl cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Camera className="w-8 h-8 text-slate-500 mb-2" />
                          <p className="text-xs text-slate-500">คลิกเพื่ออัปโหลดรูปภาพ</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" />
                      </label>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-spk-yellow text-spk-blue font-black text-xl rounded-2xl shadow-xl shadow-spk-yellow/20 hover:bg-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-6 h-6" />
                        ส่งรายงานปัญหา
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        );
      case 'products':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="pt-10"
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="w-16 h-16 bg-spk-blue/20 rounded-2xl flex items-center justify-center">
                <Package className="text-spk-blue w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">รายการสินค้า</h2>
                <p className="text-slate-400">อุปกรณ์ไอทีทั้งหมดที่พร้อมให้บริการ</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden group hover:border-spk-yellow/50 transition-all">
                  <div className="h-64 overflow-hidden relative">
                    <img 
                      src={cat.imageUrl || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800'} 
                      alt={cat.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60"></div>
                    <div className="absolute bottom-6 left-6">
                      <span className="px-3 py-1 bg-spk-blue text-white text-xs font-bold rounded-full uppercase tracking-widest">
                        {cat.designatedFor}
                      </span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-white mb-3">{cat.name}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2">
                      {cat.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-spk-yellow font-bold">พร้อมให้บริการ</span>
                      <button 
                        onClick={onStart}
                        className="text-white hover:text-spk-yellow font-bold text-sm underline underline-offset-4 cursor-pointer"
                      >
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 'rules':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl mx-auto pt-10"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 md:p-12">
              <div className="flex items-center gap-4 mb-12">
                <div className="w-16 h-16 bg-spk-yellow/20 rounded-2xl flex items-center justify-center">
                  <FileText className="text-spk-yellow w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white">ระเบียบการยืมใช้งาน</h2>
                  <p className="text-slate-400">ข้อกำหนดและเงื่อนไขในการใช้บริการยืม-คืนเครื่อง iPad</p>
                </div>
              </div>

              <div className="space-y-10">
                {[
                  { num: "1", title: "คุณสมบัติผู้ยืม", text: "ต้องเป็นนักเรียนหรือบุคลากรของโรงเรียนสารคามพิทยาคมที่มีสถานะปกติ" },
                  { num: "2", title: "ระยะเวลาการยืม", text: "สามารถยืมได้สูงสุด 7 วันทำการต่อครั้ง หากต้องการต่ออายุต้องนำเครื่องมาตรวจสอบ" },
                  { num: "3", title: "การดูแลรักษา", text: "ผู้ยืมต้องดูแลรักษาเครื่องให้อยู่ในสภาพดี ห้ามแกะสติกเกอร์หรือดัดแปลงซอฟต์แวร์" },
                  { num: "4", title: "กรณีชำรุดหรือสูญหาย", text: "ผู้ยืมต้องรับผิดชอบค่าใช้จ่ายในการซ่อมแซมหรือชดใช้ตามมูลค่าปัจจุบันของอุปกรณ์" },
                  { num: "5", title: "การส่งคืน", text: "ต้องส่งคืนเครื่องพร้อมอุปกรณ์เสริมครบชุดตามกำหนดเวลา ณ ศูนย์ ICT" }
                ].map((rule, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-spk-blue rounded-full flex items-center justify-center text-xl font-black text-white">
                      {rule.num}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{rule.title}</h4>
                      <p className="text-slate-400 leading-relaxed">{rule.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 p-8 bg-spk-blue/10 border border-spk-blue/20 rounded-3xl text-center">
                <p className="text-spk-blue font-bold mb-4">หากมีข้อสงสัยเพิ่มเติม กรุณาติดต่อเจ้าหน้าที่</p>
                <button 
                  onClick={() => setActiveSection('contact')}
                  className="px-8 py-3 bg-spk-blue text-white rounded-xl font-bold hover:bg-blue-700 transition-all cursor-pointer"
                >
                  ติดต่อศูนย์ ICT
                </button>
              </div>
            </div>
          </motion.div>
        );
      case 'contact':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-6xl mx-auto pt-10"
          >
            <div className="text-center mb-16">
              <div className="w-20 h-20 bg-spk-blue/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Phone className="text-spk-blue w-10 h-10" />
              </div>
              <h2 className="text-4xl font-black text-white mb-4">ติดต่อสอบถาม</h2>
              <p className="text-slate-400 text-lg">ช่องทางการติดต่อสื่อสารกับศูนย์ ICT โรงเรียนสารคามพิทยาคม</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-10 text-center group hover:border-spk-yellow/50 transition-all">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Phone className="text-green-500 w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">เบอร์โทรศัพท์</h4>
                <p className="text-2xl font-black text-spk-yellow mb-2">043-711-xxx</p>
                <p className="text-slate-500 text-sm">ในวันและเวลาราชการ</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-10 text-center group hover:border-spk-yellow/50 transition-all">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Facebook className="text-blue-500 w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Facebook Page</h4>
                <p className="text-2xl font-black text-spk-yellow mb-2">ICT SPK Center</p>
                <p className="text-slate-500 text-sm">ตอบกลับภายใน 24 ชม.</p>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-10 text-center group hover:border-spk-yellow/50 transition-all">
                <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <MapPin className="text-red-500 w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">สถานที่ติดต่อ</h4>
                <p className="text-xl font-black text-spk-yellow mb-2">อาคาร ICT ชั้น 2</p>
                <p className="text-slate-500 text-sm">ห้องปฏิบัติการคอมพิวเตอร์</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden h-[500px]">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3827.1851571216523!2d103.2965618758872!3d16.18528338451163!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31199326f6345677%3A0x7623977366347f3b!2z4LmC4Lij4LiH4LmA4Lij4Li14Lii4LiZ4Liq4Liy4Lij4LiE4Liy4Lih4Lie4Li04LiX4Lii4Liy4LiE4Lih!5e0!3m2!1sth!2sth!4v1741338000000!5m2!1sth!2sth" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="SPK School Map"
              ></iframe>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-spk-yellow/30 relative overflow-hidden text-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=1920" 
          alt="Background" 
          className="w-full h-full object-cover grayscale opacity-10"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="p-6 flex justify-between items-center bg-slate-950/50 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-spk-blue rounded-xl flex items-center justify-center shadow-lg shadow-spk-blue/20">
              <Tablet className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-white tracking-tight text-xl">iPad Check</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all ${
              dbConnected === true 
                ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                : dbConnected === false 
                  ? 'bg-red-500/10 border-red-500/50 text-red-400' 
                  : 'bg-slate-500/10 border-slate-500/50 text-slate-400'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                dbConnected === true ? 'bg-green-400' : dbConnected === false ? 'bg-red-400' : 'bg-slate-400'
              }`}></div>
              <span className="text-xs font-bold uppercase tracking-wider">
                {dbConnected === true ? 'เชื่อมต่อ' : dbConnected === false ? 'ขัดข้อง' : 'กำลังตรวจสอบ...'}
              </span>
            </div>

            <button 
              onClick={onAdminLogin}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-white font-bold text-sm hover:bg-spk-yellow hover:text-spk-blue transition-all shadow-sm backdrop-blur-md cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              เข้าระบบ แอดมิน
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="bg-slate-900/30 backdrop-blur-md border-b border-white/5 py-3 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-6 flex justify-center gap-4 md:gap-12">
            {navItems.map((item, i) => (
              <button 
                key={i} 
                onClick={() => setActiveSection(item.id)}
                className={`text-sm font-bold transition-all whitespace-nowrap px-4 py-2 rounded-lg cursor-pointer ${
                  activeSection === item.id 
                    ? 'text-spk-yellow bg-white/5' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Hero Section / Content */}
      <main className="relative z-10 pt-48 pb-20 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {renderSection()}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-16 border-t border-white/5 bg-slate-950/50 backdrop-blur-md mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-5">
            <img src="https://www.spk.ac.th/home/wp-content/uploads/2025/10/spk-logo-png-new-1.png" alt="SPK Logo" className="w-14 h-14" referrerPolicy="no-referrer" />
            <div>
              <p className="font-bold text-white text-xl">iPad Check System</p>
              <p className="text-sm text-slate-500">โรงเรียนสารคามพิทยาคม</p>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-slate-400 font-medium mb-2">
              © {new Date().getFullYear()} ศูนย์ ไอซีที โรงเรียนสารคามพิทยาคม
            </p>
            <p className="text-xs text-slate-600 uppercase tracking-widest font-bold">
              Modern Education Technology
            </p>
          </div>
        </div>
      </footer>

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-spk-blue via-spk-yellow to-spk-blue opacity-30"></div>
    </div>
  );
};

export default LandingPage;
