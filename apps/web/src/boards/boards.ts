import { BoardDefinition } from './boardTypes';

/**
 * Registry of all supported board definitions.
 * Use the same keys as in BOARD_CONFIG for consistency.
 */

export const ArduinoUno: BoardDefinition = {
    name: "Arduino Uno",
    manufacturer: "Arduino",
    architecture: "AVR",
    voltage: 5,
    pins: {
        digital: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        analog: ["A0", "A1", "A2", "A3", "A4", "A5"],
        pwm: [3, 5, 6, 9, 10, 11]
    },
    communication: {
        i2c: { sda: "A4", scl: "A5" },
        spi: { mosi: 11, miso: 12, sck: 13, ss: 10 },
        uart: { rx: 0, tx: 1 }
    },
    builtin: {
        led: 13
    }
};

export const ArduinoNano: BoardDefinition = {
    name: "Arduino Nano",
    manufacturer: "Arduino",
    architecture: "AVR",
    voltage: 5,
    pins: {
        digital: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        analog: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7"],
        pwm: [3, 5, 6, 9, 10, 11]
    },
    communication: {
        i2c: { sda: "A4", scl: "A5" },
        spi: { mosi: 11, miso: 12, sck: 13, ss: 10 },
        uart: { rx: 0, tx: 1 }
    },
    builtin: {
        led: 13
    }
};

export const ArduinoMega: BoardDefinition = {
    name: "Arduino Mega",
    manufacturer: "Arduino",
    architecture: "AVR",
    voltage: 5,
    pins: {
        digital: Array.from({ length: 54 }, (_, i) => i),
        analog: Array.from({ length: 16 }, (_, i) => `A${i}`),
        pwm: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 44, 45, 46]
    },
    communication: {
        i2c: { sda: 20, scl: 21 },
        spi: { mosi: 51, miso: 50, sck: 52, ss: 53 },
        uart: { rx: 0, tx: 1 }
    },
    builtin: {
        led: 13
    }
};

export const ArduinoLeonardo: BoardDefinition = {
    name: "Arduino Leonardo",
    manufacturer: "Arduino",
    architecture: "AVR",
    voltage: 5,
    pins: {
        digital: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
        analog: ["A0", "A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11"],
        pwm: [3, 5, 6, 9, 10, 11, 13]
    },
    communication: {
        i2c: { sda: 2, scl: 3 },
        spi: { mosi: "ICSP-4", miso: "ICSP-1", sck: "ICSP-3", ss: "None" },
        uart: { rx: 0, tx: 1 }
    },
    builtin: {
        led: 13
    }
};

export const ESP32: BoardDefinition = {
    name: "ESP32",
    manufacturer: "Espressif",
    architecture: "Xtensa",
    voltage: 3.3,
    pins: {
        digital: [2, 4, 5, 12, 13, 14, 15, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
        analog: ["34", "35", "36", "39"],
        pwm: [2, 4, 5, 12, 13, 14, 15, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33]
    },
    communication: {
        i2c: { sda: 21, scl: 22 },
        spi: { mosi: 23, miso: 19, sck: 18, ss: 5 },
        uart: { rx: 3, tx: 1 }
    },
    builtin: {
        led: 2
    }
};

export const ESP8266: BoardDefinition = {
    name: "ESP8266",
    manufacturer: "Espressif",
    architecture: "Tensilica",
    voltage: 3.3,
    pins: {
        digital: [0, 2, 4, 5, 12, 13, 14, 15, 16],
        analog: ["A0"],
        pwm: [0, 2, 4, 5, 12, 13, 14, 15]
    },
    communication: {
        i2c: { sda: 4, scl: 5 },
        spi: { mosi: 13, miso: 12, sck: 14, ss: 15 },
        uart: { rx: 3, tx: 1 }
    },
    builtin: {
        led: 2
    }
};

export const RaspberryPiPico: BoardDefinition = {
    name: "Raspberry Pi Pico",
    manufacturer: "Raspberry Pi",
    architecture: "RP2040",
    voltage: 3.3,
    pins: {
        digital: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 26, 27, 28],
        analog: ["26", "27", "28"],
        pwm: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 26, 27, 28]
    },
    communication: {
        i2c: { sda: 4, scl: 5 },
        spi: { mosi: 19, miso: 16, sck: 18, ss: 17 },
        uart: { rx: 1, tx: 0 }
    },
    builtin: {
        led: 25
    }
};

