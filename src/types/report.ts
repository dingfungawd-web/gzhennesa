// Single completed case
export interface CompletedCase {
  address: string;
  actualDuration: string;
  difficulties: string;
  measuringColleague: string;
  customerFeedback: string;
  customerWitness: string;
  doorsInstalled: string;
  windowsInstalled: string;
  aluminumInstalled: string;
  oldGrillesRemoved: string;
}

// Single follow-up case
export interface FollowUpCase {
  address: string;
  duration: string;
  materialsCut: string;
  materialsSupplemented: string;
  reorders: string;
  measuringColleague: string;
  reorderLocation: string;
  responsibility: string;
  urgency: string;
  details: string;
  customerFeedback: string;
  doorsInstalled: string;
  windowsInstalled: string;
  aluminumInstalled: string;
  oldGrillesRemoved: string;
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

// Row from Google Sheet (flat structure)
export interface Report {
  id: string;
  username: string;
  date: string;
  team: string;
  installer1: string;
  installer2: string;
  installer3: string;
  installer4: string;
  // Completed case fields (H-Q)
  address: string;
  actualDuration: string;
  difficulties: string;
  measuringColleague: string;
  customerFeedback: string;
  customerWitness: string;
  doorsInstalled: number | string;
  windowsInstalled: number | string;
  aluminumInstalled: number | string;
  oldGrillesRemoved: number | string;
  // Follow-up case fields (R-AF)
  followUpAddress: string;
  followUpDuration: string;
  materialsCut: number | string;
  materialsSupplemented: number | string;
  reorders: number | string;
  followUpMeasuringColleague: string;
  reorderLocation: string;
  responsibility: string;
  urgency: string;
  followUpDetails: string;
  followUpCustomerFeedback: string;
  followUpDoorsInstalled: number | string;
  followUpWindowsInstalled: number | string;
  followUpAluminumInstalled: number | string;
  followUpOldGrillesRemoved: number | string;
  reportCode: string;
  createdAt: string;
  updatedAt: string;
}

// Empty case templates
export const emptyCompletedCase: CompletedCase = {
  address: '',
  actualDuration: '',
  difficulties: '',
  measuringColleague: '',
  customerFeedback: '',
  customerWitness: '',
  doorsInstalled: '',
  windowsInstalled: '',
  aluminumInstalled: '',
  oldGrillesRemoved: '',
};

export const emptyFollowUpCase: FollowUpCase = {
  address: '',
  duration: '',
  materialsCut: '',
  materialsSupplemented: '',
  reorders: '',
  measuringColleague: '',
  reorderLocation: '',
  responsibility: '',
  urgency: '',
  details: '',
  customerFeedback: '',
  doorsInstalled: '',
  windowsInstalled: '',
  aluminumInstalled: '',
  oldGrillesRemoved: '',
};
