import * as Blockly from 'blockly';
import type { ThemeMode } from '@/contexts/ThemeContext';

const blockStyles = {
  logic_blocks: {
    colourPrimary: '#6F7DFF',
    colourSecondary: '#5B68DD',
    colourTertiary: '#4752B6',
  },
  math_blocks: {
    colourPrimary: '#4DB58F',
    colourSecondary: '#3E9776',
    colourTertiary: '#31755B',
  },
  loop_blocks: {
    colourPrimary: '#F0A44B',
    colourSecondary: '#D88E37',
    colourTertiary: '#B87424',
  },
  text_blocks: {
    colourPrimary: '#54A9C2',
    colourSecondary: '#418AA0',
    colourTertiary: '#336B7B',
  },
  io_blocks: {
    colourPrimary: '#EE7B72',
    colourSecondary: '#D7655C',
    colourTertiary: '#B94E46',
  },
  timing_blocks: {
    colourPrimary: '#DAB25A',
    colourSecondary: '#C39A46',
    colourTertiary: '#9F7C34',
  },
  setup_blocks: {
    colourPrimary: '#9373F7',
    colourSecondary: '#7A5DDA',
    colourTertiary: '#5F46B5',
  },
  sensor_blocks: {
    colourPrimary: '#C0488A',
    colourSecondary: '#A13A73',
    colourTertiary: '#7B2C58',
  },
  motor_blocks: {
    colourPrimary: '#D35B73',
    colourSecondary: '#B54A61',
    colourTertiary: '#8E374A',
  },
  actuator_blocks: {
    colourPrimary: '#CD6578',
    colourSecondary: '#B35567',
    colourTertiary: '#8D4150',
  },
  comm_blocks: {
    colourPrimary: '#D86B43',
    colourSecondary: '#B95835',
    colourTertiary: '#904327',
  },
  light_blocks: {
    colourPrimary: '#9F41DE',
    colourSecondary: '#8534BC',
    colourTertiary: '#652892',
  },
  display_blocks: {
    colourPrimary: '#5E31A6',
    colourSecondary: '#4D2788',
    colourTertiary: '#3B1E68',
  },
  output_blocks: {
    colourPrimary: '#6F66F5',
    colourSecondary: '#5B54D1',
    colourTertiary: '#4540A6',
  },
} as const;

const categoryStyles = {
  logic_category: { colour: '#6F7DFF' },
  math_category: { colour: '#4DB58F' },
  loop_category: { colour: '#F0A44B' },
  text_category: { colour: '#54A9C2' },
  io_category: { colour: '#EE7B72' },
  timing_category: { colour: '#DAB25A' },
  setup_category: { colour: '#9373F7' },
  sensors_category: { colour: '#C0488A' },
  motion_category: { colour: '#D35B73' },
  messaging_category: { colour: '#D86B43' },
  color_category: { colour: '#9F41DE' },
  displays_category: { colour: '#5E31A6' },
} as const;

const blocklyThemePalette: Record<ThemeMode, { componentStyles: Blockly.Theme.ComponentStyle; gridColour: string }> = {
  light: {
    componentStyles: {
      workspaceBackgroundColour: '#EEF2FF',
      toolboxBackgroundColour: '#243789',
      toolboxForegroundColour: '#F8FAFF',
      flyoutBackgroundColour: '#F7F4FF',
      flyoutForegroundColour: '#1F2937',
      flyoutOpacity: 1,
      scrollbarColour: '#6977C8',
      insertionMarkerColour: '#3047A6',
      insertionMarkerOpacity: 0.28,
      scrollbarOpacity: 0.52,
      cursorColour: '#3047A6',
    },
    gridColour: 'rgba(48, 71, 166, 0.24)',
  },
  dark: {
    componentStyles: {
      workspaceBackgroundColour: '#151329',
      toolboxBackgroundColour: '#111226',
      toolboxForegroundColour: '#F8F4FF',
      flyoutBackgroundColour: '#18152C',
      flyoutForegroundColour: '#F8F4FF',
      flyoutOpacity: 1,
      scrollbarColour: '#6C7CF7',
      insertionMarkerColour: '#7F96FF',
      insertionMarkerOpacity: 0.34,
      scrollbarOpacity: 0.55,
      cursorColour: '#7F96FF',
    },
    gridColour: 'rgba(181, 165, 255, 0.32)',
  },
  magma: {
    componentStyles: {
      workspaceBackgroundColour: '#23120F',
      toolboxBackgroundColour: '#2C1916',
      toolboxForegroundColour: '#FFF1EB',
      flyoutBackgroundColour: '#3B221C',
      flyoutForegroundColour: '#FFF1EB',
      flyoutOpacity: 1,
      scrollbarColour: '#E28D37',
      insertionMarkerColour: '#F97316',
      insertionMarkerOpacity: 0.3,
      scrollbarOpacity: 0.55,
      cursorColour: '#F97316',
    },
    gridColour: 'rgba(249, 115, 22, 0.26)',
  },
};

const blocklyThemes: Record<ThemeMode, Blockly.Theme> = {
  light: Blockly.Theme.defineTheme('edtech-light', {
    name: 'edtech-light',
    base: Blockly.Themes.Zelos,
    blockStyles,
    categoryStyles,
    componentStyles: blocklyThemePalette.light.componentStyles,
    fontStyle: {
      family: 'Segoe UI, Inter, sans-serif',
      weight: '600',
      size: 12,
    },
    startHats: true,
  }),
  dark: Blockly.Theme.defineTheme('edtech-dark', {
    name: 'edtech-dark',
    base: Blockly.Themes.Zelos,
    blockStyles,
    categoryStyles,
    componentStyles: blocklyThemePalette.dark.componentStyles,
    fontStyle: {
      family: 'Segoe UI, Inter, sans-serif',
      weight: '600',
      size: 12,
    },
    startHats: true,
  }),
  magma: Blockly.Theme.defineTheme('edtech-magma', {
    name: 'edtech-magma',
    base: Blockly.Themes.Zelos,
    blockStyles,
    categoryStyles,
    componentStyles: blocklyThemePalette.magma.componentStyles,
    fontStyle: {
      family: 'Segoe UI, Inter, sans-serif',
      weight: '600',
      size: 12,
    },
    startHats: true,
  }),
};

export function getBlocklyTheme(theme: ThemeMode) {
  return blocklyThemes[theme];
}

export function getBlocklyGridColor(theme: ThemeMode) {
  return blocklyThemePalette[theme].gridColour;
}

export const edtechTheme = blocklyThemes.dark;

