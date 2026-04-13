/**
 * Constants and helpers for pin capabilities.
 */

export enum PinType {
    DIGITAL = 'DIGITAL',
    ANALOG = 'ANALOG',
    PWM = 'PWM',
    I2C = 'I2C',
    SPI = 'SPI',
    UART = 'UART',
}

export const CAPABILITY_COLORS = {
    [PinType.DIGITAL]: '#4a9eff',
    [PinType.ANALOG]: '#ffcc00',
    [PinType.PWM]: '#ff66b2',
    [PinType.I2C]: '#00cc99',
    [PinType.SPI]: '#cc66ff',
    [PinType.UART]: '#ff9933',
};
