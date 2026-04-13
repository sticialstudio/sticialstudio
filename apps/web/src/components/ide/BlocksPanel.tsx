"use client";
/**
 * BlocksPanel â€“ Scratch-style compact block library (middle column).
 *
 * UX:
 *   â€¢ Compact rows (36px) â€” colored left border, icon, truncated label.
 *   â€¢ Hover â†’ row expands smoothly to show full label + "drag to use" hint.
 *   â€¢ MouseDown + drag (> 6px) â†’ block created on canvas + native drag starts.
 *   â€¢ Click without drag â†’ nothing happens (no accidental block insertions).
 */
import React, { useEffect, useRef, useCallback, useState } from "react";
import * as Blockly from "blockly";
import { BoardKey } from "@/contexts/BoardContext";
import { buildCategoryToolboxXml } from "@/lib/blockly/toolbox";
import "./blocklyStyles.css";

interface BlocksPanelProps {
  board: BoardKey;
  selectedCategoryName: string;
  workspace: Blockly.WorkspaceSvg | null;
}

interface BlockDef {
  type: string;
  label: string;
}

// â”€â”€â”€ Color per category (matches theme.ts) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CATEGORY_COLORS: Record<string, string> = {
  control:       "#F97316",
  logic:         "#10B981",
  math:          "#10B981",
  variables:     "#EA580C",
  sensors:       "#38BDF8",
  input:         "#8B5CF6",
  output:        "#3B82F6",
  communication: "#14B8A6",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category.toLowerCase()] ?? "#64748b";
}

// â”€â”€â”€ Label helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getLabel(type: string): string {
  const overrides: Record<string, string> = {
    arduino_on_start:        "On Start",
    arduino_forever:         "Forever",
    controls_forever:        "Forever Loop",
    controls_repeat:         "Repeat N Times",
    controls_repeat_until:   "Repeat Until",
    controls_for_loop:       "For Loop",
    controls_if:             "If",
    arduino_setup_loop:      "Legacy Setup & Loop",
    time_wait_seconds:       "Wait Seconds",
    time_delay:              "Delay ms",
    time_wait_until:         "Wait Until",
    arduino_millis:          "Millis Timer",
    logic_compare:           "Compare (< > =)",
    logic_operation:         "AND / OR",
    logic_negate:            "NOT",
    logic_boolean:           "True / False",
    math_number:             "Number",
    math_arithmetic:         "Arithmetic",
    math_single:             "Math Function",
    math_random_int_custom:  "Random Integer",
    math_modulo_custom:      "Modulo (%)",
    math_round:              "Round",
    math_on_list:            "List Math",
    arduino_map:             "Map Value",
    arduino_constrain:       "Constrain",
    arduino_ultrasonic:      "Ultrasonic Distance",
    arduino_pir_read:        "PIR Motion",
    arduino_touch_read:      "Touch Sensor",
    arduino_dht_init:        "DHT Init",
    arduino_dht_read:        "DHT Read",
    arduino_bme280_init:     "BME280 Init",
    arduino_bme280_read:     "BME280 Read",
    arduino_bh1750_init:     "BH1750 Init (Light)",
    arduino_bh1750_read:     "BH1750 Read",
    arduino_soil_moisture_read: "Soil Moisture",
    arduino_rain_read:       "Rain Sensor",
    arduino_water_level_read: "Water Level",
    arduino_ir_init:         "IR Receiver Init",
    arduino_ir_read_code:    "IR Read Code",
    arduino_keypad_init:     "Keypad Init",
    arduino_sound_sensor_read: "Sound Sensor",
    arduino_photo_sensor_read: "Light Sensor (Photo)",
    arduino_potentiometer_read: "Potentiometer",
    arduino_color_sensor_read: "TCS3200 Color",
    arduino_button_read:     "Tactile Button",
    arduino_ir_obstacle_read: "IR Obstacle Sensor",
    arduino_max30102_init:   "MAX30102 Init",
    arduino_max30102_read:   "MAX30102 Read",
    arduino_led_set:         "LED Control",
    arduino_rgb_set:         "RGB LED Control",
    arduino_traffic_light_set: "Traffic Light Module",
    arduino_keypad_get_key:  "Keypad Get Key",
    arduino_digitalRead:     "Digital Read",
    arduino_pinMode:         "Pin Mode",
    arduino_digitalWrite:    "Digital Write",
    arduino_analogWrite:     "Analog Write (PWM)",
    arduino_servo_write:     "Servo Angle",
    arduino_relay_write:     "Relay On/Off",
    arduino_buzzer_tone:     "Buzzer Tone",
    arduino_buzzer_stop:     "Buzzer Stop",
    motor_forward:           "Motor Forward",
    motor_backward:          "Motor Backward",
    motor_stop:              "Motor Stop",
    arduino_l298n_drive:     "L298N Drive",
    arduino_afmotor_run:     "Motor Shield Run",
    arduino_dc_motor_set:    "DC Motor Speed",
    arduino_water_pump_set:  "Water Pump",
    arduino_active_buzzer_set: "Active Buzzer",
    arduino_tft_init:        "TFT Screen Init",
    arduino_tft_clear:       "TFT Screen Clear",
    arduino_tft_print:       "TFT Screen Print",
    neopixel_init:           "NeoPixel Init",
    neopixel_set_color:      "NeoPixel Color",
    neopixel_show:           "NeoPixel Show",
    neopixel_clear:          "NeoPixel Clear",
    robot_move_forward:      "Robot Forward",
    robot_move_backward:     "Robot Backward",
    robot_turn_left:         "Robot Turn Left",
    robot_turn_right:        "Robot Turn Right",
    robot_stop:              "Robot Stop",
    robot_move_speed:        "Robot Move Speed",
    arduino_serialBegin:     "Serial Begin",
    arduino_serialPrint:     "Serial Print",
    arduino_serialPrintln:   "Serial Println",
    oled_init:               "OLED Init",
    oled_clear:              "OLED Clear",
    oled_print:              "OLED Print",
    lcd_i2c_init:            "LCD Init (I2C)",
    lcd_i2c_clear:           "LCD Clear",
    lcd_i2c_print:           "LCD Print",
    text_print:              "Print Text",
    text:                    "Text String",
  };
  if (overrides[type]) return overrides[type];
  return type
    .replace(/^(arduino_|controls_|math_|logic_|time_|robot_|neopixel_|motor_|oled_|lcd_i2c_)/, "")
    .split("_")
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

