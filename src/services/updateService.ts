export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseDate?: string;
  downloadUrl?: string;
  changelog: string[];
}

export const CURRENT_VERSION = '1.0.0';

export const checkForAppUpdates = async (): Promise<UpdateInfo> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // Fetch version.json from GitHub raw master/main
    const response = await fetch(
      'https://raw.githubusercontent.com/shantocnits/sm-remote-controller/main/version.json',
      {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const latestVer = data.version || '1.0.0';
      const hasUpdate = compareVersions(latestVer, CURRENT_VERSION) > 0;

      return {
        hasUpdate,
        currentVersion: CURRENT_VERSION,
        latestVersion: latestVer,
        releaseDate: data.releaseDate || '2026-09-28',
        downloadUrl: data.downloadUrl,
        changelog: data.changelog || [
          'Performance improvements & bug fixes',
          'Updated remote controller bridge',
        ],
      };
    }
  } catch (err) {
    // Network or fetch fallback
  }

  // Fallback info showing latest current state
  return {
    hasUpdate: false,
    currentVersion: CURRENT_VERSION,
    latestVersion: CURRENT_VERSION,
    releaseDate: '28 Sept 2026',
    changelog: [
      '🔥 Custom Remote Controller App Icon & Brand Logo',
      '🚀 In-App GitHub Auto-Update System with changelog',
      '✨ Interactive File Manager, Call Logs, App Manager & System Shell',
      '💬 Voice Player, Photo & Document Attachment in Live Chat',
      '📹 Video Call with Draggable Self-Camera & PiP Multitasking',
    ],
  };
};

function compareVersions(v1: string, v2: string): number {
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
