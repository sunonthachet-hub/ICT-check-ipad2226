import React, { useState } from 'react';
import { Student, Teacher, TranslationKey } from '../types';
import { Search, Users, Filter, User } from 'lucide-react';

interface StudentsRegistryProps {
  students: Student[];
  teachers: Teacher[];
  t: (key: TranslationKey) => string;
}

const StudentsRegistry: React.FC<StudentsRegistryProps> = ({ students, teachers, t }) => {
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredStudents = students.filter(s => {
    const matchesGrade = gradeFilter === 'all' || s.grade === gradeFilter;
    const matchesSearch = 
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.studentId.toString().includes(searchTerm) ||
      (s.classroom && s.classroom.toString().includes(searchTerm));
    return matchesGrade && matchesSearch;
  });

  const getTeacherForClassroom = (grade: string, classroom: string) => {
    const classKey = `${grade}/${classroom}`;
    return teachers.find(t => t.classroom === classKey);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-spk-blue">{t('studentsRegistry')}</h2>
          <p className="text-gray-500">ทะเบียนรายชื่อนักเรียนทั้งหมดในระบบ</p>
        </div>
      </header>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสประจำตัว หรือ ห้องเรียน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          
          <div className="flex items-center gap-2 bg-spk-gray px-4 py-2 rounded-xl border border-gray-100">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={gradeFilter} 
              onChange={(e) => setGradeFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-600 focus:outline-none cursor-pointer"
            >
              <option value="all">ทุกระดับชั้น</option>
              <option value="ม.4">ม.4</option>
              <option value="ม.5">ม.5</option>
              <option value="ม.6">ม.6</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-spk-gray text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">รหัสประจำตัว</th>
                <th className="px-6 py-4">ชื่อ-นามสกุล</th>
                <th className="px-6 py-4">ระดับชั้น/ห้อง</th>
                <th className="px-6 py-4">ครูประจำชั้น</th>
                <th className="px-6 py-4">อีเมล</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map((student) => {
                const teacher = getTeacherForClassroom(student.grade, student.classroom);
                return (
                  <tr key={student.studentId} className="hover:bg-spk-gray/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-spk-blue">{student.studentId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-spk-blue text-xs font-bold">
                          {student.fullName.charAt(0)}
                        </div>
                        <p className="font-bold text-gray-800">{student.fullName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                        {student.grade}/{student.classroom}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {teacher ? (
                        <div className="flex items-center gap-2">
                          {teacher.profileImageUrl ? (
                            <img 
                              src={teacher.profileImageUrl} 
                              alt={teacher.fullName} 
                              className="w-6 h-6 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-gray-700">{teacher.fullName}</p>
                            <p className="text-[10px] text-gray-400">{teacher.department}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">ไม่ระบุ</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-10 h-10 opacity-20" />
                      <p>ไม่พบข้อมูลนักเรียนที่ค้นหา</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-right">
          <p className="text-xs text-gray-400">แสดงข้อมูลทั้งหมด {filteredStudents.length} รายการ</p>
        </div>
      </div>
    </div>
  );
};

export default StudentsRegistry;
