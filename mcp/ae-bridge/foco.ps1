# foco.ps1 - ayudante del ae-bridge para que After Effects no le robe el foco al usuario.
# Proceso persistente: lee comandos por stdin, uno por linea.
#   get        -> imprime "<hwnd>|<proceso>" de la ventana activa
#   set <hwnd> -> devuelve el foco a esa ventana (si sigue existiendo)
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class FG {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool f);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  public static uint Pid(IntPtr h) { uint p; GetWindowThreadProcessId(h, out p); return p; }
  public static bool Restore(IntPtr h) {
    if (h == IntPtr.Zero || !IsWindow(h)) return false;
    IntPtr cur = GetForegroundWindow();
    if (cur == h) return true;
    uint p; uint tCur = GetWindowThreadProcessId(cur, out p);
    uint tMe = GetCurrentThreadId();
    bool att = AttachThreadInput(tMe, tCur, true);
    BringWindowToTop(h);
    bool ok = SetForegroundWindow(h);
    if (att) AttachThreadInput(tMe, tCur, false);
    return ok;
  }
}
"@
[Console]::Out.WriteLine("listo")
while ($true) {
  $l = [Console]::In.ReadLine()
  if ($l -eq $null) { break }
  try {
    if ($l -eq 'get') {
      $h = [FG]::GetForegroundWindow()
      $n = ''
      try { $n = (Get-Process -Id ([FG]::Pid($h))).ProcessName } catch {}
      [Console]::Out.WriteLine(([int64]$h).ToString() + '|' + $n)
    } elseif ($l.StartsWith('set ')) {
      $ok = [FG]::Restore([IntPtr][int64]$l.Substring(4))
      [Console]::Out.WriteLine($(if ($ok) { 'ok' } else { 'no' }))
    } else {
      [Console]::Out.WriteLine('?')
    }
  } catch {
    [Console]::Out.WriteLine('err')
  }
}
