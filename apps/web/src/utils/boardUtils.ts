import { BOARD_REGISTRY } from '../boards/boards';
import { BoardDefinition } from '../boards/boardTypes';

/**
 * Get a board definition by ID.
 */
export function getBoard(boardId: string): BoardDefinition | undefined {
    return BOARD_REGISTRY[boardId];
}

/**
 * Get digital pins for a board.
 */
export function getDigitalPins(boardId: string): (number | string)[] {
    return BOARD_REGISTRY[boardId]?.pins.digital || [];
}

/**
 * Get analog pins for a board.
 */
export function getAnalogPins(boardId: string): (number | string)[] {
    return BOARD_REGISTRY[boardId]?.pins.analog || [];
}

/**
 * Get PWM pins for a board.
 */
export function getPWMPins(boardId: string): (number | string)[] {
    return BOARD_REGISTRY[boardId]?.pins.pwm || [];
}

/**
 * Get I2C pins for a board.
 */
export function getI2CPins(boardId: string) {
    return BOARD_REGISTRY[boardId]?.communication.i2c;
}

/**
 * Get SPI pins for a board.
 */
export function getSPIPins(boardId: string) {
    return BOARD_REGISTRY[boardId]?.communication.spi;
}

/**
 * Get UART pins for a board.
 */
export function getUARTPins(boardId: string) {
    return BOARD_REGISTRY[boardId]?.communication.uart;
}

/**
 * Get Builtin LED pin for a board.
 */
export function getBuiltinLed(boardId: string): number | string | undefined {
    return BOARD_REGISTRY[boardId]?.builtin?.led;
}

/**
 * Check if a board supports PWM.
 */
export function boardSupportsPWM(boardId: string): boolean {
    const pins = getPWMPins(boardId);
    return pins && pins.length > 0;
}

/**
 * Check if a board supports Analog.
 */
export function boardSupportsAnalog(boardId: string): boolean {
    const pins = getAnalogPins(boardId);
    return pins && pins.length > 0;
}

/**
 * Check if a board supports I2C.
 */
export function boardSupportsI2C(boardId: string): boolean {
    return !!getI2CPins(boardId);
}

/**
 * Check if a board supports SPI.
 */
export function boardSupportsSPI(boardId: string): boolean {
    return !!getSPIPins(boardId);
}

/**
 * Check if a board supports UART.
 */
export function boardSupportsUART(boardId: string): boolean {
    return !!getUARTPins(boardId);
}

/**
 * Get a user-friendly label for a pin based on the board type.
 */
export function getFormattedPinLabel(boardId: string, pin: number | string): string {
    const board = BOARD_REGISTRY[boardId];
    if (!board) return String(pin);

    // Raspberry Pi Pico family (RP2040, RP2350)
    if (board.manufacturer === "Raspberry Pi" && (board.name.includes("Pico") || board.architecture.startsWith("RP"))) {
        if (typeof pin === 'number' || !isNaN(Number(pin))) {
            return `GP${pin}`;
        }
    }

    return String(pin);
}
