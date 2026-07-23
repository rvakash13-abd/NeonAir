import { useState } from 'react';

interface Props {
  hidden: boolean;
  profileLabel: string;
  names: string[];
  favorites: Record<string, boolean>;
  currentName: string;
  saveStatus: string;
  onSwitch: (name: string) => void;
  onToggleFavorite: (name: string) => void;
  onRename: (name: string) => void;
  onDuplicate: (name: string) => void;
  onDelete: (name: string) => void;
  onNew: (name: string) => void;
  onTemplates: () => void;
  onStats: () => void;
  onHistory: () => void;
  onProfile: () => void;
  onLogout: () => void;
}

export default function GalleryPanel(p: Props) {
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [newName, setNewName] = useState('');

  const names = p.names
    .filter((n) => n.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (p.favorites[b] ? 1 : 0) - (p.favorites[a] ? 1 : 0));

  return (
    <div className={'gallery-panel' + (p.hidden ? ' hidden' : '')} style={{ display: p.hidden ? 'none' : 'flex' }}>
      <div className="flex items-center justify-between gap-1.5">
        <div className="panel-label text-left">
          Account: <span style={{ color: 'rgba(0,220,255,0.85)', fontWeight: 500 }}>{p.profileLabel}</span>
        </div>
        <div className="gmini" title="Search drawings" onClick={() => setShowSearch((s) => !s)}>🔍</div>
      </div>
      {showSearch && (
        <input
          className="field-input"
          placeholder="Search drawings…"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      <div className="flex flex-col gap-1 max-h-[130px] overflow-y-auto my-1">
        {names.map((name) => (
          <div key={name} className={'gallery-item' + (name === p.currentName ? ' active' : '')}>
            <span
              className={'gmini star' + (p.favorites[name] ? ' fav' : '')}
              title="Favorite"
              onClick={(e) => { e.stopPropagation(); p.onToggleFavorite(name); }}
            >
              {p.favorites[name] ? '★' : '☆'}
            </span>
            <span className="gname" onClick={() => p.onSwitch(name)}>{name}</span>
            <span className="gmini" title="Rename" onClick={(e) => { e.stopPropagation(); p.onRename(name); }}>✎</span>
            <span className="gmini" title="Duplicate" onClick={(e) => { e.stopPropagation(); p.onDuplicate(name); }}>⧉</span>
            <span className="gmini" title="Delete" onClick={(e) => { e.stopPropagation(); p.onDelete(name); }}>🗑</span>
          </div>
        ))}
      </div>
      <input
        className="field-input"
        placeholder="New drawing name"
        autoComplete="off"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
      />
      <div className="gbtn" onClick={() => { p.onNew(newName); setNewName(''); }}>+ New Drawing</div>
      <div className="gbtn" onClick={p.onTemplates}>🖍 Trace Templates</div>
      <div className="gbtn" onClick={p.onProfile}>👤 My Profile</div>
      <div className="gallery-row">
        <div className="gbtn" onClick={p.onStats}>📊 Stats</div>
        <div className="gbtn" onClick={p.onHistory}>🕓 History</div>
      </div>
      <div className="gbtn" onClick={p.onLogout}>Log Out</div>
      <div style={{ fontSize: 9, color: 'rgba(60,255,150,0.7)', height: 11, textAlign: 'center' }}>{p.saveStatus}</div>
      <div style={{ fontSize: 8, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.3 }}>
        ☁ Saved to your account — log in anywhere to access it
      </div>
    </div>
  );
}