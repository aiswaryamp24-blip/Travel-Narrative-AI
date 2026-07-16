import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * 4×4×4 grid of cubes that slowly rotates — inspired by the animejs/Three.js
 * cube-grid demo. Used as an abstract hero accent on the landing page.
 */
export function ThreeCubeBg({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const { width, height } = el.getBoundingClientRect();
    if (!width || !height) return;

    /* ── Renderer (graceful WebGL fallback) ───────────────────── */
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      // WebGL unavailable (headless / sandboxed env) — render nothing
      return;
    }
    if (!renderer.getContext()) {
      renderer.dispose();
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    /* ── Scene & Camera ───────────────────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 6;
    scene.add(camera);

    /* ── Lighting ─────────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const point = new THREE.PointLight(0xffffff, 8, 20, 0.4);
    scene.add(point);
    const dir = new THREE.DirectionalLight(0xffffff, 2);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    /* ── Instanced cube grid ──────────────────────────────────── */
    const gridSize = 4;
    const cellSize = 2 / gridSize;
    const spread = ((gridSize - 1) / 2) * cellSize;
    const count = gridSize ** 3;

    const geo = new THREE.BoxGeometry(cellSize * 0.82, cellSize * 0.82, cellSize * 0.82);
    const mat = new THREE.MeshLambertMaterial({ color: 0x6366f1, transparent: true, opacity: 0.55 });
    const mesh = new THREE.InstancedMesh(geo, mat, count);

    const mtx = new THREE.Matrix4();
    let idx = 0;
    for (let xi = 0; xi < gridSize; xi++)
      for (let yi = 0; yi < gridSize; yi++)
        for (let zi = 0; zi < gridSize; zi++) {
          const x = (xi / (gridSize - 1) - 0.5) * 2 * spread;
          const y = (yi / (gridSize - 1) - 0.5) * 2 * spread;
          const z = (zi / (gridSize - 1) - 0.5) * 2 * spread;
          mtx.setPosition(x, y, z);
          mesh.setMatrixAt(idx++, mtx);
        }
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);

    /* ── Animation loop (matches animejs demo params) ─────────── */
    let raf: number;
    const t0 = performance.now();

    const loop = () => {
      const t = (performance.now() - t0) / 1000;
      // rotateY: 360° / 9s, rotateX: 360° / 12s
      mesh.rotation.y = ((t % 9) / 9) * Math.PI * 2;
      mesh.rotation.x = ((t % 12) / 12) * Math.PI * 2;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    /* ── Resize ───────────────────────────────────────────────── */
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className={className ?? 'w-full h-full'} />;
}
