import React, { useState, useEffect, useCallback } from 'react';
import { User, Device, Category, UserRole, DeviceStatus, TranslationKey, ServiceLog, Student, ServiceReport, Teacher } from './types';
import { translations } from './constants';
import { gasHelper } from './services/gasService';

// Components
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import BorrowReturn from './components/BorrowReturn';
import AdminPanel from './components/Admin';
import Service from './components/Service';
import Logs from './components/Logs';
import StudentsRegistry from './components/StudentsRegistry';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [language] = useState<'th' | 'en'>('th');
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    borrowed: 0,
    maintenance: 0
  });

  const t = useCallback((key: TranslationKey): string => {
    return translations[language][key] || key;
  }, [language]);

  const loadPublicData = useCallback(async () => {
    try {
      const [devicesRes, categoriesRes] = await Promise.all([
        gasHelper('read', 'Devices'),
        gasHelper('read', 'Categories')
      ]);

      if (devicesRes.success && categoriesRes.success) {
        const loadedCategories = categoriesRes.data as Category[];
        const loadedDevices = (devicesRes.data as Device[]).map(d => {
          const cat = loadedCategories.find(c => c.id === d.category_id);
          return {
            ...d,
            name: cat?.name || 'Unknown Device',
            categoryName: cat?.name,
            imageUrl: cat?.imageUrl,
            designatedFor: cat?.designatedFor
          };
        });
        setCategories(loadedCategories);
        setDevices(loadedDevices);
      }
    } catch (error) {
      console.error('Failed to load public data', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [devicesRes, categoriesRes, usersRes, serviceLogsRes, studentsRes, studentsM5Res, studentsM6Res, serviceRes, teachersRes] = await Promise.all([
        gasHelper('read', 'Devices'),
        gasHelper('read', 'Categories'),
        gasHelper('read', 'Users'),
        gasHelper('read', 'serviceLogs'),
        gasHelper('read', 'Students'),
        gasHelper('read', 'StudentsM5'),
        gasHelper('read', 'StudentsM6'),
        gasHelper('read', 'Service'),
        gasHelper('read', 'Teachers')
      ]);

      if (devicesRes.success && categoriesRes.success) {
        const loadedCategories = categoriesRes.data as Category[];
        const loadedDevices = (devicesRes.data as Device[]).map(d => {
          const cat = loadedCategories.find(c => c.id === d.category_id);
          return {
            ...d,
            name: cat?.name || 'Unknown Device',
            categoryName: cat?.name,
            imageUrl: cat?.imageUrl,
            designatedFor: cat?.designatedFor
          };
        });

        const extendedDevices = loadedDevices as Device[] & {
          users?: User[];
          serviceLogs?: ServiceLog[];
          students?: Student[];
          serviceReports?: ServiceReport[];
          teachers?: Teacher[];
        };

        extendedDevices.users = usersRes.data as User[];
        extendedDevices.serviceLogs = serviceLogsRes.data as ServiceLog[];
        extendedDevices.teachers = teachersRes.data as Teacher[];
        
        // Combine all student data
        const allStudents = [
          ...(studentsRes.data as Student[] || []),
          ...(studentsM5Res.data as Student[] || []),
          ...(studentsM6Res.data as Student[] || [])
        ];
        extendedDevices.students = allStudents;
        extendedDevices.serviceReports = serviceRes.data as ServiceReport[];

        setCategories(loadedCategories);
        setDevices(extendedDevices);

        // Calculate stats
        setStats({
          total: loadedDevices.length,
          available: loadedDevices.filter(d => d.status === DeviceStatus.Available).length,
          borrowed: loadedDevices.filter(d => d.status === DeviceStatus.Borrowed).length,
          maintenance: loadedDevices.filter(d => d.status === DeviceStatus.Maintenance).length
        });
      }
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkDb = async () => {
      try {
        const res = await gasHelper('read', 'Categories');
        setDbConnected(res.success);
      } catch {
        setDbConnected(false);
      }
    };
    checkDb();
    loadPublicData();

    if (currentUser) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [currentUser, loadData, loadPublicData]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLogin(false);
    setActiveTab('dashboard');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <div className="loader"></div>
        <p className="mt-4 text-spk-blue font-semibold">ICT Inventory System Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    if (showLogin) {
      return <Login onLogin={handleLogin} onBack={() => setShowLogin(false)} t={t} />;
    }
    return <LandingPage 
      onStart={() => setShowLogin(true)} 
      onAdminLogin={() => setShowLogin(true)} 
      dbConnected={dbConnected} 
      categories={categories}
      devices={devices}
    />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} t={t} />;
      case 'inventory':
        return <Inventory devices={devices} categories={categories} t={t} />;
      case 'borrow':
        return <BorrowReturn devices={devices} currentUser={currentUser} onUpdate={loadData} t={t} />;
      case 'service':
        return <Service devices={devices} currentUser={currentUser} t={t} />;
      case 'students':
        return <StudentsRegistry students={(devices as any).students || []} teachers={(devices as any).teachers || []} t={t} />;
      case 'logs':
        return <Logs t={t} />;
      case 'admin':
        return (currentUser.role === UserRole.Admin || currentUser.role === UserRole.Staff) ? (
          <AdminPanel devices={devices} categories={categories} onUpdate={loadData} t={t} />
        ) : (
          <Dashboard stats={stats} t={t} />
        );
      default:
        return <Dashboard stats={stats} t={t} />;
    }
  };

  return (
    <Layout 
      currentUser={currentUser} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onLogout={handleLogout}
      t={t}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
