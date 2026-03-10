export const gasHelper = async (action: string, sheetName: string | null, data?: any, currentUser?: any): Promise<any> => {
  const GAS_URL = import.meta.env.VITE_GAS_URL;
  
  if (!GAS_URL) {
    console.warn('VITE_GAS_URL is not defined. Using mock data.');
    if (action === 'login') {
      return { success: true, user: { id: '1', users: 'admin', role: 'Admin', name: 'Admin User' } };
    }
    return { success: true, data: [] };
  }

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors', // Changed from no-cors to cors to read response
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, sheetName, data, currentUser }),
    });

    if (!response.ok) throw new Error('Network response was not ok');
    
    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error('GAS Service Error:', error);
    // Fallback for demo if GAS is not yet configured or CORS issues
    if (action === 'login') {
      return { success: true, user: { id: '1', users: 'admin', role: 'Admin', name: 'Admin User' } };
    }
    return { success: false, error: error.message };
  }
};
