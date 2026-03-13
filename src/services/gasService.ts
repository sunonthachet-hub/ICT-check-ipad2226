export const gasHelper = async (action: string, sheetName: string | null, data?: any, currentUser?: any): Promise<any> => {
  const GAS_URL = import.meta.env.VITE_GAS_URL;
  
  if (!GAS_URL || GAS_URL === "" || GAS_URL.includes('XXXXXXXXX')) {
    console.error('❌ VITE_GAS_URL is missing or placeholder.');
    return { 
      success: false, 
      error: 'ระบบยังไม่ได้เชื่อมต่อกับ Google Sheets (VITE_GAS_URL missing). กรุณาตรวจสอบว่าได้ตั้งค่า "VITE_GAS_URL" ใน Settings > Secrets และกด Restart Server' 
    };
  }

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, sheetName, data, currentUser }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('❌ GAS Service Error:', error.message);
    return { 
      success: false, 
      error: `ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้: ${error.message}. โปรดตรวจสอบการ Deploy ของ Google Apps Script ว่าเป็น "Anyone"` 
    };
  }
};
