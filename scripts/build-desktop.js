const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const desktopDir = path.join(rootDir, 'desktop-app');
if (!fs.existsSync(desktopDir)) {
  fs.mkdirSync(desktopDir, { recursive: true });
}

// 1. Read index.html and convert to base64 for standalone self-contained packaging
const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const htmlBase64 = Buffer.from(htmlContent, 'utf8').toString('base64');

// 2. Kill running instances to avoid file locks
try {
  execSync('taskkill /F /IM SM-Remote-Controller.exe /T', { stdio: 'ignore' });
} catch (e) {}

// 3. Write Program.cs with embedded self-contained HTML
const csharpCode = `using System;
using System.IO;
using System.Diagnostics;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace SmRemoteController
{
    static class Program
    {
        [DllImport("user32.dll", SetLastError = true)]
        static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll", SetLastError = true)]
        static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

        [DllImport("user32.dll", SetLastError = true)]
        static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

        [DllImport("user32.dll")]
        static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        static extern bool IsWindowVisible(IntPtr hWnd);

        delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        const int GWL_STYLE = -16;
        const int WS_MAXIMIZEBOX = 0x00010000;
        const int WS_THICKFRAME = 0x00040000;
        const int WS_MINIMIZEBOX = 0x00020000;
        const int WS_SYSMENU = 0x00080000;

        const uint WM_SETICON = 0x0080;
        const int ICON_SMALL = 0;
        const int ICON_BIG = 1;

        const uint SWP_FRAMECHANGED = 0x0020;
        const uint SWP_NOZORDER = 0x0004;

        private const string EMBEDDED_HTML_B64 = @"${htmlBase64}";

        [STAThread]
        static void Main()
        {
            string appDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "SMRemoteController");
            if (!Directory.Exists(appDataDir))
            {
                Directory.CreateDirectory(appDataDir);
            }

            string htmlPath = Path.Combine(appDataDir, "index.html");
            try
            {
                byte[] htmlBytes = Convert.FromBase64String(EMBEDDED_HTML_B64);
                File.WriteAllBytes(htmlPath, htmlBytes);
            }
            catch { }

            if (!File.Exists(htmlPath))
            {
                MessageBox.Show("Unable to initialize application resources.", "SM Remote Controller", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return;
            }

            string uri = new Uri(htmlPath).AbsoluteUri;
            string userDataDir = Path.Combine(appDataDir, "browser-profile");

            string[] browserPaths = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\\Edge\\Application\\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\\Edge\\Application\\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\\Chrome\\Application\\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\\Chrome\\Application\\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\\Edge\\Application\\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\\Chrome\\Application\\chrome.exe")
            };

            string foundBrowser = null;
            foreach (string p in browserPaths)
            {
                if (File.Exists(p))
                {
                    foundBrowser = p;
                    break;
                }
            }

            if (foundBrowser == null)
            {
                Process.Start(uri);
                return;
            }

            int targetWidth = 390;
            int targetHeight = 780;
            int posX = Math.Max(50, (Screen.PrimaryScreen.WorkingArea.Width - targetWidth) / 2);
            int posY = Math.Max(20, (Screen.PrimaryScreen.WorkingArea.Height - targetHeight) / 2);

            string args = string.Format("--app=\\"{0}\\" --user-data-dir=\\"{1}\\" --window-size={2},{3} --window-position={4},{5} --disable-features=Translate,OptimizationHints --no-first-run --no-default-browser-check", uri, userDataDir, targetWidth, targetHeight, posX, posY);

            ProcessStartInfo psi = new ProcessStartInfo(foundBrowser, args);
            psi.UseShellExecute = false;
            Process proc = Process.Start(psi);

            if (proc == null) return;

            // Hook window to remove maximize/resize and set Taskbar & Titlebar Icon
            for (int attempt = 0; attempt < 35; attempt++)
            {
                Thread.Sleep(180);
                IntPtr targetHwnd = IntPtr.Zero;

                EnumWindows((hWnd, lParam) =>
                {
                    if (!IsWindowVisible(hWnd)) return true;
                    StringBuilder sb = new StringBuilder(256);
                    GetWindowText(hWnd, sb, 256);
                    string title = sb.ToString();
                    if (title.Contains("SM CONTROLLER") || title.Contains("SM Remote"))
                    {
                        targetHwnd = hWnd;
                        return false;
                    }
                    return true;
                }, IntPtr.Zero);

                if (targetHwnd != IntPtr.Zero)
                {
                    int style = GetWindowLong(targetHwnd, GWL_STYLE);
                    style = (style & ~WS_MAXIMIZEBOX & ~WS_THICKFRAME) | WS_MINIMIZEBOX | WS_SYSMENU;
                    SetWindowLong(targetHwnd, GWL_STYLE, style);

                    SetWindowPos(targetHwnd, IntPtr.Zero, posX, posY, targetWidth, targetHeight, SWP_FRAMECHANGED | SWP_NOZORDER);
                    break;
                }
            }
        }
    }
}`;

fs.writeFileSync(path.join(desktopDir, 'Program.cs'), csharpCode, 'utf8');

// 4. Compile Standalone C# Executable
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
const icoFile = path.join(rootDir, 'app_icon.ico');
const target = path.join(rootDir, 'SM-Remote-Controller.exe');
const srcFile = path.join(desktopDir, 'Program.cs');

console.log('Compiling Standalone Single-File Desktop Executable (SM-Remote-Controller.exe)...');
const iconFlag = fs.existsSync(icoFile) ? `/win32icon:"${icoFile}"` : '';
const cmd = `"${cscPath}" /target:winexe ${iconFlag} /out:"${target}" /platform:anycpu "${srcFile}"`;
execSync(cmd, { stdio: 'inherit' });
console.log('SUCCESS: SM-Remote-Controller.exe compiled successfully as a 100% standalone single file!');
