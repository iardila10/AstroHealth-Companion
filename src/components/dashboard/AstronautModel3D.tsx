import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { HealthStatus, IndicatorKey } from "../../types/health";

interface AstronautModel3DProps {
  statuses: Partial<Record<IndicatorKey, HealthStatus>>;
}

type ZoneKey = "head" | "chest" | "abdomen" | "arms" | "legs";
type ZoneMeshes = Record<ZoneKey, THREE.Mesh[]>;
const zoneKeys: ZoneKey[] = ["head", "chest", "abdomen", "arms", "legs"];

const zoneColors: Record<HealthStatus, number> = {
  normal: 0x20d890,
  attention: 0xffc247,
  critical: 0xff405d,
  no_data: 0x718096,
};

const zoneOrder: Record<HealthStatus, number> = {
  no_data: -1,
  normal: 0,
  attention: 1,
  critical: 2,
};

function strongestStatus(
  statuses: Array<HealthStatus | undefined>,
): HealthStatus {
  return statuses.reduce<HealthStatus>(
    (current, status) =>
      status && zoneOrder[status] > zoneOrder[current] ? status : current,
    "no_data",
  );
}

function createFabricTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const base = context.createLinearGradient(0, 0, 128, 128);
  base.addColorStop(0, "#f1f4f6");
  base.addColorStop(1, "#dce3e8");
  context.fillStyle = base;
  context.fillRect(0, 0, 128, 128);
  context.strokeStyle = "rgba(70, 91, 108, 0.12)";
  context.lineWidth = 1;
  for (let offset = 0; offset < 128; offset += 5) {
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, 128);
    context.stroke();
    context.beginPath();
    context.moveTo(0, offset);
    context.lineTo(128, offset);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSuitMaterial(color = 0xe7edf1) {
  return new THREE.MeshPhysicalMaterial({
    color,
    map: createFabricTexture(),
    roughness: 0.72,
    metalness: 0.04,
    clearcoat: 0.18,
    clearcoatRoughness: 0.42,
  });
}

