/**
 * SPK ICT Inventory System - Backend Script (code.gs)
 * Spreadsheet ID: 1_pwgicJEs0Vk_5m-m40F8RYPS672_GSA0kptrz_Ib4c
 */

const SPREADSHEET_ID = '1_pwgicJEs0Vk_5m-m40F8RYPS672_GSA0kptrz_Ib4c';

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const sheetName = params.sheetName;
    const data = params.data;

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    const user = params.currentUser || { name: 'System' };

    if (action === 'login') {
      return handleLogin(ss, data);
    }

    if (action === 'uploadFile') {
      return handleFileUpload(data);
    }

    if (action === 'sendRepairEmail') {
      return handleSendRepairEmail(data);
    }

    if (!sheet) {
      return shadowResponse({ success: false, message: 'Sheet not found: ' + sheetName });
    }

    switch (action) {
      case 'read':
        return handleRead(sheet);
      case 'append':
        return handleAppend(ss, sheet, sheetName, data, user);
      case 'update':
        return handleUpdate(ss, sheet, sheetName, data, user);
      case 'delete':
        return handleDelete(ss, sheet, sheetName, data, user);
      case 'importTransactions':
        return handleImportTransactions(ss, sheet, data, user);
      default:
        return shadowResponse({ success: false, message: 'Unknown action' });
    }
  } catch (error) {
    return shadowResponse({ success: false, message: error.toString() });
  }
}

function handleRead(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const data = values.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
  return shadowResponse({ success: true, data: data });
}

function handleAppend(ss, sheet, sheetName, data, user) {
  const headers = sheet.getDataRange().getValues()[0];
  
  // Auto-generate IDs if not provided
  if (sheetName === 'Transactions' && !data.borrowerId) {
    data.borrowerId = 'B-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000);
  } else if (!data.id && headers.includes('id')) {
    data.id = 'ID-' + new Date().getTime();
  }
  
  // Default values for missing data
  headers.forEach(header => {
    if (data[header] === undefined || data[header] === '') {
      data[header] = 'ยังไม่ระบุ';
    }
  });
  
  const newRow = headers.map(header => data[header]);
  sheet.appendRow(newRow);
  
  logActivity(ss, user.name, 'CREATE', sheetName, JSON.stringify(data));
  return shadowResponse({ success: true, data: data });
}

function handleImportTransactions(ss, sheet, data, user) {
  try {
    const headers = sheet.getDataRange().getValues()[0];
    const transactions = Array.isArray(data) ? data : [data];
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    transactions.forEach((item, index) => {
      try {
        // Auto-generate borrowerId
        if (!item.borrowerId) {
          item.borrowerId = 'B-IMP-' + new Date().getTime() + '-' + index;
        }

        // Calculate due_date if not provided
        if (!item.due_date || item.due_date === 'ยังไม่ระบุ') {
          const now = new Date();
          const isTeacher = (item.role && item.role.toLowerCase() === 'teacher') || 
                            (item.fname && (item.fname.includes('ครู') || item.fname.includes('อาจารย์')));
          const yearsToAdd = isTeacher ? 5 : 3;
          now.setFullYear(now.getFullYear() + yearsToAdd);
          item.due_date = now.toLocaleDateString('th-TH');
        }

        // Fill missing fields
        headers.forEach(header => {
          if (item[header] === undefined || item[header] === '') {
            item[header] = 'ยังไม่ระบุ';
          }
        });

        const newRow = headers.map(header => item[header]);
        sheet.appendRow(newRow);
        successCount++;
      } catch (err) {
        failCount++;
        errors.push(`Row ${index + 1}: ${err.toString()}`);
      }
    });

    logActivity(ss, user.name, 'IMPORT', 'Transactions', `Success: ${successCount}, Fail: ${failCount}`);
    return shadowResponse({ 
      success: true, 
      successCount, 
      failCount, 
      errors 
    });
  } catch (e) {
    return shadowResponse({ success: false, message: e.toString() });
  }
}

function handleUpdate(ss, sheet, sheetName, data, user) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('id');
  const serialIndex = headers.indexOf('serial_number');
  
  // Find row by ID or Serial Number
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    // Priority 1: Match by ID
    if (idIndex !== -1 && data.id && values[i][idIndex] == data.id) {
      rowIndex = i + 1;
      break;
    }
    // Priority 2: Match by Serial Number (especially for Devices sheet without ID)
    if (serialIndex !== -1 && data.serial_number && values[i][serialIndex] == data.serial_number) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    return shadowResponse({ success: false, message: 'Record not found' });
  }

  const oldData = {};
  headers.forEach((header, i) => {
    oldData[header] = values[rowIndex-1][i];
    if (data[header] !== undefined) {
      sheet.getRange(rowIndex, i + 1).setValue(data[header]);
    }
  });

  logActivity(ss, user.name, 'UPDATE', sheetName, `Old: ${JSON.stringify(oldData)} | New: ${JSON.stringify(data)}`);
  return shadowResponse({ success: true });
}

function handleDelete(ss, sheet, sheetName, data, user) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf('id');
  const serialIndex = headers.indexOf('serial_number');
  
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (idIndex !== -1 && data.id && values[i][idIndex] == data.id) {
      rowIndex = i + 1;
      break;
    }
    if (serialIndex !== -1 && data.serial_number && values[i][serialIndex] == data.serial_number) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex !== -1) {
    const deletedData = {};
    headers.forEach((header, i) => deletedData[header] = values[rowIndex-1][i]);
    
    sheet.deleteRow(rowIndex);
    logActivity(ss, user.name, 'DELETE', sheetName, JSON.stringify(deletedData));
    return shadowResponse({ success: true });
  }
  return shadowResponse({ success: false, message: 'Record not found' });
}

