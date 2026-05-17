export interface ViewerSettings {
  pointSize: number;
  pointShape: "square" | "circle";
  opacity: number;
  colorMode: "vertex" | "uniform";
  uniformColor: string;
  backgroundColor: string;
  showAxes: boolean;
  showGrid: boolean;
}

export const defaultSettings: ViewerSettings = {
  pointSize: 0.05,
  pointShape: "circle",
  opacity: 1.0,
  colorMode: "vertex",
  uniformColor: "#ffffff",
  backgroundColor: "#18181b",
  showAxes: true,
  showGrid: true,
};
