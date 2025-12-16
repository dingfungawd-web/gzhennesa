import { supabase } from '@/integrations/supabase/client';
import { Report, ReportFormData } from '@/types/report';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sheets`;

// Map between Chinese headers and English field names (matching Google Sheet columns A-AG)
const fieldMapping: Record<string, keyof Report> = {
  // 基本資料 (A-G)
  '使用者名稱': 'username',
  '日期': 'date',
  '分隊': 'team',
  '安裝同事1': 'installer1',
  '安裝同事2': 'installer2',
  '安裝同事3': 'installer3',
  '安裝同事4': 'installer4',
  // 已完成個案 (H-Q)
  '地址': 'address',
  '安裝實際時長': 'actualDuration',
  '現場困難解決和建議': 'difficulties',
  '度尺同事': 'measuringColleague',
  '客戶反饋': 'customerFeedback',
  '客戶親證': 'customerWitness',
  '安裝門數': 'doorsInstalled',
  '安裝窗數': 'windowsInstalled',
  '安裝鋁料數': 'aluminumInstalled',
  '拆舊拆拉釘窗花數': 'oldGrillesRemoved',
  // 需跟進個案 (R-AG) - using column prefixes to differentiate
  '跟進地址': 'followUpAddress',
  '跟進安裝實際時長': 'followUpDuration',
  '開料數': 'materialsCut',
  '補料數': 'materialsSupplemented',
  '重訂數': 'reorders',
  '跟進度尺同事': 'followUpMeasuringColleague',
  '重訂位置': 'reorderLocation',
  '責任選項': 'responsibility',
  '正常/加急': 'urgency',
  '跟進詳情': 'followUpDetails',
  '跟進客戶反饋': 'followUpCustomerFeedback',
  '跟進安裝門數': 'followUpDoorsInstalled',
  '跟進安裝窗數': 'followUpWindowsInstalled',
  '跟進安裝鋁料數': 'followUpAluminumInstalled',
  '跟進拆舊拆拉釘窗花數': 'followUpOldGrillesRemoved',
  'report code': 'reportCode',
};

// Column order for Google Sheet (A-AG)
const columnOrder = [
  '使用者名稱',      // A
  '日期',            // B
  '分隊',            // C
  '安裝同事1',       // D
  '安裝同事2',       // E
  '安裝同事3',       // F
  '安裝同事4',       // G
  '地址',            // H
  '安裝實際時長',    // I
  '現場困難解決和建議', // J
  '度尺同事',        // K
  '客戶反饋',        // L
  '客戶親證',        // M
  '安裝門數',        // N
  '安裝窗數',        // O
  '安裝鋁料數',      // P
  '拆舊拆拉釘窗花數', // Q
  '跟進地址',        // R
  '跟進安裝實際時長', // S
  '開料數',          // T
  '補料數',          // U
  '重訂數',          // V
  '跟進度尺同事',    // W
  '重訂位置',        // X
  '責任選項',        // Y
  '正常/加急',       // Z
  '跟進詳情',        // AA
  '跟進客戶反饋',    // AB
  '跟進安裝門數',    // AC
  '跟進安裝窗數',    // AD
  '跟進安裝鋁料數',  // AE
  '跟進拆舊拆拉釘窗花數', // AF
  'report code',     // AG
];

// Reverse mapping for sending data
const reverseFieldMapping: Record<string, string> = Object.fromEntries(
  Object.entries(fieldMapping).map(([k, v]) => [v, k])
);

export async function fetchUserReports(username: string): Promise<Report[]> {
  try {
    const response = await fetch(`${FUNCTION_URL}?username=${encodeURIComponent(username)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }
    
    const data = await response.json();
    
    // Transform Chinese keys to English
    return data.map((row: Record<string, any>, index: number) => {
      const report: Partial<Report> = {
        id: row['report code'] || `temp-${index}`,
        createdAt: row['日期'] || new Date().toISOString(),
        updatedAt: row['日期'] || new Date().toISOString(),
      };
      
      Object.entries(fieldMapping).forEach(([chineseKey, englishKey]) => {
        const value = row[chineseKey];
        if (value !== undefined) {
          // Handle numeric fields
          if (['doorsInstalled', 'windowsInstalled', 'aluminumInstalled', 'oldGrillesRemoved', 
               'materialsCut', 'materialsSupplemented', 'reorders',
               'followUpDoorsInstalled', 'followUpWindowsInstalled', 'followUpAluminumInstalled', 
               'followUpOldGrillesRemoved'].includes(englishKey)) {
            (report as any)[englishKey] = parseInt(value) || 0;
          } else {
            (report as any)[englishKey] = value;
          }
        }
      });
      
      return report as Report;
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
}

export async function submitReport(username: string, formData: ReportFormData): Promise<boolean> {
  try {
    // Transform to Chinese keys for Google Sheets
    const sheetData: Record<string, any> = {
      '使用者名稱': username,
    };
    
    Object.entries(formData).forEach(([key, value]) => {
      const chineseKey = reverseFieldMapping[key];
      if (chineseKey) {
        sheetData[chineseKey] = value;
      }
    });
    
    // Generate report code if not exists
    if (!sheetData['report code']) {
      sheetData['report code'] = `RPT-${Date.now().toString(36).toUpperCase()}`;
    }
    
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sheetData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit report');
    }
    
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
}
