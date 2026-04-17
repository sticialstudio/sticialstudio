import type { FileItem } from '@/contexts/ProjectContext';
import type { WorkspaceSvg } from 'blockly';
import { BLOCK_TERMINAL_MAX_HEIGHT, BLOCK_TERMINAL_MIN_HEIGHT } from './constants';

export function getPreferredSourceFileName(language: string | null, generator: string | null) {
  if (language === 'python' || generator === 'micropython') {
    return 'main.py';
  }
  return 'main.cpp';
}

export function isLikelyBlocklyXml(content: string | null | undefined) {
  if (typeof content !== 'string') return false;

  const trimmed = content.trim();
  if (!trimmed) return true;

  const withoutDeclaration = trimmed.replace(/^<\?xml[\s\S]*?\?>\s*/i, '');
  return /^<xml(\s|>)/i.test(withoutDeclaration);
}

export function buildProjectFilePath(file: FileItem, filesById: Map<string, FileItem>) {
  const segments = [file.name];
  let parentId = file.parentId;

  while (parentId) {
    const parent = filesById.get(parentId);
    if (!parent) break;
    segments.unshift(parent.name);
    parentId = parent.parentId;
  }

  return segments.join('/');
}

export function encodeUtf8AsHex(content: string) {
  return Array.from(new TextEncoder().encode(content))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function getInitialStudioView(environment: string) {
  return environment === 'virtual' ? 'circuit' : 'code';
}

export function clampBlockTerminalHeight(height: number) {
  return Math.min(BLOCK_TERMINAL_MAX_HEIGHT, Math.max(BLOCK_TERMINAL_MIN_HEIGHT, height));
}

export function syncBlocklyWorkspaceSource(
  workspace: WorkspaceSvg | null,
  generatorType: string,
  currentSource: string,
  updateSource: (nextCode: string) => void,
  buildSourceCodeFromBlocklyWorkspace: (workspace: WorkspaceSvg, generatorType: string) => { code: string },
) {
  if (!workspace) {
    return currentSource;
  }

  const nextCode = buildSourceCodeFromBlocklyWorkspace(workspace, generatorType).code;
  if (nextCode !== currentSource) {
    updateSource(nextCode);
  }

  return nextCode;
}
