import type { editor, languages } from 'monaco-editor';

type EditorLanguage = 'cpp' | 'python';
type CompletionKind = 'class' | 'constant' | 'function' | 'method' | 'module';

interface CompletionEntry {
  label: string;
  detail: string;
  documentation: string;
  kind?: CompletionKind;
  insertText?: string;
}

type MonacoLike = {
  Range: new (
    startLineNumber: number,
    startColumn: number,
    endLineNumber: number,
    endColumn: number
  ) => NonNullable<languages.Hover['range']>;
  languages: {
    CompletionItemKind: {
      Class: languages.CompletionItemKind;
      Constant: languages.CompletionItemKind;
      Function: languages.CompletionItemKind;
      Method: languages.CompletionItemKind;
      Module: languages.CompletionItemKind;
    };
    registerCompletionItemProvider: (
      language: EditorLanguage,
      provider: languages.CompletionItemProvider
    ) => unknown;
    registerHoverProvider: (
      language: EditorLanguage,
      provider: languages.HoverProvider
    ) => unknown;
  };
};

const REGISTRY_FLAG = '__edtechMonacoAssistProvidersRegistered__';

function getCompletionKind(monacoInstance: MonacoLike, kind: CompletionKind = 'function') {
  switch (kind) {
    case 'class':
      return monacoInstance.languages.CompletionItemKind.Class;
    case 'constant':
      return monacoInstance.languages.CompletionItemKind.Constant;
    case 'method':
      return monacoInstance.languages.CompletionItemKind.Method;
    case 'module':
      return monacoInstance.languages.CompletionItemKind.Module;
    default:
      return monacoInstance.languages.CompletionItemKind.Function;
  }
}

function registerLanguageAssist(
  monacoInstance: MonacoLike,
  language: EditorLanguage,
  entries: CompletionEntry[]
) {
  const docsByLabel = Object.fromEntries(entries.map((entry) => [entry.label, entry.documentation]));

  monacoInstance.languages.registerCompletionItemProvider(language, {
    provideCompletionItems: (model: editor.ITextModel, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: languages.CompletionItem[] = entries.map((entry) => ({
        label: entry.label,
        kind: getCompletionKind(monacoInstance, entry.kind),
        insertText: entry.insertText || entry.label,
        detail: entry.detail,
        documentation: entry.documentation,
        range,
      }));

      return { suggestions };
    },
  });

  monacoInstance.languages.registerHoverProvider(language, {
    provideHover: (model: editor.ITextModel, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) {
        return null;
      }

      const documentation = docsByLabel[word.word];
      if (!documentation) {
        return null;
      }

      return {
        range: new monacoInstance.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        ),
        contents: [
          { value: `**${word.word}**` },
          { value: documentation },
        ],
      };
    },
  });
}

const ARDUINO_ENTRIES: CompletionEntry[] = [
  {
    label: 'setup',
    detail: 'Arduino lifecycle',
    documentation:
      'The setup() function runs once when the sketch starts. Use it to configure pins, initialize libraries, and set initial state.',
    kind: 'function',
  },
  {
    label: 'loop',
    detail: 'Arduino lifecycle',
    documentation:
      'The loop() function runs repeatedly after setup() completes. Put your recurring runtime logic here.',
    kind: 'function',
  },
  {
    label: 'pinMode',
    detail: 'Arduino built-in',
    documentation: 'Configure a digital pin to behave as INPUT, OUTPUT, or INPUT_PULLUP.',
    kind: 'function',
  },
  {
    label: 'digitalWrite',
    detail: 'Arduino built-in',
    documentation: 'Write a HIGH or LOW value to a digital output pin.',
    kind: 'function',
  },
  {
    label: 'digitalRead',
    detail: 'Arduino built-in',
    documentation: 'Read the current HIGH or LOW value from a digital input pin.',
    kind: 'function',
  },
  {
    label: 'analogRead',
    detail: 'Arduino built-in',
    documentation: 'Read the analog value from a supported analog input pin.',
    kind: 'function',
  },
  {
    label: 'analogWrite',
    detail: 'Arduino built-in',
    documentation: 'Write a PWM-style analog value to a supported output pin.',
    kind: 'function',
  },
  {
    label: 'tone',
    detail: 'Arduino built-in',
    documentation: 'Generate a square-wave tone on a pin at a specific frequency.',
    kind: 'function',
  },
  {
    label: 'noTone',
    detail: 'Arduino built-in',
    documentation: 'Stop tone generation on a pin previously used with tone().',
    kind: 'function',
  },
  {
    label: 'delay',
    detail: 'Arduino timing',
    documentation: 'Pause the sketch for the given number of milliseconds.',
    kind: 'function',
  },
  {
    label: 'delayMicroseconds',
    detail: 'Arduino timing',
    documentation: 'Pause the sketch for the given number of microseconds.',
    kind: 'function',
  },
  {
    label: 'millis',
    detail: 'Arduino timing',
    documentation: 'Return the number of milliseconds since the board started the current program.',
    kind: 'function',
  },
  {
    label: 'micros',
    detail: 'Arduino timing',
    documentation: 'Return the number of microseconds since the board started the current program.',
    kind: 'function',
  },
  {
    label: 'Serial',
    detail: 'Arduino serial',
    documentation: 'Primary serial interface used to communicate with a computer or another device.',
    kind: 'module',
  },
  {
    label: 'HIGH',
    detail: 'Arduino constant',
    documentation: 'Digital pin state constant representing a high output or logic level.',
    kind: 'constant',
  },
  {
    label: 'LOW',
    detail: 'Arduino constant',
    documentation: 'Digital pin state constant representing a low output or logic level.',
    kind: 'constant',
  },
  {
    label: 'INPUT',
    detail: 'Arduino constant',
    documentation: 'Pin mode constant that configures a pin as an input.',
    kind: 'constant',
  },
  {
    label: 'OUTPUT',
    detail: 'Arduino constant',
    documentation: 'Pin mode constant that configures a pin as an output.',
    kind: 'constant',
  },
  {
    label: 'INPUT_PULLUP',
    detail: 'Arduino constant',
    documentation: 'Pin mode constant that enables a pin as input with its internal pull-up resistor.',
    kind: 'constant',
  },
  {
    label: 'LED_BUILTIN',
    detail: 'Arduino constant',
    documentation: "Pin number connected to the board's built-in status LED.",
    kind: 'constant',
  },
];

