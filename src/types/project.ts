export interface Hotspot {
  id: string;
  name: string;
  label: string;
  url: string;
  targetBlank: boolean;
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  imageBase64: string; // We'll store it as data URL
  hotspots: Hotspot[];
  createdAt: number;
  updatedAt: number;
}
