import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowGuide(true);
    }
  };

  if (isInstalled || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600/90 via-orange-600/90 to-amber-700/90 text-white px-4 py-2.5 shadow-lg border-b border-amber-500/30">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/25">
            <Smartphone className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight flex items-center gap-1.5">
              <span>Pasang VoliBareng di HP Android</span>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-black/30 tracking-wider">PWA</span>
            </p>
            <p className="text-xs text-amber-100/90 hidden sm:block">
              Akses cepat tanpa buka browser, lebih hemat kuota & siap terima notifikasi jadwal main.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleInstallClick}
            className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 bg-slate-950 text-amber-400 hover:bg-slate-900 rounded-lg shadow-sm transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pasang Aplikasi</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Tutup banner"
            className="p-1 hover:bg-white/20 rounded-md transition text-amber-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showGuide && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 text-slate-100 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                Cara Pasang di HP
              </h3>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/80">
                <span className="font-black text-amber-400 text-sm">1</span>
                <p>Buka menu browser Chrome di HP (ikon titik tiga di pojok kanan atas).</p>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/80">
                <span className="font-black text-amber-400 text-sm">2</span>
                <p>Pilih <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Install Aplikasi"</strong>.</p>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/80">
                <span className="font-black text-amber-400 text-sm">3</span>
                <p>Ikon VoliBareng akan muncul di menu aplikasi Android kamu seperti aplikasi biasa!</p>
              </div>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
