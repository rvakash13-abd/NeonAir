import type { Color, ToolType } from '../lib/engine';

const SWATCHES: Color[] = [
  { r: 0, g: 220, b: 255 },
  { r: 255, g: 0, b: 200 },
  { r: 255, g: 230, b: 0 },
  { r: 60, g: 255, b: 100 },
  { r: 255, g: 255, b: 255 },
  { r: 180, g: 80, b: 255 },
  { r: 255, g: 80, b: 30 },
];

interface Props {
  collapsed: boolean;
  color: Color;
  onColor: (c: Color) => void;
  tool: ToolType;
  onTool: (t: ToolType) => void;
  gradientOn: boolean;
  onGradient: () => void;
  size: number;
  onSize: (v: number) => void;
  isEraser: boolean;
  onEraser: () => void;
  onUndo: () => void;
  onClear: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onBgImage: () => void;
  camPaused: boolean;
  onCamToggle: () => void;
  canvasMode: boolean;
  onCanvasMode: () => void;
  onPipFlip: () => void;
  transparentExport: boolean;
  onTransparent: () => void;
  onExport: () => void;
  onReplay: () => void;
  onRecord: () => void;
  recording: boolean;
  theme: 'dark' | 'light';
  onTheme: () => void;
}

export default function Panel(p: Props) {
  const sameColor = (c: Color) => c.r === p.color.r && c.g === p.color.g && c.b === p.color.b;
  return (
    <div className={'panel' + (p.collapsed ? ' collapsed' : '')}>
      <div className="panel-label">Color</div>
      {SWATCHES.map((c, i) => (
        <div
          key={i}
          className={'swatch' + (sameColor(c) && !p.isEraser ? ' active' : '')}
          style={{ background: `rgb(${c.r},${c.g},${c.b})` }}
          onClick={() => p.onColor(c)}
        />
      ))}
      <div className="sep" />
      <div className="panel-label">Tool</div>
      <div className="ibtn-row">
        <div className={'ibtn' + (p.tool === 'freehand' ? ' active' : '')} title="Freehand" onClick={() => p.onTool('freehand')}>✏️</div>
        <div className={'ibtn' + (p.tool === 'line' ? ' active' : '')} title="Line" onClick={() => p.onTool('line')}>╱</div>
        <div className={'ibtn' + (p.tool === 'circle' ? ' active' : '')} title="Circle" onClick={() => p.onTool('circle')}>○</div>
        <div className={'ibtn' + (p.tool === 'rect' ? ' active' : '')} title="Rectangle" onClick={() => p.onTool('rect')}>▭</div>
      </div>
      <div className={'ibtn' + (p.gradientOn ? ' active' : '')} title="Gradient stroke" onClick={p.onGradient}>🌈</div>
      <div className="sep" />
      <div className="size-wrap">
        <div className="size-lbl">Size</div>
        <div className="slider-rotate-wrap">
          <input
            className="size-slider"
            type="range"
            min={0.5}
            max={40}
            step={0.5}
            value={p.size}
            onChange={(e) => p.onSize(+e.target.value)}
          />
        </div>
      </div>
      <div className="sep" />
      <div className="ibtn-row">
        <div className={'ibtn' + (p.isEraser ? ' active' : '')} title="Eraser" onClick={p.onEraser}>✕</div>
        <div className="ibtn" title="Undo" onClick={p.onUndo}>↩</div>
        <div className="ibtn" title="Clear" onClick={p.onClear}>🗑</div>
      </div>
      <div className="sep" />
      <div className="panel-label">View</div>
      <div className="ibtn-row">
        <div className="ibtn" title="Zoom in" onClick={p.onZoomIn}>➕</div>
        <div className="ibtn" title="Zoom out" onClick={p.onZoomOut}>➖</div>
        <div className="ibtn" title="Reset view" onClick={p.onZoomReset}>⤾</div>
      </div>
      <div className="sep" />
      <div className="panel-label">Media</div>
      <div className="ibtn-row">
        <div className="ibtn" title="Import background image" onClick={p.onBgImage}>🖼</div>
        <div className={'ibtn' + (p.camPaused ? ' active' : '')} title="Toggle camera" onClick={p.onCamToggle}>📷</div>
      </div>
      <div className="ibtn-row">
        <div className={'ibtn' + (p.canvasMode ? ' active' : '')} title="White canvas mode" onClick={p.onCanvasMode}>🖌</div>
        <div className="ibtn" title="Move camera bubble left/right" onClick={p.onPipFlip}>⇄</div>
      </div>
      <div className="ibtn-row">
        <div className="ibtn" title="Export PNG" onClick={p.onExport}>⬇</div>
        <div className={'ibtn' + (p.transparentExport ? ' active' : '')} title="Transparent PNG" onClick={p.onTransparent}>◻</div>
      </div>
      <div className="ibtn-row">
        <div className="ibtn" title="Replay drawing" onClick={p.onReplay}>▶</div>
        <div className={'ibtn' + (p.recording ? ' active' : '')} title="Record video (webm)" onClick={p.onRecord}>⏺</div>
      </div>
      <div className="sep" />
      <div className="ibtn" title="Toggle theme" onClick={p.onTheme}>{p.theme === 'light' ? '☀' : '☾'}</div>
    </div>
  );
}