// â”€â”€â”€ Icon helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getIcon(type: string): string {
  if (type.includes("setup_loop"))  return "â–¶ï¸";
  if (type.includes("forever") || type.includes("repeat") || type.includes("loop")) return "ðŸ”";
  if (type.includes("if"))          return "â“";
  if (type.includes("wait") || type.includes("delay") || type.includes("millis")) return "â±ï¸";
  if (type.includes("compare"))     return "âš–ï¸";
  if (type.includes("operation"))   return "ðŸ”—";
  if (type.includes("negate"))      return "ðŸš«";
  if (type.includes("boolean"))     return "âœ…";
  if (type.includes("math_number")) return "ðŸ”¢";
  if (type.includes("arithmetic"))  return "ðŸ”£";
  if (type.includes("random"))      return "ðŸŽ²";
  if (type.includes("map") || type.includes("constrain")) return "ðŸ“";
  if (type.includes("ultrasonic"))  return "ðŸ“";
  if (type.includes("pir") || type.includes("motion")) return "ðŸš¶";
  if (type.includes("touch"))       return "ðŸ‘†";
  if (type.includes("dht") || type.includes("bme")) return "ðŸŒ¡ï¸";
  if (type.includes("bh1750"))      return "â˜€ï¸";
  if (type.includes("soil"))        return "ðŸŒ±";
  if (type.includes("rain"))        return "ðŸŒ§ï¸";
  if (type.includes("water"))       return "ðŸ’§";
  if (type.includes("ir_"))         return "ðŸ“¡";
  if (type.includes("keypad"))      return "âŒ¨ï¸";
  if (type.includes("digitalRead") || type.includes("analogRead")) return "ðŸ“¥";
  if (type.includes("pinMode"))     return "ðŸ”Œ";
  if (type.includes("digitalWrite")) return "ðŸ’¬";
  if (type.includes("analog"))      return "ã€°ï¸";
  if (type.includes("servo"))       return "ðŸ”©";
  if (type.includes("relay"))       return "ðŸ”˜";
  if (type.includes("buzzer"))      return "ðŸ””";
  if (type.includes("motor") || type.includes("robot") || type.includes("afmotor") || type.includes("l298n")) return "âš™ï¸";
  if (type.includes("potentiometer")) return "ðŸŽ›ï¸";
  if (type.includes("color"))       return "ðŸŽ¨";
  if (type.includes("button"))      return "ðŸ”˜";
  if (type.includes("max30102"))    return "â¤ï¸";
  if (type.includes("sound"))       return "ðŸŽ¤";
  if (type.includes("photo"))       return "ðŸ’¡";
  if (type.includes("traffic"))     return "ðŸš¥";
  if (type.includes("led") || type.includes("rgb")) return "ðŸ’¡";
  if (type.includes("neopixel"))    return "ðŸŒˆ";
  if (type.includes("oled") || type.includes("lcd") || type.includes("tft")) return "ðŸ–¥ï¸";
  if (type.includes("serial"))      return "ðŸ“Ÿ";
  if (type.includes("text"))        return "ðŸ“";
  return "ðŸ§©";
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function BlocksPanel({
  board,
  selectedCategoryName,
  workspace,
}: BlocksPanelProps): React.JSX.Element {
  const [blocks, setBlocks] = useState<BlockDef[]>([]);
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const color = getCategoryColor(selectedCategoryName);

  // â”€â”€â”€ Parse category blocks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!selectedCategoryName) { setBlocks([]); return; }
    try {
      const xmlString = buildCategoryToolboxXml(board, selectedCategoryName);
      if (!xmlString) { setBlocks([]); return; }
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, "text/xml");
      const seen = new Set<string>();
      const parsed: BlockDef[] = [];
      for (const node of Array.from(doc.getElementsByTagName("block"))) {
        const type = node.getAttribute("type") || "";
        if (!type || seen.has(type)) continue;
        seen.add(type);
        parsed.push({ type, label: getLabel(type) });
      }
      setBlocks(parsed);
    } catch (e) {
      console.error("[BlocksPanel]", e);
      setBlocks([]);
    }
  }, [board, selectedCategoryName]);

  // â”€â”€â”€ Drag-threshold detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  /**
   * We only create + drag a block when the user has clearly moved the mouse
   * (drag-distance â‰¥ 6px). Pure clicks do nothing.
   */
  const dragState = useRef<{
    blockType: string;
    startX: number;
    startY: number;
    block: Blockly.BlockSvg | null;
    started: boolean;
  } | null>(null);

  const createAndDragBlock = useCallback(
    (blockType: string, clientX: number, clientY: number) => {
      if (!workspace) return;
      const scale = workspace.scale;
      const svgRect = (workspace.getParentSvg() as SVGSVGElement).getBoundingClientRect();
      const metrics = workspace.getMetrics();
      const wsX = (clientX - svgRect.left) / scale - (metrics.viewLeft ?? 0) / scale;
      const wsY = (clientY - svgRect.top) / scale - (metrics.viewTop ?? 0) / scale;

      let block: Blockly.BlockSvg;
      try {
        block = workspace.newBlock(blockType) as Blockly.BlockSvg;
        block.initSvg();
        block.render();
        block.moveBy(wsX - 40, wsY - 20);
        workspace.render();
      } catch (err) {
        console.error("[BlocksPanel] newBlock failed:", blockType, err);
        return;
      }
      dragState.current!.block = block;
      dragState.current!.started = true;

      const svgRoot = block.getSvgRoot();
      svgRoot.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true, cancelable: true,
          clientX, clientY,
          button: 0, pointerId: 1, pointerType: "mouse",
        })
      );
    },
    [workspace]
  );

  const handleMouseDown = useCallback(
    (blockType: string, e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      dragState.current = {
        blockType,
        startX: e.clientX,
        startY: e.clientY,
        block: null,
        started: false,
      };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragState.current || dragState.current.started) return;
        const dx = ev.clientX - dragState.current.startX;
        const dy = ev.clientY - dragState.current.startY;
        if (Math.hypot(dx, dy) >= 6) {
          createAndDragBlock(dragState.current.blockType, ev.clientX, ev.clientY);
        }
      };

      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        dragState.current = null;
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [createAndDragBlock]
  );

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!selectedCategoryName) {
    return (
      <div className="blocks-panel-empty">
        <span>â† Select a category</span>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="blocks-panel-empty">
        <span>No blocks available</span>
      </div>
    );
  }

  return (
    <div className="blocks-panel" style={{ "--cat-color": color } as React.CSSProperties}>
      {/* Panel header */}
      <div className="blocks-panel-header" style={{ borderColor: `${color}50` }}>
        <span className="blocks-panel-header-dot" style={{ backgroundColor: color }} />
        <span>{selectedCategoryName}</span>
      </div>

      <div className="blocks-panel-list">
        {blocks.map((block) => {
          const isHovered = hoveredType === block.type;
          return (
            <div
              key={block.type}
              className={`block-row${isHovered ? " block-row--expanded" : ""}`}
              style={{
                borderLeftColor: isHovered ? color : `${color}55`,
                backgroundColor: isHovered ? `${color}18` : undefined,
              }}
              onMouseEnter={() => setHoveredType(block.type)}
              onMouseLeave={() => setHoveredType(null)}
              onMouseDown={(e) => handleMouseDown(block.type, e)}
              draggable={false}
            >
              <span className="block-row-icon">{getIcon(block.type)}</span>
              <div className="block-row-content">
                <span className="block-row-label">{block.label}</span>
                {isHovered && (
                  <span className="block-row-hint">
                    â†– drag to workspace
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


