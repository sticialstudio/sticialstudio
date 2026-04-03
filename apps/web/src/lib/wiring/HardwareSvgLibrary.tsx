// src/lib/wiring/HardwareSvgLibrary.tsx

import React from 'react';

// --- ULTRASONIC SENSOR (HC-SR04) ---
export const UltrasonicSensorSvg = ({ width = 120, height = 80 }) => (
    <g>
        {/* PCB Base */}
        <rect x="0" y="0" width={width} height={height} rx="4" fill="#155e75" stroke="#164e63" strokeWidth="2" />
        
        {/* Transmitter Cylinder (Left) */}
        <circle cx="35" cy="40" r="22" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" />
        <circle cx="35" cy="40" r="18" fill="#cbd5e1" />
        <circle cx="35" cy="40" r="6" fill="#0f172a" opacity="0.8" />
        <path d="M 20 40 A 15 15 0 0 1 50 40" fill="none" stroke="#64748b" strokeWidth="2" opacity="0.5" />
        
        {/* Receiver Cylinder (Right) */}
        <circle cx="85" cy="40" r="22" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="3" />
        <circle cx="85" cy="40" r="18" fill="#cbd5e1" />
        <circle cx="85" cy="40" r="6" fill="#0f172a" opacity="0.8" />
        <path d="M 70 40 A 15 15 0 0 1 100 40" fill="none" stroke="#64748b" strokeWidth="2" opacity="0.5" />
        
        {/* Crystal Oscillator */}
        <rect x="52" y="60" width="16" height="8" rx="2" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
        
        {/* Top Text */}
        <text x="60" y="16" fill="white" fontSize="10" textAnchor="middle" fontWeight="bold" opacity="0.9" fontFamily="monospace">
            HC-SR04
        </text>
        
        {/* Pin Header Base (Black Plastic) */}
        <rect x="35" y="80" width="50" height="8" fill="#1e293b" />
    </g>
);

// --- LED (Standard 5mm) ---
export const LedSvg = ({ width = 120, height = 80, color = 'red' }) => {
    // Map abstract colors to hex
    const colorMap: Record<string, string> = {
        'red': '#ef4444',
        'green': '#22c55e',
        'blue': '#3b82f6',
        'yellow': '#eab308'
    };
    const fillHex = colorMap[color.toLowerCase()] || '#ef4444';

    return (
        <g>
            {/* Base Box (Invisible, just for alignment if needed, but we'll draw actual legs) */}
            <rect x="0" y="0" width={width} height={height} fill="transparent" />
            
            {/* Left Leg (Anode - Long) */}
            <rect x="45.6" y="60" width="4" height="25" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            
            {/* Right Leg (Cathode - Short, usually flat side) */}
            <rect x="60.0" y="60" width="4" height="25" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <line x1="61.2" y1="65" x2="61.2" y2="70" stroke="#94a3b8" strokeWidth="2" /> {/* Kink detail */}
            
            {/* Bulb Dome */}
            <path d="M 40.8 60 C 40.8 20, 64.8 20, 64.8 60 Z" fill={fillHex} opacity="0.85" />
            
            {/* Inner Anvil/Post (Inside LED) */}
            <path d="M 45.6 60 L 45.6 45 L 48.6 45 L 48.6 60 Z" fill="#94a3b8" />
            <path d="M 57.6 60 L 57.6 42 L 63.6 42 L 63.6 60 Z" fill="#94a3b8" />
            
            {/* Flat edge on Right (Cathode side) */}
            <rect x="64.8" y="55" width="4" height="6" fill="#cbd5e1" opacity="0.5" />

            {/* Shine Highlight */}
            <path d="M 46.8 35 A 10 15 0 0 1 52.8 25" fill="none" stroke="white" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
        </g>
    );
};

