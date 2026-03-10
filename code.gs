/**
 * SPK ICT Inventory System Backend (code.gs)
 * ปรับปรุงล่าสุด: รองรับการบันทึกวันที่แบบ ค.ศ. และดึงข้อมูลเป็น String ทั้งหมด
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();

function doGet(e) {
  return HtmlService.createHtmlOutput("SPK ICT API is Running");
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const sheetName = params.sheetName;
    const data = params.data;
    const user = params.user || params.currentUser;

    let result;
    switch (action) {
      case 'login':
        result = login(data);
        break;
      case 'read':
        result = readData(sheetName);
        break;
      case 'append':
        result = appendData(sheetName, data, user);
        break;
      case 'update':
        result = updateData(sheetName, data, user);
        break;
      case 'delete':
        result = deleteData(sheetName, data, user);
        break;
      case 'importTransactions':
        result = importTransactions(data, user);
        break;
      case 'borrowDevice':
        result = borrowDevice(data, user);
        break;
      case 'returnDevice':
        result = returnDevice(data, user);
        break;
      case 'reportService':
        result = reportService(data, user);
        break;
      default:
        throw new Error('Action not found: ' + action);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ตรวจสอบการเข้าสู่ระบบ
 */
function login(data) {
  const sheet = SS.getSheetByName('Users');
  if (!sheet) throw new Error('Sheet "Users" not found');
  
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  const lowerHeaders = headers.map(h => h.toLowerCase());
  
  const userIndex = lowerHeaders.indexOf('users');
  const passIndex = lowerHeaders.indexOf('password');
  
  if (userIndex === -1 || passIndex === -1) {
    throw new Error('Columns "users" or "password" not found in Users sheet');
  }
  
  const user = values.slice(1).find(row => 
    row[userIndex] === data.users && row[passIndex] === data.password
  );
  
  if (!user) throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  
  let userObj = {};
  headers.forEach((header, i) => {
    userObj[header] = user[i];
  });
  
  return userObj;
}

/**
 * อ่านข้อมูลจากชีท โดยใช้ getDisplayValues เพื่อให้ได้ค่าที่เป็น String ตามที่แสดงในหน้าชีท
 * ช่วยลดปัญหาเรื่อง Format วันที่เพี้ยน
 */
function readData(sheetName) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) {
    if (sheetName === 'Students' || sheetName === 'StudentsM5' || sheetName === 'StudentsM6') {
      const newSheet = SS.insertSheet(sheetName);
      newSheet.appendRow(['studentId', 'fullName', 'grade', 'classroom', 'email']);
      return [];
    }
    return [];
  }
  
  const values = sheet.getDataRange().getDisplayValues(); 
  const headers = values[0];
  
  return values.slice(1).map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

function appendData(sheetName, data, user) {
  const sheet = SS.getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => data[h] !== undefined ? data[h] : "");
  sheet.appendRow(row);
  logAction(user, 'APPEND', sheetName, JSON.stringify(data));
  return true;
}

function updateData(sheetName, data, user) {
  const sheet = SS.getSheetByName(sheetName);
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0];
  
  // ค้นหาแถวที่จะอัปเดต
  let rowIndex = -1;
  const key = data.serial_number || data.id || data.email || data.fid || data.studentId || data.borrowerId || data.snDevice;

  // สำหรับ Transactions เราอาจต้องการหาแถวที่ snDevice ตรงกันและสถานะยังเป็น Borrowed
  if (sheetName === 'Transactions' && data.status === 'Returned') {
    const snIdx = headers.indexOf('snDevice') !== -1 ? headers.indexOf('snDevice') : headers.indexOf('serial_number');
    const statusIdx = headers.indexOf('status');
    for (let i = values.length - 1; i >= 1; i--) {
      if (values[i][snIdx] === (data.snDevice || data.serial_number) && values[i][statusIdx] === 'Borrowed') {
        rowIndex = i + 1;
        break;
      }
    }
  }

  if (rowIndex === -1) {
    for (let i = 1; i < values.length; i++) {
      if (values[i].includes(key)) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  if (rowIndex === -1) throw new Error('Data not found for update: ' + key);

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
  const values = sheet.getDataRange().getDisplayValues();
  const key = data.serial_number || data.id || data.email || data.fid;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i].includes(key)) {
      sheet.deleteRow(i + 1);
      logAction(user, 'DELETE', sheetName, JSON.stringify(data));
      return true;
    }
  }
  return false;
}

