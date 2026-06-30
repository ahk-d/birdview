import { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { useStore } from '@/services/store';
import { useTheme } from '@/hooks/useTheme';
import { QuickCapture } from '@/components/QuickCapture';
import { Toaster } from '@/components/Toast';
import { isExtension } from '@/services/browser';

export function Popup() {
  const hydrate = useStore((s) => s.hydrate);
  useTheme();
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const openDashboard = () => {
    if (isExtension) {
      void chrome.tabs.create({ url: chrome.runtime.getURL('src/pages/dashboard/index.html') });
    } else {
      window.open('/', '_blank');
    }
  };

  return (
    <div className="bg-bg p-3 text-fg">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-accent-fg text-xs font-bold">B</div>
          <span className="text-sm font-semibold">Birdview</span>
        </div>
        <button onClick={openDashboard} className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
          Open dashboard <ExternalLink size={12} />
        </button>
      </div>
      <QuickCapture />
      <Toaster />
    </div>
  );
}