// --- SERVO MOTOR (SG90 Micro Servo) ---
export const ServoSvg = ({ width = 120, height = 80 }) => (
    <g>
        {/* Main Body (Blue plastic) */}
        <rect x="20" y="30" width="80" height="50" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
        <rect x="10" y="45" width="100" height="12" rx="1" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
        
        {/* Mounting Holes */}
        <circle cx="15" cy="51" r="3" fill="#0f172a" />
        <circle cx="105" cy="51" r="3" fill="#0f172a" />
        
        {/* Top Rotor Housing */}
        <rect x="35" y="15" width="50" height="15" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
        
        {/* Motor Shaft Dome */}
        <circle cx="60" cy="15" r="16" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
        
        {/* Servo Horn (White Plastic Arm) */}
        <g transform="rotate(30 60 15)">
            <rect x="42" y="11" width="36" height="8" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx="60" cy="15" r="4" fill="#cbd5e1" /> {/* Center Screw */}
            <circle cx="48" cy="15" r="1.5" fill="#94a3b8" />
            <circle cx="72" cy="15" r="1.5" fill="#94a3b8" />
        </g>
        
        {/* Label Text */}
        <text x="60" y="70" fill="white" fontSize="10" textAnchor="middle" fontWeight="bold" opacity="0.9" fontFamily="sans-serif">
            SG90
        </text>

        {/* Cable exit on the right */}
        <rect x="100" y="65" width="10" height="6" fill="#334155" />
    </g>
);

// --- DHT11 Temperature/Humidity Sensor ---
export const Dht11Svg = ({ width = 120, height = 80 }) => (
    <g>
        {/* Breakout Board */}
        <rect x="25" y="15" width="70" height="65" rx="3" fill="#020617" stroke="#1e293b" strokeWidth="2" />
        
        {/* Main Blue Sensor Box */}
        <rect x="35" y="5" width="50" height="60" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
        
        {/* Plastic Grill Lines */}
        <line x1="40" y1="15" x2="80" y2="15" stroke="#0369a1" strokeWidth="2" />
        <line x1="40" y1="25" x2="80" y2="25" stroke="#0369a1" strokeWidth="2" />
        <line x1="40" y1="35" x2="80" y2="35" stroke="#0369a1" strokeWidth="2" />
        <line x1="40" y1="45" x2="80" y2="45" stroke="#0369a1" strokeWidth="2" />
        <line x1="40" y1="55" x2="80" y2="55" stroke="#0369a1" strokeWidth="2" />
        
        {/* Label */}
        <text x="60" y="75" fill="white" fontSize="8" textAnchor="middle" fontWeight="bold" opacity="0.8" fontFamily="monospace">
            DHT11
        </text>
        
        {/* Pin Header Base */}
        <rect x="45" y="80" width="30" height="6" fill="#1e293b" />
    </g>
);

// --- OLED DISPLAY (128x64 I2C) ---
export const OledSvg = ({ width = 120, height = 80 }) => (
    <g>
        {/* PCB Board */}
        <rect x="10" y="0" width="100" height="80" rx="4" fill="#1e1b4b" stroke="#312e81" strokeWidth="2" />
        
        {/* Mounting Holes */}
        <circle cx="18" cy="8" r="3" fill="#0f172a" />
        <circle cx="102" cy="8" r="3" fill="#0f172a" />
        <circle cx="18" cy="72" r="3" fill="#0f172a" />
        <circle cx="102" cy="72" r="3" fill="#0f172a" />
        
        {/* Glass Screen */}
        <rect x="20" y="20" width="80" height="40" rx="2" fill="#020617" stroke="#334155" strokeWidth="1" />
        <rect x="25" y="25" width="70" height="30" fill="#09090b" />
        
        {/* Faux Pixels (Cyan details) */}
        <text x="60" y="43" fill="#22d3ee" fontSize="12" textAnchor="middle" fontWeight="bold" fontFamily="monospace">
            128x64
        </text>
        <rect x="28" y="28" width="64" height="5" fill="#4f46e5" opacity="0.4" />
        
        {/* Pin Header Base */}
        <rect x="35" y="80" width="50" height="6" fill="#1e293b" />
    </g>
);

// --- GENERIC COMPONENT (Fallback) ---
export const GenericComponentSvg = ({ width = 120, height = 80, name = 'Sensor' }) => (
    <g>
        <rect x="10" y="10" width="100" height="70" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="2" />
        
        <rect x="10" y="10" width="100" height="20" rx="0" fill="#0f172a" />
        
        {/* Generic Chip Outline */}
        <rect x="40" y="40" width="40" height="20" fill="#020617" stroke="#334155" strokeWidth="1" />
        
        <text x="60" y="24" fill="#e2e8f0" fontSize="10" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">
            {name.substring(0, 15)}
        </text>

        {/* Pin Header Base */}
        <rect x="20" y="80" width="80" height="6" fill="#1e293b" />
    </g>
);
