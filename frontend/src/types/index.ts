export type UserRole = "shipping_company" | "verifier" | "ministry";

export type ReportStatus =
  | "draft"
  | "submitted"
  | "under_verification"
  | "approved"
  | "rejected";

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface User {
  id: number;
  email: string;
  role: UserRole;
  full_name: string;
  company_name?: string;
  company_tax_id?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Ship {
  id: number;
  imo_number: string;
  name: string;
  flag: string;
  owner_id: number;
  registry_port?: string;
  ship_type?: string;
  gross_tonnage?: number;
  created_at: string;
  owner?: User;
}

export interface MonitoringPlan {
  id: number;
  ship_id: number;
  emission_sources: Record<string, unknown>[];
  fuel_methods: Record<string, unknown>[];
  procedures?: string;
  status: string;
  version: number;
  revision_log: Record<string, unknown>[];
  created_by: number;
  created_at: string;
  updated_at: string;
  ship?: Ship;
}

export interface EmissionReport {
  id: number;
  ship_id: number;
  voyage_data: Record<string, unknown>;
  fuel_consumption: Record<string, unknown>;
  ghg_emissions: Record<string, unknown>;
  status: ReportStatus;
  reporting_period_start: string;
  reporting_period_end: string;
  submitted_at?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  ship?: Ship;
}

export interface Verification {
  id: number;
  report_id: number;
  verifier_id: number;
  status: VerificationStatus;
  notes?: string;
  verified_at?: string;
  created_at: string;
  report?: EmissionReport;
  verifier?: User;
}

export interface ComplianceDocument {
  id: number;
  ship_id: number;
  issued_by: number;
  document_type: string;
  document_number: string;
  valid_from: string;
  valid_until: string;
  notes?: string;
  created_at: string;
  ship?: Ship;
  issuer?: User;
}

export interface DashboardStats {
  total_ships: number;
  total_reports: number;
  reports_by_status: Record<string, number>;
  total_verifications: number;
  total_compliance_docs: number;
  total_co2_mt: number;
}

export interface ShipReport {
  id: number;
  imo_number: string;
  ship_name: string;
  ship_type?: string;
  company?: string;
  reporting_period: number;
  co2_emissions?: number;
  co2eq_emissions?: number;
  report_coverage?: string;
  created_at: string;
}

export interface ShipReportList {
  items: ShipReport[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DatasetVersion {
  id: number;
  reporting_period: number;
  version: number;
  generation_date: string;
  file_name?: string;
  file_url?: string;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

// Turkish labels
export const ROLE_LABELS: Record<UserRole, string> = {
  shipping_company: "Denizcilik Şirketi",
  verifier: "Doğrulayıcı",
  ministry: "Bakanlık",
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Taslak",
  submitted: "Gönderildi",
  under_verification: "Doğrulamada",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

export const STATUS_COLORS: Record<ReportStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  under_verification: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

export const VERIFICATION_COLORS: Record<VerificationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};
