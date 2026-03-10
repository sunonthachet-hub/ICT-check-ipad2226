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
  if (!sheet) return [];
  
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
  const key = data.serial_number || data.id || data.email || data.fid || data.studentId || data.borrowerId;

  // สำหรับ Transactions เราอาจต้องการหาแถวที่ serial_number ตรงกันและสถานะยังเป็น Borrowed
  if (sheetName === 'Transactions' && data.status === 'Returned') {
    const snIdx = headers.indexOf('serial_number');
    const statusIdx = headers.indexOf('status');
    for (let i = values.length - 1; i >= 1; i--) {
      if (values[i][snIdx] === data.serial_number && values[i][statusIdx] === 'Borrowed') {
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
      
      // คำนวณ due_date ถ้าไม่มี (บวก 14 วัน)
      if (!item.due_date && item.borrowDate) {
        const bDate = new Date(item.borrowDate);
        if (!isNaN(bDate.getTime())) {
          bDate.setDate(bDate.getDate() + 14);
          item.due_date = Utilities.formatDate(bDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
        }
      }

      // 2. บันทึกลง Transactions
      const row = headers.map(h => item[h] !== undefined ? item[h] : "");
      sheet.appendRow(row);

      // 3. อัปเดตสถานะใน Devices
      if (item.serial_number && item.status) {
        let found = false;
        for (let i = 1; i < devValues.length; i++) {
          if (devValues[i][devSerialIdx] === item.serial_number) {
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

function logAction(user, action, target, details) {
  const sheet = SS.getSheetByName('Logs') || SS.insertSheet('Logs');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'User', 'Action', 'Target', 'Details']);
  }
  sheet.appendRow([new Date(), user ? (user.email || user.name) : 'System', action, target, details]);
}
