export const gasHelper = async (action: string, sheetName: string | null, data?: any, currentUser?: any): Promise<any> => {
  // Use process.env.GAS_URL as defined in vite.config.ts
  const GAS_URL = (process.env as any).GAS_URL;
  
  if (!GAS_URL) {
    console.error('GAS_URL is not defined in environment variables.');
    return { 
      success: false, 
      error: 'ระบบยังไม่ได้เชื่อมต่อกับ Google Sheets (GAS_URL missing). กรุณาตั้งค่าใน Environment Variables.' 
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
      throw new Error(`Network response was not ok: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('GAS Service Error:', error);
    return { 
      success: false, 
      error: `ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้: ${error.message}. โปรดตรวจสอบการตั้งค่า CORS หรือสถานะการ Deploy ของ Google Apps Script.` 
    };
  }
};
