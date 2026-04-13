import { BOARD_CONFIG, type BoardConfigItem } from '@/lib/boards/boardConfig';
import type { BoardKey } from '@/contexts/BoardContext';
import { BLOCK_REGISTRY, type BlockSupportMetadata, type GeneratorId } from '@/lib/blockly/registry';

export type { BlockSupportMetadata, GeneratorId };

export const BLOCK_SUPPORT_MATRIX: Record<string, BlockSupportMetadata> = Object.fromEntries(
  Object.entries(BLOCK_REGISTRY).map(([type, entry]) => [
    type,
    {
      supportedBoards: entry.supportedBoards,
      generators: entry.generators,
      category: entry.category,
    },
  ])
);

function matchesBoardFamily(candidate: string, boardConfig: BoardConfigItem) {
  return candidate === boardConfig.family;
}

function matchesBoardKey(candidate: string, boardKey: BoardKey) {
  return candidate === boardKey;
}

export function isBlockSupportedForBoard(blockType: string, boardKey: BoardKey) {
  const metadata = BLOCK_SUPPORT_MATRIX[blockType];
  if (!metadata) return true;

  const boardConfig = BOARD_CONFIG[boardKey];
  if (!boardConfig) return true;

  const supportsBoard =
    metadata.supportedBoards.includes('all') ||
    metadata.supportedBoards.some((candidate) => matchesBoardFamily(candidate, boardConfig) || matchesBoardKey(candidate, boardKey));

  const supportsGenerator = metadata.generators.includes(boardConfig.generator as GeneratorId);

  return supportsBoard && supportsGenerator;
}
