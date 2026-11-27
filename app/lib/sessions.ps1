# Flocon : sessions Windows ouvertes, sans quser (absent de Windows Famille).
#   sessions.ps1 liste          -> [{"id":2,"user":"Brune","active":true}, ...]
#   sessions.ps1 deconnecter 2  -> ferme la session 2
# Lancé par le gardien (compte SYSTEM).
param([string]$Action = 'liste', [int]$Id = 0)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class FloconWts {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  struct INFO { public int Id; public string Station; public int State; }
  [DllImport("wtsapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  static extern bool WTSEnumerateSessions(IntPtr h, int reserve, int version, out IntPtr infos, out int nombre);
  [DllImport("wtsapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  static extern bool WTSQuerySessionInformation(IntPtr h, int id, int classe, out IntPtr tampon, out int taille);
  [DllImport("wtsapi32.dll")]
  static extern void WTSFreeMemory(IntPtr p);
  [DllImport("wtsapi32.dll", SetLastError = true)]
  public static extern bool WTSLogoffSession(IntPtr h, int id, bool attendre);

  static string Json(string s) {
    var sb = new StringBuilder();
    foreach (char ch in s) {
      if (ch == '"' || ch == '\\') { sb.Append('\\'); sb.Append(ch); }
      else if (ch < 32 || ch > 126) sb.Append("\\u" + ((int)ch).ToString("x4"));
      else sb.Append(ch);
    }
    return sb.ToString();
  }

  public static string Liste() {
    IntPtr p; int n;
    if (!WTSEnumerateSessions(IntPtr.Zero, 0, 1, out p, out n)) return "[]";
    var sb = new StringBuilder("[");
    int taille = Marshal.SizeOf(typeof(INFO));
    bool premier = true;
    for (int i = 0; i < n; i++) {
      var s = (INFO)Marshal.PtrToStructure(new IntPtr(p.ToInt64() + (long)i * taille), typeof(INFO));
      IntPtr b; int l; string u = "";
      // 5 = WTSUserName
      if (WTSQuerySessionInformation(IntPtr.Zero, s.Id, 5, out b, out l)) { u = Marshal.PtrToStringUni(b); WTSFreeMemory(b); }
      if (String.IsNullOrEmpty(u)) continue;
      if (!premier) sb.Append(",");
      premier = false;
      // 0 = WTSActive : la session est à l'écran (et non verrouillée en arrière-plan par un changement d'utilisateur)
      sb.Append("{\"id\":" + s.Id + ",\"user\":\"" + Json(u) + "\",\"active\":" + (s.State == 0 ? "true" : "false") + "}");
    }
    WTSFreeMemory(p);
    sb.Append("]");
    return sb.ToString();
  }
}
'@
if ($Action -eq 'liste') { [Console]::Out.Write([FloconWts]::Liste()) }
elseif ($Action -eq 'deconnecter' -and $Id -gt 0) { if (-not [FloconWts]::WTSLogoffSession([IntPtr]::Zero, $Id, $false)) { exit 1 } }
