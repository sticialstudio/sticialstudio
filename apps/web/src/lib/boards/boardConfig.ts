export interface BoardConfigItem {
    family: 'arduino' | 'esp' | 'raspberry';
    language: 'cpp' | 'python';
    generator: 'arduino' | 'micropython';
    compileStrategy: 'arduino-cli' | 'micropython-flash';
    chip: string;
    summary: string;
}

export const BOARD_CONFIG: Record<string, BoardConfigItem> = {
    // Arduino Boards
    'Arduino Uno': {
        family: 'arduino',
        language: 'cpp',
        generator: 'arduino',
        compileStrategy: 'arduino-cli',
        chip: 'ATmega328P microcontroller',
        summary: 'The classic starter board for sensors, LEDs, and beginner robotics projects.'
    },
    'Arduino Nano': {
        family: 'arduino',
        language: 'cpp',
        generator: 'arduino',
        compileStrategy: 'arduino-cli',
        chip: 'ATmega328P microcontroller',
        summary: 'Compact Arduino board for breadboard prototypes and space-constrained builds.'
    },
    'Arduino Mega': {
        family: 'arduino',
        language: 'cpp',
        generator: 'arduino',
        compileStrategy: 'arduino-cli',
        chip: 'ATmega2560 microcontroller',
        summary: 'High I/O count Arduino board for advanced hardware projects and larger circuits.'
    },
    'Arduino Leonardo': {
        family: 'arduino',
        language: 'cpp',
        generator: 'arduino',
        compileStrategy: 'arduino-cli',
        chip: 'ATmega32u4 microcontroller',
        summary: 'USB-native Arduino board, useful for HID projects and keyboard/mouse emulation.'
    },

    // ESP Boards
    'ESP32': {
        family: 'esp',
        language: 'python',
        generator: 'micropython',
        compileStrategy: 'micropython-flash',
        chip: 'Xtensa dual-core SoC',
        summary: 'WiFi + Bluetooth microcontroller ideal for IoT, connected sensors, and smart devices.'
    },
    'ESP8266': {
        family: 'esp',
        language: 'python',
        generator: 'micropython',
        compileStrategy: 'micropython-flash',
        chip: 'Tensilica L106 SoC',
        summary: 'Affordable WiFi microcontroller for lightweight networking and automation projects.'
    },

    // Raspberry Pi Boards
    'Raspberry Pi Pico': {
        family: 'raspberry',
        language: 'python',
        generator: 'micropython',
        compileStrategy: 'micropython-flash',
        chip: 'RP2040 dual-core microcontroller',
        summary: 'Reliable MicroPython board for education, control systems, and embedded fundamentals.'
    },
    'Raspberry Pi Pico W': {
        family: 'raspberry',
        language: 'python',
        generator: 'micropython',
        compileStrategy: 'micropython-flash',
        chip: 'RP2040 + wireless module',
        summary: 'Pico with onboard wireless connectivity for cloud-ready classroom prototypes.'
    },
    'Raspberry Pi Zero': {
        family: 'raspberry',
        language: 'python',
        generator: 'micropython',
        compileStrategy: 'micropython-flash',
        chip: 'Broadcom BCM2835',
        summary: 'Linux-capable mini computer board for edge applications and multi-service projects.'
    },
    'Raspberry Pi Pico 2W': {
        family: 'raspberry',
        language: 'python',
        generator: 'micropython',
        compileStrategy: 'micropython-flash',
        chip: 'Broadcom BCM2710A1',
        summary: 'Wireless Raspberry Pi option for low-power connected applications and kiosks.'
    },
    'Raspberry Pi 3': {
        family: 'raspberry',
        language: 'python',
        generator: 'micropython',
        compileStrategy: 'micropython-flash',
        chip: 'Broadcom BCM2837',
        summary: 'Balanced Raspberry Pi board for mixed software + hardware integration work.'
    },
    'Raspberry Pi 4': {
        family: 'raspberry',
        language: 'python',
        generator: 'micropython',
        compileStrategy: 'micropython-flash',
        chip: 'Broadcom BCM2711',
        summary: 'High-performance Raspberry Pi board for demanding maker and lab workloads.'
    },
    'Raspberry Pi 5': {
        family: 'raspberry',
        language: 'python',
        generator: 'micropython',
        compileStrategy: 'micropython-flash',
        chip: 'Broadcom BCM2712',
        summary: 'Latest Raspberry Pi platform for advanced prototyping and compute-heavy tasks.'
    }
};

