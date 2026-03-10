import * as Blockly from 'blockly';

// defining our Scratch-inspired custom theme
export const edtechTheme = Blockly.Theme.defineTheme('edtech', {
    name: 'edtech',
    base: Blockly.Themes.Zelos, // Zelos provides the Scratch-like rounded corners and shapes
    blockStyles: {
        logic_blocks: {
            colourPrimary: '#5C81A6',
            colourSecondary: '#4A6885',
            colourTertiary: '#3A5269'
        },
        math_blocks: {
            colourPrimary: '#59C059',
            colourSecondary: '#469A46',
            colourTertiary: '#337333'
        },
        loop_blocks: {
            colourPrimary: '#FFAB19',
            colourSecondary: '#CC8914',
            colourTertiary: '#99670F'
        },
        text_blocks: {
            colourPrimary: '#5BA58C',
            colourSecondary: '#498470',
            colourTertiary: '#366354'
        },
        // Custom categories
        io_blocks: {
            colourPrimary: '#FF6680',
            colourSecondary: '#FF4D6A',
            colourTertiary: '#FF3355'
        },
        timing_blocks: {
            colourPrimary: '#FFBF00',
            colourSecondary: '#E6AC00',
            colourTertiary: '#CC9900'
        },
        setup_blocks: {
            colourPrimary: '#FF661A',
            colourSecondary: '#E65C17',
            colourTertiary: '#CC5214'
        }
    },
    categoryStyles: {
        logic_category: { colour: '#5C81A6' },
        math_category: { colour: '#59C059' },
        loop_category: { colour: '#FFAB19' },
        text_category: { colour: '#5BA58C' },
        io_category: { colour: '#FF6680' },
        timing_category: { colour: '#FFBF00' },
        setup_category: { colour: '#FF661A' }
    },
    componentStyles: {
        workspaceBackgroundColour: '#F8FAFC', // tailwind slate-50
        toolboxBackgroundColour: '#FFFFFF',
        toolboxForegroundColour: '#334155', // tailwind slate-700
        flyoutBackgroundColour: '#F1F5F9', // tailwind slate-100
        flyoutForegroundColour: '#334155',
        flyoutOpacity: 1,
        scrollbarColour: '#CBD5E1', // tailwind slate-300
        insertionMarkerColour: '#3B82F6', // tailwind blue-500
        insertionMarkerOpacity: 0.3,
        scrollbarOpacity: 0.4,
        cursorColour: '#3B82F6',
    },
    fontStyle: {
        family: 'Inter, sans-serif',
        weight: '500',
        size: 12
    },
    startHats: true,
});
