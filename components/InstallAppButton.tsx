'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type InstallAppButtonProps = {
  variant?: 'hero' | 'header' | 'mobile';
  className?: string;
};

function isAppInstalled() {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export default function InstallAppButton({ variant = 'hero', className = '' }: InstallAppButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isAppInstalled());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowHelp(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleClick = async () => {
    if (installed) return;

    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice.catch(() => null);
      if (choice?.outcome === 'accepted') setInstalled(true);
      setInstallPrompt(null);
      return;
    }

    setShowHelp(true);
  };

  const styles = {
    hero:
      'inline-flex items-center justify-center rounded-lg bg-yellow-300 px-6 py-3 font-extrabold uppercase text-gray-950 shadow-sm transition-colors hover:bg-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-200',
    header:
      'inline-flex items-center justify-center rounded-lg bg-yellow-300 px-4 py-2 text-sm font-extrabold uppercase text-gray-950 shadow-sm transition-colors hover:bg-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500',
    mobile:
      'block w-full rounded-lg bg-yellow-300 px-4 py-4 text-center text-base font-extrabold uppercase text-gray-950 shadow-sm transition-colors hover:bg-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500',
  };

  const label = installed ? 'App Installed' : variant === 'header' ? 'Download App' : 'Download Now';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={installed}
        className={`${styles[variant]} ${installed ? 'cursor-default opacity-80' : ''} ${className}`}
      >
        {label}
      </button>

      {showHelp && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-950/60 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-realm-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 text-gray-900 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-brand-700">REALM app</p>
                <h2 id="install-realm-title" className="mt-1 text-2xl font-black text-gray-950">
                  Add REALM to your Home Screen
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                X
              </button>
            </div>

            <ol className="mt-5 space-y-3 text-sm leading-relaxed text-gray-700">
              <li>
                <strong className="text-gray-950">iPhone or iPad:</strong> open this page in Safari, tap Share, then tap
                Add to Home Screen.
              </li>
              <li>
                <strong className="text-gray-950">Android:</strong> open this page in Chrome, tap the menu, then tap
                Install app or Add to Home screen.
              </li>
              <li>
                <strong className="text-gray-950">Done:</strong> the REALM tile will appear with your other apps.
              </li>
            </ol>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Got it
              </button>
              <a
                href="/"
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Open Home Page
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
