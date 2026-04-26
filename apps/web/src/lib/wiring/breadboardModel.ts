import type { BreadboardSegment, BreadboardZone } from '@/lib/wiring/mountingTypes';

export const BREADBOARD_CONFIG = {
  width: 652.8,
  height: 201.6,
  columns: 63,
  holeSpacingX: 9.6,
  holeSpacingY: 9.6,
  startX: 28.8,
  startY: 19.2,
  railSplitAfterColumn: null as number | null,
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
  segment: BreadboardSegment;
  continuityGroupId: string;
}

export interface BreadboardContinuityGroup {
  id: string;
  kind: 'rail' | 'strip';
  row: string;
  zone: BreadboardZone;
  segment: BreadboardSegment;
  columnStart: number;
  columnEnd: number;
  anchorIds: string[];
  nodeIds: string[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const TOP_STRIP_ROWS = ['A', 'B', 'C', 'D', 'E'] as const;
const BOTTOM_STRIP_ROWS = ['F', 'G', 'H', 'I', 'J'] as const;
const RAIL_ROWS = [
  ['RAIL_TOP_MINUS', 'TOP_MINUS', 'rail-top'],
  ['RAIL_TOP_PLUS', 'TOP_PLUS', 'rail-top'],
  ['RAIL_BOT_PLUS', 'BOT_PLUS', 'rail-bottom'],
  ['RAIL_BOT_MINUS', 'BOT_MINUS', 'rail-bottom'],
] as const;

let cachedAnchors: Record<string, BreadboardAnchor> | null = null;
let cachedNodeEntries: BreadboardNodeEntry[] | null = null;
let cachedContinuityGroups: BreadboardContinuityGroup[] | null = null;
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

function toRailGroupId(rowKey: string, segment: BreadboardSegment) {
  return segment === 'full' ? `GROUP_${rowKey}` : `GROUP_${rowKey}_${segment.toUpperCase()}`;
}

function toStripGroupId(zone: BreadboardZone, column: number) {
  return `GROUP_${zone.toUpperCase().replace(/-/g, '_')}_${column}`;
}

function buildGroupBounds(anchorIds: string[], anchors: Record<string, BreadboardAnchor>, kind: 'rail' | 'strip') {
  const points = anchorIds.map((anchorId) => anchors[anchorId]).filter((anchor): anchor is BreadboardAnchor => Boolean(anchor));
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));

  const padX = kind === 'rail' ? BREADBOARD_CONFIG.holeSpacingX * 0.62 : BREADBOARD_CONFIG.holeSpacingX * 0.52;
  const padY = kind === 'rail' ? BREADBOARD_CONFIG.holeSpacingY * 0.76 : BREADBOARD_CONFIG.holeSpacingY * 0.54;

  return {
    x: minX - padX,
    y: minY - padY,
    width: maxX - minX + padX * 2,
    height: maxY - minY + padY * 2,
  };
}

