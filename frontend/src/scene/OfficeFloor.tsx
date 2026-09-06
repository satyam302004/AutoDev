/* Main Pixi.js office floor orchestrator. */

import { useEffect, useRef } from 'react';
import { Application, Container, Ticker } from 'pixi.js';
import { Camera } from './Camera';
import { OfficeMap, OFFICE_LAYOUT } from './OfficeMap';
import { Character } from './Character';
import { MessageEnvelope } from './MessageEnvelope';
import { getCastFrames, CAST, type AgentKey } from './cast';

interface AgentState {
  key: AgentKey;
  status: string;
  task?: string;
}

interface OfficeFloorProps {
  agents: AgentState[];
  selectedAgent?: string;
  onAgentClick?: (key: string) => void;
}

function getRandomWalkableTile(map: { isWalkable: (x: number, y: number) => boolean; width: number; height: number }): { x: number; y: number } {
  for (let attempts = 0; attempts < 100; attempts++) {
    const x = 3 + Math.floor(Math.random() * (map.width - 6));
    const y = 3 + Math.floor(Math.random() * (map.height - 6));
    if (map.isWalkable(x, y)) {
      return { x, y };
    }
  }
  return { x: 16, y: 22 };
}

export function OfficeFloor({ agents, selectedAgent, onAgentClick }: OfficeFloorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const charactersRef = useRef<Map<string, Character>>(new Map());
  const envelopesRef = useRef<MessageEnvelope[]>([]);

  useEffect(() => {
    if (!hostRef.current) return;
    const host = hostRef.current;

    let destroyed = false;

    const init = async () => {
      const app = new Application();
      await app.init({
        background: 0x1A1320,
        antialias: false,
        roundPixels: true,
        resolution: Math.max(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        width: host.clientWidth || 800,
        height: host.clientHeight || 600,
      });

      if (destroyed) {
        app.destroy();
        return;
      }

      appRef.current = app;
      host.appendChild(app.canvas);

      const officeMap = new OfficeMap();
      const world = new Container();
      world.addChild(officeMap.container);
      app.stage.addChild(world);

      const camera = new Camera(world);
      cameraRef.current = camera;
      camera.setMapSize(officeMap.getPixelWidth(), officeMap.getPixelHeight());
      camera.setViewSize(host.clientWidth, host.clientHeight);
      camera.fitToScreen();

      const characters = new Map<string, Character>();
      const agentStates = agents.slice(0, OFFICE_LAYOUT.desks.length);

      for (let i = 0; i < agentStates.length; i++) {
        const agent = agentStates[i];
        const desk = OFFICE_LAYOUT.desks[i];
        const frames = getCastFrames(agent.key);

        const startPos = getRandomWalkableTile(officeMap);
        const char = new Character(
          agent.key,
          CAST.find((c) => c.key === agent.key)?.label ?? agent.key,
          frames,
          officeMap,
          startPos.x,
          startPos.y,
        );
        char.setDesk(desk.tileX, desk.tileY);

        officeMap.container.addChild(char.container);
        characters.set(agent.key, char);
      }
      charactersRef.current = characters;

      const resize = new ResizeObserver((entries) => {
        for (const e of entries) {
          const { width, height } = e.contentRect;
          if (width === 0 || height === 0) continue;
          app.renderer?.resize(width, height);
          camera.setViewSize(width, height);
        }
      });
      resize.observe(host);

      const onTick = (ticker: Ticker) => {
        const dt = ticker.deltaMS / 1000;
        camera.update(dt);

        for (const char of characters.values()) {
          char.update(dt);
        }

        for (let i = envelopesRef.current.length - 1; i >= 0; i--) {
          if (envelopesRef.current[i].update(dt)) {
            envelopesRef.current[i].destroy();
            envelopesRef.current.splice(i, 1);
          }
        }
      };
      app.ticker.add(onTick);

      return () => {
        resize.disconnect();
        app.ticker.remove(onTick);
        for (const char of characters.values()) {
          char.container.destroy({ children: true });
        }
        for (const env of envelopesRef.current) {
          env.destroy();
        }
        characters.clear();
        envelopesRef.current = [];
        app.destroy(true);
        appRef.current = null;
        cameraRef.current = null;
      };
    };

    const cleanup = init();

    return () => {
      destroyed = true;
      cleanup.then((fn) => fn?.());
    };
  }, []);

  useEffect(() => {
    const characters = charactersRef.current;
    for (const agent of agents) {
      const char = characters.get(agent.key);
      if (!char) continue;

      const isWorking = agent.status === 'running';
      char.setWorking(isWorking);
      char.setStatus(agent.status);

      if (isWorking) {
        if (agent.task) {
          char.setThought(agent.task);
        } else {
          char.showWorking();
        }
      } else {
        char.hideThought();
      }
    }
  }, [agents]);

  useEffect(() => {
    if (!selectedAgent) return;
    const char = charactersRef.current.get(selectedAgent);
    const camera = cameraRef.current;
    if (char && camera) {
      camera.focusOn(char.px, char.py, 2);
    }
  }, [selectedAgent]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = hostRef.current?.getBoundingClientRect();
    if (!rect || !appRef.current || !cameraRef.current) return;

    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    let closestKey: string | null = null;
    let closestDist = Infinity;

    for (const [key, char] of charactersRef.current) {
      const world = appRef.current.stage.children[0] as Container;
      if (!world) continue;
      const charScreenX = char.px * world.scale.x + world.x;
      const charScreenY = char.py * world.scale.y + world.y;
      const dist = Math.hypot(screenX - charScreenX, screenY - charScreenY);
      if (dist < closestDist) {
        closestDist = dist;
        closestKey = key;
      }
    }

    if (closestKey && closestDist < 40) {
      onAgentClick?.(closestKey);
    }
  };

  return (
    <div
      ref={hostRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--cth-ink-900)',
        cursor: 'pointer',
      }}
      onClick={handleClick}
    />
  );
}
