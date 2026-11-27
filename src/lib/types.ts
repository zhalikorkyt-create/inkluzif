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
  subject: string;
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

export const SUBJECTS = [
  { id: "math", name: "Математика", grade: "5-сынып", tone: "mint" },
  { id: "kaz", name: "Қазақ тілі", grade: "5-сынып", tone: "peach" },
] as const;

export const AVATARS = [
  { color: "#8fcbb5", shape: "rounded-md" },
  { color: "#efb98a", shape: "rounded-full" },
  { color: "#b9b0db", shape: "rounded-lg rotate-12" },
  { color: "#9cc3e6", shape: "rounded-full" },
  { color: "#e9a3a8", shape: "rounded-md rotate-45" },
];
export const avatarFor = (i: number) => AVATARS[i % AVATARS.length];
