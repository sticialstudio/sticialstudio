/**
 * Defines the core interfaces and types for the Board Support System.
 */

export interface PinCapabilities {
    digital: (number | string)[];
    analog?: (number | string)[];
    pwm?: (number | string)[];
}

export interface I2CDefinition {
    sda: number | string;
    scl: number | string;
}

export interface SPIDefinition {
    mosi: number | string;
    miso: number | string;
    sck: number | string;
    ss?: number | string;
}

export interface UARTDefinition {
    rx: number | string;
    tx: number | string;
}

export interface BoardDefinition {
    name: string;
    manufacturer: string;
    architecture: string;
    voltage: number;
    pins: PinCapabilities;
    communication: {
        i2c?: I2CDefinition;
        spi?: SPIDefinition;
        uart?: UARTDefinition;
    };
    builtin?: {
        led?: number | string;
    };
}
