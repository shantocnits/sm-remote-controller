export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseDate?: string;
  downloadUrl?: string;
  changelog: string[];
}

export const DEFAULT_VERSION = '1.0.0';

export const checkForAppUpdates = async (currentVersion = DEFAULT_VERSION): Promise<UpdateInfo> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // Fetch version.json with cache buster from GitHub raw
    const response = await fetch(
      `https://raw.githubusercontent.com/shantocnits/sm-remote-controller/main/version.json?t=${Date.now()}`,
      {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const latestVer = data.version || '1.0.0';
      const hasUpdate = compareVersions(latestVer, currentVersion) > 0;

      return {
        hasUpdate,
        currentVersion,
        latestVersion: latestVer,
        releaseDate: data.releaseDate || '2026-09-28',
        downloadUrl: data.downloadUrl,
        changelog: Array.isArray(data.changelog) && data.changelog.length > 0 ? data.changelog : [
          '🔥 Performance improvements & bug fixes',
          '⚡ Enhanced remote stream latency',
        ],
      };
    }
  } catch (err) {
    // network fallback handled below
  }

  // Fallback when offline or GitHub raw unreachable
  return {
    hasUpdate: false,
    currentVersion,
    latestVersion: currentVersion,
    releaseDate: '28 Sept 2026',
    changelog: [
      '🔥 Custom Remote Controller App Icon & Brand Logo',
      '🚀 In-App GitHub Auto-Update System with changelog viewer',
      '✨ Interactive File Manager, Call Logs, App Manager & System Shell',
      '💬 Voice Player, Photo & Document Attachment in Live Chat',
      '📹 Fullscreen Video Call with Draggable Self-Camera & PiP Multitasking',
      '⚡ Strict Network Monitoring & Fast Offline Screen Protection',
    ],
  };
};

export function compareVersions(v1: string, v2: string): number {
  const p1 = (v1 || '0').split('.').map((n) => parseInt(n, 10) || 0);
  const p2 = (v2 || '0').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] !== undefined ? p1[i] : 0;
    const num2 = p2[i] !== undefined ? p2[i] : 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