function logActivity(ss, user, action, target, details) {
  try {
    let logSheet = ss.getSheetByName('ActivityLogs');
    if (!logSheet) {
      logSheet = ss.insertSheet('ActivityLogs');
      logSheet.appendRow(['timestamp', 'user', 'action', 'target', 'details']);
      logSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f3f3f3');
    }
    logSheet.appendRow([new Date().toLocaleString('th-TH'), user, action, target, details]);
  } catch (e) {
    console.error('Logging failed: ' + e.toString());
  }
}

function handleLogin(ss, data) {
  const sheet = ss.getSheetByName('Users');
  if (!sheet) return shadowResponse({ success: false, message: 'Users sheet missing' });
  
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const users = values.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });

  const user = users.find(u => u.users === data.users && u.password === data.password);
  if (user) {
    const { password, ...userWithoutPass } = user;
    return shadowResponse({ success: true, user: userWithoutPass });
  }
  return shadowResponse({ success: false, message: 'Invalid credentials' });
}

function handleFileUpload(data) {
  try {
    const folderId = '1YOccTHgmK8R4QAW89PLtcvMFb8DAMu7t';
    const folder = DriveApp.getFolderById(folderId);
    const contentType = data.mimeType || 'image/jpeg';
    const decodedData = Utilities.base64Decode(data.base64);
    const blob = Utilities.newBlob(decodedData, contentType, data.fileName || 'repair_photo.jpg');
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return shadowResponse({ success: true, url: file.getUrl(), fileId: file.getId() });
  } catch (e) {
    return shadowResponse({ success: false, message: e.toString() });
  }
}

function handleSendRepairEmail(data) {
  try {
    const folderId = '1lpD4JQ_b5zHTuq-LThL1n4DE4nGVarqJ';
    const folder = DriveApp.getFolderById(folderId);
    
    const htmlContent = `
      <html>
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Sarabun', sans-serif; color: #333; line-height: 1.6; }
            .container { padding: 30px; border: 1px solid #003366; border-radius: 15px; max-width: 600px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #003366; padding-bottom: 20px; margin-bottom: 20px; }
            .title { color: #003366; font-size: 24px; font-weight: bold; margin: 0; }
            .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .info-table td { padding: 12px; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #666; width: 150px; }
            .footer { text-align: center; font-size: 12px; color: #888; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <p class="title">ใบรับซ่อมอุปกรณ์ (Repair Slip)</p>
              <p style="margin: 5px 0; font-size: 14px;">ศูนย์ ICT โรงเรียนสารคามพิทยาคม</p>
            </div>
            <p>เรียน คุณ ${data.userName || 'ผู้แจ้งซ่อม'}</p>
            <p>ระบบได้รับแจ้งซ่อมอุปกรณ์ของท่านเรียบร้อยแล้ว รายละเอียดดังนี้:</p>
            <table class="info-table">
              <tr><td class="label">รหัสใบแจ้งซ่อม:</td><td><b>${data.repairId}</b></td></tr>
              <tr><td class="label">รหัสอุปกรณ์:</td><td>${data.deviceId}</td></tr>
              <tr><td class="label">ประเภทปัญหา:</td><td>${data.issueType}</td></tr>
              <tr><td class="label">วันที่แจ้ง:</td><td>${data.date}</td></tr>
              <tr><td class="label">รายละเอียด:</td><td>${data.details || '-'}</td></tr>
            </table>
            <div style="text-align: center; margin-top: 20px;">
              <p style="font-size: 14px; font-weight: bold; color: #003366;">ขอบคุณที่ใช้บริการ</p>
            </div>
            <div class="footer">
              <p>© 2026 ศูนย์ ไอซีที โรงเรียนสารคามพิทยาคม</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Generate PDF
    const blob = HtmlService.createHtmlOutput(htmlContent).getAs('application/pdf');
    const fileName = `RepairSlip_${data.repairId}.pdf`;
    blob.setName(fileName);
    
    // Save PDF to Drive
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Send Email with PDF attachment
    MailApp.sendEmail({
      to: data.email,
      subject: `[SPK ICT] ใบรับซ่อมอุปกรณ์ #${data.repairId}`,
      htmlBody: `<div style="font-family: 'Sarabun', sans-serif;">
                   <p>เรียน คุณ ${data.userName || 'ผู้แจ้งซ่อม'},</p>
                   <p>ระบบได้ส่งใบรับซ่อมอุปกรณ์มาให้ท่านในรูปแบบไฟล์ PDF แนบมาพร้อมกับอีเมลฉบับนี้</p>
                   <p>ขอบคุณครับ<br>ศูนย์ ICT โรงเรียนสารคามพิทยาคม</p>
                 </div>`,
      attachments: [blob]
    });

    return shadowResponse({ success: true, pdfUrl: file.getUrl() });
  } catch (e) {
    return shadowResponse({ success: false, message: e.toString() });
  }
}

function shadowResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Test function
function doGet() {
  return ContentService.createTextOutput("SPK ICT API is Running").setMimeType(ContentService.MimeType.TEXT);
}
