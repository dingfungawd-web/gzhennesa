import { Report, ReportFormData } from '@/types/report';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sheets`;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SESSION_TOKEN_KEY = 'session_token';

const getAuthHeaders = () => {
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) throw new Error('Session expired');

  return {
    apikey: API_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const readJsonFromResponse = async (response: Response) => {
  const text = await response.text().catch(() => '');
  if (!text) return { data: null as any, text: '' };
  try {
    return { data: JSON.parse(text), text };
  } catch {
    return { data: null as any, text };
  }
};

// New column mapping (A-AI = 35 columns):
// A(0): Name, B(1): 日期, C(2): 分隊, D(3): 安裝同事1, E(4): 安裝同事2, F(5): 安裝同事3, G(6): 安裝同事4
// Completed: H(7): 地址, I(8): 安裝實際時長, J(9): 度尺同事預計時長, K(10): 現場困難, L(11): 度尺同事, M(12): 客戶反饋, N(13): 客戶親證, O(14): 封陽台數, P(15): 安裝門數, Q(16): 安裝窗數, R(17): 安裝鋁料數, S(18): 拆舊數
// Follow-up: T(19): 地址, U(20): 安裝實際時長, V(21): 度尺同事預計時長, W(22): 重訂數, X(23): 度尺同事, Y(24): 重訂位置, Z(25): 責任選項, AA(26): 正常/加急, AB(27): 跟進詳情, AC(28): 客戶反饋, AD(29): 封陽台數, AE(30): 安裝門數, AF(31): 安裝窗數, AG(32): 安裝鋁料數, AH(33): 拆舊數
// AI(34): Report Code

export async function fetchUserReports(username: string): Promise<Report[]> {
  try {
    const response = await fetch(`${FUNCTION_URL}?username=${encodeURIComponent(username)}`, {
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      throw new Error('Session expired');
    }

    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }

    const data = await response.json();
    const rows = Array.isArray(data) ? data : data.data || [];

    // Data comes as array of arrays (rows), transform to Report objects
    return rows.map((row: any[], index: number) => {
      const report: Report = {
        id: row[34] || `temp-${index}`, // AI - report code
        username: row[0] || '',
        date: row[1] || '',
        team: row[2] || '',
        installer1: row[3] || '',
        installer2: row[4] || '',
        installer3: row[5] || '',
        installer4: row[6] || '',
        // Completed case fields (H-S, indices 7-18)
        address: row[7] || '',
        actualDuration: row[8] || '',
        estimatedDuration: row[9] || '',
        difficulties: row[10] || '',
        measuringColleague: row[11] || '',
        customerFeedback: row[12] || '',
        customerWitness: row[13] || '',
        balconySealed: row[14] || '',
        doorsInstalled: row[15] || '',
        windowsInstalled: row[16] || '',
        aluminumInstalled: row[17] || '',
        oldRemoved: row[18] || '',
        // Follow-up case fields (T-AH, indices 19-33)
        followUpAddress: row[19] || '',
        followUpDuration: row[20] || '',
        followUpEstimatedDuration: row[21] || '',
        reorders: row[22] || '',
        followUpMeasuringColleague: row[23] || '',
        reorderLocation: row[24] || '',
        responsibility: row[25] || '',
        urgency: row[26] || '',
        followUpDetails: row[27] || '',
        followUpCustomerFeedback: row[28] || '',
        followUpBalconySealed: row[29] || '',
        followUpDoorsInstalled: row[30] || '',
        followUpWindowsInstalled: row[31] || '',
        followUpAluminumInstalled: row[32] || '',
        followUpOldRemoved: row[33] || '',
        reportCode: row[34] || '', // AI column
        createdAt: row[1] || new Date().toISOString(),
        updatedAt: row[1] || new Date().toISOString(),
      };

      return report;
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
}

export async function fetchReportsByCode(username: string, reportCode: string): Promise<Report[]> {
  const allReports = await fetchUserReports(username);
  return allReports.filter(r => r.reportCode === reportCode);
}

export async function submitReport(username: string, formData: ReportFormData): Promise<boolean> {
  try {
    // Generate report code if not exists
    const reportCode = formData.reportCode || `RPT-${Date.now().toString(36).toUpperCase()}`;
    const basicInfo = formData.basicInfo;

    // Build rows - each completed case and follow-up case becomes a separate row
    const rows: any[][] = [];

    // Add completed cases (35 columns: A-AI)
    formData.completedCases.forEach((caseData) => {
      // Only add if there's at least some data
      if (caseData.address || caseData.doorsInstalled || caseData.windowsInstalled) {
        const row = [
          username,                   // A(0) - username
          basicInfo.date,             // B(1) - date
          basicInfo.team,             // C(2) - team
          basicInfo.installer1,       // D(3) - installer1
          basicInfo.installer2,       // E(4) - installer2
          basicInfo.installer3,       // F(5) - installer3
          basicInfo.installer4,       // G(6) - installer4
          caseData.address,           // H(7) - address
          caseData.actualDuration,    // I(8) - actual duration
          caseData.estimatedDuration, // J(9) - estimated duration
          caseData.difficulties,      // K(10) - difficulties
          caseData.measuringColleague,// L(11) - measuring colleague
          caseData.customerFeedback,  // M(12) - customer feedback
          caseData.customerWitness,   // N(13) - customer witness
          caseData.balconySealed,     // O(14) - balcony sealed
          caseData.doorsInstalled,    // P(15) - doors
          caseData.windowsInstalled,  // Q(16) - windows
          caseData.aluminumInstalled, // R(17) - aluminum
          caseData.oldRemoved,        // S(18) - old removed
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', // T-AH(19-33) empty for completed case
          reportCode,                 // AI(34) - report code
        ];
        rows.push(row);
      }
    });

    // Add follow-up cases (35 columns: A-AI)
    formData.followUpCases.forEach((caseData) => {
      // Only add if there's at least some data
      if (caseData.address || caseData.doorsInstalled || caseData.windowsInstalled) {
        const row = [
          username,                   // A(0) - username
          basicInfo.date,             // B(1) - date
          basicInfo.team,             // C(2) - team
          basicInfo.installer1,       // D(3) - installer1
          basicInfo.installer2,       // E(4) - installer2
          basicInfo.installer3,       // F(5) - installer3
          basicInfo.installer4,       // G(6) - installer4
          '', '', '', '', '', '', '', '', '', '', '', '', // H-S(7-18) empty for follow-up case
          caseData.address,           // T(19) - address
          caseData.duration,          // U(20) - actual duration
          caseData.estimatedDuration, // V(21) - estimated duration
          caseData.reorders,          // W(22) - reorders
          caseData.measuringColleague,// X(23) - measuring colleague
          caseData.reorderLocation,   // Y(24) - reorder location
          caseData.responsibility,    // Z(25) - responsibility
          caseData.urgency,           // AA(26) - urgency
          caseData.details,           // AB(27) - details
          caseData.customerFeedback,  // AC(28) - customer feedback
          caseData.balconySealed,     // AD(29) - balcony sealed
          caseData.doorsInstalled,    // AE(30) - doors
          caseData.windowsInstalled,  // AF(31) - windows
          caseData.aluminumInstalled, // AG(32) - aluminum
          caseData.oldRemoved,        // AH(33) - old removed
          reportCode,                 // AI(34) - report code
        ];
        rows.push(row);
      }
    });

    // If no cases, add at least one row with basic info
    if (rows.length === 0) {
      const row = [
        username,
        basicInfo.date,
        basicInfo.team,
        basicInfo.installer1,
        basicInfo.installer2,
        basicInfo.installer3,
        basicInfo.installer4,
        '', '', '', '', '', '', '', '', '', '', '', '', // H-S
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', // T-AH
        reportCode, // AI
      ];
      rows.push(row);
    }

    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rows }),
    });

    if (response.status === 401) {
      throw new Error('Session expired');
    }

    const { data: result, text } = await readJsonFromResponse(response);

    if (!response.ok) {
      console.error('Submit error response:', { status: response.status, result, text: text?.slice?.(0, 300) });
      throw new Error(result?.error || `Failed to submit report (${response.status})`);
    }

    if (result?.success !== true) {
      throw new Error(result?.error || 'Failed to submit report');
    }

    return true;
  } catch (error) {
    console.error('Error submitting report:', error);
    throw error;
  }
}

export async function updateReport(username: string, formData: ReportFormData): Promise<boolean> {
  try {
    const reportCode = formData.reportCode;
    if (!reportCode) {
      throw new Error('Report code is required for update');
    }

    const basicInfo = formData.basicInfo;
    const rows: any[][] = [];

    // Build completed case rows (35 columns)
    formData.completedCases.forEach((caseData) => {
      if (caseData.address || caseData.doorsInstalled || caseData.windowsInstalled) {
        const row = [
          username,
          basicInfo.date,
          basicInfo.team,
          basicInfo.installer1,
          basicInfo.installer2,
          basicInfo.installer3,
          basicInfo.installer4,
          caseData.address,
          caseData.actualDuration,
          caseData.estimatedDuration,
          caseData.difficulties,
          caseData.measuringColleague,
          caseData.customerFeedback,
          caseData.customerWitness,
          caseData.balconySealed,
          caseData.doorsInstalled,
          caseData.windowsInstalled,
          caseData.aluminumInstalled,
          caseData.oldRemoved,
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          reportCode,
        ];
        rows.push(row);
      }
    });

    // Build follow-up case rows (35 columns)
    formData.followUpCases.forEach((caseData) => {
      if (caseData.address || caseData.doorsInstalled || caseData.windowsInstalled) {
        const row = [
          username,
          basicInfo.date,
          basicInfo.team,
          basicInfo.installer1,
          basicInfo.installer2,
          basicInfo.installer3,
          basicInfo.installer4,
          '', '', '', '', '', '', '', '', '', '', '', '',
          caseData.address,
          caseData.duration,
          caseData.estimatedDuration,
          caseData.reorders,
          caseData.measuringColleague,
          caseData.reorderLocation,
          caseData.responsibility,
          caseData.urgency,
          caseData.details,
          caseData.customerFeedback,
          caseData.balconySealed,
          caseData.doorsInstalled,
          caseData.windowsInstalled,
          caseData.aluminumInstalled,
          caseData.oldRemoved,
          reportCode,
        ];
        rows.push(row);
      }
    });

    if (rows.length === 0) {
      const row = [
        username,
        basicInfo.date,
        basicInfo.team,
        basicInfo.installer1,
        basicInfo.installer2,
        basicInfo.installer3,
        basicInfo.installer4,
        '', '', '', '', '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        reportCode,
      ];
      rows.push(row);
    }

    const response = await fetch(FUNCTION_URL, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reportCode, rows }),
    });

    if (response.status === 401) {
      throw new Error('Session expired');
    }

    const { data: result, text } = await readJsonFromResponse(response);

    if (!response.ok) {
      console.error('Update error response:', { status: response.status, result, text: text?.slice?.(0, 300) });
      throw new Error(result?.error || `Failed to update report (${response.status})`);
    }

    if (result?.success !== true) {
      throw new Error(result?.error || 'Failed to update report');
    }

    return true;
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
}
