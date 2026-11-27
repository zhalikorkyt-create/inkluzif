export type Level = "independent" | "assisted" | "notyet";

export const LEVEL_LABEL: Record<Level, string> = {
  independent: "Өз бетімен",
  assisted: "Көмекпен",
  notyet: "Әзірге жоқ",
};

export interface Profile {
  id: string;
  code: string; // ойдан шығарылған код, мыс. "О-01"
  goal: string;
  supports: string[];
  selected: boolean;
}

export interface Draft {
  id: string;
  profileId: string;
  title: string;
  text: string;
  source: "upload" | "paste" | "template";
  approved: boolean;
  createdAt: string;
}

export interface Entry {
  id: string;
  profileId: string;
  draftId?: string;
  date: string; // ISO
  task: string;
  level: Level;
  note: string;
}

export interface Report {
  id: string;
  profileId: string;
  entryId: string;
  text: string;
  status: "draft" | "queued";
  createdAt: string;
}

export interface State {
  profiles: Profile[];
  drafts: Draft[];
  entries: Entry[];
  reports: Report[];
}
