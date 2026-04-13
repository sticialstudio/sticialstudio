import { 
    getDigitalPinOptions, 
    getAnalogPinOptions, 
    getPWMPinOptions,
    } from '../dropdowns';
import { getOledInstances, getNeopixelInstances } from '../dropdowns';

export const displayBlocks = [
{
            type: "oled_init",
            extensions: ["dynamic_oled_extension"],
            message0: "initialize %1 width: %2 height: %3",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["", "NONE"]] },
                { type: "field_number", name: "WIDTH", value: 128 },
                { type: "field_number", name: "HEIGHT", value: 64 }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Initialize an I2C OLED display.",
            helpUrl: ""
        },
        {
            type: "oled_clear",
            extensions: ["dynamic_oled_extension"],
            message0: "clear OLED %1",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["", "NONE"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Clear the entire display.",
            helpUrl: ""
        },
        {
            type: "oled_print",
            extensions: ["dynamic_oled_extension"],
            message0: "OLED %1 print text %2 at X: %3 Y: %4",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["", "NONE"]] },
                { type: "input_value", name: "TEXT" },
                { type: "input_value", name: "X", check: "Number" },
                { type: "input_value", name: "Y", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Print text at a specific coordinate on the OLED.",
            helpUrl: ""
        },
        {
            type: "oled_set_rotation",
            extensions: ["dynamic_oled_extension"],
            message0: "OLED %1 set rotation %2",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["", "NONE"]] },
                { type: "field_dropdown", name: "ROTATION", options: [["0°", "0"], ["90°", "1"], ["180°", "2"], ["270°", "3"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Set the rotation of the OLED display.",
            helpUrl: ""
        },
        {
            type: "oled_set_text_color",
            extensions: ["dynamic_oled_extension"],
            message0: "OLED %1 set text color %2",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["", "NONE"]] },
                { type: "field_dropdown", name: "COLOR", options: [["White", "WHITE"], ["Black", "BLACK"], ["Inverse", "INVERSE"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Set the text color for the OLED display.",
            helpUrl: ""
        },
        {
            type: "oled_draw_pixel",
            extensions: ["dynamic_oled_extension"],
            message0: "OLED %1 draw pixel at X: %2 Y: %3 color: %4",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["", "NONE"]] },
                { type: "input_value", name: "X", check: "Number" },
                { type: "input_value", name: "Y", check: "Number" },
                { type: "field_dropdown", name: "COLOR", options: [["White", "WHITE"], ["Black", "BLACK"], ["Inverse", "INVERSE"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Draw a single pixel on the OLED display.",
            helpUrl: ""
        },
        {
            type: "oled_draw_line",
            extensions: ["dynamic_oled_extension"],
            message0: "OLED %1 draw line X0: %2 Y0: %3 X1: %4 Y1: %5 color: %6",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["", "NONE"]] },
                { type: "input_value", name: "X0", check: "Number" },
                { type: "input_value", name: "Y0", check: "Number" },
                { type: "input_value", name: "X1", check: "Number" },
                { type: "input_value", name: "Y1", check: "Number" },
                { type: "field_dropdown", name: "COLOR", options: [["White", "WHITE"], ["Black", "BLACK"], ["Inverse", "INVERSE"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Draw a line between two points.",
            helpUrl: ""
        },
        {
            type: "oled_draw_rect",
            extensions: ["dynamic_oled_extension"],
            message0: "OLED %1 draw rect X: %2 Y: %3 W: %4 H: %5 fill: %6 color: %7",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["", "NONE"]] },
                { type: "input_value", name: "X", check: "Number" },
                { type: "input_value", name: "Y", check: "Number" },
                { type: "input_value", name: "W", check: "Number" },
                { type: "input_value", name: "H", check: "Number" },
                { type: "field_checkbox", name: "FILL", checked: false },
                { type: "field_dropdown", name: "COLOR", options: [["White", "WHITE"], ["Black", "BLACK"], ["Inverse", "INVERSE"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Draw a rectangle with optional fill.",
            helpUrl: ""
        },
        {
            type: "oled_draw_circle",
            extensions: ["dynamic_oled_extension"],
            message0: "OLED %1 draw circle X: %2 Y: %3 radius: %4 fill: %5 color: %6",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["", "NONE"]] },
                { type: "input_value", name: "X", check: "Number" },
                { type: "input_value", name: "Y", check: "Number" },
                { type: "input_value", name: "R", check: "Number" },
                { type: "field_checkbox", name: "FILL", checked: false },
                { type: "field_dropdown", name: "COLOR", options: [["White", "WHITE"], ["Black", "BLACK"], ["Inverse", "INVERSE"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Draw a circle with optional fill.",
            helpUrl: ""
        },
        {
            type: "oled_draw_triangle",
            extensions: ["dynamic_oled_extension"],
            message0: "OLED %1 draw triangle X0: %2 Y0: %3 X1: %4 Y1: %5 X2: %6 Y2: %7 fill: %8 color: %9",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["", "NONE"]] },
                { type: "input_value", name: "X0", check: "Number" },
                { type: "input_value", name: "Y0", check: "Number" },
                { type: "input_value", name: "X1", check: "Number" },
                { type: "input_value", name: "Y1", check: "Number" },
                { type: "input_value", name: "X2", check: "Number" },
                { type: "input_value", name: "Y2", check: "Number" },
                { type: "field_checkbox", name: "FILL", checked: false },
                { type: "field_dropdown", name: "COLOR", options: [["White", "WHITE"], ["Black", "BLACK"], ["Inverse", "INVERSE"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Draw a triangle with optional fill.",
            helpUrl: ""
        },
        {
            type: "lcd_i2c_init",
            message0: "initialize LCD I2C address %1 columns %2 rows %3",
            args0: [
                { type: "field_dropdown", name: "ADDRESS", options: [["0x27", "0x27"], ["0x3F", "0x3F"]] },
                { type: "field_number", name: "COLS", value: 16, min: 8, max: 40 },
                { type: "field_number", name: "ROWS", value: 2, min: 1, max: 4 }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Initialize an I2C LCD display.",
            helpUrl: ""
        },
        {
            type: "lcd_i2c_clear",
            message0: "clear LCD",
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Clear LCD contents.",
            helpUrl: ""
        },
        {
            type: "lcd_i2c_print",
            message0: "LCD print %1 at column %2 row %3",
            args0: [
                { type: "input_value", name: "TEXT" },
                { type: "input_value", name: "COL", check: "Number" },
                { type: "input_value", name: "ROW", check: "Number" }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Print text at a specific LCD cursor position.",
            helpUrl: ""
        },
        // --- NeoPixel ---
        {
            type: "neopixel_init",
            extensions: ["dynamic_neopixel_extension"],
            message0: "initialize NeoPixels %1 with %2 LEDs",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["", "NONE"]] },
                { type: "field_number", name: "COUNT", value: 8, min: 1 }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "light_blocks",
            tooltip: "Initialize an addressable LED strip.",
            helpUrl: ""
        },
        {
            type: "neopixel_set_color",
            extensions: ["dynamic_neopixel_extension"],
            message0: "set NeoPixel %5 LED %1 to Color (R:%2 G:%3 B:%4)",
            args0: [
                { type: "input_value", name: "INDEX", check: "Number" },
                { type: "input_value", name: "R", check: "Number" },
                { type: "input_value", name: "G", check: "Number" },
                { type: "input_value", name: "B", check: "Number" },
                { type: "field_dropdown", name: "SENSOR", options: [["", "NONE"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "light_blocks",
            tooltip: "Set the RGB color of a specific NeoPixel.",
            helpUrl: ""
        },
        {
            type: "neopixel_show",
            extensions: ["dynamic_neopixel_extension"],
            message0: "show NeoPixels %1",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["", "NONE"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "light_blocks",
            tooltip: "Update the strip with newly set colors.",
            helpUrl: ""
        },
        {
            type: "neopixel_clear",
            extensions: ["dynamic_neopixel_extension"],
            message0: "clear NeoPixels %1",
            args0: [
                { type: "field_dropdown", name: "SENSOR", options: [["", "NONE"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "light_blocks",
            tooltip: "Turn off all pixels.",
            helpUrl: ""
        },
        {
            type: "arduino_tft_init",
            message0: "initialize 2.4\" TFT Touch Display",
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Initialize a 2.4 inch SPI TFT Display Shield.",
            helpUrl: ""
        },
        {
            type: "arduino_tft_clear",
            message0: "clear TFT Display Color %1",
            args0: [
                { type: "field_dropdown", name: "COLOR", options: [["Black", "TFT_BLACK"], ["White", "TFT_WHITE"], ["Red", "TFT_RED"], ["Blue", "TFT_BLUE"], ["Green", "TFT_GREEN"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Clear the TFT screen with a background color.",
            helpUrl: ""
        },
        {
            type: "arduino_tft_print",
            message0: "TFT print text %1 at X: %2 Y: %3 Size: %4 Color: %5",
            args0: [
                { type: "input_value", name: "TEXT" },
                { type: "input_value", name: "X", check: "Number" },
                { type: "input_value", name: "Y", check: "Number" },
                { type: "field_dropdown", name: "SIZE", options: [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]] },
                { type: "field_dropdown", name: "COLOR", options: [["White", "TFT_WHITE"], ["Black", "TFT_BLACK"], ["Red", "TFT_RED"], ["Blue", "TFT_BLUE"], ["Green", "TFT_GREEN"]] }
            ],
            previousStatement: null,
            nextStatement: null,
            style: "display_blocks",
            tooltip: "Print text to the TFT Display at given coordinates.",
            helpUrl: ""
        }
];


import * as Blockly from 'blockly';

let displayExtensionsRegistered = false;
export function registerDisplayExtensions() {
    if (displayExtensionsRegistered) return;
    
    Blockly.Extensions.register('dynamic_oled_extension', function(this: Blockly.Block) {
        const field = this.getField('SENSOR') as Blockly.FieldDropdown;
        if (field) {
            (field as any).menuGenerator_ = getOledInstances;
        }
    });

    Blockly.Extensions.register('dynamic_neopixel_extension', function(this: Blockly.Block) {
        const field = this.getField('SENSOR') as Blockly.FieldDropdown;
        if (field) {
            (field as any).menuGenerator_ = getNeopixelInstances;
        }
    });
    
    displayExtensionsRegistered = true;
}
