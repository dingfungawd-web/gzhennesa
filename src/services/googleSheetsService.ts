import { Report, ReportFormData } from '@/types/report';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sheets`;

// Column order for Google Sheet (A-AG) - using simplified Chinese as in the sheet
const columnOrder = [
  'username',           // A 使用者名称
  'date',               // B 日期
  'team',               // C 分队
  'installer1',         // D 安装同事1
  'installer2',         // E 安装同事2
  'installer3',         // F 安装同事3
  'installer4',         // G 安装同事4
  'address',            // H 地址
  'actualDuration',     // I 安装实际时长
  'difficulties',       // J 现场困难解决和建议
  'measuringColleague', // K 度尺同事
  'customerFeedback',   // L 客户反馈
  'customerWitness',    // M 客户亲证
  'doorsInstalled',     // N 安装门数
  'windowsInstalled',   // O 安装窗数
  'aluminumInstalled',  // P 安装铝料数
  'oldGrillesRemoved',  // Q 拆旧拆拉钉窗花数
  'followUpAddress',    // R 地址
  'followUpDuration',   // S 安装实际时长
  'materialsCut',       // T 开料数
  'materialsSupplemented', // U 补料数
  'reorders',           // V 重订数
  'followUpMeasuringColleague', // W 度尺同事
  'reorderLocation',    // X 重订位置
  'responsibility',     // Y 责任选项
  'urgency',            // Z 正常/加急
  'followUpDetails',    // AA 跟进详情
  'followUpCustomerFeedback', // AB 客户反馈
  'followUpDoorsInstalled',   // AC 安装门数
  'followUpWindowsInstalled', // AD 安装窗数
  'followUpAluminumInstalled', // AE 安装铝料数
  'followUpOldGrillesRemoved', // AF 拆旧拆拉钉窗花数
  'reportCode',         // AG report code
] as const;

export async function fetchUserReports(username: string): Promise<Report[]> {
  try {
    const response = await fetch(`${FUNCTION_URL}?username=${encodeURIComponent(username)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }
    
    const data = await response.json();
    
    // Data comes as array of arrays (rows), transform to Report objects
    return data.map((row: any[], index: number) => {
      const report: Partial<Report> = {
        id: row[32] || `temp-${index}`, // AG - report code
        createdAt: row[1] || new Date().toISOString(), // B - date
        updatedAt: row[1] || new Date().toISOString(),
      };
      
      // Map each column to its field
      columnOrder.forEach((field, colIndex) => {
        const value = row[colIndex];
        if (value !== undefined && value !== null && value !== '') {
          // Handle numeric fields
          const numericFields = [
            'doorsInstalled', 'windowsInstalled', 'aluminumInstalled', 'oldGrillesRemoved',
            'materialsCut', 'materialsSupplemented', 'reorders',
            'followUpDoorsInstalled', 'followUpWindowsInstalled', 'followUpAluminumInstalled', 
            'followUpOldGrillesRemoved'
          ];
          if (numericFields.includes(field)) {
            (report as any)[field] = parseInt(value) || 0;
          } else {
            (report as any)[field] = value;
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
    // Generate report code if not exists
    const reportCode = formData.reportCode || `RPT-${Date.now().toString(36).toUpperCase()}`;
    
    // Build row data in column order (A-AG)
    const rowData = [
      username,                          // A
      formData.date,                     // B
      formData.team,                     // C
      formData.installer1,               // D
      formData.installer2,               // E
      formData.installer3,               // F
      formData.installer4,               // G
      formData.address,                  // H
      formData.actualDuration,           // I
      formData.difficulties,             // J
      formData.measuringColleague,       // K
      formData.customerFeedback,         // L
      formData.customerWitness,          // M
      formData.doorsInstalled,           // N
      formData.windowsInstalled,         // O
      formData.aluminumInstalled,        // P
      formData.oldGrillesRemoved,        // Q
      formData.followUpAddress,          // R
      formData.followUpDuration,         // S
      formData.materialsCut,             // T
      formData.materialsSupplemented,    // U
      formData.reorders,                 // V
      formData.followUpMeasuringColleague, // W
      formData.reorderLocation,          // X
      formData.responsibility,           // Y
      formData.urgency,                  // Z
      formData.followUpDetails,          // AA
      formData.followUpCustomerFeedback, // AB
      formData.followUpDoorsInstalled,   // AC
      formData.followUpWindowsInstalled, // AD
      formData.followUpAluminumInstalled, // AE
      formData.followUpOldGrillesRemoved, // AF
      reportCode,                        // AG
    ];
    
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rowData }),
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
