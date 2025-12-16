import { Report, ReportFormData, BasicInfo } from '@/types/report';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sheets`;
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function fetchUserReports(username: string): Promise<Report[]> {
  try {
    const response = await fetch(`${FUNCTION_URL}?username=${encodeURIComponent(username)}`, {
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }
    
    const data = await response.json();
    
    // Data comes as array of arrays (rows), transform to Report objects
    return data.map((row: any[], index: number) => {
      const report: Report = {
        id: row[32] || `temp-${index}`, // AG - report code
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
        reportCode: row[32] || '',
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
          username,                    // A - username
          basicInfo.date,              // B - date
          basicInfo.team,              // C - team
          basicInfo.installer1,        // D - installer1
          basicInfo.installer2,        // E - installer2
          basicInfo.installer3,        // F - installer3
          basicInfo.installer4,        // G - installer4
          caseData.address,            // H - address
          caseData.actualDuration,     // I - duration
          caseData.difficulties,       // J - difficulties
          caseData.measuringColleague, // K - measuring colleague
          caseData.customerFeedback,   // L - customer feedback
          caseData.customerWitness,    // M - customer witness
          caseData.doorsInstalled,     // N - doors
          caseData.windowsInstalled,   // O - windows
          caseData.aluminumInstalled,  // P - aluminum
          caseData.oldGrillesRemoved,  // Q - old grilles
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', // R-AF empty for completed case
          reportCode,                  // AG - report code
        ];
        rows.push(row);
      }
    });
    
    // Add follow-up cases
    formData.followUpCases.forEach((caseData) => {
      // Only add if there's at least some data
      if (caseData.address || caseData.doorsInstalled || caseData.windowsInstalled) {
        const row = [
          username,                    // A - username
          basicInfo.date,              // B - date
          basicInfo.team,              // C - team
          basicInfo.installer1,        // D - installer1
          basicInfo.installer2,        // E - installer2
          basicInfo.installer3,        // F - installer3
          basicInfo.installer4,        // G - installer4
          '', '', '', '', '', '', '', '', '', '', // H-Q empty for follow-up case
          caseData.address,            // R - address
          caseData.duration,           // S - duration
          caseData.materialsCut,       // T - materials cut
          caseData.materialsSupplemented, // U - materials supplemented
          caseData.reorders,           // V - reorders
          caseData.measuringColleague, // W - measuring colleague
          caseData.reorderLocation,    // X - reorder location
          caseData.responsibility,     // Y - responsibility
          caseData.urgency,            // Z - urgency
          caseData.details,            // AA - details
          caseData.customerFeedback,   // AB - customer feedback
          caseData.doorsInstalled,     // AC - doors
          caseData.windowsInstalled,   // AD - windows
          caseData.aluminumInstalled,  // AE - aluminum
          caseData.oldGrillesRemoved,  // AF - old grilles
          reportCode,                  // AG - report code
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
        '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', // R-AF
        reportCode,
      ];
      rows.push(row);
    }
    
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rows }),
    });
    
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
