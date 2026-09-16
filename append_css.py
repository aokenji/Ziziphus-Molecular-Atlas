import os

css_append = """
.molecular-viewer-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.viewer-controls {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}

.viewer-toggle {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 120ms ease;
}

.viewer-toggle:hover {
  background: var(--color-surface-alt);
}

.viewer-toggle.active {
  background: var(--color-green-deep);
  border-color: var(--color-green-deep);
  color: var(--color-text-inverse);
}

.molecular-viewer__3d-container {
  position: relative;
  min-height: 200px;
}
"""

with open('src/components/MolecularViewer/MolecularViewer.css', 'a', encoding='utf-8') as f:
    f.write(css_append)
print("CSS appended.")
