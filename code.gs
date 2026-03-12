/**
 * SPK ICT Inventory System Backend (Unified Version)
 * ปรับปรุงล่าสุด: รวมทุกฟังก์ชัน, รองรับการอัปโหลดรูปภาพ, และจัดการ Serial Number เป็นหลัก
 */

const CONFIG = {
  // ใช้ getActiveSpreadsheet() เพื่อความสะดวกในการใช้งานกับชีทที่ผูกสคริปต์ไว้
  // หรือระบุ ID ถ้าต้องการแยกชีท
  UPLOAD_FOLDER_ID: '1YOccTHgmK8R4QAW89PLtcvMFb8DAMu7t', 
};

const SS = SpreadsheetApp.getActiveSpreadsheet();

function doGet(e) {
  return HtmlService.createHtmlOutput("SPK ICT API is Running (Unified Version - Stable)");
}

function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) throw new Error("No data received");
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const sheetName = params.sheetName;
    const data = params.data;
    const user = params.user || params.currentUser;

    let result;
    switch (action) {
      case 'login': result = login(data); break;
      case 'read':  result = readData(sheetName); break;
      case 'append': result = appendData(sheetName, data, user); break;
      case 'update': result = updateData(sheetName, data, user); break;
      case 'delete': result = deleteData(sheetName, data, user); break;
      case 'importTransactions': result = importTransactions(data, user); break;
      case 'borrowDevice': result = borrowDevice(data, user); break;
      case 'returnDevice': result = returnDevice(data, user); break;
      case 'reportService': result = reportService(data, user); break;
      default: throw new Error('Action not found: ' + action);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** --- 1. ระบบจัดการข้อมูลพื้นฐาน (CRUD) --- **/

function login(data) {
  const sheet = SS.getSheetByName('Users');
  if (!sheet) throw new Error('Sheet "Users" not found');
  
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0].map(h => h.toLowerCase());
  const uIdx = headers.indexOf('users');
  const pIdx = headers.indexOf('password');
  
  const userRow = values.slice(1).find(r => r[uIdx] === data.users && r[pIdx] === data.password);
  if (!userRow) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  
  let obj = {};
  values[0].forEach((h, i) => obj[h] = userRow[i]);
  return obj;
}

function readData(sheetName) {
  let sheet = SS.getSheetByName(sheetName);
  if (!sheet) {
    // สร้างชีทพื้นฐานถ้ายังไม่มี
    if (sheetName === 'Users') {
      sheet = SS.insertSheet(sheetName);
      sheet.appendRow(['users', 'password', 'name', 'role']);
    } else if (sheetName === 'Devices') {
      sheet = SS.insertSheet(sheetName);
      sheet.appendRow(['serial_number', 'category_id', 'defaultAccessories', 'borrowedBy', 'status', 'notes']);
    } else if (sheetName === 'Categories') {
      sheet = SS.insertSheet(sheetName);
      sheet.appendRow(['id', 'name', 'description', 'designatedFor', 'imageUrl']);
    } else if (sheetName === 'Students' || sheetName === 'StudentsM5' || sheetName === 'StudentsM6') {
      sheet = SS.insertSheet(sheetName);
      sheet.appendRow(['studentId', 'fullName', 'grade', 'classroom', 'email']);
    } else {
      return [];
    }
  }
  
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  return values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function appendData(sheetName, data, user) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => data[h] !== undefined ? data[h] : "");
  sheet.appendRow(row);
  
  logAction(user, 'APPEND', sheetName, JSON.stringify(data));
  return true;
}

function updateData(sheetName, data, user) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  
  let rowIndex = -1;
  const key = data.serial_number || data.id || data.studentId || data.users || data.email || data.fid;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i].includes(key)) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) throw new Error('Data not found for key: ' + key);
  
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headerRow.forEach((header, i) => {
    if (data[header] !== undefined) {
      sheet.getRange(rowIndex, i + 1).setValue(data[header]);
    }
  });
  
  logAction(user, 'UPDATE', sheetName, JSON.stringify(data));
  return true;
}

function deleteData(sheetName, data, user) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return false;
  
  const values = sheet.getDataRange().getDisplayValues();
  const key = data.serial_number || data.id || data.users || data.email;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i].includes(key)) {
      sheet.deleteRow(i + 1);
      logAction(user, 'DELETE', sheetName, JSON.stringify(data));
      return true;
    }
  }
  return false;
}

