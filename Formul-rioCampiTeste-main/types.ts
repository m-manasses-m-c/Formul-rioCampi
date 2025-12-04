
export interface Campus {
  id: number | string;
  name: string;
  ictName: string;
}

export interface SelectedCampus extends Campus {
  addedAt: string;
}

export interface IctConfig {
  id: number;
  icts: string[];
  campi: Campus[];
  updated_at?: string;
}

export interface FormConfig {
  id: string; // UUID
  created_at: string;
  title: string; // Ex: Registro de ICTs
  edict_name: string; // Ex: Trilha Brasil Inovador
  is_active: boolean;
}

export interface Submission {
  id: number;
  created_at: string;
  name: string;
  email: string;
  phone: string; // New field
  ict: string;
  campi: Campus[];
  form_config_id?: string; // Link to specific form version
}

// New Dynamic Structure Types
export interface DateCategory {
  id: string;
  name: string;
  color: string; // Tailwind classes
}

export interface CampusEvent {
  id: string;
  categoryId: string;
  startDate: string;
  endDate: string;
}

export interface CalendarDataWrapper {
  version: number;
  categories: DateCategory[];
  events: Record<string, CampusEvent[]>; // key is campus.id
}

// Legacy type support for migration (internal use mostly, but good to keep reference)
export interface LegacyCampusDateConfig {
  recessStart: string;
  recessEnd: string;
  vacStart: string;
  vacEnd: string;
}

export interface DayStats {
  ratio: number;
  events: { category: DateCategory, count: number, campusNames: string[] }[]; // Aggregated events for the day
  heatClass: string;
}

export interface CalendarDay {
  day: number | string;
  date: string;
  empty: boolean;
  stats: DayStats;
}

export interface CalendarMonth {
  name: string;
  days: CalendarDay[];
}

export type ViewState = 'form' | 'success' | 'adminLogin' | 'dashboard';
export type AdminTab = 'charts' | 'calendar' | 'config' | 'forms';
