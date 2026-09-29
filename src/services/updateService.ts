export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseDate?: string;
  downloadUrl?: string;
  exeUrl?: string;
  changelog: string[];
  error?: boolean;
  errorMessage?: string;
}

export const DEFAULT_VERSION = '1.0.0';

const UPDATE_ENDPOINTS = [
  `https://raw.githubusercontent.com/shantocnits/sm-remote-controller/main/version.json`,
  `https://cdn.jsdelivr.net/gh/shantocnits/sm-remote-controller@main/version.json`,
  `https://fastly.jsdelivr.net/gh/shantocnits/sm-remote-controller@main/version.json`,
];

export const checkForAppUpdates = async (currentVersion = DEFAULT_VERSION): Promise<UpdateInfo> => {
  // 1. Try JSON endpoints with Multi-CDN mirror fallbacks
  for (const baseUrl of UPDATE_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const url = `${baseUrl}?t=${Date.now()}`;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      });
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
          downloadUrl: data.downloadUrl || `https://github.com/shantocnits/sm-remote-controller/releases/download/v${latestVer}/SM_Remote_Controller.apk`,
          exeUrl: data.exeUrl || `https://github.com/shantocnits/sm-remote-controller/releases/download/v${latestVer}/SM_Remote_Controller.exe`,
          changelog: Array.isArray(data.changelog) && data.changelog.length > 0 ? data.changelog : [
            '🔥 Performance improvements & bug fixes',
            '⚡ Enhanced remote stream latency',
          ],
          error: false,
        };
      }
    } catch {
      // Continue to next mirror endpoint
    }
  }

  // 2. Try GitHub Releases API fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const apiRes = await fetch(
      'https://api.github.com/repos/shantocnits/sm-remote-controller/releases/latest',
      {
        signal: controller.signal,
        headers: { 'User-Agent': 'SM-Remote-Controller-App' },
      }
    );
    clearTimeout(timeoutId);

    if (apiRes.ok) {
      const releaseData = await apiRes.json();
      const rawTag = releaseData.tag_name || '1.0.0';
      const latestVer = rawTag.replace(/^v/, '');
      const hasUpdate = compareVersions(latestVer, currentVersion) > 0;

      let apkUrl = `https://github.com/shantocnits/sm-remote-controller/releases/download/${rawTag}/SM_Remote_Controller.apk`;
      let exeUrl = `https://github.com/shantocnits/sm-remote-controller/releases/download/${rawTag}/SM_Remote_Controller.exe`;

      if (Array.isArray(releaseData.assets)) {
        const apkAsset = releaseData.assets.find((a: any) => a.name && a.name.endsWith('.apk'));
        const exeAsset = releaseData.assets.find((a: any) => a.name && a.name.endsWith('.exe'));
        if (apkAsset && apkAsset.browser_download_url) apkUrl = apkAsset.browser_download_url;
        if (exeAsset && exeAsset.browser_download_url) exeUrl = exeAsset.browser_download_url;
      }

      const changelogLines: string[] = releaseData.body
        ? releaseData.body
            .split('\n')
            .map((l: string) => l.trim().replace(/^[-*•]\s*/, ''))
            .filter((l: string) => l.length > 0 && !l.startsWith('#'))
        : ['🚀 New release update available on GitHub'];

      return {
        hasUpdate,
        currentVersion,
        latestVersion: latestVer,
        releaseDate: releaseData.published_at ? releaseData.published_at.slice(0, 10) : '2026-09-28',
        downloadUrl: apkUrl,
        exeUrl: exeUrl,
        changelog: changelogLines.length > 0 ? changelogLines : ['⚡ Latest improvements available'],
        error: false,
      };
    }
  } catch {
    // API failed
  }

  // 3. Transparent Failure (Do not fake latest version = current version!)
  return {
    hasUpdate: false,
    currentVersion,
    latestVersion: 'Network Error',
    releaseDate: 'N/A',
    changelog: [
      '⚠️ Unable to reach GitHub update server.',
      '📌 Ensure your internet is active.',
      '🔒 Make sure repository "shantocnits/sm-remote-controller" is PUBLIC on GitHub Settings so the app can fetch updates.',
    ],
    error: true,
    errorMessage: 'Could not connect to update server. Please check internet or repo visibility.',
  };
};

export function compareVersions(v1: string, v2: string): number {
  const p1 = (v1 || '0').replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  const p2 = (v2 || '0').replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] !== undefined ? p1[i] : 0;
    const num2 = p2[i] !== undefined ? p2[i] : 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
