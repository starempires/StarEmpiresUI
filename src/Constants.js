export const SQRT_THREE = Math.sqrt(3);
export const RADIUS = 35;
export const SHORT_SIDE = RADIUS / 2;
export const LONG_SIDE = SQRT_THREE * RADIUS /2;
export const PROHIBITION_COLOR = "orange";
export const PROHIBITION_LINE_OFFSET = 3;
export const COORDS_FONT_SIZE = 10;
export const COORDS_FONT_FAMILY = "Arial Rounded";
export const COORDS_COLOR_UNKNOWN = "white";
export const COORDS_COLOR_KNOWN = "black";
export const WORLD_RADIUS = 15;
export const PRODUCTION_COLOR = "#333333";
export const WORLD_BORDER_COLOR = "black";
export const WORLD_BORDER_DASH_PATTERN = [10,5];
export const UNIDENTIFIED_SHIPS_COLOR = "black";
export const PORTAL_COLOR = "orange";
export const CONNECTION_COLOR = "orange";
export const INFO_HOVER_OFFSET = 20;
export const INFO_HOVER_BACKGROUND_COLOR = "lightgrey";
export const INFO_HOVER_TEXT_COLOR = "black";
export const INFO_HOVER_FONT_SIZE = 10;
export const INFO_HOVER_FONT_FAMILY = "Calibri";
export const SHIP_DOT_SIZE = 5;

// enums
export const SCAN_STATUS_TYPE = {
   Visible: "visible",
   Scanned: "scanned",
   Stale: "stale",
   Unknown: "unknown"
}

export const PROHIBITION_TYPE = {
   Blockaded: "blockaded",
   Interdicted: "interdicted"
}

export const BORDER_TYPE = {
   Regular: "regular",
   Nebula: "nebula",
   Storm: "storm"
}

export const ORDER_TYPE = {
   Load: "load",
   Unload: "unload",
}

// color maps
export const BORDER_TYPE_COLOR_MAP = new Map([
   [BORDER_TYPE.Regular, "black"],
   [BORDER_TYPE.Nebula, "mediumblue"],
   [BORDER_TYPE.Storm, "red"]
]);

export const SECTOR_STATUS_COLOR_MAP = new Map([
   [SCAN_STATUS_TYPE.Visible, "white"],
   [SCAN_STATUS_TYPE.Scanned, "lightgrey"],
   [SCAN_STATUS_TYPE.Stale, "grey"],
   [SCAN_STATUS_TYPE.Unknown, "black"],
]);

export const COORDS_STATUS_COLOR_MAP = new Map([
   [SCAN_STATUS_TYPE.Visible, "black"],
   [SCAN_STATUS_TYPE.Scanned, "black"],
   [SCAN_STATUS_TYPE.Stale, "black"],
   [SCAN_STATUS_TYPE.Unknown, "white"],
]);

export function getXCount(column) {
      if (column < 2) {
        return column + 1;
      } else {
        return getXCount(column - 2) + 3;
      }
  }

export function coordsToPosition(radius, oblique, y) {
     var cols = 2 * radius + 1;
     var row = -2 * y + oblique + 2 * radius;
     var column = oblique + Math.floor(cols / 2);
     var xpos = getXCount(column) * RADIUS + (column % 2) * SHORT_SIDE;
     var ypos = (row +1) * LONG_SIDE;
     return [xpos, ypos];
}

export function getCoordinateKey(oblique, y) {
     const key = (oblique < 0 ? "n" : "") + Math.abs(oblique) + "_" + (y < 0 ? "n" : "") + Math.abs(y);
     return key;
}
