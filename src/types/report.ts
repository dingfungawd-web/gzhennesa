// Single completed case
export interface CompletedCase {
  address: string;
  actualDuration: string;
  estimatedDuration: string;  // 度尺同事預計時長
  difficulties: string;
  measuringColleague: string;
  customerFeedback: string;
  customerWitness: string;
  balconySealed: string;      // 封陽台數
  doorsInstalled: string;
  windowsInstalled: string;
  aluminumInstalled: string;
  oldRemoved: string;         // 拆舊數 (renamed from oldGrillesRemoved)
}

// Single follow-up case
export interface FollowUpCase {
  address: string;
  duration: string;
  estimatedDuration: string;  // 度尺同事預計時長
  reorders: string;
  measuringColleague: string;
  reorderLocation: string;
  responsibility: string;
  urgency: string;
  details: string;
  customerFeedback: string;
  balconySealed: string;      // 封陽台數
  doorsInstalled: string;
  windowsInstalled: string;
  aluminumInstalled: string;
  oldRemoved: string;         // 拆舊數 (renamed from oldGrillesRemoved)
}

// Basic info shared across all cases in the same report
export interface BasicInfo {
  date: string;
  team: string;
  installer1: string;
  installer2: string;
  installer3: string;
  installer4: string;
}

// Full report structure
export interface ReportFormData {
  basicInfo: BasicInfo;
  completedCases: CompletedCase[];
  followUpCases: FollowUpCase[];
  reportCode: string;
}

// Row from Google Sheet (flat structure) - Updated for new 35 column structure (A-AI)
export interface Report {
  id: string;
  username: string;
  date: string;
  team: string;
  installer1: string;
  installer2: string;
  installer3: string;
  installer4: string;
  // Completed case fields (H-S)
  address: string;
  actualDuration: string;
  estimatedDuration: string;
  difficulties: string;
  measuringColleague: string;
  customerFeedback: string;
  customerWitness: string;
  balconySealed: number | string;
  doorsInstalled: number | string;
  windowsInstalled: number | string;
  aluminumInstalled: number | string;
  oldRemoved: number | string;
  // Follow-up case fields (T-AH)
  followUpAddress: string;
  followUpDuration: string;
  followUpEstimatedDuration: string;
  reorders: number | string;
  followUpMeasuringColleague: string;
  reorderLocation: string;
  responsibility: string;
  urgency: string;
  followUpDetails: string;
  followUpCustomerFeedback: string;
  followUpBalconySealed: number | string;
  followUpDoorsInstalled: number | string;
  followUpWindowsInstalled: number | string;
  followUpAluminumInstalled: number | string;
  followUpOldRemoved: number | string;
  reportCode: string;
  createdAt: string;
  updatedAt: string;
}

// Empty case templates
export const emptyCompletedCase: CompletedCase = {
  address: '',
  actualDuration: '',
  estimatedDuration: '',
  difficulties: '',
  measuringColleague: '',
  customerFeedback: '',
  customerWitness: '',
  balconySealed: '',
  doorsInstalled: '',
  windowsInstalled: '',
  aluminumInstalled: '',
  oldRemoved: '',
};

export const emptyFollowUpCase: FollowUpCase = {
  address: '',
  duration: '',
  estimatedDuration: '',
  reorders: '',
  measuringColleague: '',
  reorderLocation: '',
  responsibility: '',
  urgency: '',
  details: '',
  customerFeedback: '',
  balconySealed: '',
  doorsInstalled: '',
  windowsInstalled: '',
  aluminumInstalled: '',
  oldRemoved: '',
};
