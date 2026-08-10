"use client";

/* Loader for the vendored canvas-animation modules (lib/fx/vendor).

   The vendor files are classic IIFEs that publish onto window — and several
   of them share a global name, so loading must be SERIALIZED: import one
   module, capture its API object, then allow the next. The captured object
   keeps working after the global is overwritten (closures own the state). */

export type FxName = "latentField" | "selfDraw" | "dockingField" | "streamWave";

export interface FxOptions {
  speed?: number;
  intensity?: number;
  pointerFollow?: boolean;
  /** stream-wave only: skip its opaque paper backdrop (local patch) */
  transparent?: boolean;
}

export interface FxHandle {
  destroy(): void;
}

interface FxApi {
  ready(): Promise<unknown>;
  loadImage?(src: string): Promise<HTMLImageElement>;
  [method: string]: unknown;
}

interface FxDef {
  global: string;
  method: string;
  /** source artwork drawn by the effect, served from /public/fx */
  image: string | null;
  needsThree: boolean;
  load(): Promise<unknown>;
}

const DEFS: Record<FxName, FxDef> = {
  latentField: {
    global: "SphereFX",
    method: "latentField",
    image: "/fx/latent-field-sphere.png",
    needsThree: true,
    load: () => import("./vendor/latent-field.js"),
  },
  selfDraw: {
    global: "LoopFX",
    method: "selfDraw",
    image: "/fx/self-draw-loop.png",
    needsThree: false,
    load: () => import("./vendor/self-draw.js"),
  },
  dockingField: {
    global: "TilesFX",
    method: "dockingField",
    image: "/fx/docking-field-tiles.png",
    needsThree: false,
    load: () => import("./vendor/docking-field.js"),
  },
  streamWave: {
    global: "WaveCodeFX",
    method: "streamWave",
    image: null,
    needsThree: false,
    load: () => import("./vendor/stream-wave.js"),
  },
};

const cache = new Map<FxName, { api: FxApi; def: FxDef }>();
let queue: Promise<unknown> = Promise.resolve();

export function loadFx(name: FxName): Promise<{ api: FxApi; def: FxDef }> {
  const task = queue.then(async () => {
    const cached = cache.get(name);
    if (cached) return cached;

    const def = DEFS[name];
    const w = window as unknown as Record<string, unknown>;
    if (!w.gsap) w.gsap = (await import("gsap")).gsap;
    if (def.needsThree && !w.THREE) w.THREE = await import("three");

    await def.load();
    const api = w[def.global] as FxApi; // capture before the next module can overwrite it
    const entry = { api, def };
    cache.set(name, entry);
    return entry;
  });
  queue = task.catch(() => {});
  return task;
}

/** Boots an effect on a canvas. Resolves to a destroyable handle. */
export async function mountFx(
  name: FxName,
  canvas: HTMLCanvasElement,
  opts: FxOptions,
): Promise<FxHandle> {
  const { api, def } = await loadFx(name);
  await api.ready();
  const run = api[def.method] as (...args: unknown[]) => FxHandle;
  if (def.image && api.loadImage) {
    const img = await api.loadImage(def.image);
    return run(canvas, img, opts);
  }
  return run(canvas, opts);
}
