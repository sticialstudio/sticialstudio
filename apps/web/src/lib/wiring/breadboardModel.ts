import type { BreadboardZone } from '@/lib/wiring/mountingTypes';

export const BREADBOARD_CONFIG = {
  width: 652.8,
  height: 201.6,
  columns: 63,
  holeSpacingX: 9.6,
  holeSpacingY: 9.6,
  startX: 28.8,
  startY: 19.2,
} as const;

export interface BreadboardAnchor {
  x: number;
  y: number;
}

export interface BreadboardNodeEntry extends BreadboardAnchor {
  anchorId: string;
  nodeId: string;
  kind: 'rail' | 'strip';
  column: number;
  row: string;
  zone: BreadboardZone;
}

const TOP_STRIP_ROWS = ['A', 'B', 'C', 'D', 'E'] as const;
const BOTTOM_STRIP_ROWS = ['F', 'G', 'H', 'I', 'J'] as const;
const RAIL_ROWS = [
  ['RAIL_TOP_MINUS', 'rail-top-minus'],
  ['RAIL_TOP_PLUS', 'rail-top-plus'],
  ['RAIL_BOT_PLUS', 'rail-bot-plus'],
  ['RAIL_BOT_MINUS', 'rail-bot-minus'],
] as const;

let cachedAnchors: Record<string, BreadboardAnchor> | null = null;
let cachedNodeEntries: BreadboardNodeEntry[] | null = null;
let cachedContinuityEdges: Array<[string, string]> | null = null;

export function toBreadboardNodeId(anchorId: string) {
  return anchorId.startsWith('BB_') ? anchorId : `BB_${anchorId}`;
}

export function isBreadboardNodeId(nodeId: string) {
  return nodeId.startsWith('BB_RAIL_') || nodeId.startsWith('BB_STRIP_');
}

export function getBreadboardZoneForEntry(entry: Pick<BreadboardNodeEntry, 'kind' | 'row'>): BreadboardZone {
  if (entry.kind === 'rail') {
    return entry.row.startsWith('TOP') ? 'rail-top' : 'rail-bottom';
  }

  return TOP_STRIP_ROWS.includes(entry.row as (typeof TOP_STRIP_ROWS)[number]) ? 'strip-top' : 'strip-bottom';
}

export function generateBreadboardLocalAnchors(): Record<string, BreadboardAnchor> {
  if (cachedAnchors) {
    return cachedAnchors;
  }

  const anchors: Record<string, BreadboardAnchor> = {};
  const { columns, holeSpacingX, holeSpacingY, startX, startY } = BREADBOARD_CONFIG;
  const bottomRailStartY = startY + 16 * holeSpacingY;
  const stripAStartY = startY + 3 * holeSpacingY;
  const stripFStartY = startY + 10 * holeSpacingY;

  for (let col = 1; col <= columns; col += 1) {
    const localX = startX + (col - 1) * holeSpacingX;

    anchors[`RAIL_TOP_MINUS_${col}`] = { x: localX, y: startY };
    anchors[`RAIL_TOP_PLUS_${col}`] = { x: localX, y: startY + holeSpacingY };
    anchors[`RAIL_BOT_PLUS_${col}`] = { x: localX, y: bottomRailStartY };
    anchors[`RAIL_BOT_MINUS_${col}`] = { x: localX, y: bottomRailStartY + holeSpacingY };

    TOP_STRIP_ROWS.forEach((rowLetter, rowIndex) => {
      anchors[`STRIP_${col}_${rowLetter}`] = {
        x: localX,
        y: stripAStartY + rowIndex * holeSpacingY,
      };
    });

    BOTTOM_STRIP_ROWS.forEach((rowLetter, rowIndex) => {
      anchors[`STRIP_${col}_${rowLetter}`] = {
        x: localX,
        y: stripFStartY + rowIndex * holeSpacingY,
      };
    });
  }

  cachedAnchors = anchors;
  return anchors;
}

export function getBreadboardNodeEntries(): BreadboardNodeEntry[] {
  if (cachedNodeEntries) {
    return cachedNodeEntries;
  }

  const anchors = generateBreadboardLocalAnchors();
  const entries: BreadboardNodeEntry[] = [];

  Object.entries(anchors).forEach(([anchorId, anchor]) => {
    const railMatch = anchorId.match(/^RAIL_(TOP|BOT)_(PLUS|MINUS)_(\d+)$/);
    if (railMatch) {
      const entry: BreadboardNodeEntry = {
        anchorId,
        nodeId: toBreadboardNodeId(anchorId),
        kind: 'rail',
        column: Number(railMatch[3]),
        row: `${railMatch[1]}_${railMatch[2]}`,
        zone: railMatch[1] === 'TOP' ? 'rail-top' : 'rail-bottom',
        x: anchor.x,
        y: anchor.y,
      };
      entries.push(entry);
      return;
    }

    const stripMatch = anchorId.match(/^STRIP_(\d+)_([A-J])$/);
    if (stripMatch) {
      const entry: BreadboardNodeEntry = {
        anchorId,
        nodeId: toBreadboardNodeId(anchorId),
        kind: 'strip',
        column: Number(stripMatch[1]),
        row: stripMatch[2],
        zone: TOP_STRIP_ROWS.includes(stripMatch[2] as (typeof TOP_STRIP_ROWS)[number]) ? 'strip-top' : 'strip-bottom',
        x: anchor.x,
        y: anchor.y,
      };
      entries.push(entry);
    }
  });

  cachedNodeEntries = entries;
  return entries;
}

export function getBreadboardContinuityEdges(): Array<[string, string]> {
  if (cachedContinuityEdges) {
    return cachedContinuityEdges;
  }

  const edges: Array<[string, string]> = [];

  for (const [railPrefix] of RAIL_ROWS) {
    for (let col = 1; col < BREADBOARD_CONFIG.columns; col += 1) {
      edges.push([
        toBreadboardNodeId(`${railPrefix}_${col}`),
        toBreadboardNodeId(`${railPrefix}_${col + 1}`),
      ]);
    }
  }

  for (let col = 1; col <= BREADBOARD_CONFIG.columns; col += 1) {
    for (let index = 0; index < TOP_STRIP_ROWS.length - 1; index += 1) {
      edges.push([
        toBreadboardNodeId(`STRIP_${col}_${TOP_STRIP_ROWS[index]}`),
        toBreadboardNodeId(`STRIP_${col}_${TOP_STRIP_ROWS[index + 1]}`),
      ]);
    }

    for (let index = 0; index < BOTTOM_STRIP_ROWS.length - 1; index += 1) {
      edges.push([
        toBreadboardNodeId(`STRIP_${col}_${BOTTOM_STRIP_ROWS[index]}`),
        toBreadboardNodeId(`STRIP_${col}_${BOTTOM_STRIP_ROWS[index + 1]}`),
      ]);
    }
  }

  cachedContinuityEdges = edges;
  return edges;
}
