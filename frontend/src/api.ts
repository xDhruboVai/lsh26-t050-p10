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
  slab_penalty: string;
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

interface AnalysisResponse {
  details: CaseDetails;
  timeline: TimelineEntry[];
  run_out: RunOutResponse;
  recharge: RechargeResponse;
  comparison: ComparisonEntry[];
  monthly_comparison: MonthlyComparisonEntry[];
}

interface StoredUpload {
  case: Record<string, unknown>;
  item: CaseListItem;
}

const UPLOADS_KEY = 'p10-uploaded-cases-v1';

class ApiClient {
  private client: AxiosInstance;
  private analysisCache = new Map<string, Promise<AnalysisResponse>>();

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
    const uploads = this.readUploads();
    let builtIn: CaseListItem[] = [];
    try {
      const response = await this.client.get<CaseListItem[]>('/cases');
      builtIn = response.data;
    } catch (error) {
      if (Object.keys(uploads).length === 0) throw error;
    }
    const merged = new Map(builtIn.map((item) => [item.case_id, item]));
    Object.values(uploads).forEach(({ item }) => merged.set(item.case_id, item));
    return [...merged.values()].sort((a, b) => a.case_id.localeCompare(b.case_id));
  }

  async uploadCase(content: string): Promise<CaseListItem[]> {
    const document = JSON.parse(content) as Record<string, unknown>;
    const rawCases = Array.isArray(document.cases)
      ? document.cases
      : [document];
    const response = await this.client.post<CaseListItem[]>('/cases/upload', document);
    const uploads = this.readUploads();
    response.data.forEach((item) => {
      const raw = rawCases.find((candidate) =>
        candidate && typeof candidate === 'object' &&
        String((candidate as Record<string, unknown>).case_id) === item.case_id
      );
      if (!raw || typeof raw !== 'object') {
        throw new Error(`Uploaded case ${item.case_id} was not found in the JSON document.`);
      }
      uploads[item.case_id] = {
        case: raw as Record<string, unknown>,
        item,
      };
      this.clearAnalysis(item.case_id);
    });
    this.writeUploads(uploads);
    return response.data;
  }

  async getCaseDetails(caseId: string): Promise<CaseDetails> {
    const analysis = await this.analyze(caseId);
    if (analysis) return analysis.details;
    const response = await this.client.get<CaseDetails>(`/cases/${caseId}`);
    return response.data;
  }

  async getTimeline(caseId: string): Promise<TimelineEntry[]> {
    const analysis = await this.analyze(caseId);
    if (analysis) return analysis.timeline;
    const response = await this.client.get<TimelineEntry[]>(`/timeline/${caseId}`);
    return response.data;
  }

  async getRunOut(caseId: string, dailyUnits?: number): Promise<RunOutResponse> {
    const analysis = await this.analyze(caseId, dailyUnits);
    if (analysis) return analysis.run_out;
    const response = await this.client.get<RunOutResponse>(`/run-out/${caseId}`, { params: dailyUnits === undefined ? {} : { daily_units: dailyUnits } });
    return response.data;
  }

  async getRechargeNeeded(caseId: string, targetDate?: string, dailyUnits?: number): Promise<RechargeResponse> {
    const analysis = await this.analyze(caseId, dailyUnits, targetDate);
    if (analysis) return analysis.recharge;
    const params: Record<string, string | number> = {};
    if (targetDate !== undefined) params.target_date = targetDate;
    if (dailyUnits !== undefined) params.daily_units = dailyUnits;
    const response = await this.client.get<RechargeResponse>(`/recharge-needed/${caseId}`, { params });
    return response.data;
  }

  async getHabitComparison(caseId: string): Promise<ComparisonEntry[]> {
    const analysis = await this.analyze(caseId);
    if (analysis) return analysis.comparison;
    const response = await this.client.get<ComparisonEntry[]>(`/comparison/${caseId}`);
    return response.data;
  }

  async getMonthlyComparison(caseId: string): Promise<MonthlyComparisonEntry[]> {
    const analysis = await this.analyze(caseId);
    if (analysis) return analysis.monthly_comparison;
    const response = await this.client.get<MonthlyComparisonEntry[]>(`/comparison-monthly/${caseId}`);
    return response.data;
  }

  private readUploads(): Record<string, StoredUpload> {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem(UPLOADS_KEY) ?? '{}') as Record<string, StoredUpload>;
    } catch {
      return {};
    }
  }

  private writeUploads(uploads: Record<string, StoredUpload>) {
    localStorage.setItem(UPLOADS_KEY, JSON.stringify(uploads));
  }

  private clearAnalysis(caseId: string) {
    for (const key of this.analysisCache.keys()) {
      if (key.startsWith(`${caseId}|`)) this.analysisCache.delete(key);
    }
  }

  private analyze(
    caseId: string,
    dailyUnits?: number,
    targetDate?: string,
  ): Promise<AnalysisResponse | null> {
    const uploaded = this.readUploads()[caseId];
    if (!uploaded) return Promise.resolve(null);

    const key = `${caseId}|${dailyUnits ?? ''}|${targetDate ?? ''}`;
    const existing = this.analysisCache.get(key);
    if (existing) return existing;

    const request = this.client.post<AnalysisResponse>('/analyze', {
      case: uploaded.case,
      daily_units: dailyUnits,
      target_date: targetDate,
    }).then((response) => response.data).catch((error) => {
      this.analysisCache.delete(key);
      throw error;
    });
    this.analysisCache.set(key, request);
    return request;
  }
}

export const apiClient = new ApiClient();
