import { useEffect, useRef } from 'react';
import { renderPortrait, type PortraitRecipe, AGENT_RECIPES } from '../design/portraitArt';

interface SpritePortraitProps {
  agentKey: string;
  size?: number;
  recipe?: PortraitRecipe;
  className?: string;
}

export function SpritePortrait({ agentKey, size = 32, recipe, className }: SpritePortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const r = recipe ?? AGENT_RECIPES[agentKey] ?? AGENT_RECIPES.pm;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scale = Math.max(1, Math.round(size / 18));
    renderPortrait(ctx, r, scale);
  }, [r, size]);

  const scale = Math.max(1, Math.round(size / 18));

  return (
    <canvas
      ref={canvasRef}
      width={18 * scale}
      height={28 * scale}
      className={className}
      style={{
        width: size,
        height: Math.round(size * 28 / 18),
        imageRendering: 'pixelated',
      }}
    />
  );
}
