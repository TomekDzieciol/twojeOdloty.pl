export type AdGender = "male" | "female" | "couple";

export interface Profile {
  id: string;
  display_name: string | null;
  city: string | null;
  phone: string | null;
  birth_date: string | null;
  age_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ad {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  gender: AdGender;
  city: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile | null;
}

export interface ImageRecord {
  id: string;
  user_id: string;
  path: string;
  is_profile: boolean;
  sort_order: number;
  created_at: string;
}
