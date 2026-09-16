import { useEffect, useRef, useId, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './MolecularViewer.css';

interface MolecularViewerProps {
  smiles?: string;
  cid?: number;
  compoundName: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const DIMENSIONS = {
  small: { width: 250, height: 200 },
  medium: { width: 420, height: 320 },
  large: { width: 600, height: 450 },
} as const;

export function MolecularViewer({
  smiles,
  cid,
  compoundName,
  size = 'medium',
  className = '',
}: MolecularViewerProps) {
  const uniqueId = useId().replace(/:/g, '-');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const container3dRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'2d' | '3d'>('2d');
  const { theme } = useTheme();
  
  // 3D Viewer instance reference to clean up
  const viewer3dRef = useRef<any>(null);

  useEffect(() => {
    if (mode === '2d') {
      if (!smiles || !canvasRef.current) return;

      setIsLoading(true);
      setError(null);

      const canvas = canvasRef.current;
      const { width, height } = DIMENSIONS[size];
      canvas.width = width;
      canvas.height = height;

      let cancelled = false;

      import('smiles-drawer').then((mod) => {
        if (cancelled) return;
        const SmilesDrawer = mod.default || mod;

        try {
          const drawerOptions: Record<string, unknown> = {
            width,
            height,
            bondThickness: 1.5,
            bondLength: 15,
            shortBondLength: 0.85,
            bondSpacing: 5.1,
            atomVisualization: 'default',
            isomeric: true,
            debug: false,
            terminalCarbons: true,
            explicitHydrogens: false,
            overlapSensitivity: 0.42,
            overlapResolutionIterations: 1,
            compactDrawing: false,
            fontSizeLarge: 6,
            fontSizeSmall: 4,
            padding: 20,
            themes: {
              light: {
                C: '#1a1a1a', O: '#cc0000', N: '#2b4c7e', S: '#b5850e', F: '#2d6a4f',
                Cl: '#2d6a4f', Br: '#9b2c2c', I: '#6b3fa0', P: '#d4760a', H: '#1a1a1a',
                BACKGROUND: '#ffffff',
              },
              dark: {
                C: '#e8e6e1', O: '#e85d5d', N: '#6b9fd4', S: '#d4a836', F: '#52b788',
                Cl: '#52b788', Br: '#e85d5d', I: '#a77bca', P: '#d4a836', H: '#e8e6e1',
                BACKGROUND: '#1c1c1a',
              },
            },
          };

          const drawer = new SmilesDrawer.Drawer(drawerOptions);

          SmilesDrawer.parse(
            smiles,
            (tree: unknown) => {
              if (cancelled) return;
              drawer.draw(tree, canvas, theme === 'dark' ? 'dark' : 'light');
              setIsLoading(false);
            },
            (err: unknown) => {
              if (cancelled) return;
              console.error('SMILES parse error:', err);
              setError('Unable to render structure');
              setIsLoading(false);
            }
          );
        } catch (err) {
          if (!cancelled) {
            console.error('Drawer initialization error:', err);
            setError('Viewer initialization failed');
            setIsLoading(false);
          }
        }
      }).catch((err) => {
        if (!cancelled) {
          console.error('Failed to load smiles-drawer:', err);
          setError('Structure viewer unavailable');
          setIsLoading(false);
        }
      });

      return () => { cancelled = true; };
    } else if (mode === '3d') {
      if (!cid || !container3dRef.current) return;
      
      setIsLoading(true);
      setError(null);
      
      let cancelled = false;
      
      // Load 3dmol dynamically
      import('3dmol').then((x) => {
        if (cancelled) return;
        const $3Dmol = x.default || x;
        
        const container = container3dRef.current;
        if (!container) return;
        
        container.innerHTML = ''; // clear previous
        
        const viewer = $3Dmol.createViewer(container, {
          backgroundColor: theme === 'dark' ? '#1c1c1a' : '#ffffff',
        });
        viewer3dRef.current = viewer;
        
        // Fetch SDF
        fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SDF/?record_type=3d&response_type=display`)
          .then(res => {
            if (!res.ok) throw new Error('3D coordinates not available');
            return res.text();
          })
          .then(sdfData => {
            if (cancelled) return;
            viewer.addModel(sdfData, 'sdf');
            viewer.setStyle({}, { stick: { colorscheme: 'Jmol' } });
            viewer.zoomTo();
            viewer.render();
            setIsLoading(false);
          })
          .catch(err => {
            if (cancelled) return;
            console.error('3D fetch error:', err);
            setError('3D conformer not available for this compound');
            setIsLoading(false);
          });
      }).catch(err => {
        if (!cancelled) {
          console.error('Failed to load 3dmol:', err);
          setError('3D viewer unavailable');
          setIsLoading(false);
        }
      });
      
      return () => { cancelled = true; };
    }
  }, [smiles, cid, size, theme, mode]);

  return (
    <div className={`molecular-viewer-wrapper ${className}`}>
      <div className="viewer-controls">
        <button 
          className={`viewer-toggle ${mode === '2d' ? 'active' : ''}`}
          onClick={() => setMode('2d')}
        >
          2D
        </button>
        {cid && (
          <button 
            className={`viewer-toggle ${mode === '3d' ? 'active' : ''}`}
            onClick={() => setMode('3d')}
          >
            3D
          </button>
        )}
      </div>
      
      <div
        className={`molecular-viewer molecular-viewer--${size}`}
        role="img"
        aria-label={`Molecular structure of ${compoundName}`}
      >
        {!smiles && mode === '2d' ? (
          <div className="molecular-viewer__message">
            <span>Structure not available</span>
          </div>
        ) : error ? (
          <div className="molecular-viewer__message molecular-viewer__message--error">
            <span>{error}</span>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="molecular-viewer__loading">
                <div className="molecular-viewer__spinner" />
              </div>
            )}
            
            {mode === '2d' && (
              <canvas
                ref={canvasRef}
                id={`mol-${uniqueId}`}
                className="molecular-viewer__canvas"
                style={{ display: isLoading ? 'none' : 'block' }}
              />
            )}
            
            {mode === '3d' && (
              <div 
                ref={container3dRef} 
                className="molecular-viewer__3d-container"
                style={{ width: '100%', height: '100%', display: isLoading ? 'none' : 'block' }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
