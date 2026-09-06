/* BFS grid pathfinding for office floor navigation. */

export interface Point {
  x: number;
  y: number;
}

export interface Walkable {
  width: number;
  height: number;
  isWalkable(x: number, y: number): boolean;
}

const DIRECTIONS: Point[] = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

export function findPath(map: Walkable, start: Point, goal: Point): Point[] | null {
  if (start.x === goal.x && start.y === goal.y) return [];

  if (
    goal.x < 0 || goal.x >= map.width ||
    goal.y < 0 || goal.y >= map.height ||
    !map.isWalkable(goal.x, goal.y)
  ) {
    return null;
  }

  const visited = new Set<string>();
  const queue: Point[] = [start];
  const parent = new Map<string, Point>();
  const key = (p: Point) => `${p.x},${p.y}`;

  visited.add(key(start));

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const dir of DIRECTIONS) {
      const next: Point = { x: current.x + dir.x, y: current.y + dir.y };
      const k = key(next);

      if (
        next.x < 0 || next.x >= map.width ||
        next.y < 0 || next.y >= map.height ||
        !map.isWalkable(next.x, next.y) ||
        visited.has(k)
      ) {
        continue;
      }

      visited.add(k);
      parent.set(k, current);
      queue.push(next);

      if (next.x === goal.x && next.y === goal.y) {
        const path: Point[] = [];
        let cur: Point | undefined = next;
        while (cur && !(cur.x === start.x && cur.y === start.y)) {
          path.unshift(cur);
          cur = parent.get(key(cur));
        }
        return path;
      }
    }
  }

  return null;
}
