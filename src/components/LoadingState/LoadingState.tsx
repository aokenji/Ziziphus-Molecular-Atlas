import './LoadingState.css';

interface LoadingStateProps {
  text?: string;
}

export function LoadingState({ text = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="loading-state">
      <div className="loading-spinner"></div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
}
