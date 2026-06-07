// Hand-authored DB types for MVP. In production, regenerate with:
//   supabase gen types typescript --local > src/types/database.types.ts
// Keep in sync with supabase/migrations.

export type UserRole = "customer" | "worker";
export type WorkerStatus = "pending" | "approved" | "rejected" | "suspended";
export type LocationType = "city" | "commune" | "quartier";
export type ReviewStatus = "pending" | "published" | "rejected";
export type PhotoType = "portfolio" | "avatar" | "verification";
export type LeadChannel = "whatsapp" | "call" | "form";
export type LeadStatus = "new" | "contacted" | "converted" | "lost";
export type JobStatus = "open" | "assigned" | "closed" | "cancelled";
export type AdminRole = "super_admin" | "moderator" | "support";

export interface ProfessionRow {
  id: string;
  slug: string;
  name_fr: string;
  name_sw: string | null;
  name_en: string | null;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationRow {
  id: string;
  slug: string;
  name: string;
  type: LocationType;
  parent_id: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkerRow {
  id: string;
  user_id: string;
  profession_id: string;
  location_id: string;
  headline: string;
  bio: string | null;
  years_experience: number | null;
  service_areas: string[] | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  whatsapp_number: string;
  status: WorkerStatus;
  rejection_reason: string | null;
  rating_avg: number;
  rating_count: number;
  lead_count: number;
  is_featured: boolean;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkerPhotoRow {
  id: string;
  worker_id: string;
  cloudinary_public_id: string;
  url: string;
  type: PhotoType;
  caption: string | null;
  width: number | null;
  height: number | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ReviewRow {
  id: string;
  worker_id: string;
  author_user_id: string | null;
  author_name: string;
  author_phone: string | null;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  job_request_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LeadRow {
  id: string;
  worker_id: string;
  customer_user_id: string | null;
  channel: LeadChannel;
  source_page: string | null;
  customer_phone: string | null;
  message: string | null;
  status: LeadStatus;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AdminUserRow {
  id: string;
  full_name: string;
  email: string;
  admin_role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}
