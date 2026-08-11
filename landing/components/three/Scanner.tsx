"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./MagicRings.module.css";

/* A scanning band-field: layered lines swept by a moving highlight, with
   ripple, mouse interaction, scanlines, grain and vignette. Authored from the
   documented parameter set (color1/2/3, sweep*, band*, scan*, etc.). Mirrors
   the MagicRings lifecycle — WebGL quad that self-pauses offscreen / on hidden
   tab and is disabled under reduced motion. */

const vertexShader = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform vec2  uResolution, uMouse;
uniform float uTime;
uniform vec3  uColor1, uColor2, uColor3;
uniform float uSweepSpeed, uSweepWidth, uSweepFalloff;
uniform float uScale, uFrequency, uRipple, uBandDensity, uLineSharpness;
uniform float uGlow, uColorSpread, uBrightness, uContrast, uSoftness, uVignette;
uniform float uScanline, uGrain, uGrainIntensity, uOpacity;
uniform float uVertical, uMouseOn, uMouseRadius, uMouseStrength;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 p = (uv - 0.5) * uScale;

  float axis  = uVertical > 0.5 ? p.y : p.x;
  float cross = uVertical > 0.5 ? p.x : p.y;

  // mouse ripple
  float mwave = 0.0;
  if (uMouseOn > 0.5) {
    float md = distance(uv, uMouse * 0.5 + 0.5);
    mwave = exp(-md / max(uMouseRadius, 0.001)) * uMouseStrength
          * sin(md * 26.0 - uTime * 4.0);
  }

  // rippled band coordinate
  float ripple = sin(cross * uFrequency * 6.2831853 + uTime) * uRipple;
  float band = axis * uBandDensity + ripple + mwave;
  float tri = abs(fract(band) - 0.5) * 2.0;         // 1 at line centre → 0 between
  float sharp = mix(uLineSharpness, uLineSharpness / max(uSoftness, 0.001), 0.5);
  float line = pow(1.0 - tri, sharp);

  // moving sweep highlight along the scan axis
  float sweepCenter = (fract(uTime * uSweepSpeed) * 2.0 - 1.0) * (uScale * 0.5 + 0.5);
  float sweep = exp(-pow(abs(axis - sweepCenter) / max(uSweepWidth * 0.25, 0.001), uSweepFalloff));

  float intensity = line * (0.35 + sweep) + uGlow * sweep + line * uGlow * 0.5;
  intensity = clamp(intensity, 0.0, 1.5);

  // colour ramp color1 → color2 → color3
  float t = clamp(intensity * (0.6 + uColorSpread), 0.0, 1.0);
  vec3 col = t < 0.5 ? mix(uColor1, uColor2, t * 2.0)
                     : mix(uColor2, uColor3, (t - 0.5) * 2.0);
  col *= intensity;

  // brightness / contrast
  col = (col - 0.5) * uContrast + 0.5;
  col *= uBrightness;

  // scanlines
  if (uScanline > 0.5) {
    col *= 1.0 - 0.12 * (0.5 + 0.5 * sin(uv.y * uResolution.y * 1.6));
  }
  // grain
  if (uGrain > 0.5) {
    col += (hash(gl_FragCoord.xy + uTime) - 0.5) * uGrainIntensity;
  }
  // vignette
  float vig = smoothstep(0.9, 0.35, length(uv - 0.5));
  col *= mix(1.0, vig, uVignette);

  col = max(col, 0.0);
  float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0) * uOpacity;
  gl_FragColor = vec4(col, a);
}
`;

export interface ScannerProps {
  color1?: string;
  color2?: string;
  color3?: string;
  speed?: number;
  sweepSpeed?: number;
  sweepWidth?: number;
  sweepFalloff?: number;
  scale?: number;
  frequency?: number;
  ripple?: number;
  bandDensity?: number;
  lineSharpness?: number;
  glow?: number;
  scanDirection?: "vertical" | "horizontal";
  colorSpread?: number;
  brightness?: number;
  contrast?: number;
  softness?: number;
  vignette?: number;
  scanline?: boolean;
  grain?: boolean;
  grainIntensity?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  mouseRadius?: number;
  mouseStrength?: number;
  className?: string;
}

export default function Scanner({
  color1 = "#000092",
  color2 = "#3D5DEE",
  color3 = "#FFFFFF",
  speed = 0.5,
  sweepSpeed = 0.25,
  sweepWidth = 1.6,
  sweepFalloff = 6,
  scale = 1.5,
  frequency = 2,
  ripple = 0.22,
  bandDensity = 11,
  lineSharpness = 5.5,
  glow = 0.22,
  scanDirection = "vertical",
  colorSpread = 0.7,
  brightness = 1,
  contrast = 1.15,
  softness = 1.4,
  vignette = 0.45,
  scanline = true,
  grain = true,
  grainIntensity = 0.05,
  opacity = 1,
  mouseInteraction = true,
  mouseRadius = 0.5,
  mouseStrength = 0.5,
  className,
}: ScannerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const props = {
    color1, color2, color3, speed, sweepSpeed, sweepWidth, sweepFalloff, scale,
    frequency, ripple, bandDensity, lineSharpness, glow, scanDirection,
    colorSpread, brightness, contrast, softness, vignette, scanline, grain,
    grainIntensity, opacity, mouseInteraction, mouseRadius, mouseStrength,
  };
  const propsRef = useRef(props);
  propsRef.current = props;
  const mouseRef = useRef<[number, number]>([0, 0]);
  const smoothMouseRef = useRef<[number, number]>([0, 0]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;

    const uniforms = {
      uResolution: { value: new THREE.Vector2() },
      uMouse: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color() },
      uColor2: { value: new THREE.Color() },
      uColor3: { value: new THREE.Color() },
      uSweepSpeed: { value: 0 }, uSweepWidth: { value: 0 }, uSweepFalloff: { value: 0 },
      uScale: { value: 1 }, uFrequency: { value: 0 }, uRipple: { value: 0 },
      uBandDensity: { value: 0 }, uLineSharpness: { value: 0 }, uGlow: { value: 0 },
      uColorSpread: { value: 0 }, uBrightness: { value: 1 }, uContrast: { value: 1 },
      uSoftness: { value: 1 }, uVignette: { value: 0 },
      uScanline: { value: 0 }, uGrain: { value: 0 }, uGrainIntensity: { value: 0 },
      uOpacity: { value: 1 }, uVertical: { value: 1 },
      uMouseOn: { value: 0 }, uMouseRadius: { value: 0.5 }, uMouseStrength: { value: 0.5 },
    };

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    scene.add(quad);

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(w, h);
      renderer.setPixelRatio(dpr);
      uniforms.uResolution.value.set(w * dpr, h * dpr);
    };
    resize();
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const onMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseRef.current[0] = (e.clientX - rect.left) / rect.width - 0.5;
      mouseRef.current[1] = -((e.clientY - rect.top) / rect.height - 0.5);
    };
    mount.addEventListener("mousemove", onMove);

    let frameId = 0;
    let isVisible = false;
    let isPageVisible = !document.hidden;
    let elapsed = 0;
    let lastT = 0;
    const animate = (t: number) => {
      frameId = requestAnimationFrame(animate);
      const p = propsRef.current;
      const dt = lastT === 0 ? 0 : Math.min(t - lastT, 100);
      lastT = t;
      elapsed += dt * 0.001 * p.speed;

      smoothMouseRef.current[0] += (mouseRef.current[0] - smoothMouseRef.current[0]) * 0.08;
      smoothMouseRef.current[1] += (mouseRef.current[1] - smoothMouseRef.current[1]) * 0.08;

      uniforms.uTime.value = elapsed;
      uniforms.uColor1.value.set(p.color1);
      uniforms.uColor2.value.set(p.color2);
      uniforms.uColor3.value.set(p.color3);
      uniforms.uSweepSpeed.value = p.sweepSpeed;
      uniforms.uSweepWidth.value = p.sweepWidth;
      uniforms.uSweepFalloff.value = p.sweepFalloff;
      uniforms.uScale.value = p.scale;
      uniforms.uFrequency.value = p.frequency;
      uniforms.uRipple.value = p.ripple;
      uniforms.uBandDensity.value = p.bandDensity;
      uniforms.uLineSharpness.value = p.lineSharpness;
      uniforms.uGlow.value = p.glow;
      uniforms.uColorSpread.value = p.colorSpread;
      uniforms.uBrightness.value = p.brightness;
      uniforms.uContrast.value = p.contrast;
      uniforms.uSoftness.value = p.softness;
      uniforms.uVignette.value = p.vignette;
      uniforms.uScanline.value = p.scanline ? 1 : 0;
      uniforms.uGrain.value = p.grain ? 1 : 0;
      uniforms.uGrainIntensity.value = p.grainIntensity;
      uniforms.uOpacity.value = p.opacity;
      uniforms.uVertical.value = p.scanDirection === "vertical" ? 1 : 0;
      uniforms.uMouseOn.value = p.mouseInteraction ? 1 : 0;
      uniforms.uMouseRadius.value = p.mouseRadius;
      uniforms.uMouseStrength.value = p.mouseStrength;
      uniforms.uMouse.value.set(smoothMouseRef.current[0], smoothMouseRef.current[1]);

      renderer.render(scene, camera);
    };

    const tryStart = () => {
      if (isVisible && isPageVisible && frameId === 0) { lastT = 0; frameId = requestAnimationFrame(animate); }
    };
    const tryStop = () => { if (frameId !== 0) { cancelAnimationFrame(frameId); frameId = 0; } };

    const io = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; isVisible ? tryStart() : tryStop(); },
      { threshold: 0 },
    );
    io.observe(mount);
    const onVisibility = () => { isPageVisible = !document.hidden; isPageVisible ? tryStart() : tryStop(); };
    document.addEventListener("visibilitychange", onVisibility);
    tryStart();

    return () => {
      tryStop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      ro.disconnect();
      mount.removeEventListener("mousemove", onMove);
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      renderer.dispose();
      material.dispose();
    };
  }, []);

  return <div ref={mountRef} className={`${styles.container} ${className ?? ""}`} />;
}