function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: THREE.Vector3,
  scale?: THREE.Vector3,
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  if (scale) mesh.scale.copy(scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addSphere(
  parent: THREE.Object3D,
  material: THREE.Material,
  position: THREE.Vector3,
  scale: THREE.Vector3,
) {
  return addMesh(
    parent,
    new THREE.SphereGeometry(1, 32, 24),
    material,
    position,
    scale,
  );
}

function addCylinderBetween(
  parent: THREE.Object3D,
  start: THREE.Vector3,
  end: THREE.Vector3,
  startRadius: number,
  endRadius: number,
  material: THREE.Material,
) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      endRadius,
      startRadius,
      direction.length(),
      24,
      1,
    ),
    material,
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addOverlayMaterial(
  parent: THREE.Object3D,
  zone: ZoneKey,
  position: THREE.Vector3,
  scale: THREE.Vector3,
  zoneMeshes: ZoneMeshes,
) {
  const material = new THREE.MeshBasicMaterial({
    color: zoneColors.no_data,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const mesh = addSphere(parent, material, position, scale);
  mesh.renderOrder = 2;
  zoneMeshes[zone].push(mesh);
  return mesh;
}

function addOverlayLimb(
  parent: THREE.Object3D,
  zone: ZoneKey,
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  zoneMeshes: ZoneMeshes,
) {
  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const material = new THREE.MeshBasicMaterial({
    color: zoneColors.no_data,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const cylinder = addCylinderBetween(
    parent,
    new THREE.Vector3(start.x, start.y, start.z + 0.2),
    new THREE.Vector3(end.x, end.y, end.z + 0.2),
    radius,
    radius,
    material,
  );
  cylinder.renderOrder = 2;
  zoneMeshes[zone].push(cylinder);
  addOverlayMaterial(
    parent,
    zone,
    new THREE.Vector3(start.x, start.y, midpoint.z + 0.2),
    new THREE.Vector3(radius, radius, radius),
    zoneMeshes,
  );
  addOverlayMaterial(
    parent,
    zone,
    new THREE.Vector3(end.x, end.y, midpoint.z + 0.2),
    new THREE.Vector3(radius, radius, radius),
    zoneMeshes,
  );
}

function buildAstronaut(scene: THREE.Scene) {
  const figure = new THREE.Group();
  scene.add(figure);

  const suit = createSuitMaterial();
  const suitShade = createSuitMaterial(0xcbd4db);
  const graphite = new THREE.MeshStandardMaterial({
    color: 0x263646,
    roughness: 0.7,
    metalness: 0.18,
  });
  const blue = new THREE.MeshStandardMaterial({
    color: 0x1b477f,
    roughness: 0.48,
    metalness: 0.16,
  });
  const seam = new THREE.MeshStandardMaterial({
    color: 0x85939d,
    roughness: 0.56,
    metalness: 0.28,
  });
  const gold = new THREE.MeshPhysicalMaterial({
    color: 0xb79045,
    roughness: 0.2,
    metalness: 0.76,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });

  const pack = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 1.54, 0.48),
    suitShade,
  );
  pack.position.set(0, 0.78, -0.42);
  pack.castShadow = true;
  pack.receiveShadow = true;
  figure.add(pack);

  const packTop = addMesh(
    figure,
    new THREE.BoxGeometry(0.86, 0.22, 0.52),
    graphite,
    new THREE.Vector3(0, 1.52, -0.39),
  );
  packTop.castShadow = true;
  [-1, 1].forEach((side) => {
    addMesh(
      figure,
      new THREE.BoxGeometry(0.15, 0.88, 0.54),
      suit,
      new THREE.Vector3(side * 0.51, 0.86, -0.4),
    );
    addMesh(
      figure,
      new THREE.BoxGeometry(0.08, 0.68, 0.08),
      seam,
      new THREE.Vector3(side * 0.51, 0.82, -0.1),
    );
  });

  const torsoProfile = [
    new THREE.Vector2(0, -0.73),
    new THREE.Vector2(0.36, -0.73),
    new THREE.Vector2(0.42, -0.57),
    new THREE.Vector2(0.4, -0.25),
    new THREE.Vector2(0.43, 0.1),
    new THREE.Vector2(0.53, 0.5),
    new THREE.Vector2(0.5, 0.66),
    new THREE.Vector2(0.36, 0.75),
    new THREE.Vector2(0, 0.75),
  ];
  addMesh(
    figure,
    new THREE.LatheGeometry(torsoProfile, 40),
    suit,
    new THREE.Vector3(0, 0.84, 0),
  );
  addMesh(
    figure,
    new THREE.CylinderGeometry(0.42, 0.47, 0.38, 32),
    suitShade,
    new THREE.Vector3(0, 0.1, 0),
  );
  [-1, 1].forEach((side) => {
    addSphere(
      figure,
      suit,
      new THREE.Vector3(side * 0.48, 1.32, 0),
      new THREE.Vector3(0.3, 0.34, 0.34),
    );
  });

  const armSegments = [-1, 1].map((side) => {
    const shoulder = new THREE.Vector3(side * 0.58, 1.27, 0.02);
    const elbow = new THREE.Vector3(side * 0.8, 0.68, 0.04);
    const wrist = new THREE.Vector3(side * 0.9, 0.12, 0.06);
    addCylinderBetween(figure, shoulder, elbow, 0.24, 0.2, suit);
    addCylinderBetween(figure, elbow, wrist, 0.2, 0.15, suit);
    addSphere(
      figure,
      suit,
      elbow,
      new THREE.Vector3(0.2, 0.2, 0.2),
    );

    const cuff = addCylinderBetween(
      figure,
      new THREE.Vector3(side * 0.9, 0.24, 0.06),
      new THREE.Vector3(side * 0.9, 0.02, 0.06),
      0.17,
      0.17,
      blue,
    );
    cuff.castShadow = true;
    addSphere(
      figure,
      suitShade,
      new THREE.Vector3(side * 0.92, -0.12, 0.08),
      new THREE.Vector3(0.17, 0.21, 0.2),
    );

    return { side, shoulder, elbow, wrist };
  });

  const legSegments = [-1, 1].map((side) => {
    const hip = new THREE.Vector3(side * 0.25, -0.12, 0);
    const knee = new THREE.Vector3(side * 0.3, -0.94, 0.01);
    const ankle = new THREE.Vector3(side * 0.32, -1.78, 0.02);
    addCylinderBetween(figure, hip, knee, 0.26, 0.22, suit);
    addSphere(
      figure,
      suit,
      knee,
      new THREE.Vector3(0.22, 0.2, 0.22),
    );
    addCylinderBetween(figure, knee, ankle, 0.22, 0.17, suit);

    const boot = addSphere(
      figure,
      graphite,
      new THREE.Vector3(side * 0.32, -2.03, 0.13),
      new THREE.Vector3(0.22, 0.29, 0.34),
    );
    boot.rotation.x = -0.16;
    addMesh(
      figure,
      new THREE.TorusGeometry(0.18, 0.025, 8, 24),
      seam,
      new THREE.Vector3(side * 0.32, -1.83, 0.12),
    );
    return { side, hip, knee, ankle };
  });

  addMesh(
    figure,
    new THREE.CylinderGeometry(0.26, 0.26, 0.12, 32),
    seam,
    new THREE.Vector3(0, 1.62, 0),
  );
  addSphere(
    figure,
    suit,
    new THREE.Vector3(0, 2.14, 0),
    new THREE.Vector3(0.48, 0.56, 0.43),
  );
  addMesh(
    figure,
    new THREE.TorusGeometry(0.42, 0.035, 10, 40),
    seam,
    new THREE.Vector3(0, 1.68, 0),
    new THREE.Vector3(1, 1, 0.88),
  );
  const visor = addSphere(
    figure,
    gold,
    new THREE.Vector3(0, 2.15, 0.34),
    new THREE.Vector3(0.37, 0.34, 0.13),
  );
  visor.renderOrder = 1;
  addMesh(
    figure,
    new THREE.TorusGeometry(0.37, 0.025, 10, 40),
    suitShade,
    new THREE.Vector3(0, 2.15, 0.38),
    new THREE.Vector3(1, 0.92, 0.45),
  );

  const visorGlint = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.2, 2.34, 0.46),
        new THREE.Vector3(-0.1, 2.4, 0.47),
        new THREE.Vector3(0.04, 2.42, 0.46),
      ]),
      20,
      0.012,
      8,
      false,
    ),
    new THREE.MeshBasicMaterial({
      color: 0xffe6aa,
      transparent: true,
      opacity: 0.78,
    }),
  );
  figure.add(visorGlint);

  const zipper = addMesh(
    figure,
    new THREE.BoxGeometry(0.045, 1.12, 0.035),
    seam,
    new THREE.Vector3(0, 0.78, 0.43),
  );
  zipper.receiveShadow = true;
  [-1, 1].forEach((side) => {
    const port = addMesh(
      figure,
      new THREE.CylinderGeometry(0.075, 0.075, 0.035, 24),
      seam,
      new THREE.Vector3(side * 0.22, 0.34, 0.47),
      new THREE.Vector3(1, 1, 0.45),
    );
    port.rotation.x = Math.PI / 2;
    addMesh(
      figure,
      new THREE.BoxGeometry(0.14, 0.08, 0.035),
      suitShade,
      new THREE.Vector3(side * 0.31, 1.16, 0.4),
    );
  });

  const zoneMeshes: ZoneMeshes = {
    head: [],
    chest: [],
    abdomen: [],
    arms: [],
    legs: [],
  };
  addOverlayMaterial(
    figure,
    "head",
    new THREE.Vector3(0, 2.14, 0.36),
    new THREE.Vector3(0.46, 0.54, 0.19),
    zoneMeshes,
  );
  addOverlayMaterial(
    figure,
    "chest",
    new THREE.Vector3(0, 1.13, 0.44),
    new THREE.Vector3(0.49, 0.39, 0.17),
    zoneMeshes,
  );
  addOverlayMaterial(
    figure,
    "abdomen",
    new THREE.Vector3(0, 0.42, 0.43),
    new THREE.Vector3(0.4, 0.34, 0.16),
    zoneMeshes,
  );
  armSegments.forEach(({ side, shoulder, elbow, wrist }) => {
    addOverlayLimb(
      figure,
      "arms",
      new THREE.Vector3(shoulder.x, shoulder.y, 0.22),
      new THREE.Vector3(elbow.x, elbow.y, 0.22),
      0.17,
      zoneMeshes,
    );
    addOverlayLimb(
      figure,
      "arms",
      new THREE.Vector3(elbow.x, elbow.y, 0.22),
      new THREE.Vector3(wrist.x, wrist.y, 0.22),
      0.14,
      zoneMeshes,
    );
    addOverlayMaterial(
      figure,
      "arms",
      new THREE.Vector3(side * 0.92, -0.1, 0.28),
      new THREE.Vector3(0.15, 0.2, 0.14),
      zoneMeshes,
    );
  });
  legSegments.forEach(({ side, hip, knee, ankle }) => {
    addOverlayLimb(
      figure,
      "legs",
      new THREE.Vector3(hip.x, hip.y, 0.2),
      new THREE.Vector3(knee.x, knee.y, 0.2),
      0.2,
      zoneMeshes,
    );
    addOverlayLimb(
      figure,
      "legs",
      new THREE.Vector3(knee.x, knee.y, 0.2),
      new THREE.Vector3(ankle.x, ankle.y, 0.2),
      0.15,
      zoneMeshes,
    );
  });

  return zoneMeshes;
}

