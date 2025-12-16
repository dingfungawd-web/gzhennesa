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
  doorsInstalled: number | string;
  windowsInstalled: number | string;
  aluminumInstalled: number | string;
  oldGrillesRemoved: number | string;
  // 需跟進個案
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

export type ReportFormData = Omit<Report, 'id' | 'username' | 'createdAt' | 'updatedAt'>;
