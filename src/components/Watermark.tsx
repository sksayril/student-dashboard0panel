import React from 'react';

interface WatermarkProps {
  text?: string;
  opacity?: number;
  fontSize?: string;
  rotation?: number;
  position?: 'fixed' | 'absolute';
  zIndex?: number;
}

export default function Watermark({
  text = 'AG',
  opacity = 0.05,
  fontSize = '12rem',
  rotation = -45,
  position = 'fixed',
  zIndex = 0,
}: WatermarkProps) {
  return (
    <div
      className="pointer-events-none select-none"
      style={{
        position,
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        fontSize,
        fontWeight: 900,
        color: '#ffffff',
        opacity,
        zIndex,
        whiteSpace: 'nowrap',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        letterSpacing: '0.5rem',
      }}
    >
      {text}
    </div>
  );
}