function updateZoneColors(zoneMeshes: ZoneMeshes, statuses: Record<ZoneKey, HealthStatus>) {
  zoneKeys.forEach((zone) => {
    const status = statuses[zone];
    const meshes = zoneMeshes[zone];
    meshes.forEach((mesh) => {
      const material = mesh.material;
      if (!(material instanceof THREE.MeshBasicMaterial)) return;
      material.color.setHex(zoneColors[status]);
      material.opacity = status === "no_data" ? 0.13 : 0.4;
      material.needsUpdate = true;
    });
  });
}

function disposeScene(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const meshMaterials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    meshMaterials.forEach((material) => materials.add(material));
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => {
    if (material instanceof THREE.MeshStandardMaterial) material.map?.dispose();
    material.dispose();
  });
}

function AstronautModel3D({ statuses }: AstronautModel3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const zoneMeshesRef = useRef<ZoneMeshes | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const zoneStatuses: Record<ZoneKey, HealthStatus> = {
    head: statuses.sleep_hours ?? "no_data",
    chest: strongestStatus([statuses.heart_rate, statuses.temperature]),
    abdomen: statuses.glucose ?? "no_data",
    arms: statuses.blood_pressure ?? "no_data",
    legs: statuses.fatigue_level ?? "no_data",
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      setRenderError("No se pudo iniciar WebGL para mostrar el modelo 3D.");
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.add(new THREE.HemisphereLight(0xc8dcf5, 0x1c2633, 2.1));

    const keyLight = new THREE.DirectionalLight(0xfff0d8, 3.1);
    keyLight.position.set(-3.5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(512, 512);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x76a9ed, 1.6);
    fillLight.position.set(4, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x94c7ff, 2.2);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    const floorShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.88, 48),
      new THREE.MeshBasicMaterial({
        color: 0x173152,
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
      }),
    );
    floorShadow.rotation.x = -Math.PI / 2;
    floorShadow.position.set(0, -2.39, 0);
    scene.add(floorShadow);

    zoneMeshesRef.current = buildAstronaut(scene);

    const camera = new THREE.OrthographicCamera(-1, 1, 3, -3, 0.1, 40);
    camera.position.set(0, 0.1, 10);
    camera.lookAt(0, 0.1, 0);
    cameraRef.current = camera;

    const render = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      const frustumHeight = 5.95;
      const aspect = width / height;
      camera.left = (-frustumHeight * aspect) / 2;
      camera.right = (frustumHeight * aspect) / 2;
      camera.top = frustumHeight / 2;
      camera.bottom = -frustumHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const observer = new ResizeObserver(render);
    observer.observe(container);
    render();

    return () => {
      observer.disconnect();
      disposeScene(scene);
      renderer.dispose();
      renderer.domElement.remove();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      zoneMeshesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const zoneMeshes = zoneMeshesRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!zoneMeshes || !renderer || !scene || !camera) return;
    updateZoneColors(zoneMeshes, zoneStatuses);
    renderer.render(scene, camera);
  }, [zoneStatuses.head, zoneStatuses.chest, zoneStatuses.abdomen, zoneStatuses.arms, zoneStatuses.legs]);

  return (
    <div
      ref={containerRef}
      className="astronaut-model-frame"
      role="img"
      aria-label={
        renderError ??
        "Modelo 3D frontal de astronauta con zonas de salud codificadas por color"
      }
    >
      {renderError && <p className="astronaut-model-error">{renderError}</p>}
    </div>
  );
}

export default AstronautModel3D;
