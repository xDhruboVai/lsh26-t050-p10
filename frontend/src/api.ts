import axios, { AxiosInstance } from 'axios';

export interface CaseListItem {
  case_id: string;
  opening_balance: string;
  days_count: number;
  recharges_count: number;
  today: string;
}

export interface CaseDetails {
  case_id: string;
  opening_balance: string;
  today: string;
  usual_daily_units: number;
  target_date: string;
}

export interface TimelineEntry {
  date: string;
  units: number;
  balance: string;
  energy_cost: string;
  vat: string;
  recharge: string;
  slab_warning?: string;
}

export interface RunOutResponse {
  run_out_date: string;
  days_remaining: number;
}

export interface RechargeResponse {
  required_amount: string;
  base_energy: string;
  fixed_charges: string;
  vat: string;
  breakdown_valid: boolean;
}

export interface ComparisonEntry {
  habit: string;
  total_cost: string;
  energy_cost: string;
  vat: string;
  fixed_charges: string;
  fixed_charge_count: number;
  recharge_total: string;
}

export interface MonthlyComparisonEntry {
  period: string;
  first_month: string;
  second_month: string;
  first_cost: string;
  second_cost: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL = '/api') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  async health() {
    const response = await this.client.get('/health');
    return response.data;
  }

  async listCases(): Promise<CaseListItem[]> {
    const response = await this.client.get<CaseListItem[]>('/cases');
    return response.data;
  }

  async uploadCase(content: string): Promise<CaseListItem[]> {
    const response = await this.client.post<CaseListItem[]>('/cases/upload', JSON.parse(content));
    return response.data;
  }

  async getCaseDetails(caseId: string): Promise<CaseDetails> {
    const response = await this.client.get<CaseDetails>(`/cases/${caseId}`);
    return response.data;
  }

  async getTimeline(caseId: string): Promise<TimelineEntry[]> {
    const response = await this.client.get<TimelineEntry[]>(`/timeline/${caseId}`);
    return response.data;
  }

  async getRunOut(caseId: string, dailyUnits?: number): Promise<RunOutResponse> {
    const response = await this.client.get<RunOutResponse>(`/run-out/${caseId}`, { params: dailyUnits === undefined ? {} : { daily_units: dailyUnits } });
    return response.data;
  }

  async getRechargeNeeded(caseId: string, targetDate?: string, dailyUnits?: number): Promise<RechargeResponse> {
    const params: Record<string, string | number> = {};
    if (targetDate !== undefined) params.target_date = targetDate;
    if (dailyUnits !== undefined) params.daily_units = dailyUnits;
    const response = await this.client.get<RechargeResponse>(`/recharge-needed/${caseId}`, { params });
    return response.data;
  }

  async getHabitComparison(caseId: string): Promise<ComparisonEntry[]> {
    const response = await this.client.get<ComparisonEntry[]>(`/comparison/${caseId}`);
    return response.data;
  }

  async getMonthlyComparison(caseId: string): Promise<MonthlyComparisonEntry[]> {
    const response = await this.client.get<MonthlyComparisonEntry[]>(`/comparison-monthly/${caseId}`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
