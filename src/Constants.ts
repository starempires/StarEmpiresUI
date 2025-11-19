// Constants.ts

// Basic numerical and string constants
export const SQRT_THREE: number = Math.sqrt(3);
export const RADIUS: number = 35;
export const SHORT_SIDE: number = RADIUS / 2;
export const LONG_SIDE: number = (SQRT_THREE * RADIUS) / 2;
export const PROHIBITION_COLOR: string = "orange";
export const PROHIBITION_LINE_OFFSET: number = 3;
export const COORDS_FONT_SIZE: number = 10;
export const COORDS_FONT_FAMILY: string = "Arial Rounded";
export const COORDS_COLOR_UNKNOWN: string = "white";
export const COORDS_COLOR_KNOWN: string = "black";
export const WORLD_RADIUS: number = 15;
export const PRODUCTION_COLOR: string = "#333333";
export const WORLD_BORDER_COLOR: string = "black";
export const WORLD_BORDER_DASH_PATTERN: number[] = [10, 5];
export const UNIDENTIFIED_SHIPS_COLOR: string = "black";
export const PORTAL_COLOR: string = "orange";
export const CONNECTION_COLOR: string = "orange";
export const INFO_HOVER_X_OFFSET: number = 20;
export const INFO_HOVER_Y_OFFSET: number = -10;
export const INFO_HOVER_BACKGROUND_COLOR: string = "lightgrey";
export const INFO_HOVER_TEXT_COLOR: string = "black";
export const INFO_HOVER_FONT_SIZE: number = 10;
export const INFO_HOVER_FONT_FAMILY: string = "Calibri";
export const SHIP_DOT_SIZE: number = 5;
export const DEFAULT_DESIGN_MULTIPLIER = 0.5;
export const DEFAULT_AUTO_REPAIR_MULTIPLIER = 0.1;

// Enums defined as constant objects with literal types
export const SCAN_STATUS_TYPE = {
  Visible: "visible",
  Scanned: "scanned",
  Stale: "stale",
  Unknown: "unknown",
} as const;
export type ScanStatusType = typeof SCAN_STATUS_TYPE[keyof typeof SCAN_STATUS_TYPE];

export const PROHIBITION_TYPE = {
  Blockaded: "blockaded",
  Interdicted: "interdicted",
} as const;
export type ProhibitionType = typeof PROHIBITION_TYPE[keyof typeof PROHIBITION_TYPE];

export const BORDER_TYPE = {
  Regular: "regular",
  Nebula: "nebula",
  Storm: "storm",
} as const;
export type BorderType = typeof BORDER_TYPE[keyof typeof BORDER_TYPE];

export const ORDER_TYPE = {
  Load: "load",
  Unload: "unload",
} as const;
export type OrderType = typeof ORDER_TYPE[keyof typeof ORDER_TYPE];

// Color maps
export const BORDER_TYPE_COLOR_MAP: Map<BorderType, string> = new Map([
  [BORDER_TYPE.Regular, "black"],
  [BORDER_TYPE.Nebula, "mediumblue"],
  [BORDER_TYPE.Storm, "red"],
]);

export const SECTOR_STATUS_COLOR_MAP: Map<ScanStatusType, string> = new Map([
  [SCAN_STATUS_TYPE.Visible, "white"],
  [SCAN_STATUS_TYPE.Scanned, "lightgrey"],
  [SCAN_STATUS_TYPE.Stale, "grey"],
  [SCAN_STATUS_TYPE.Unknown, "black"],
]);

export const COORDS_STATUS_COLOR_MAP: Map<ScanStatusType, string> = new Map([
  [SCAN_STATUS_TYPE.Visible, "black"],
  [SCAN_STATUS_TYPE.Scanned, "black"],
  [SCAN_STATUS_TYPE.Stale, "black"],
  [SCAN_STATUS_TYPE.Unknown, "white"],
]);

// Recursive function to calculate the number of X positions.
export function getXCount(column: number): number {
  if (column < 2) {
    return column + 1;
  } else {
    return getXCount(column - 2) + 3;
  }
}

// Given a radius, oblique, and y coordinate, computes the corresponding x and y positions
// for the "top-middle" of the hex
// Returns a tuple with both values rounded to the nearest integers.
export function coordsToPosition(radius: number, oblique: number, y: number): [number, number] {
  const cols: number = 2 * radius + 1;
  const row: number = -2 * y + oblique + 2 * radius;
  const column: number = oblique + Math.floor(cols / 2);
  const xpos: number = getXCount(column) * RADIUS + (column % 2) * SHORT_SIDE;
  const ypos: number = (row + 1) * LONG_SIDE;
  return [Math.round(xpos), Math.round(ypos)];
}

// Returns a unique key for a given oblique and y coordinate.
export function getCoordinateKey(oblique: number, y: number): string {
  return `${oblique < 0 ? "n" : ""}${Math.abs(oblique)}_${y < 0 ? "n" : ""}${Math.abs(y)}`;
}