/* ==========================================================================
   stage.js  |  the cars, as a game
   --------------------------------------------------------------------------
   Two modes.

   Show.   A car turns slowly on a stand. Drag to spin it. Every few seconds
           the next car in `car.models` takes its place.
   Drive.  Press an arrow key or WASD and the camera drops in behind, with
           forward meaning forward.

   Up / W        accelerate
   Down / S      brake, then reverse
   Left / Right  steer
   Shift / Space boost

   Cars are loaded on demand, so the first one is on screen fast and the rest
   arrive while you watch.

   If anything fails (no WebGL, no network), body gets .no-3d.
   ========================================================================== */

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.getElementById("stage");

function fallback(reason) {
  document.body.classList.add("no-3d");
  if (reason) console.warn("3D stage fallback:", reason);
}

if (canvas && window.PORTFOLIO && window.PORTFOLIO.car) {
  init();
} else {
  fallback("no canvas or no car config");
}

function init() {
  const P = window.PORTFOLIO;
  const entries = P.car.models || [];

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    fallback(e && e.message);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const BG = 0x060606;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 16, 70);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 400);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a18, 0.55));

  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(4, 10, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  const sc = key.shadow.camera;
  sc.near = 1; sc.far = 40; sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6;
  key.shadow.bias = -0.0006;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xbcd0ff, 0.8);
  fill.position.set(-6, 5, -6);
  scene.add(fill);

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
  rimLight.position.set(-5, 4, -10);
  scene.add(rimLight);

  const grid = new THREE.GridHelper(2400, 1200, 0xecebe7, 0xecebe7);
  grid.material.transparent = true;
  grid.material.opacity = 0.06;
  grid.position.y = 0.002;
  scene.add(grid);

  /* --------------------------------------------------------------- rig */

  const rig = new THREE.Group();
  scene.add(rig);

  const tilt = new THREE.Group();
  rig.add(tilt);

  const spin = new THREE.Group();
  spin.rotation.y = Math.PI;
  tilt.add(spin);

  /* ---------------------------------------------------------- materials */

  function makeMaterials(hex) {
    return {
      paint: new THREE.MeshPhysicalMaterial({ color: new THREE.Color(hex), metalness: 0.62, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.14, envMapIntensity: 1.35 }),
      glass: new THREE.MeshPhysicalMaterial({ color: 0x0e0e10, metalness: 0.3, roughness: 0.06, transparent: true, opacity: 0.82, envMapIntensity: 1.6 }),
      chrome: new THREE.MeshStandardMaterial({ color: 0xd6d3cc, metalness: 1.0, roughness: 0.2, envMapIntensity: 1.6 }),
      rubber: new THREE.MeshStandardMaterial({ color: 0x101010, metalness: 0, roughness: 0.9 }),
      carbon: new THREE.MeshStandardMaterial({ color: 0x1c1c1d, metalness: 0.5, roughness: 0.45 }),
      mechanical: new THREE.MeshStandardMaterial({ color: 0x3a3936, metalness: 0.65, roughness: 0.45 }),
      interior: new THREE.MeshStandardMaterial({ color: 0x211f1c, metalness: 0.3, roughness: 0.65 }),
      emissive: new THREE.MeshStandardMaterial({ color: 0x3a0f0a, emissive: 0xff3b2a, emissiveIntensity: 1.6, roughness: 0.4 }),
      trim: new THREE.MeshStandardMaterial({ color: 0x6f6d68, metalness: 0.6, roughness: 0.4 })
    };
  }

  function pick(m, name) {
    const n = (name || "").toLowerCase();
    if (n.indexOf("tyre") !== -1 || n.indexOf("tire") !== -1) return m.rubber;
    if (n.indexOf("rim") !== -1 || n.indexOf("wheel") !== -1 || n.indexOf("calliper") !== -1 || n.indexOf("caliper") !== -1) return m.chrome;
    if (n.indexOf("carpaint") !== -1 || n.indexOf("detach") !== -1 || n.indexOf("paint") !== -1) return m.paint;
    if (n.indexOf("glass") !== -1 || n.indexOf("window") !== -1) return m.glass;
    if (n.indexOf("carbon") !== -1 || n.indexOf("grid") !== -1) return m.carbon;
    if (n.indexOf("light") !== -1 || n.indexOf("emis") !== -1) return m.emissive;
    if (n.indexOf("interior") !== -1 || n.indexOf("steering") !== -1) return m.interior;
    if (n.indexOf("chassis") !== -1 || n.indexOf("underside") !== -1 || n.indexOf("engine") !== -1 || n.indexOf("grill") !== -1) return m.mechanical;
    return m.trim;
  }

  /* ------------------------------------------------------------- loading */

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  const built = entries.map(function () { return null; });
  const mats = entries.map(function () { return null; });
  const loading = entries.map(function () { return false; });
  let active = -1;

  const LOAD_BOX = new THREE.Box3();
  const LOAD_SIZE = new THREE.Vector3();
  const LOAD_CENTRE = new THREE.Vector3();

  function buildCar(car, entry) {
    const m = makeMaterials(entry.color || "#a03328");

    car.traverse(function (o) {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      o.material = pick(m, o.material && o.material.name);
    });

    LOAD_BOX.setFromObject(car);
    LOAD_BOX.getSize(LOAD_SIZE);
    LOAD_BOX.getCenter(LOAD_CENTRE);
    const s = 4.4 / (Math.max(LOAD_SIZE.x, LOAD_SIZE.y, LOAD_SIZE.z) || 1);

    car.scale.setScalar(s);
    /* centre on the pivot in all three axes */
    car.position.set(-LOAD_CENTRE.x * s, -LOAD_CENTRE.y * s, -LOAD_CENTRE.z * s);

    const group = new THREE.Group();
    group.add(car);
    /* lift the group so the wheels rest on the ground */
    group.position.y = (LOAD_SIZE.y * s) / 2;
    group.userData.pop = 0;
    spin.add(group);

    /* group the wheel parts into four wheels, so each one turns on its own
       axle instead of orbiting the car */
    const wheels = [];
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(car);
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z) || 1;

    const parts = [];
    car.traverse(function (o) {
      if (!o.isMesh) return;
      const n = ((o.material && o.material.name) || "").toLowerCase();
      if (n.indexOf("tyre") === -1 && n.indexOf("tire") === -1 && n.indexOf("rim") === -1 && n.indexOf("wheel") === -1) return;
      const b = new THREE.Box3().setFromObject(o);
      const sz = b.getSize(new THREE.Vector3());
      if (Math.max(sz.x, sz.y, sz.z) > longest * 0.45) return;   /* spans several wheels */
      parts.push({ mesh: o, centre: b.getCenter(new THREE.Vector3()), size: sz });
    });

    const buckets = [[], [], [], []];
    parts.forEach(function (p) {
      const i = (p.centre.x > centre.x ? 1 : 0) + (p.centre.z > centre.z ? 2 : 0);
      buckets[i].push(p);
    });

    buckets.forEach(function (list) {
      if (!list.length) return;
      const c = new THREE.Vector3();
      let radius = 0;
      list.forEach(function (p) {
        c.add(p.centre);
        radius = Math.max(radius, Math.max(p.size.y, p.size.z) / 2);
      });
      c.divideScalar(list.length);

      const parent = list[0].mesh.parent;
      const pivot = new THREE.Group();
      pivot.position.copy(parent.worldToLocal(c.clone()));
      parent.add(pivot);
      pivot.updateMatrixWorld(true);
      list.forEach(function (p) { pivot.attach(p.mesh); });

      wheels.push({ pivot: pivot, radius: radius || 0.35 });
    });

    return { group: group, wheels: wheels, mats: m };
  }

  function ensure(i) {
    if (i < 0 || i >= entries.length) return;
    if (built[i] || loading[i]) return;
    loading[i] = true;
    loader.load(entries[i].src, function (gltf) {
      built[i] = buildCar(gltf.scene, entries[i]);
      mats[i] = built[i].mats;
      loading[i] = false;
      if (active === -1) show(i);
      else built[i].group.visible = false;
    }, undefined, function (e) {
      loading[i] = false;
      fallback(e && e.message);
    });
  }

  function show(i) {
    active = i;
    built.forEach(function (b, k) {
      if (b) b.group.visible = k === i;
    });
    const b = built[i];
    if (b) b.group.userData.pop = 0;
  }

  ensure(0);

  /* -------------------------------------------------------------- input */

  let mode = "show";
  let showYaw = -0.7;
  let rigYaw = 0;
  let heading = 0;
  let speed = 0;
  let distance = 0;
  let showDist = 5.6;
  let showTimer = 0;
  let dragging = false;
  let held = false;
  let lastX = 0;
  const keys = Object.create(null);

  const DRIVE_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"];
  const speedEl = document.getElementById("speed");
  const distEl = document.getElementById("dist");

  function enterDrive() {
    if (mode === "drive") return;
    mode = "drive";
    heading = 0;
    rigYaw = ((showYaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    fit();
  }

  window.addEventListener("keydown", function (e) {
    keys[e.key] = true;
    if (DRIVE_KEYS.indexOf(e.key) !== -1) {
      enterDrive();
      e.preventDefault();
    } else if (e.key === " " || e.key === "Shift") {
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", function (e) { keys[e.key] = false; });

  canvas.addEventListener("pointerdown", function (e) {
    if (mode === "show") {
      dragging = true;
      lastX = e.clientX;
      canvas.classList.add("is-grabbing");
    } else {
      held = true;
    }
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    showYaw += (e.clientX - lastX) * 0.012;
    lastX = e.clientX;
  });

  function release() {
    dragging = false;
    held = false;
    canvas.classList.remove("is-grabbing");
  }
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("pointerleave", release);

  /* ------------------------------------------------------------ framing */

  const lookWanted = new THREE.Vector3();
  const lookSmooth = new THREE.Vector3(0, 0.35, 0);
  const forward = new THREE.Vector3();
  let camAz = 2.5;
  let camR = 5.6;
  let camH = 1.9;
  let driveFov = 44;
  let shake = 0;

  function fit() {
    const aspect = (canvas.clientWidth || 1) / (canvas.clientHeight || 1);
    if (mode === "show") {
      /* a longer lens for the stand. the size is set so the car still fits
         when it is broadside to the camera, which is its widest angle */
      camera.fov = 16;
      const lens = 2 * Math.tan(THREE.MathUtils.degToRad(8));
      const forHeight = 1.8 / lens;
      const forWidth = 6.2 / (lens * Math.max(aspect, 0.6));
      showDist = Math.max(forHeight, forWidth);
      camR = showDist;
    } else {
      driveFov = aspect > 2.4 ? 38 : 44;
      camera.fov = driveFov;
    }
    camera.updateProjectionMatrix();
  }

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", function () { fit(); resize(); });

  fit();
  camera.position.set(Math.sin(camAz) * camR, 0.95, Math.cos(camAz) * camR);
  lookSmooth.set(0, 0.38, 0);
  camera.lookAt(lookSmooth);
  resize();

  /* ---------------------------------------------------------------- loop */

  const DEFAULT_ACCEL = 10;     /* m/s^2 */
  const DEFAULT_TOP = 340;      /* km/h */
  const BOOST = 1.06;
  const DRAG = 6;
  const TURN = 1.7;
  const WORLD = 0.34;           /* metres to world units */
  const SHOW_MS = 7;

  const clock = new THREE.Clock();
  let t = 0;
  let wheelAngle = 0;

  function currentWheels() {
    const b = built[active];
    return b ? b.wheels : null;
  }

  function currentEmissive() {
    const m = mats[active];
    return m ? m.emissive : null;
  }

  function tick() {
    requestAnimationFrame(tick);

    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    if (mode === "show") {
      if (!dragging) showYaw += 0.32 * dt;
      rig.rotation.y = showYaw;

      showTimer += dt;
      if (showTimer > SHOW_MS && entries.length > 1) {
        showTimer = 0;
        const next = (active + 1) % entries.length;
        ensure(next);
        if (built[next]) show(next);
      }
      /* bring the next car in early, so the swap is instant */
      if (entries.length > 1 && built[(active + 1) % entries.length] === null) {
        ensure((active + 1) % entries.length);
      }

      const activeGroup = built[active] ? built[active].group : null;
      if (activeGroup) {
        activeGroup.userData.pop = Math.min(1, activeGroup.userData.pop + dt * 3.2);
        const e = activeGroup.userData.pop;
        activeGroup.scale.setScalar(0.94 + 0.06 * (1 - Math.pow(1 - e, 3)));
      }

      lookWanted.set(rig.position.x, 0.38, rig.position.z);
      shake = 0;
    } else {
      const fwd = keys.ArrowUp || keys.w || keys.W || held;
      const back = keys.ArrowDown || keys.s || keys.S;
      const left = keys.ArrowLeft || keys.a || keys.A;
      const right = keys.ArrowRight || keys.d || keys.D;
      const boost = keys.Shift === true || keys[" "];

      /* the active car's real figures drive the model */
      const spec = entries[active] || {};
      const accel = spec.accel || DEFAULT_ACCEL;
      const topMs = (spec.top || DEFAULT_TOP) / 3.6;
      const ceiling = boost ? topMs * BOOST : topMs;

      if (fwd) speed += accel * dt;
      else if (back) speed -= accel * 1.8 * dt;
      else speed -= Math.sign(speed) * DRAG * dt;

      speed = Math.max(topMs * -0.3, Math.min(ceiling, speed));
      if (!fwd && !back && Math.abs(speed) < 0.4) speed = 0;

      const grip = Math.min(Math.abs(speed) / 12, 1) * (speed < 0 ? -1 : 1);
      if (left) heading += TURN * grip * dt;
      if (right) heading -= TURN * grip * dt;

      forward.set(-Math.sin(heading), 0, -Math.cos(heading));
      rig.position.addScaledVector(forward, speed * WORLD * dt);

      rigYaw += (heading - rigYaw) * Math.min(1, dt * 6);
      rig.rotation.y = rigYaw;

      distance += Math.max(speed, 0) * dt;

      const lean = ((left ? 1 : 0) - (right ? 1 : 0)) * Math.min(Math.abs(speed) / topMs, 1);
      tilt.rotation.z += (lean * -0.05 - tilt.rotation.z) * 0.1;
      tilt.rotation.x += (Math.min(speed / topMs, 1) * 0.02 - tilt.rotation.x) * 0.1;

      const wheels = currentWheels();
      if (wheels && wheels.length) {
        const r = wheels[0].radius || 0.35;
        wheelAngle += (speed * WORLD * dt) / r;
        for (let i = 0; i < wheels.length; i += 1) wheels[i].pivot.rotation.x = wheelAngle;
      }

      const em = currentEmissive();
      if (em) {
        const braking = back && speed > 1;
        em.emissiveIntensity += ((braking ? 7 : 1.6) - em.emissiveIntensity) * Math.min(1, dt * 8);
      }

      /* a wider lens and a small tremble as the speed builds */
      const lift = Math.min(Math.abs(speed) / topMs, 1);
      camera.fov += (driveFov + lift * 11 - camera.fov) * Math.min(1, dt * 4);
      camera.updateProjectionMatrix();
      shake = Math.sin(t * 37) * 0.02 * lift;

      lookWanted.set(
        rig.position.x + forward.x * 4,
        0.2,
        rig.position.z + forward.z * 4
      );

      if (speedEl) speedEl.textContent = String(Math.round(Math.abs(speed) * 3.6));
      if (distEl) distEl.textContent = String(Math.round(distance));
    }

    const ease = 1 - Math.pow(0.0022, dt);
    const wantAz = mode === "show" ? 2.5 : heading;
    const wantR = mode === "show" ? showDist : 8.0;
    const wantH = mode === "show" ? 0.95 : 2.6;

    let dAz = wantAz - camAz;
    dAz = ((dAz + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    camAz += dAz * ease;
    camR += (wantR - camR) * ease;
    camH += (wantH - camH) * ease;

    camera.position.set(
      rig.position.x + Math.sin(camAz) * camR,
      camH + shake,
      rig.position.z + Math.cos(camAz) * camR
    );
    lookSmooth.lerp(lookWanted, ease);
    camera.lookAt(lookSmooth);

    grid.position.x = Math.round(camera.position.x / 2) * 2;
    grid.position.z = Math.round(camera.position.z / 2) * 2;

    renderer.render(scene, camera);
  }

  tick();

  /* step through the cars, and restart the timer so the choice lingers */
  function step(dir) {
    if (entries.length < 2) return;
    const i = (active + dir + entries.length) % entries.length;
    ensure(i);
    const timer = setInterval(function () {
      if (built[i]) {
        show(i);
        showTimer = 0;
        clearInterval(timer);
      }
    }, 80);
  }

  const prevBtn = document.getElementById("carPrev");
  const nextBtn = document.getElementById("carNext");
  if (prevBtn) prevBtn.addEventListener("click", function () { step(-1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { step(1); });

  window.STAGE = {
    ready: true,
    step: step,
    reset: function () { speed = 0; distance = 0; heading = 0; rig.position.set(0, 0, 0); },
    /* jump the turntable to a given car, loading it first if needed */
    show: function (i) {
      ensure(i);
      let tries = 0;
      const timer = setInterval(function () {
        tries += 1;
        if (built[i]) { show(i); clearInterval(timer); }
        else if (tries > 200) clearInterval(timer);
      }, 100);
    }
  };
}
