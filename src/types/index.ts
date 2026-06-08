import type {
  WorkerRow,
  ProfessionRow,
  LocationRow,
  WorkerPhotoRow,
  ReviewRow,
} from "./database.types";

// Composed view used on listing/profile pages
export interface WorkerWithRelations extends WorkerRow {
  profession: Pick<ProfessionRow, "id" | "slug" | "name_fr" | "name_sw" | "icon"> | null;
  location: Pick<LocationRow, "id" | "slug" | "name" | "type"> | null;
  photos?: WorkerPhotoRow[];
  reviews?: ReviewRow[];
}

export interface SearchParams {
  profession?: string; // profession slug
  commune?: string; // commune slug
  quartier?: string; // quartier slug
  q?: string; // keyword
  page?: string;
}

export interface QuartierNode {
  id: string;
  slug: string;
  name: string;
}

export interface CommuneNode {
  id: string;
  slug: string;
  name: string;
  quartiers: QuartierNode[];
}