export const RaspberryPiPicoW: BoardDefinition = {
    name: "Raspberry Pi Pico W",
    manufacturer: "Raspberry Pi",
    architecture: "RP2040",
    voltage: 3.3,
    pins: {
        digital: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 26, 27, 28],
        analog: ["26", "27", "28"],
        pwm: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 26, 27, 28]
    },
    communication: {
        i2c: { sda: 4, scl: 5 },
        spi: { mosi: 19, miso: 16, sck: 18, ss: 17 },
        uart: { rx: 1, tx: 0 }
    },
    builtin: {
        led: "WL_GPIO0"
    }
};

export const RaspberryPiPico2W: BoardDefinition = {
    name: "Raspberry Pi Pico 2W",
    manufacturer: "Raspberry Pi",
    architecture: "RP2350",
    voltage: 3.3,
    pins: {
        digital: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 26, 27, 28],
        analog: ["26", "27", "28"],
        pwm: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 26, 27, 28]
    },
    communication: {
        i2c: { sda: 4, scl: 5 },
        spi: { mosi: 19, miso: 16, sck: 18, ss: 17 },
        uart: { rx: 1, tx: 0 }
    },
    builtin: {
        led: "WL_GPIO0"
    }
};

export const RaspberryPiZero: BoardDefinition = {
    name: "Raspberry Pi Zero",
    manufacturer: "Raspberry Pi",
    architecture: "Broadcom",
    voltage: 3.3,
    pins: {
        digital: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
        pwm: [12, 13, 18, 19]
    },
    communication: {
        i2c: { sda: 2, scl: 3 },
        spi: { mosi: 10, miso: 9, sck: 11, ss: 8 },
        uart: { rx: 15, tx: 14 }
    }
};

export const RaspberryPi3: BoardDefinition = {
    name: "Raspberry Pi 3",
    manufacturer: "Raspberry Pi",
    architecture: "Broadcom",
    voltage: 3.3,
    pins: {
        digital: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
        pwm: [12, 13, 18, 19]
    },
    communication: {
        i2c: { sda: 2, scl: 3 },
        spi: { mosi: 10, miso: 9, sck: 11, ss: 8 },
        uart: { rx: 15, tx: 14 }
    }
};

export const RaspberryPi4: BoardDefinition = {
    name: "Raspberry Pi 4",
    manufacturer: "Raspberry Pi",
    architecture: "Broadcom",
    voltage: 3.3,
    pins: {
        digital: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
        pwm: [12, 13, 18, 19]
    },
    communication: {
        i2c: { sda: 2, scl: 3 },
        spi: { mosi: 10, miso: 9, sck: 11, ss: 8 },
        uart: { rx: 15, tx: 14 }
    }
};

export const RaspberryPi5: BoardDefinition = {
    name: "Raspberry Pi 5",
    manufacturer: "Raspberry Pi",
    architecture: "Broadcom",
    voltage: 3.3,
    pins: {
        digital: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
        pwm: [12, 13, 18, 19]
    },
    communication: {
        i2c: { sda: 2, scl: 3 },
        spi: { mosi: 10, miso: 9, sck: 11, ss: 8 },
        uart: { rx: 15, tx: 14 }
    }
};

export const BOARD_REGISTRY: Record<string, BoardDefinition> = {
    'Arduino Uno': ArduinoUno,
    'Arduino Nano': ArduinoNano,
    'Arduino Mega': ArduinoMega,
    'Arduino Leonardo': ArduinoLeonardo,
    'ESP32': ESP32,
    'ESP8266': ESP8266,
    'Raspberry Pi Pico': RaspberryPiPico,
    'Raspberry Pi Pico W': RaspberryPiPicoW,
    'Raspberry Pi Pico 2W': RaspberryPiPico2W,
    'Raspberry Pi Zero': RaspberryPiZero,
    'Raspberry Pi 3': RaspberryPi3,
    'Raspberry Pi 4': RaspberryPi4,
    'Raspberry Pi 5': RaspberryPi5
};
