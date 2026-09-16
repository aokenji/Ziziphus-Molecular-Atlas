/**
 * Ball-and-stick renderer.
 *
 * Deliberately hand-rolled rather than dropped in from a molecular-viewer library:
 * the point is to control the material, lighting and touch feel so a structure looks
 * like part of this interface rather than like lab software embedded in it.
 *
 * Atoms and bonds are each a single InstancedMesh, so a 178-atom saponin is two draw
 * calls. Bonds are split into two half-cylinders, each taking the colour of the atom
 * it grows from - the standard trick that makes a structure readable without labels.
 */
import {
  ACESFilmicToneMapping,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { boundingRadius, centroid, withoutHydrogens, type Molecule } from '../lib/sdf';
import { elementInfo } from '../lib/elements';

export type RenderMode = 'ball-and-stick' | 'spacefill' | 'sticks';

interface ModeSpec {
  /** Multiplier on the covalent radius, or on the vdW radius when `useVdw`. */
  atomScale: number;
  useVdw: boolean;
  bondRadius: number;
  showBonds: boolean;
}

const MODES: Record<RenderMode, ModeSpec> = {
  'ball-and-stick': { atomScale: 0.42, useVdw: false, bondRadius: 0.11, showBonds: true },
  spacefill: { atomScale: 1, useVdw: true, bondRadius: 0, showBonds: false },
  sticks: { atomScale: 0.13, useVdw: false, bondRadius: 0.13, showBonds: true },
};

const AUTO_ROTATE_SPEED = 0.22; // radians/second
const IDLE_BEFORE_RESUME = 2600; // ms after the last touch
const UP = new Vector3(0, 1, 0);

export interface SceneOptions {
  showHydrogens: boolean;
  mode: RenderMode;
  autoRotate: boolean;
}

export class MoleculeScene {
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private group = new Group();
  private atomMesh: InstancedMesh | null = null;
  private bondMesh: InstancedMesh | null = null;

  private sphere = new SphereGeometry(1, 28, 20);
  private cylinder = new CylinderGeometry(1, 1, 1, 14, 1, true);
  private material = new MeshStandardMaterial({ roughness: 0.34, metalness: 0.02 });

  private molecule: Molecule | null = null;
  private options: SceneOptions = { showHydrogens: false, mode: 'ball-and-stick', autoRotate: true };

  // Camera orbit state, in spherical coordinates about the molecule's centre.
  private theta = 0.7;
  private phi = 1.15;
  private radius = 10;
  private minRadius = 2;
  private maxRadius = 60;
  private velocity = { theta: 0, phi: 0 };

  private pointers = new Map<number, { x: number; y: number }>();
  private pinchDistance = 0;
  private lastInteraction = 0;
  private frame = 0;
  private running = false;
  private dirty = true;
  private lastTime = 0;
  private reducedMotion = false;
  private userZoomed = false;

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    this.scene = new Scene();
    this.scene.add(this.group);

    this.camera = new PerspectiveCamera(40, 1, 0.1, 500);

    // Key / fill / rim. The rim is the interface accent, which ties a structure to
    // the rest of the palette without tinting the atoms themselves.
    const hemi = new HemisphereLight(0x9fb4d0, 0x0a0c10, 0.5);
    const key = new DirectionalLight(0xffffff, 2.3);
    key.position.set(3, 4, 5);
    const fill = new DirectionalLight(0x6f8cff, 0.55);
    fill.position.set(-4, -1.5, -3);
    const rim = new DirectionalLight(0x3ddc84, 0.85);
    rim.position.set(-2.5, 3, -4.5);
    this.scene.add(hemi, key, fill, rim);

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.attachPointerHandlers();
  }

  setMolecule(molecule: Molecule, options: Partial<SceneOptions> = {}): void {
    this.molecule = molecule;
    this.options = { ...this.options, ...options };
    this.build();
    // Framing depends on the camera aspect, so size the canvas before fitting.
    this.resize();
    this.frameCamera();
  }

  setOptions(options: Partial<SceneOptions>): void {
    const rebuild =
      (options.showHydrogens !== undefined && options.showHydrogens !== this.options.showHydrogens) ||
      (options.mode !== undefined && options.mode !== this.options.mode);
    this.options = { ...this.options, ...options };
    if (rebuild) {
      this.build();
      this.frameCamera();
    }
    this.dirty = true;
  }

  /** Rebuild both instanced meshes from the current molecule and options. */
  private build(): void {
    if (!this.molecule) return;
    this.clearMeshes();

    const spec = MODES[this.options.mode];
    const mol = this.options.showHydrogens ? this.molecule : withoutHydrogens(this.molecule);
    if (!mol.atoms.length) return;

    const centre = centroid(mol.atoms);
    const dummy = new Object3D();
    const colour = new Color();

    // --- atoms
    const atoms = new InstancedMesh(this.sphere, this.material, mol.atoms.length);
    mol.atoms.forEach((atom, i) => {
      const info = elementInfo(atom.element);
      const r = (spec.useVdw ? info.vdw : info.covalent) * spec.atomScale;
      dummy.position.set(atom.x - centre[0], atom.y - centre[1], atom.z - centre[2]);
      dummy.scale.setScalar(r);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      atoms.setMatrixAt(i, dummy.matrix);
      atoms.setColorAt(i, colour.set(info.color).convertSRGBToLinear());
    });
    atoms.instanceMatrix.needsUpdate = true;
    if (atoms.instanceColor) atoms.instanceColor.needsUpdate = true;
    this.group.add(atoms);
    this.atomMesh = atoms;

    // --- bonds
    if (spec.showBonds && mol.bonds.length) {
      const segments: { from: Vector3; to: Vector3; colour: string }[] = [];
      const a = new Vector3();
      const b = new Vector3();
      const dir = new Vector3();
      const offsetAxis = new Vector3();

      for (const bond of mol.bonds) {
        const atomA = mol.atoms[bond.a];
        const atomB = mol.atoms[bond.b];
        a.set(atomA.x - centre[0], atomA.y - centre[1], atomA.z - centre[2]);
        b.set(atomB.x - centre[0], atomB.y - centre[1], atomB.z - centre[2]);
        dir.subVectors(b, a);
        const length = dir.length();
        if (length < 1e-4) continue;

        // Multiple bonds are drawn as parallel rods offset perpendicular to the bond.
        const multiplicity = bond.order === 2 || bond.order === 3 ? bond.order : 1;
        offsetAxis.copy(dir).normalize().cross(UP);
        if (offsetAxis.lengthSq() < 1e-6) offsetAxis.set(1, 0, 0);
        offsetAxis.normalize().multiplyScalar(spec.bondRadius * 2.1);

        for (let k = 0; k < multiplicity; k++) {
          const shift = multiplicity === 1 ? 0 : k - (multiplicity - 1) / 2;
          const from = a.clone().addScaledVector(offsetAxis, shift);
          const to = b.clone().addScaledVector(offsetAxis, shift);
          const mid = from.clone().add(to).multiplyScalar(0.5);
          segments.push({ from, to: mid, colour: elementInfo(atomA.element).color });
          segments.push({ from: to, to: mid, colour: elementInfo(atomB.element).color });
        }
      }

      const radius = spec.bondRadius;
      const bonds = new InstancedMesh(this.cylinder, this.material, segments.length);
      const quat = new Quaternion();
      const axis = new Vector3();
      const matrix = new Matrix4();

      segments.forEach((segment, i) => {
        axis.subVectors(segment.to, segment.from);
        const length = axis.length();
        quat.setFromUnitVectors(UP, axis.clone().normalize());
        matrix.compose(
          segment.from.clone().add(segment.to).multiplyScalar(0.5),
          quat,
          new Vector3(radius, length, radius),
        );
        bonds.setMatrixAt(i, matrix);
        bonds.setColorAt(i, colour.set(segment.colour).convertSRGBToLinear());
      });
      bonds.instanceMatrix.needsUpdate = true;
      if (bonds.instanceColor) bonds.instanceColor.needsUpdate = true;
      this.group.add(bonds);
      this.bondMesh = bonds;
    }

    this.dirty = true;
  }

  /**
   * Pull the camera back far enough to contain the molecule at any orientation.
   *
   * The molecule turns, so the worst case is its bounding sphere. Fitting that to the
   * *narrower* of the two field-of-view angles is what guarantees the long axis never
   * clips as it sweeps past - on a portrait phone the limiting angle is horizontal,
   * not the vertical fov three exposes.
   */
  private frameCamera(): void {
    if (!this.molecule) return;
    const mol = this.options.showHydrogens ? this.molecule : withoutHydrogens(this.molecule);
    const centre = centroid(mol.atoms);
    const spec = MODES[this.options.mode];
    // boundingRadius reaches atom centres, so add back the radius of an atom.
    const padding = spec.useVdw ? 2 : 0.5;
    const extent = boundingRadius(mol.atoms, centre) + padding;

    const fovV = (this.camera.fov * Math.PI) / 180;
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * (this.camera.aspect || 1));
    const fov = Math.min(fovV, fovH);

    this.radius = extent / Math.sin(fov / 2);
    this.minRadius = extent * 0.5;
    this.maxRadius = extent * 5;
    this.dirty = true;
  }

  private clearMeshes(): void {
    for (const mesh of [this.atomMesh, this.bondMesh]) {
      if (!mesh) continue;
      this.group.remove(mesh);
      mesh.dispose();
    }
    this.atomMesh = null;
    this.bondMesh = null;
  }

  // ---- interaction ---------------------------------------------------------

  private attachPointerHandlers(): void {
    const el = this.canvas;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('pointercancel', this.onPointerUp);
    el.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private onPointerDown = (event: PointerEvent): void => {
    this.canvas.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.velocity.theta = 0;
    this.velocity.phi = 0;
    this.lastInteraction = performance.now();
    if (this.pointers.size === 2) this.pinchDistance = this.currentPinchDistance();
  };

  private onPointerMove = (event: PointerEvent): void => {
    const previous = this.pointers.get(event.pointerId);
    if (!previous) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    this.lastInteraction = performance.now();

    if (this.pointers.size === 1) {
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      // Scale by viewport width so a swipe travels the same arc on any screen.
      const k = (Math.PI * 2) / Math.max(this.canvas.clientWidth, 1);
      this.theta -= dx * k;
      this.phi = clamp(this.phi - dy * k, 0.12, Math.PI - 0.12);
      this.velocity.theta = -dx * k;
      this.velocity.phi = -dy * k;
      this.dirty = true;
    } else if (this.pointers.size === 2) {
      const distance = this.currentPinchDistance();
      if (this.pinchDistance > 0 && distance > 0) {
        this.radius = clamp(
          this.radius * (this.pinchDistance / distance),
          this.minRadius,
          this.maxRadius,
        );
        this.userZoomed = true;
        this.dirty = true;
      }
      this.pinchDistance = distance;
    }
  };

  private onPointerUp = (event: PointerEvent): void => {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinchDistance = 0;
    this.lastInteraction = performance.now();
  };

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.radius = clamp(this.radius * (1 + event.deltaY * 0.0012), this.minRadius, this.maxRadius);
    this.userZoomed = true;
    this.lastInteraction = performance.now();
    this.dirty = true;
  };

  private currentPinchDistance(): number {
    const [a, b] = [...this.pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }

  /** Re-frame the molecule at the default orientation. */
  reset(): void {
    this.theta = 0.7;
    this.phi = 1.15;
    this.velocity.theta = 0;
    this.velocity.phi = 0;
    this.userZoomed = false;
    this.frameCamera();
  }

  // ---- loop ----------------------------------------------------------------

  resize(): void {
    const width = this.canvas.clientWidth || 1;
    const height = this.canvas.clientHeight || 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    // Rotating a phone changes which axis is limiting; re-fit unless the viewer
    // has zoomed to something of their own.
    if (!this.userZoomed) this.frameCamera();
    this.dirty = true;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const tick = (time: number): void => {
      if (!this.running) return;
      const delta = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;
      this.update(delta, time);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private update(delta: number, time: number): void {
    const idle = time - this.lastInteraction > IDLE_BEFORE_RESUME;
    const spinning = this.options.autoRotate && !this.reducedMotion && idle && !this.pointers.size;

    if (spinning) {
      this.theta -= AUTO_ROTATE_SPEED * delta;
      this.dirty = true;
    } else if (!this.pointers.size) {
      // Let a flick coast to a stop instead of halting on release.
      const damping = Math.pow(0.92, delta * 60);
      this.velocity.theta *= damping;
      this.velocity.phi *= damping;
      if (Math.abs(this.velocity.theta) > 1e-5 || Math.abs(this.velocity.phi) > 1e-5) {
        this.theta += this.velocity.theta;
        this.phi = clamp(this.phi + this.velocity.phi, 0.12, Math.PI - 0.12);
        this.dirty = true;
      }
    }

    if (!this.dirty) return;
    this.camera.position.set(
      this.radius * Math.sin(this.phi) * Math.sin(this.theta),
      this.radius * Math.cos(this.phi),
      this.radius * Math.sin(this.phi) * Math.cos(this.theta),
    );
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
    this.dirty = false;
  }

  dispose(): void {
    this.stop();
    const el = this.canvas;
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointermove', this.onPointerMove);
    el.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('pointercancel', this.onPointerUp);
    el.removeEventListener('wheel', this.onWheel);
    this.clearMeshes();
    this.sphere.dispose();
    this.cylinder.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** A molecule small enough that showing hydrogens still reads clearly. */
export const hydrogensReadable = (molecule: Molecule): boolean => molecule.atoms.length <= 60;

export type { Molecule };
