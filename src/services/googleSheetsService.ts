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
        id: row[33] || `temp-${index}`, // AH - report code
        username: row[0] || '',
        date: row[1] || '',
        team: row[2] || '',
        installer1: row[3] || '',
        installer2: row[4] || '',
        installer3: row[5] || '',
        installer4: row[6] || '',
        address: row[7] || '',
        actualDuration: row[8] || '',
        difficulties: row[9] || '',
        measuringColleague: row[10] || '',
        customerFeedback: row[11] || '',
        customerWitness: row[12] || '',
        doorsInstalled: row[13] || '',
        windowsInstalled: row[14] || '',
        aluminumInstalled: row[15] || '',
        oldGrillesRemoved: row[16] || '',
        followUpAddress: row[17] || '',
        followUpDuration: row[18] || '',
        materialsCut: row[19] || '',
        materialsSupplemented: row[20] || '',
        reorders: row[21] || '',
        followUpMeasuringColleague: row[22] || '',
        reorderLocation: row[23] || '',
        responsibility: row[24] || '',
        urgency: row[25] || '',
        followUpDetails: row[26] || '',
        followUpCustomerFeedback: row[27] || '',
        followUpDoorsInstalled: row[28] || '',
        followUpWindowsInstalled: row[29] || '',
        followUpAluminumInstalled: row[30] || '',
        followUpOldGrillesRemoved: row[31] || '',
        reportCode: row[33] || '', // AH column
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

    // Add completed cases
    formData.completedCases.forEach((caseData) => {
      // Only add if there's at least some data
      if (caseData.address || caseData.doorsInstalled || caseData.windowsInstalled) {
        const row = [
          username, // A - username (server will enforce authenticated username)
          basicInfo.date, // B - date
          basicInfo.team, // C - team
          basicInfo.installer1, // D - installer1
          basicInfo.installer2, // E - installer2
          basicInfo.installer3, // F - installer3
          basicInfo.installer4, // G - installer4
          caseData.address, // H - address
          caseData.actualDuration, // I - duration
          caseData.difficulties, // J - difficulties
          caseData.measuringColleague, // K - measuring colleague
          caseData.customerFeedback, // L - customer feedback
          caseData.customerWitness, // M - customer witness
          caseData.doorsInstalled, // N - doors
          caseData.windowsInstalled, // O - windows
          caseData.aluminumInstalled, // P - aluminum
          caseData.oldGrillesRemoved, // Q - old grilles
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', // R-AG empty for completed case
          reportCode, // AH - report code
        ];
        rows.push(row);
      }
    });

    // Add follow-up cases
    formData.followUpCases.forEach((caseData) => {
      // Only add if there's at least some data
      if (caseData.address || caseData.doorsInstalled || caseData.windowsInstalled) {
        const row = [
          username, // A - username (server will enforce authenticated username)
          basicInfo.date, // B - date
          basicInfo.team, // C - team
          basicInfo.installer1, // D - installer1
          basicInfo.installer2, // E - installer2
          basicInfo.installer3, // F - installer3
          basicInfo.installer4, // G - installer4
          '', '', '', '', '', '', '', '', '', '', // H-Q empty for follow-up case
          caseData.address, // R - address
          caseData.duration, // S - duration
          caseData.materialsCut, // T - materials cut
          caseData.materialsSupplemented, // U - materials supplemented
          caseData.reorders, // V - reorders
          caseData.measuringColleague, // W - measuring colleague
          caseData.reorderLocation, // X - reorder location
          caseData.responsibility, // Y - responsibility
          caseData.urgency, // Z - urgency
          caseData.details, // AA - details
          caseData.customerFeedback, // AB - customer feedback
          caseData.doorsInstalled, // AC - doors
          caseData.windowsInstalled, // AD - windows
          caseData.aluminumInstalled, // AE - aluminum
          caseData.oldGrillesRemoved, // AF - old grilles
          '', // AG - empty
          reportCode, // AH - report code
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
        '', '', '', '', '', '', '', '', '', '', // H-Q
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', // R-AG
        reportCode, // AH
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Submit error response:', errorData);
      throw new Error('Failed to submit report');
    }

    const result = await response.json();
    return result.success === true;
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

    // Build completed case rows
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
          caseData.difficulties,
          caseData.measuringColleague,
          caseData.customerFeedback,
          caseData.customerWitness,
          caseData.doorsInstalled,
          caseData.windowsInstalled,
          caseData.aluminumInstalled,
          caseData.oldGrillesRemoved,
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
          reportCode,
        ];
        rows.push(row);
      }
    });

    // Build follow-up case rows
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
          '', '', '', '', '', '', '', '', '', '',
          caseData.address,
          caseData.duration,
          caseData.materialsCut,
          caseData.materialsSupplemented,
          caseData.reorders,
          caseData.measuringColleague,
          caseData.reorderLocation,
          caseData.responsibility,
          caseData.urgency,
          caseData.details,
          caseData.customerFeedback,
          caseData.doorsInstalled,
          caseData.windowsInstalled,
          caseData.aluminumInstalled,
          caseData.oldGrillesRemoved,
          '',
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
        '', '', '', '', '', '', '', '', '', '',
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
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

    if (!response.ok) {
      throw new Error('Failed to update report');
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
}