function importTransactions(data, user) {
  const sheet = SS.getSheetByName('Transactions');
  const devSheet = SS.getSheetByName('Devices');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const devValues = devSheet.getDataRange().getValues();
  const devHeaders = devValues[0];
  const devSerialIdx = devHeaders.indexOf('serial_number');
  const devStatusIdx = devHeaders.indexOf('status');

  let successCount = 0;
  let failCount = 0;
  let errors = [];

  data.forEach((item, index) => {
    try {
      // 1. จัดการข้อมูลพื้นฐานและค่าเริ่มต้น
      if (!item.borrowerId) {
        item.borrowerId = 'TRX-' + Date.now() + '-' + index;
      }
      if (!item.emailId || item.emailId === "") item.emailId = "ยังไม่ระบุ";
      if (!item.borrowNotes || item.borrowNotes === "") item.borrowNotes = "ยังไม่ระบุ";
      
      // คำนวณ due_date ถ้าไม่มี (นักเรียน 3 ปี, อื่นๆ 14 วัน)
      if (!item.due_date && (item.borrowDate || item.borrow_date)) {
        const bDate = new Date(item.borrowDate || item.borrow_date);
        if (!isNaN(bDate.getTime())) {
          if (item.role === 'Student' || item.userRole === 'Student') {
            bDate.setFullYear(bDate.getFullYear() + 3);
          } else {
            bDate.setDate(bDate.getDate() + 14);
          }
          item.due_date = Utilities.formatDate(bDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
        }
      }

      // 2. บันทึกลง Transactions
      const row = headers.map(h => item[h] !== undefined ? item[h] : "");
      sheet.appendRow(row);

      // 3. อัปเดตสถานะใน Devices
      const sn = item.snDevice || item.serial_number;
      if (sn && item.status) {
        let found = false;
        for (let i = 1; i < devValues.length; i++) {
          if (devValues[i][devSerialIdx] === sn) {
            const newStatus = item.status === 'Borrowed' ? 'Borrowed' : 'Available';
            devSheet.getRange(i + 1, devStatusIdx + 1).setValue(newStatus);
            found = true;
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
  
  logAction(user, 'IMPORT', 'Transactions', `Imported ${data.length} items and updated device statuses`);
  return { success: true, successCount, failCount, errors };
}

function borrowDevice(data, user) {
  const trxSheet = SS.getSheetByName('Transactions');
  const devSheet = SS.getSheetByName('Devices');
  
  if (!trxSheet || !devSheet) throw new Error('Sheets not found');

  // 1. Calculate Dates
  const now = new Date();
  const borrowDate = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");
  const borrowTime = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss");
  
  let dueDate = new Date(now);
  if (data.userRole === 'Student') {
    dueDate.setFullYear(dueDate.getFullYear() + 3);
  } else {
    dueDate.setDate(dueDate.getDate() + 14);
  }
  const dueDateStr = Utilities.formatDate(dueDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
  
  // 2. Prepare Transaction Data
  const trxData = {
    borrowerId: 'TRX-' + Date.now(),
    fid: data.userFid,
    fname: data.userName,
    snDevice: data.snDevice,
    borrow_date: borrowDate,
    borrowTime: borrowTime,
    due_date: dueDateStr,
    status: 'Borrowed',
    recorder: user ? (user.username || user.email) : 'System',
    emailId: data.emailId || "ยังไม่ระบุ",
    borrowNotes: data.borrowNotes || "ยังไม่ระบุ"
  };
  
  // 3. Append to Transactions
  const trxHeaders = trxSheet.getRange(1, 1, 1, trxSheet.getLastColumn()).getValues()[0];
  const trxRow = trxHeaders.map(h => trxData[h] !== undefined ? trxData[h] : "");
  trxSheet.appendRow(trxRow);
  
  // 4. Update Device Status
  const devValues = devSheet.getDataRange().getValues();
  const devHeaders = devValues[0];
  const idIdx = devHeaders.indexOf('id');
  const statusIdx = devHeaders.indexOf('status');
  
  for (let i = 1; i < devValues.length; i++) {
    if (devValues[i][idIdx].toString() === data.deviceId.toString()) {
      devSheet.getRange(i + 1, statusIdx + 1).setValue('Borrowed');
      break;
    }
  }
  
  logAction(user, 'BORROW', 'Transactions', JSON.stringify(trxData));
  return { success: true };
}

function returnDevice(data, user) {
  const trxSheet = SS.getSheetByName('Transactions');
  const devSheet = SS.getSheetByName('Devices');
  
  if (!trxSheet || !devSheet) throw new Error('Sheets not found');

  const now = new Date();
  const returnDate = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd");

  // 1. Update Transactions
  const trxValues = trxSheet.getDataRange().getDisplayValues();
  const trxHeaders = trxValues[0];
  const snIdx = trxHeaders.indexOf('snDevice') !== -1 ? trxHeaders.indexOf('snDevice') : trxHeaders.indexOf('serial_number');
  const statusIdx = trxHeaders.indexOf('status');
  const returnDateIdx = trxHeaders.indexOf('return_date');
  
  let foundTrx = false;
  for (let i = trxValues.length - 1; i >= 1; i--) {
    if (trxValues[i][snIdx] === data.snDevice && trxValues[i][statusIdx] === 'Borrowed') {
      if (returnDateIdx !== -1) {
        trxSheet.getRange(i + 1, returnDateIdx + 1).setValue(returnDate);
      }
      trxSheet.getRange(i + 1, statusIdx + 1).setValue('Returned');
      foundTrx = true;
      break;
    }
  }

  // 2. Update Devices
  const devValues = devSheet.getDataRange().getValues();
  const devHeaders = devValues[0];
  const idIdx = devHeaders.indexOf('id');
  const devStatusIdx = devHeaders.indexOf('status');
  
  for (let i = 1; i < devValues.length; i++) {
    if (devValues[i][idIdx].toString() === data.deviceId.toString()) {
      devSheet.getRange(i + 1, devStatusIdx + 1).setValue('Available');
      break;
    }
  }

  logAction(user, 'RETURN', 'Transactions', `Returned device ${data.snDevice}`);
  return { success: true };
}

function logAction(user, action, target, details) {
  const sheet = SS.getSheetByName('Logs') || SS.insertSheet('Logs');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp', 'user', 'action', 'target', 'details']);
  }
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  const userName = user ? (user.fullName || user.username || user.email || user.users) : 'System';
  sheet.appendRow([timestamp, userName, action, target, details]);
}

function reportService(data, user) {
  const sheet = SS.getSheetByName('Service') || SS.insertSheet('Service');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'deviceId', 'issue_type', 'details', 'email', 'photo_url', 'reportedAt', 'status']);
  }
  
  const id = 'SRV-' + Date.now();
  const reportedAt = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  
  const rowData = {
    id: id,
    deviceId: data.deviceId,
    issue_type: data.issue_type,
    details: data.details,
    email: data.email || (user ? user.email : ""),
    photo_url: data.photo_url || "",
    reportedAt: reportedAt,
    status: 'Pending'
  };
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => rowData[h] !== undefined ? rowData[h] : "");
  sheet.appendRow(row);
  
  logAction(user, 'REPORT_SERVICE', 'Service', JSON.stringify(rowData));
  return { success: true, id: id };
}
