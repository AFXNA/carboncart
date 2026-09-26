import { useEffect, useRef } from "react";
import * as THREE from "three";

// Living "impact orb": the lower the eco score, the spikier and hotter it gets.
export default function ImpactOrb({ score, size = 96 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 10);
    cam.position.z = 3;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(size, size);
    el.appendChild(renderer.domElement);

    const bad = 1 - score / 100;
    const geo = new THREE.IcosahedronGeometry(1, 4);
    const base = geo.attributes.position.array.slice();
    const color = new THREE.Color().setHSL(0.38 - bad * 0.33, 0.7, 0.5);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, wireframe: true }));
    scene.add(mesh);
    scene.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 2), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 })));

    let raf, t = 0;
    const pos = geo.attributes.position;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      t += 0.02;
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2];
        const k = 1 + Math.sin(x * 4 + t) * Math.cos(y * 4 + t * 0.8) * (0.04 + bad * 0.3);
        pos.setXYZ(i, x * k, y * k, z * k);
      }
      pos.needsUpdate = true;
      mesh.rotation.y += 0.008;
      mesh.rotation.x += 0.004;
      renderer.render(scene, cam);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [score, size]);
  return <div ref={ref} className="orb" style={{ width: size, height: size }} aria-hidden="true" />;
}
