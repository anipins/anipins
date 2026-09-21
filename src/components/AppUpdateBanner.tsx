"use client";

import { useEffect, useState } from "react";

type AppVersion = { versionCode: number; versionName: string; apk: string };

export default function AppUpdateBanner() {
  const [data, setData] = useState<AppVersion | null>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    try {
      const current = window.AniPinsAndroid?.getVersionCode?.();
      if (!current) return;
      fetch("/api/app-version", { cache: "no-store" })
        .then((response) => response.json())
        .then((latest: AppVersion) => {
          if (Number(current) < Number(latest.versionCode)) setData(latest);
        });
    } catch {}
  }, []);

  if (!data) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-[75] mx-auto max-w-md rounded-2xl bg-panel p-4 hairline shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">AniPins {data.versionName} is ready</p>
          <p className="mt-1 text-xs text-fog">
            {downloadStarted
              ? "Open Downloads, tap the AniPins APK, then choose Update."
              : "Download the latest signed app update."}
          </p>
        </div>
        <button onClick={() => setData(null)} aria-label="Dismiss" className="text-fog">×</button>
      </div>
      <div className="mt-3 flex gap-2">
        {!downloadStarted ? (
          <a
            href={data.apk}
            download={`AniPins-${data.versionName}.apk`}
            onClick={() => setDownloadStarted(true)}
            className="btn-primary flex-1 !px-4 !py-2 text-center text-xs"
          >
            Download update
          </a>
        ) : (
          <button
            onClick={() => window.AniPinsAndroid?.openDownloads?.()}
            className="btn-primary flex-1 !px-4 !py-2 text-xs"
          >
            Open Downloads
          </button>
        )}
      </div>
    </div>
  );
}
