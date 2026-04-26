const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'apps/web/public/boards');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// Helper to generate castellated edges (pins)
const generatePins = (startX, startY, count, spacing, isHorizontal) => {
    let pins = '';
    for (let i = 0; i < count; i++) {
        const x = isHorizontal ? startX + (i * spacing) : startX;
        const y = isHorizontal ? startY : startY + (i * spacing);
        pins += `<circle cx="${x}" cy="${y}" r="4" fill="#fbbf24" opacity="0.8"/>\n`;
        pins += `<circle cx="${x}" cy="${y}" r="2" fill="#0f172a" opacity="0.9"/>\n`;
    }
    return pins;
};

// Base SVG wrapper
const wrapSVG = (content) => `
<svg width="600" height="400" viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#020617"/>
    </radialGradient>
    <linearGradient id="boardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <linearGradient id="boardGradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#075985"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="shadow" x="-5%" y="-5%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.6"/>
    </filter>
  </defs>
  <rect width="600" height="400" fill="url(#bg)"/>
  <g filter="url(#shadow)">
    ${content}
  </g>
</svg>`;

const createPicoSVG = (chipLabel, hasWifi) => {
    return wrapSVG(`
      <!-- Board Base -->
      <rect x="230" y="80" width="140" height="260" rx="8" fill="url(#boardGrad)" stroke="#34d399" stroke-width="2"/>
      
      <!-- Edges/Pins -->
      ${generatePins(230, 95, 20, 12, false)}
      ${generatePins(370, 95, 20, 12, false)}
      
      <!-- USB Port -->
      <rect x="280" y="70" width="40" height="15" rx="2" fill="#94a3b8"/>
      <rect x="285" y="68" width="30" height="4" fill="#475569"/>
      
      <!-- Main Chip -->
      <rect x="270" y="150" width="60" height="60" rx="4" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
      <circle cx="278" cy="158" r="3" fill="#334155"/>
      <text x="300" y="180" font-family="monospace" font-size="10" font-weight="bold" fill="#64748b" text-anchor="middle" letter-spacing="1">${chipLabel}</text>
      <text x="300" y="195" font-family="monospace" font-size="7" fill="#475569" text-anchor="middle">ARM Cortex</text>
      
      <!-- Wifi Module -->
      ${hasWifi ? `
      <rect x="275" y="240" width="50" height="50" rx="2" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1"/>
      <path d="M285 245 L315 245 L315 270" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="2 4"/>
      <text x="300" y="280" font-family="monospace" font-size="8" fill="#475569" text-anchor="middle">WiFi/BT</text>
      ` : `
      <rect x="285" y="250" width="30" height="30" rx="2" fill="#0f172a"/>
      `}
      
      <!-- Boot Button -->
      <circle cx="300" cy="115" r="8" fill="#1e293b" stroke="#cbd5e1" stroke-width="1"/>
      <circle cx="300" cy="115" r="4" fill="#f8fafc"/>
      
      <!-- RP Logo styling -->
      <text x="340" y="320" font-family="sans-serif" font-size="14" font-weight="900" fill="#a7f3d0" transform="rotate(-90 340 320)">PICO</text>
    `);
};

const createPiSVG = (modelLabel, chipLabel) => {
    return wrapSVG(`
      <!-- Board Base -->
      <rect x="150" y="120" width="300" height="200" rx="10" fill="url(#boardGrad)" stroke="#34d399" stroke-width="2"/>
      
      <!-- 40-pin GPIO Header -->
      <rect x="170" y="125" width="220" height="20" fill="#1e293b"/>
      ${generatePins(175, 130, 20, 11, true)}
      ${generatePins(175, 140, 20, 11, true)}
      
      <!-- Broadcom SOC -->
      <rect x="250" y="180" width="70" height="70" rx="4" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
      <circle cx="260" cy="190" r="4" fill="#334155"/>
      <text x="285" y="215" font-family="monospace" font-size="10" font-weight="bold" fill="#64748b" text-anchor="middle">${chipLabel}</text>
      <text x="285" y="230" font-family="monospace" font-size="8" fill="#475569" text-anchor="middle">Broadcom</text>
      
      <!-- RAM Chip -->
      ${['4', '5'].some(v => modelLabel.includes(v)) ? `
      <rect x="340" y="190" width="40" height="50" rx="2" fill="#0f172a"/>
      <text x="360" y="215" font-family="monospace" font-size="7" fill="#64748b" text-anchor="middle" transform="rotate(-90 360 215)">LPDDR4</text>
      ` : ''}

      <!-- Ports -->
      <rect x="430" y="150" width="30" height="40" rx="2" fill="#94a3b8"/>
      <rect x="430" y="200" width="30" height="40" rx="2" fill="#94a3b8"/>
      <rect x="430" y="250" width="30" height="50" rx="2" fill="#64748b"/>
      
      <!-- IO -->
      <rect x="180" y="310" width="25" height="15" fill="#cbd5e1"/>
      <rect x="220" y="310" width="20" height="15" fill="#f8fafc"/>
      <rect x="260" y="310" width="20" height="15" fill="#f8fafc"/>
      
      <!-- Styling/Logo -->
      <text x="180" y="290" font-family="sans-serif" font-size="20" font-weight="900" fill="#a7f3d0">Raspberry ${modelLabel}</text>
    `);
};

fs.writeFileSync(path.join(outDir, 'board_pico.svg'), createPicoSVG('RP2040', false));
fs.writeFileSync(path.join(outDir, 'board_pico_w.svg'), createPicoSVG('RP2040', true));
fs.writeFileSync(path.join(outDir, 'board_pico_2w.svg'), createPicoSVG('RP2350', true));
fs.writeFileSync(path.join(outDir, 'board_pi_zero.svg'), createPiSVG('Zero', 'BCM2835'));
fs.writeFileSync(path.join(outDir, 'board_pi3.svg'), createPiSVG('Pi 3', 'BCM2837'));
fs.writeFileSync(path.join(outDir, 'board_pi4.svg'), createPiSVG('Pi 4', 'BCM2711'));
fs.writeFileSync(path.join(outDir, 'board_pi5.svg'), createPiSVG('Pi 5', 'BCM2712'));

console.log("SVGs generated successfully.");