function buildBreadboardData() {
  if (cachedAnchors && cachedNodeEntries && cachedContinuityGroups) {
    return {
      anchors: cachedAnchors,
      entries: cachedNodeEntries,
      groups: cachedContinuityGroups,
    };
  }

  const anchors: Record<string, BreadboardAnchor> = {};
  const entries: BreadboardNodeEntry[] = [];
  const groupSeed = new Map<
    string,
    Omit<BreadboardContinuityGroup, 'bounds' | 'nodeIds'>
  >();

  const { columns, holeSpacingX, holeSpacingY, startX, startY } = BREADBOARD_CONFIG;
  const bottomRailStartY = startY + 16 * holeSpacingY;
  const stripAStartY = startY + 3 * holeSpacingY;
  const stripFStartY = startY + 10 * holeSpacingY;

  const registerGroupAnchor = (
    groupId: string,
    kind: 'rail' | 'strip',
    row: string,
    zone: BreadboardZone,
    segment: BreadboardSegment,
    column: number,
    anchorId: string
  ) => {
    const existing = groupSeed.get(groupId);
    if (!existing) {
      groupSeed.set(groupId, {
        id: groupId,
        kind,
        row,
        zone,
        segment,
        columnStart: column,
        columnEnd: column,
        anchorIds: [anchorId],
      });
      return;
    }

    existing.anchorIds.push(anchorId);
    existing.columnStart = Math.min(existing.columnStart, column);
    existing.columnEnd = Math.max(existing.columnEnd, column);
  };

  for (let col = 1; col <= columns; col += 1) {
    const localX = startX + (col - 1) * holeSpacingX;
    const railSegment: BreadboardSegment = 'full';

    const railDefinitions = [
      {
        anchorId: `RAIL_TOP_MINUS_${col}`,
        y: startY,
        rowKey: 'TOP_MINUS',
        rowLabel: 'TOP_MINUS',
        zone: 'rail-top' as const,
      },
      {
        anchorId: `RAIL_TOP_PLUS_${col}`,
        y: startY + holeSpacingY,
        rowKey: 'TOP_PLUS',
        rowLabel: 'TOP_PLUS',
        zone: 'rail-top' as const,
      },
      {
        anchorId: `RAIL_BOT_PLUS_${col}`,
        y: bottomRailStartY,
        rowKey: 'BOT_PLUS',
        rowLabel: 'BOT_PLUS',
        zone: 'rail-bottom' as const,
      },
      {
        anchorId: `RAIL_BOT_MINUS_${col}`,
        y: bottomRailStartY + holeSpacingY,
        rowKey: 'BOT_MINUS',
        rowLabel: 'BOT_MINUS',
        zone: 'rail-bottom' as const,
      },
    ];

    railDefinitions.forEach((rail) => {
      anchors[rail.anchorId] = { x: localX, y: rail.y };
      const continuityGroupId = toRailGroupId(rail.rowKey, railSegment);
      entries.push({
        anchorId: rail.anchorId,
        nodeId: toBreadboardNodeId(rail.anchorId),
        kind: 'rail',
        column: col,
        row: rail.rowLabel,
        zone: rail.zone,
        segment: railSegment,
        continuityGroupId,
        x: localX,
        y: rail.y,
      });
      registerGroupAnchor(continuityGroupId, 'rail', rail.rowLabel, rail.zone, railSegment, col, rail.anchorId);
    });

    TOP_STRIP_ROWS.forEach((rowLetter, rowIndex) => {
      const anchorId = `STRIP_${col}_${rowLetter}`;
      const y = stripAStartY + rowIndex * holeSpacingY;
      anchors[anchorId] = { x: localX, y };
      const continuityGroupId = toStripGroupId('strip-top', col);
      entries.push({
        anchorId,
        nodeId: toBreadboardNodeId(anchorId),
        kind: 'strip',
        column: col,
        row: rowLetter,
        zone: 'strip-top',
        segment: 'full',
        continuityGroupId,
        x: localX,
        y,
      });
      registerGroupAnchor(continuityGroupId, 'strip', rowLetter, 'strip-top', 'full', col, anchorId);
    });

    BOTTOM_STRIP_ROWS.forEach((rowLetter, rowIndex) => {
      const anchorId = `STRIP_${col}_${rowLetter}`;
      const y = stripFStartY + rowIndex * holeSpacingY;
      anchors[anchorId] = { x: localX, y };
      const continuityGroupId = toStripGroupId('strip-bottom', col);
      entries.push({
        anchorId,
        nodeId: toBreadboardNodeId(anchorId),
        kind: 'strip',
        column: col,
        row: rowLetter,
        zone: 'strip-bottom',
        segment: 'full',
        continuityGroupId,
        x: localX,
        y,
      });
      registerGroupAnchor(continuityGroupId, 'strip', rowLetter, 'strip-bottom', 'full', col, anchorId);
    });
  }

  const groups = Array.from(groupSeed.values())
    .map((group) => ({
      ...group,
      nodeIds: group.anchorIds.map((anchorId) => toBreadboardNodeId(anchorId)),
      bounds: buildGroupBounds(group.anchorIds, anchors, group.kind),
    }))
    .sort((left, right) => {
      if (left.zone !== right.zone) {
        return left.zone.localeCompare(right.zone);
      }
      if (left.columnStart !== right.columnStart) {
        return left.columnStart - right.columnStart;
      }
      return left.id.localeCompare(right.id);
    });

  cachedAnchors = anchors;
  cachedNodeEntries = entries;
  cachedContinuityGroups = groups;

  return { anchors, entries, groups };
}

export function generateBreadboardLocalAnchors(): Record<string, BreadboardAnchor> {
  return buildBreadboardData().anchors;
}

export function getBreadboardNodeEntries(): BreadboardNodeEntry[] {
  return buildBreadboardData().entries;
}

export function getBreadboardContinuityGroups(): BreadboardContinuityGroup[] {
  return buildBreadboardData().groups;
}

export function getBreadboardContinuityEdges(): Array<[string, string]> {
  if (cachedContinuityEdges) {
    return cachedContinuityEdges;
  }

  const edges: Array<[string, string]> = [];
  getBreadboardContinuityGroups().forEach((group) => {
    for (let index = 0; index < group.nodeIds.length - 1; index += 1) {
      edges.push([group.nodeIds[index], group.nodeIds[index + 1]]);
    }
  });

  cachedContinuityEdges = edges;
  return edges;
}