const MICROPYTHON_ENTRIES: CompletionEntry[] = [
  {
    label: 'Pin',
    detail: 'machine.Pin',
    documentation: 'Use machine.Pin to configure and read or write GPIO pins in MicroPython.',
    kind: 'class',
  },
  {
    label: 'PWM',
    detail: 'machine.PWM',
    documentation: 'Use machine.PWM to drive PWM outputs for LEDs, buzzers, motors, and servos.',
    kind: 'class',
  },
  {
    label: 'ADC',
    detail: 'machine.ADC',
    documentation: 'Use machine.ADC to read analog values from supported input pins.',
    kind: 'class',
  },
  {
    label: 'I2C',
    detail: 'machine.I2C',
    documentation: 'Use machine.I2C to communicate with I2C sensors and displays.',
    kind: 'class',
  },
  {
    label: 'SPI',
    detail: 'machine.SPI',
    documentation: 'Use machine.SPI to communicate with SPI devices such as displays, radios, and sensors.',
    kind: 'class',
  },
  {
    label: 'UART',
    detail: 'machine.UART',
    documentation: 'Use machine.UART for serial communication with peripherals or other boards.',
    kind: 'class',
  },
  {
    label: 'Timer',
    detail: 'machine.Timer',
    documentation: 'Use machine.Timer to schedule periodic or one-shot callbacks.',
    kind: 'class',
  },
  {
    label: 'WLAN',
    detail: 'network.WLAN',
    documentation: 'Use network.WLAN to enable Wi-Fi and connect the board to a network.',
    kind: 'class',
  },
  {
    label: 'NeoPixel',
    detail: 'neopixel.NeoPixel',
    documentation: 'Use NeoPixel to control addressable RGB LEDs from MicroPython.',
    kind: 'class',
  },
  {
    label: 'sleep',
    detail: 'time.sleep',
    documentation: 'Pause execution for the given number of seconds.',
    kind: 'function',
  },
  {
    label: 'sleep_ms',
    detail: 'time.sleep_ms',
    documentation: 'Pause execution for the given number of milliseconds.',
    kind: 'function',
  },
  {
    label: 'ticks_ms',
    detail: 'time.ticks_ms',
    documentation: 'Return a millisecond counter that is useful for non-blocking timing logic.',
    kind: 'function',
  },
  {
    label: 'ticks_diff',
    detail: 'time.ticks_diff',
    documentation: 'Compute a safe time difference between two tick values.',
    kind: 'function',
  },
  {
    label: 'freq',
    detail: 'machine.freq',
    documentation: 'Read or set the CPU frequency on boards that expose machine.freq().',
    kind: 'function',
  },
  {
    label: 'reset',
    detail: 'machine.reset',
    documentation: 'Reset the MicroPython runtime and reboot the board.',
    kind: 'function',
  },
  {
    label: 'value',
    detail: 'Pin.value',
    documentation: 'Read or write the current digital value of a configured pin.',
    kind: 'method',
  },
  {
    label: 'on',
    detail: 'Pin.on',
    documentation: 'Drive a digital output pin to its active high state.',
    kind: 'method',
  },
  {
    label: 'off',
    detail: 'Pin.off',
    documentation: 'Drive a digital output pin to its inactive low state.',
    kind: 'method',
  },
  {
    label: 'read_u16',
    detail: 'ADC.read_u16',
    documentation: 'Read a 16-bit scaled ADC sample from the selected analog input.',
    kind: 'method',
  },
  {
    label: 'duty_u16',
    detail: 'PWM.duty_u16',
    documentation: 'Set the PWM duty cycle using a 16-bit value.',
    kind: 'method',
  },
  {
    label: 'from machine import Pin',
    detail: 'MicroPython import',
    documentation: 'Import the Pin class from the machine module.',
    kind: 'module',
    insertText: 'from machine import Pin',
  },
  {
    label: 'import time',
    detail: 'MicroPython import',
    documentation: 'Import the time helpers used for delays and non-blocking timing.',
    kind: 'module',
    insertText: 'import time',
  },
];

export function registerEditorAssistProviders(monacoInstance: MonacoLike) {
  const registryHost = globalThis as typeof globalThis & { [REGISTRY_FLAG]?: boolean };
  if (registryHost[REGISTRY_FLAG]) {
    return;
  }

  registryHost[REGISTRY_FLAG] = true;
  registerLanguageAssist(monacoInstance, 'cpp', ARDUINO_ENTRIES);
  registerLanguageAssist(monacoInstance, 'python', MICROPYTHON_ENTRIES);
}

export function registerArduinoCompletions(monacoInstance: MonacoLike) {
  registerEditorAssistProviders(monacoInstance);
}