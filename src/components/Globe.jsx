import { useEffect, useRef } from "react";
import * as THREE from "three";

const R = 1;
const toVec = (lat, lon, r = R) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
};

const ATMOS = {
  vertex: "varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
  fragment: "varying vec3 n;void main(){float i=pow(0.72-dot(n,vec3(0,0,1.)),3.);gl_FragColor=vec4(.3,.85,.6,1.)*i;}",
};

// Textured, auto-rotating Earth. Pass origin/destination ([name, lat, lon]) to draw an animated route arc.
export default function Globe({ origin, destination, height = 320, label }) {
  const mount = useRef(null);

  useEffect(() => {
    const el = mount.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 3.4;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const globe = new THREE.Group();
    scene.add(globe);

    const tex = new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}earth.jpg`);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(R, 64, 64),
      new THREE.MeshBasicMaterial({ map: tex, color: 0xbfd8c8 })
    ));
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.18, 64, 64),
      new THREE.ShaderMaterial({ vertexShader: ATMOS.vertex, fragmentShader: ATMOS.fragment, blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true })
    ));

    const star = [];
    for (let i = 0; i < 300; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(12 + Math.random() * 8);
      star.push(v.x, v.y, v.z);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.Float32BufferAttribute(star, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.7 })));

    let curve = null, mover = null;
    const rings = [];
    if (origin && destination) {
      const a = toVec(origin[1], origin[2]), b = toVec(destination[1], destination[2]);
      const mid = a.clone().add(b).setLength(R + Math.min(a.distanceTo(b) * 0.45, 0.9));
      curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      globe.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(80)),
        new THREE.LineBasicMaterial({ color: 0x6ee7a8 })
      ));
      for (const [p, c] of [[a, 0xfb923c], [b, 0x4cc38a]]) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), new THREE.MeshBasicMaterial({ color: c }));
        m.position.copy(p);
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.038, 32), new THREE.MeshBasicMaterial({ color: c, transparent: true, side: THREE.DoubleSide }));
        ring.position.copy(p).multiplyScalar(1.004);
        ring.lookAt(p.clone().multiplyScalar(2));
        rings.push(ring);
        globe.add(m, ring);
      }
      mover = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      globe.add(mover);
      // rotate so the route midpoint faces the camera (+z)
      globe.rotation.y = -Math.atan2(mid.x, mid.z);
    }
    globe.rotation.x = 0.35;

    const resize = () => {
      const w = el.clientWidth;
      renderer.setSize(w, height);
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let raf, t = 0, drag = false, lastX = 0;
    const down = (e) => { drag = true; lastX = e.clientX; };
    const up = () => { drag = false; };
    const move = (e) => { if (drag) { globe.rotation.y += (e.clientX - lastX) * 0.008; lastX = e.clientX; } };
    renderer.domElement.addEventListener("pointerdown", down);
    addEventListener("pointerup", up);
    addEventListener("pointermove", move);

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      t += 0.01;
      if (!drag && !reduce && !curve) globe.rotation.y += 0.003;
      if (curve) {
        mover.position.copy(curve.getPoint((t * 0.25) % 1));
        const k = (t * 0.8) % 1;
        rings.forEach((r) => { r.scale.setScalar(1 + k * 3); r.material.opacity = 1 - k; });
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener("pointerup", up);
      removeEventListener("pointermove", move);
      scene.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); });
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [origin, destination, height]);

  return <div ref={mount} role="img" aria-label={label || "Rotating globe"} style={{ width: "100%", height, cursor: "grab", touchAction: "pan-y" }} />;
}
