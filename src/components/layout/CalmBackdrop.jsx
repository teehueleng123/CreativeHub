import { useEffect, useRef } from 'react';

// ==========================================
// STYLE 1: SCENIC SANCTUARY (NATURE LANDSCAPES)
// ==========================================
const SCENIC_CONFIG = {
  twilight: {
    id: 'twilight',
    title: 'Twilight Lake',
    image: '/scenes/twilight-lake.jpg',
    overlay:
      'linear-gradient(180deg, rgba(9, 20, 27, 0.38) 0%, rgba(9, 20, 27, 0.2) 55%, rgba(7, 15, 20, 0.52) 100%)',
    particleColor: 'rgba(196, 240, 230, ',
  },
  dawn: {
    id: 'dawn',
    title: 'Misty Dawn',
    image: '/scenes/misty-dawn.jpg',
    overlay:
      'linear-gradient(180deg, rgba(242, 246, 242, 0.28) 0%, rgba(242, 246, 242, 0.14) 55%, rgba(235, 240, 236, 0.35) 100%)',
    particleColor: 'rgba(255, 252, 240, ',
  },
  forest: {
    id: 'forest',
    title: 'Forest Sanctuary',
    image: '/scenes/forest-sanctuary.jpg',
    overlay:
      'linear-gradient(180deg, rgba(8, 20, 16, 0.36) 0%, rgba(8, 20, 16, 0.18) 55%, rgba(6, 16, 13, 0.46) 100%)',
    particleColor: 'rgba(210, 245, 220, ',
  },
};

SCENIC_CONFIG.atelier = SCENIC_CONFIG.twilight;
SCENIC_CONFIG.zen = SCENIC_CONFIG.twilight;
SCENIC_CONFIG.solarium = SCENIC_CONFIG.twilight;
SCENIC_CONFIG.mirror = SCENIC_CONFIG.twilight;
SCENIC_CONFIG.dunes = SCENIC_CONFIG.twilight;
SCENIC_CONFIG.pavilion = SCENIC_CONFIG.twilight;

// ==========================================
// STYLE 2: ASTONISHING SURREAL DREAMSCAPES
// ==========================================
const SURREAL_CONFIG = {
  mirror: {
    id: 'mirror',
    title: 'Infinite Mirror Sea',
    image: '/scenes/mirror-sea.jpg',
    overlay:
      'linear-gradient(180deg, rgba(255, 244, 242, 0.24) 0%, rgba(255, 238, 235, 0.12) 55%, rgba(248, 226, 222, 0.38) 100%)',
    particleColor: 'rgba(255, 228, 218, ',
  },
  dunes: {
    id: 'dunes',
    title: 'Silk Sand Dunes',
    image: '/scenes/silk-dunes.jpg',
    overlay:
      'linear-gradient(180deg, rgba(246, 238, 252, 0.25) 0%, rgba(246, 238, 252, 0.12) 55%, rgba(236, 222, 248, 0.38) 100%)',
    particleColor: 'rgba(235, 215, 255, ',
  },
  pavilion: {
    id: 'pavilion',
    title: 'Cloud Pavilion',
    image: '/scenes/cloud-pavilion.jpg',
    overlay:
      'linear-gradient(180deg, rgba(255, 248, 235, 0.25) 0%, rgba(255, 248, 235, 0.12) 55%, rgba(252, 236, 210, 0.38) 100%)',
    particleColor: 'rgba(255, 235, 185, ',
  },
};

// Aliases for Style 2
SURREAL_CONFIG.atelier = SURREAL_CONFIG.mirror;
SURREAL_CONFIG.zen = SURREAL_CONFIG.dunes;
SURREAL_CONFIG.solarium = SURREAL_CONFIG.pavilion;
SURREAL_CONFIG.twilight = SURREAL_CONFIG.mirror;
SURREAL_CONFIG.forest = SURREAL_CONFIG.dunes;
SURREAL_CONFIG.dawn = SURREAL_CONFIG.pavilion;

