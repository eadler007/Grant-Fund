
export enum FundingLevel {
  LOCAL = 'Local',
  STATE = 'State',
  FEDERAL = 'Federal',
  PRIVATE = 'Private/Healthcare'
}

export enum ApplicationStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  SUBMITTED = 'Submitted',
  AWARDED = 'Awarded',
  DENIED = 'Denied'
}

export interface Grant {
  id: string;
  name: string;
  level: FundingLevel;
  awardRange: string;
  minVal: number;
  maxVal: number;
  applicationPeriod: string;
  awardDate?: string;
  projectExamples?: string;
  matchRequired: string;
  eligibility: string;
  recommendedUse: string;
  status: ApplicationStatus;
  sourceLink: string;
  narrativeDraft?: string;
  confirmedAwardAmount?: number;
}

export interface ProjectAnalysis {
  id: string; // Unique ID for the city record
  cityName: string;
  priorities: string[];
  scale: 'Single Site' | 'Multi-Site' | 'Citywide';
  equityGoals: string;
  budgetEstimate: number;
  fundingSecured: number;
  potentialGrants: Grant[];
  phaseBreakdown?: string;
  lastUpdated: number;
  isProcessed: boolean; // Flag to hide upload UI
}
