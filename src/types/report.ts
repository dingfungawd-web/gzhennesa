export interface Report {
  id: string;
  username: string;
  date: string;
  team: string;
  installer1: string;
  installer2: string;
  installer3: string;
  installer4: string;
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
  // Amendment fields
  amendmentAddress: string;
  materialsCut: number;
  materialsSupplemented: number;
  reorders: number;
  reorderLocation: string;
  responsibility: string;
  urgency: string;
  followUpDetails: string;
  reportCode: string;
  createdAt: string;
  updatedAt: string;
}

export type ReportFormData = Omit<Report, 'id' | 'username' | 'createdAt' | 'updatedAt'>;