// ==========================================
// STYLE 3: THE COSMIC OBSERVATORY / GALAXY
// ==========================================
const GALAXY_CONFIG = {
  nebula: {
    id: 'nebula',
    title: 'Violet Nebula',
    image: '/scenes/galaxy-nebula.jpg',
    overlay:
      'linear-gradient(180deg, rgba(7, 4, 18, 0.42) 0%, rgba(7, 4, 18, 0.22) 50%, rgba(4, 2, 12, 0.62) 100%)',
    particleColor: 'rgba(216, 180, 254, ',
  },
  stargate: {
    id: 'stargate',
    title: 'Andromeda Galaxy',
    image: '/scenes/galaxy-stargate.jpg',
    overlay:
      'linear-gradient(180deg, rgba(3, 7, 18, 0.42) 0%, rgba(3, 7, 18, 0.20) 50%, rgba(2, 4, 12, 0.58) 100%)',
    particleColor: 'rgba(125, 211, 252, ',
  },
  aurora: {
    id: 'aurora',
    title: 'Webb Deep Field',
    image: '/scenes/galaxy-aurora.jpg',
    overlay:
      'linear-gradient(180deg, rgba(6, 4, 14, 0.42) 0%, rgba(6, 4, 14, 0.20) 50%, rgba(3, 2, 8, 0.58) 100%)',
    particleColor: 'rgba(251, 191, 36, ',
  },
};

GALAXY_CONFIG.cosmos = GALAXY_CONFIG.nebula;
GALAXY_CONFIG.twilight = GALAXY_CONFIG.nebula;
GALAXY_CONFIG.mirror = GALAXY_CONFIG.nebula;
GALAXY_CONFIG.dunes = GALAXY_CONFIG.stargate;
GALAXY_CONFIG.pavilion = GALAXY_CONFIG.aurora;

// ==========================================
// DEDICATED LOGIN PORTAL: THE CELESTIAL VAULT
// ==========================================
const LOGIN_CONFIG = {
  id: 'login',
  title: 'The Celestial Vault',
  image: '/scenes/login-vault.jpg',
  overlay:
    'linear-gradient(135deg, rgba(6, 10, 18, 0.82) 0%, rgba(10, 15, 26, 0.65) 50%, rgba(4, 7, 12, 0.9) 100%)',
  particleColor: 'rgba(255, 220, 150, ',
};

export default function CalmBackdrop({ designStyle = 'atelier', atmosphere = 'mirror' }) {
  const canvasRef = useRef(null);

  const isSanctuary = designStyle === 'sanctuary';
  const isCosmos = designStyle === 'cosmos';
  const scene =
    designStyle === 'login'
      ? LOGIN_CONFIG
      : isSanctuary
        ? SCENIC_CONFIG[atmosphere] || SCENIC_CONFIG.twilight
        : isCosmos
          ? GALAXY_CONFIG[atmosphere] || GALAXY_CONFIG.nebula
          : SURREAL_CONFIG[atmosphere] || SURREAL_CONFIG.mirror;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const count = isSanctuary ? 28 : 22;
    const motes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: (isSanctuary ? 1.1 : 1.3) + Math.random() * (isSanctuary ? 2.2 : 2.5),
      vx: (Math.random() - 0.5) * (isSanctuary ? 0.18 : 0.14),
      vy: -0.06 - Math.random() * (isSanctuary ? 0.18 : 0.14),
      alpha: 0.16 + Math.random() * 0.42,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = (time) => {
      ctx.clearRect(0, 0, width, height);

      for (const mote of motes) {
        mote.x += mote.vx + Math.sin(time * 0.00045 + mote.phase) * 0.12;
        mote.y += mote.vy;

        if (mote.y < -12) {
          mote.y = height + 12;
          mote.x = Math.random() * width;
        }
        if (mote.x < -12) mote.x = width + 12;
        if (mote.x > width + 12) mote.x = -12;

        const twinkle = mote.alpha * (0.6 + 0.4 * Math.sin(time * 0.0014 + mote.phase));
        ctx.beginPath();
        ctx.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${scene.particleColor}${twinkle.toFixed(3)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isSanctuary, scene.particleColor]);

  return (
    <div
      className={`calm-backdrop ${isSanctuary ? 'sanctuary-scene' : isCosmos ? 'cosmos-scene' : 'surreal-scene'}`}
      aria-hidden="true"
    >
      {/* High-Definition Visual Canvas */}
      <div
        className="calm-scene-image"
        style={{ backgroundImage: `url(${scene.image})` }}
      />

      {/* Atmospheric Luminous Scrim */}
      <div className="calm-scene-scrim" style={{ background: scene.overlay }} />

      {/* Subtle Fine Stardust Motes */}
      <canvas ref={canvasRef} className="calm-particles" />
    </div>
  );
}