/** --- 2. ระบบจัดการยืม-คืน (Borrow/Return) --- **/

function borrowDevice(data, user) {
  const trxSheet = SS.getSheetByName('Transactions') || SS.insertSheet('Transactions');
  const devSheet = SS.getSheetByName('Devices');
  
  if (trxSheet.getLastRow() === 0) {
    trxSheet.appendRow(['borrowerId', 'fid', 'fname', 'serial_number', 'borrow_date', 'borrowTime', 'due_date', 'return_date', 'status', 'recorder', 'emailId', 'borrowNotes', 'accessories']);
  }

  const now = new Date();
  const timezone = "GMT+7";
  const borrowDate = Utilities.formatDate(now, timezone, "yyyy-MM-dd");
  const borrowTime = Utilities.formatDate(now, timezone, "HH:mm:ss");
  
  // คำนวณวันกำหนดคืน
  let dueDate = new Date(now);
  if (data.userGrade === 'ม.4') dueDate.setFullYear(dueDate.getFullYear() + 3);
  else if (data.userGrade === 'ม.5') dueDate.setFullYear(dueDate.getFullYear() + 2);
  else if (data.userGrade === 'ม.6') dueDate.setFullYear(dueDate.getFullYear() + 1);
  else dueDate.setDate(dueDate.getDate() + 14);
  
  const dueDateStr = Utilities.formatDate(dueDate, timezone, "yyyy-MM-dd");
  
  const trxData = {
    borrowerId: 'TRX-' + Date.now(),
    fid: data.userFid,
    fname: data.userName,
    serial_number: data.serial_number,
    borrow_date: borrowDate,
    borrowTime: borrowTime,
    due_date: dueDateStr,
    status: 'Borrowed',
    recorder: data.recorder || (user ? (user.name || user.users) : 'System'),
    emailId: data.emailId || "ยังไม่ระบุ",
    borrowNotes: data.borrowNotes || "ยังไม่ระบุ",
    accessories: data.accessories || ""
  };
  
  const trxHeaders = trxSheet.getRange(1, 1, 1, trxSheet.getLastColumn()).getValues()[0];
  trxSheet.appendRow(trxHeaders.map(h => trxData[h] !== undefined ? trxData[h] : ""));
  
  // อัปเดตสถานะเครื่อง
  const devValues = devSheet.getDataRange().getValues();
  const snIdx = devValues[0].indexOf('serial_number');
  const stIdx = devValues[0].indexOf('status');
  const bByIdx = devValues[0].indexOf('borrowedBy');
  
  for (let i = 1; i < devValues.length; i++) {
    if (devValues[i][snIdx].toString() === data.serial_number.toString()) {
      devSheet.getRange(i + 1, stIdx + 1).setValue('Borrowed');
      if (bByIdx !== -1) devSheet.getRange(i + 1, bByIdx + 1).setValue(data.userName);
      break;
    }
  }
  
  logAction(user, 'BORROW', 'Transactions', data.serial_number);
  return { success: true };
}

function returnDevice(data, user) {
  const trxSheet = SS.getSheetByName('Transactions');
  const devSheet = SS.getSheetByName('Devices');
  const returnDate = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");

  // 1. อัปเดตรายการยืม
  const trxValues = trxSheet.getDataRange().getDisplayValues();
  const trxHeaders = trxValues[0];
  const tSnIdx = trxHeaders.indexOf('serial_number') !== -1 ? trxHeaders.indexOf('serial_number') : trxHeaders.indexOf('snDevice');
  const tStIdx = trxHeaders.indexOf('status');
  const tRtIdx = trxHeaders.indexOf('return_date');
  
  for (let i = trxValues.length - 1; i >= 1; i--) {
    if (trxValues[i][tSnIdx] === data.serial_number && trxValues[i][tStIdx] === 'Borrowed') {
      if (tRtIdx !== -1) trxSheet.getRange(i + 1, tRtIdx + 1).setValue(returnDate);
      trxSheet.getRange(i + 1, tStIdx + 1).setValue('Returned');
      break;
    }
  }

  // 2. อัปเดตสถานะเครื่อง
  const devValues = devSheet.getDataRange().getValues();
  const dSnIdx = devValues[0].indexOf('serial_number');
  const dStIdx = devValues[0].indexOf('status');
  const bByIdx = devValues[0].indexOf('borrowedBy');
  
  for (let i = 1; i < devValues.length; i++) {
    if (devValues[i][dSnIdx].toString() === data.serial_number.toString()) {
      devSheet.getRange(i + 1, dStIdx + 1).setValue('Available');
      if (bByIdx !== -1) devSheet.getRange(i + 1, bByIdx + 1).setValue('');
      break;
    }
  }
  
  logAction(user, 'RETURN', 'Transactions', data.serial_number);
  return { success: true };
}

