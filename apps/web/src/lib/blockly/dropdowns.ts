import { getDigitalPins, getAnalogPins, getPWMPins, getFormattedPinLabel } from '../../utils/boardUtils';
import { getMappedHardwareInstances } from '@/lib/blockly/circuitAwareness';
import { useCircuitStore } from '@/stores/circuitStore';

export const getSelectedBoard = () =>
  typeof window !== 'undefined' ? (window as any).SELECTED_BOARD || 'Arduino Uno' : 'Arduino Uno';

export const getDigitalPinOptions = () => {
  const board = getSelectedBoard();
  const pins = getDigitalPins(board);
  return pins.length > 0 ? pins.map((pin) => [getFormattedPinLabel(board, pin), String(pin)]) : [['None', 'None']];
};

export const getAnalogPinOptions = () => {
  const board = getSelectedBoard();
  const pins = getAnalogPins(board);
  return pins.length > 0 ? pins.map((pin) => [getFormattedPinLabel(board, pin), String(pin)]) : [['None', 'None']];
};

export const getPWMPinOptions = () => {
  const board = getSelectedBoard();
  const pins = getPWMPins(board);
  return pins.length > 0 ? pins.map((pin) => [getFormattedPinLabel(board, pin), String(pin)]) : [['None', 'None']];
};

/**
 * Returns Blockly dropdown options for circuit-mapped hardware components.
 * Only components with the required resolved signal pins are surfaced in Coding Mode.
 */
export const getHardwareInstances = (type: string): [string, string][] => {
  const { codingSnapshot } = useCircuitStore.getState();
  return getMappedHardwareInstances(codingSnapshot, type);
};

export const getLedInstances = () => getHardwareInstances('LED');
export const getServoInstances = () => getHardwareInstances('Servo');
export const getUltrasonicInstances = () => getHardwareInstances('Ultrasonic');
export const getDhtInstances = () => getHardwareInstances('DHT');
export const getOledInstances = () => getHardwareInstances('OLED');
export const getPirInstances = () => getHardwareInstances('PIR');
export const getTouchInstances = () => getHardwareInstances('Touch');
export const getSoilMoistureInstances = () => getHardwareInstances('SoilMoisture');
export const getRainInstances = () => getHardwareInstances('Rain');
export const getWaterLevelInstances = () => getHardwareInstances('WaterLevel');
export const getPotentiometerInstances = () => getHardwareInstances('Potentiometer');
export const getPhotoSensorInstances = () => getHardwareInstances('PhotoSensor');
export const getSoundSensorInstances = () => getHardwareInstances('SoundSensor');
export const getButtonInstances = () => getHardwareInstances('Button');
export const getRelayInstances = () => getHardwareInstances('Relay');
export const getBuzzerInstances = () => getHardwareInstances('Buzzer');
export const getNeopixelInstances = () => getHardwareInstances('NeoPixel');
export const getIrObstacleInstances = () => getHardwareInstances('IRObstacle');