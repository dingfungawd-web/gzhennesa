export interface Report {
  id: string;
  username: string;
  // 基本資料
  date: string;
  team: string;
  installer1: string;
  installer2: string;
  installer3: string;
  installer4: string;
  // 已完成個案
  address: string;
  actualDuration: string;
  difficulties: string;
  measuringColleague: string;
  customerFeedback: string;
  customerWitness: string;
  doorsInstalled: number;
  windowsInstalled: number;
  aluminumInstalled: number;
  oldGrillesRemoved: number;
  // 需跟進個案
  followUpAddress: string;
  followUpDuration: string;
  materialsCut: number;
  materialsSupplemented: number;
  reorders: number;
  followUpMeasuringColleague: string;
  reorderLocation: string;
  responsibility: string;
  urgency: string;
  followUpDetails: string;
  followUpCustomerFeedback: string;
  followUpDoorsInstalled: number;
  followUpWindowsInstalled: number;
  followUpAluminumInstalled: number;
  followUpOldGrillesRemoved: number;
  reportCode: string;
  createdAt: string;
  updatedAt: string;
}

export type ReportFormData = Omit<Report, 'id' | 'username' | 'createdAt' | 'updatedAt'>;
