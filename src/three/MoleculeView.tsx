import { useEffect, useMemo, useRef, useState } from 'react';
import type { Compound } from '../lib/atlas';
import { elementTally } from '../lib/elements';
import { parseSdf, type Molecule } from '../lib/sdf';
import type { MoleculeScene, RenderMode } from './scene';
import './MoleculeView.css';

const MODES: { id: RenderMode; label: string }[] = [
  { id: 'ball-and-stick', label: 'Ball & stick' },
  { id: 'spacefill', label: 'Spacefill' },
  { id: 'sticks', label: 'Sticks' },
];

type Status = 'loading' | 'ready' | 'error';

export function MoleculeView({ compound }: { compound: Compound }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<MoleculeScene | null>(null);
  const [molecule, setMolecule] = useState<Molecule | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [mode, setMode] = useState<RenderMode>('ball-and-stick');
  const [showHydrogens, setShowHydrogens] = useState(false);

  const file = compound.structureFile;

  // Load and parse the cached conformer.
  useEffect(() => {
    if (!file) {
      setStatus('error');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    setMolecule(null);

    fetch(file)
      .then((res) => {
        if (!res.ok) throw new Error(`structure request failed: ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        setMolecule(parseSdf(text));
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  // Spin up WebGL only once a molecule is ready, and tear it down on the way out.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!molecule || !canvas) return;

    let disposed = false;
    let scene: MoleculeScene | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;

    // three.js is dynamically imported so it lands in its own chunk rather than
    // in the bundle that paints the atlas.
    import('./scene')
      .then(({ MoleculeScene: Scene }) => {
        if (disposed) return;
        scene = new Scene(canvas);
        sceneRef.current = scene;
        scene.setMolecule(molecule, { mode, showHydrogens, autoRotate: true });
        scene.resize();
        scene.start();
        setStatus('ready');

        resizeObserver = new ResizeObserver(() => scene?.resize());
        resizeObserver.observe(canvas);

        // Stop the render loop while the canvas is off screen.
        intersectionObserver = new IntersectionObserver(
          ([entry]) => (entry.isIntersecting ? scene?.start() : scene?.stop()),
          { threshold: 0.01 },
        );
        intersectionObserver.observe(canvas);
      })
      .catch(() => {
        if (!disposed) setStatus('error');
      });

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      scene?.dispose();
      sceneRef.current = null;
    };
    // `mode` and `showHydrogens` are seed values here; later changes go through
    // setOptions below rather than rebuilding the renderer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [molecule]);

  useEffect(() => {
    sceneRef.current?.setOptions({ mode, showHydrogens });
  }, [mode, showHydrogens]);

  const legend = useMemo(() => {
    if (!molecule) return [];
    const symbols = molecule.atoms
      .map((a) => a.element)
      .filter((s) => showHydrogens || s !== 'H');
    return elementTally(symbols);
  }, [molecule, showHydrogens]);

  const hydrogenCount = useMemo(
    () => molecule?.atoms.filter((a) => a.element === 'H').length ?? 0,
    [molecule],
  );

  return (
    <figure className="viewer">
      <div className="viewer__stage">
        <canvas ref={canvasRef} className="viewer__canvas" aria-label={`3D structure of ${compound.preferredName}`} />

        {status === 'loading' && (
          <div className="viewer__overlay" role="status">
            <span className="viewer__pulse" />
            <span className="micro">Loading structure</span>
          </div>
        )}

        {status === 'error' && (
          <div className="viewer__overlay">
            <span className="micro" style={{ color: 'var(--unresolved)' }}>
              Structure unavailable
            </span>
            <p className="viewer__error muted">
              No atom coordinates are cached for this compound.
            </p>
          </div>
        )}

        {status === 'ready' && (
          <>
            <div className="viewer__badge micro no-select">
              {compound.dimensionality === '2d' ? '2D record' : '3D conformer'}
            </div>
            <button
              type="button"
              className="viewer__reset micro no-select"
              onClick={() => sceneRef.current?.reset()}
            >
              Reset
            </button>
          </>
        )}
      </div>

      <div className="viewer__controls no-select">
        <div className="segmented" role="group" aria-label="Rendering style">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className="segmented__item"
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {hydrogenCount > 0 && (
          <button
            type="button"
            className="chip"
            aria-pressed={showHydrogens}
            onClick={() => setShowHydrogens((v) => !v)}
          >
            Hydrogens
            <span className="chip__count">{hydrogenCount}</span>
          </button>
        )}
      </div>

      {legend.length > 0 && (
        <figcaption className="viewer__legend">
          {legend.map(({ symbol, count, info }) => (
            <span key={symbol} className="viewer__element" title={info.name}>
              <span className="viewer__dot" style={{ background: info.color }} />
              <span className="mono">{symbol}</span>
              <span className="mono viewer__count">{count}</span>
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
