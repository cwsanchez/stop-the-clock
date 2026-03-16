import React, { useEffect, useState, useRef } from 'react';

function Particle({ style }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={style}
    />
  );
}

export default function FeverParticles({ multiplier, active }) {
  const [particles, setParticles] = useState([]);
  const idCounter = useRef(0);

  useEffect(() => {
    if (!active || multiplier < 2) {
      setParticles([]);
      return;
    }

    const count = Math.min(Math.floor((multiplier - 1) * 3), 12);
    const interval = Math.max(200 - (multiplier * 20), 60);

    const timer = setInterval(() => {
      const id = idCounter.current++;
      const x = Math.random() * 100;
      const size = 2 + Math.random() * (multiplier * 1.5);
      const duration = 1000 + Math.random() * 800;
      const hue = multiplier >= 4 ? Math.random() * 60 : 20 + Math.random() * 30;
      const brightness = multiplier >= 4 ? '100%' : '70%';

      setParticles(prev => {
        const next = [...prev, { id, x, size, duration, hue, brightness, born: Date.now() }];
        return next.slice(-30);
      });

      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== id));
      }, duration);
    }, interval);

    return () => clearInterval(timer);
  }, [multiplier, active]);

  if (!active || multiplier < 2) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map(p => (
        <Particle
          key={p.id}
          style={{
            left: `${p.x}%`,
            bottom: '0%',
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: `hsl(${p.hue}, 100%, ${p.brightness})`,
            boxShadow: `0 0 ${p.size * 2}px hsl(${p.hue}, 100%, ${p.brightness})`,
            animation: `ember-float ${p.duration}ms ease-out forwards`,
          }}
        />
      ))}
    </div>
  );
}
