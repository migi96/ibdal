"use client";

/* Loader for the vendored canvas-animation modules (lib/fx/vendor).

   The vendor files are classic IIFEs that publish onto window — and several
   of them share a global name, so loading must be SERIALIZED: import one
   module, capture its API object, then allow the next. The captured object
   keeps working after the global is overwritten (closures own the state). */

export type FxName =
  | "latentField"
  | "selfDraw"
  | "dockingField"
  | "streamWave"
  | "sovereignGrid"
  | "broadcast"
  | "dataUplink"
  | "flowLoop"
  | "counterRotate"
  | "glassSuspension"
  // animated 3D service icons (six share the IconFX global — safe because the
  // serialized loader captures each module's API right after its own import)
  | "orbitCluster"
  | "snapTogether"
  | "scanField"
  | "guardPulse"
  | "focusPull"
  | "segmentSweep"
  | "lightUp";

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
  loadWorld?(src: string): Promise<unknown>;
  loadPair?(a: string, b: string): Promise<unknown>;
  loadKit?(...srcs: string[]): Promise<unknown>;
  prepare?(img: HTMLImageElement): unknown;
  [method: string]: unknown;
}

/** How the effect's second argument (the drawable asset) is prepared. */
type FxAsset =
  | { kind: "image"; src: string }
  | { kind: "world"; src: string }
  | { kind: "pair"; src: string; src2: string }
  | { kind: "prepared"; src: string }
  | { kind: "kit"; srcs: string[] }
  | null;

interface FxDef {
  global: string;
  method: string;
  asset: FxAsset;
  needsThree: boolean;
  load(): Promise<unknown>;
}

const DEFS: Record<FxName, FxDef> = {
  latentField: {
    global: "SphereFX",
    method: "latentField",
    asset: { kind: "image", src: "/fx/latent-field-sphere.png" },
    needsThree: true,
    load: () => import("./vendor/latent-field.js"),
  },
  selfDraw: {
    global: "LoopFX",
    method: "selfDraw",
    asset: { kind: "image", src: "/fx/self-draw-loop.png" },
    needsThree: false,
    load: () => import("./vendor/self-draw.js"),
  },
  dockingField: {
    global: "TilesFX",
    method: "dockingField",
    asset: { kind: "image", src: "/fx/docking-field-tiles.png" },
    needsThree: false,
    load: () => import("./vendor/docking-field.js"),
  },
  streamWave: {
    global: "WaveCodeFX",
    method: "streamWave",
    asset: null,
    needsThree: false,
    load: () => import("./vendor/stream-wave.js"),
  },
  sovereignGrid: {
    global: "WorldFX",
    method: "sovereignGrid",
    asset: { kind: "world", src: "/fx/world.svg" },
    needsThree: false,
    load: () => import("./vendor/sovereign-grid.js"),
  },
  broadcast: {
    global: "WaveFX",
    method: "broadcast",
    asset: { kind: "image", src: "/fx/broadcast-wave.png" },
    needsThree: false,
    load: () => import("./vendor/broadcast.js"),
  },
  dataUplink: {
    global: "StackFX",
    method: "dataUplink",
    asset: { kind: "image", src: "/fx/data-uplink-stack.png" },
    needsThree: false,
    load: () => import("./vendor/data-uplink.js"),
  },
  flowLoop: {
    // shares the "LoopFX" global with selfDraw; the serialized loader captures
    // each module's API right after its own import, so the name reuse is safe
    global: "LoopFX",
    method: "flowLoop",
    asset: { kind: "image", src: "/fx/flow-loop-loop.png" },
    needsThree: false,
    load: () => import("./vendor/flow-loop.js"),
  },
  counterRotate: {
    global: "OrbFX",
    method: "counterRotate",
    asset: {
      kind: "pair",
      src: "/fx/counter-rotate-orb-1.png",
      src2: "/fx/counter-rotate-orb-2.png",
    },
    needsThree: false,
    load: () => import("./vendor/counter-rotate.js"),
  },
  glassSuspension: {
    global: "GlyphFX",
    method: "glassSuspension",
    asset: { kind: "prepared", src: "/fx/glass-suspension-glyph.png" },
    needsThree: true, // uses window.THREE (WebGLRenderer)
    load: () => import("./vendor/glass-suspension.js"),
  },

  /* --- animated 3D service icons (Canvas 2D + GSAP, loadKit → method) --- */
  orbitCluster: {
    global: "IconFX", method: "orbitCluster", needsThree: false,
    asset: { kind: "kit", srcs: ["/fx/icons/orbit-cluster.png"] },
    load: () => import("./vendor/orbit-cluster.js"),
  },
  snapTogether: {
    global: "IconFX", method: "snapTogether", needsThree: false,
    asset: { kind: "kit", srcs: ["/fx/icons/snap-together.png"] },
    load: () => import("./vendor/snap-together.js"),
  },
  scanField: {
    global: "IconFX", method: "scanField", needsThree: false,
    asset: { kind: "kit", srcs: ["/fx/icons/scan-field.png"] },
    load: () => import("./vendor/scan-field.js"),
  },
  guardPulse: {
    global: "IconFX", method: "guardPulse", needsThree: false,
    asset: { kind: "kit", srcs: ["/fx/icons/guard-pulse.png"] },
    load: () => import("./vendor/guard-pulse.js"),
  },
  focusPull: {
    global: "IconFX", method: "focusPull", needsThree: false,
    asset: { kind: "kit", srcs: ["/fx/icons/focus-pull.png"] },
    load: () => import("./vendor/focus-pull.js"),
  },
  segmentSweep: {
    global: "IconFX", method: "segmentSweep", needsThree: false,
    asset: { kind: "kit", srcs: ["/fx/icons/segment-sweep.png"] },
    load: () => import("./vendor/segment-sweep.js"),
  },
  lightUp: {
    global: "BrainFX", method: "lightUp", needsThree: false,
    asset: { kind: "kit", srcs: ["/fx/icons/light-up-dim.png", "/fx/icons/light-up-lit.png"] },
    load: () => import("./vendor/light-up.js"),
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

  if (def.asset?.kind === "image" && api.loadImage) {
    const img = await api.loadImage(def.asset.src);
    return run(canvas, img, opts);
  }
  if (def.asset?.kind === "world" && api.loadWorld) {
    const world = await api.loadWorld(def.asset.src);
    return run(canvas, world, opts);
  }
  if (def.asset?.kind === "pair" && api.loadPair) {
    const pair = await api.loadPair(def.asset.src, def.asset.src2);
    return run(canvas, pair, opts);
  }
  if (def.asset?.kind === "prepared" && api.loadImage && api.prepare) {
    const img = await api.loadImage(def.asset.src);
    const kit = api.prepare(img);
    return run(canvas, kit, opts);
  }
  if (def.asset?.kind === "kit" && api.loadKit) {
    const kit = await api.loadKit(...def.asset.srcs);
    return run(canvas, kit, opts);
  }
  return run(canvas, opts);
}
