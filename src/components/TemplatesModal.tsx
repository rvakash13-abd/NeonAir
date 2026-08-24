import { useState } from 'react';
import { templateCategories, templatesByCategory, type Template } from '../lib/templates';
import RazorpayModal from './RazorpayModal';

interface Props {
  onClose: () => void;
  subscribed: boolean;
  onSubscribe: () => Promise<void>;
  onPick: (tpl: Template) => Promise<void>;
}

export default function TemplatesModal({ onClose, subscribed, onSubscribe, onPick }: Props) {
  const [activeCat, setActiveCat] = useState(templateCategories[0] || '');
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [showPay, setShowPay] = useState(false);

  const items = templatesByCategory[activeCat] || [];

  async function handlePick(tpl: Template) {
    if (!subscribed && !tpl.free) return;
    setLoadingUrl(tpl.url);
    try {
      await onPick(tpl);
      onClose();
    } finally {
      setLoadingUrl(null);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ width: 320 }}>
        <h3>Trace Templates</h3>

        {!templateCategories.length ? (
          <div className="stat-row">No templates found yet — drop images into Subscription/&lt;Category&gt;/.</div>
        ) : (
          <>
            <div className="flex gap-1.5 flex-wrap mb-3">
              {templateCategories.map((cat) => (
                <div
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  className="gbtn"
                  style={{
                    width: 'auto',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    background: cat === activeCat ? 'rgba(0,220,255,0.18)' : undefined,
                    color: cat === activeCat ? 'var(--text)' : undefined,
                    borderColor: cat === activeCat ? 'rgba(0,220,255,0.4)' : undefined,
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              {items.map((tpl) => (
                <div
                  key={tpl.url}
                  onClick={() => handlePick(tpl)}
                  className="relative rounded-lg overflow-hidden border border-white/10 cursor-pointer bg-white/5 aspect-square"
                >
                  <img
                    src={tpl.url}
                    alt={tpl.name}
                    className="w-full h-full object-cover"
                    style={{ filter: subscribed || tpl.free ? 'none' : 'blur(3px) brightness(0.5)' }}
                  />
                  {!subscribed && !tpl.free && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/70 text-base">🔒</div>
                  )}
                  {tpl.free && !subscribed && (
                    <div className="absolute top-1 left-1 text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/80 text-white font-medium">
                      FREE
                    </div>
                  )}
                  {loadingUrl === tpl.url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[10px] text-white">
                      Loading…
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 text-[9px] text-center py-0.5 bg-black/55 text-white/80 truncate px-1">
                    {tpl.name}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!subscribed && (
          <div className="mt-3 p-3 rounded-xl border border-cyan-400/25 bg-cyan-400/5 text-center">
            <div className="text-[12px] text-white/80 mb-1 font-medium">Unlock the trace library</div>
            <div className="text-[10.5px] text-white/45 mb-2.5 leading-relaxed">
              Subscribers get every outline template, loaded as a background you draw over.
            </div>
            <button className="auth-submit" onClick={() => setShowPay(true)}>
              Subscribe — ₹99/mo
            </button>
          </div>
        )}

        <div className="gbtn mt-3 text-center" onClick={onClose}>Close</div>
      </div>

      {showPay && (
        <RazorpayModal
          title="Scribble Air Pro"
          description="Unlimited drawings + full trace template library"
          amount={99}
          onClose={() => setShowPay(false)}
          onSuccess={onSubscribe}
        />
      )}
    </div>
  );
}