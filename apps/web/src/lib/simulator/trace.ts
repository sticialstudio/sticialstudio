import type { SimulationTraceEvent } from './simulationTypes';

function toIdentifier(pin: string) {
  return pin.replace(/[^A-Za-z0-9_]/g, '_');
}

export function exportTraceEventsToVcd(traceEvents: SimulationTraceEvent[], title = 'CircuitLabTrace') {
  const sortedEvents = [...traceEvents].sort((left, right) => left.cycle - right.cycle || left.pin.localeCompare(right.pin));
  const pins = Array.from(new Set(sortedEvents.map((event) => event.pin))).sort();
  const ids = pins.reduce<Record<string, string>>((record, pin, index) => {
    record[pin] = `p${index}`;
    return record;
  }, {});

  const lines: string[] = [];
  lines.push('$date');
  lines.push(`  ${new Date().toISOString()}`);
  lines.push('$end');
  lines.push('$version');
  lines.push(`  ${title}`);
  lines.push('$end');
  lines.push('$timescale 1ns $end');
  lines.push('$scope module logic $end');
  pins.forEach((pin) => {
    lines.push(`$var wire 1 ${ids[pin]} ${toIdentifier(pin)} $end`);
  });
  lines.push('$upscope $end');
  lines.push('$enddefinitions $end');

  const grouped = new Map<number, SimulationTraceEvent[]>();
  sortedEvents.forEach((event) => {
    if (!grouped.has(event.cycle)) {
      grouped.set(event.cycle, []);
    }
    grouped.get(event.cycle)?.push(event);
  });

  grouped.forEach((events, cycle) => {
    lines.push(`#${cycle}`);
    events.forEach((event) => {
      lines.push(`${event.high ? '1' : '0'}${ids[event.pin]}`);
    });
  });

  return lines.join('\n');
}