/** --- 3. ระบบแจ้งซ่อมและอัปโหลดรูป (Service/Upload) --- **/

function reportService(data, user) {
  const sheet = SS.getSheetByName('Service') || SS.insertSheet('Service');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'deviceId', 'issue_type', 'details', 'email', 'photo_url', 'reportedAt', 'status']);
  }
  
  const id = 'SRV-' + Date.now();
  let photoUrl = data.photo_url || "";
  
  // ตรวจสอบว่าเป็น Base64 Image หรือไม่
  if (photoUrl.startsWith('data:image')) {
    photoUrl = uploadImageToDrive(photoUrl, `service_${id}.png`);
  }

  const rowData = {
    id: id, 
    deviceId: data.deviceId, 
    issue_type: data.issue_type,
    details: data.details, 
    email: data.email || (user ? user.email : ""),
    photo_url: photoUrl, 
    reportedAt: Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss"),
    status: 'Pending'
  };

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(headers.map(h => rowData[h] !== undefined ? rowData[h] : ""));
  
  logAction(user, 'REPORT_SERVICE', 'Service', JSON.stringify(rowData));
  return { success: true, id: id, imageUrl: photoUrl };
}

function uploadImageToDrive(base64, name) {
  try {
    const folder = DriveApp.getFolderById(CONFIG.UPLOAD_FOLDER_ID);
    const split = base64.split(',');
    const type = split[0].match(/:(.*?);/)[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(split[1]), type, name);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) { 
    return "error: " + e.toString(); 
  }
}

/** --- 4. ระบบจัดการการนำเข้าข้อมูล (Import) --- **/

function importTransactions(data, user) {
  const sheet = SS.getSheetByName('Transactions') || SS.insertSheet('Transactions');
  const devSheet = SS.getSheetByName('Devices');
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['borrowerId', 'fid', 'fname', 'serial_number', 'borrow_date', 'borrowTime', 'due_date', 'return_date', 'status', 'recorder', 'emailId', 'borrowNotes', 'accessories']);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const devValues = devSheet.getDataRange().getValues();
  const devSerialIdx = devValues[0].indexOf('serial_number');
  const devStatusIdx = devValues[0].indexOf('status');

  let successCount = 0;
  let failCount = 0;
  let errors = [];

  data.forEach((item, index) => {
    try {
      if (!item.borrowerId) item.borrowerId = 'TRX-' + Date.now() + '-' + index;
      if (!item.emailId) item.emailId = "ยังไม่ระบุ";
      if (!item.borrowNotes) item.borrowNotes = "ยังไม่ระบุ";
      
      const row = headers.map(h => item[h] !== undefined ? item[h] : "");
      sheet.appendRow(row);

      const sn = item.serial_number || item.snDevice;
      if (sn && item.status) {
        for (let i = 1; i < devValues.length; i++) {
          if (devValues[i][devSerialIdx].toString() === sn.toString()) {
            const newStatus = item.status === 'Borrowed' ? 'Borrowed' : 'Available';
            devSheet.getRange(i + 1, devStatusIdx + 1).setValue(newStatus);
            break;
          }
        }
      }
      successCount++;
    } catch (e) {
      failCount++;
      errors.push(`Row ${index + 1}: ${e.message}`);
    }
  });
  
  logAction(user, 'IMPORT', 'Transactions', `Imported ${data.length} items`);
  return { success: true, successCount, failCount, errors };
}

/** --- 5. ฟังก์ชันเสริม --- **/

function logAction(user, action, target, details) {
  const sheet = SS.getSheetByName('Logs') || SS.insertSheet('Logs');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp', 'user', 'action', 'target', 'details']);
  }
  const ts = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
  const name = user ? (user.fullName || user.name || user.users || user.email) : 'System';
  sheet.appendRow([ts, name, action, target, details]);
}
