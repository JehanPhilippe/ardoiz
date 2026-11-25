param(
  [int]$Port = 8080
)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Listener = New-Object System.Net.HttpListener
$Prefix = "http://localhost:$Port/"
$Listener.Prefixes.Add($Prefix)
$Listener.Start()

Write-Host "CapDevoirs démarré sur $Prefix (Ctrl+C pour arrêter)" -ForegroundColor Cyan

$MimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".webp" = "image/webp"
}

try {
  while ($Listener.IsListening) {
    $Context = $Listener.GetContext()
    $ReqPath = $Context.Request.Url.LocalPath
    if ($ReqPath -eq "/" -or [string]::IsNullOrEmpty($ReqPath)) {
      $ReqPath = "/index.html"
    }
    $RelPath = $ReqPath.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
    $FullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $RelPath))

    if (-not $FullPath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $FullPath -PathType Leaf)) {
      $Context.Response.StatusCode = 404
      $Bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $Context.Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
      $Context.Response.OutputStream.Close()
      continue
    }

    $Ext = [System.IO.Path]::GetExtension($FullPath).ToLowerInvariant()
    $ContentType = if ($MimeTypes.ContainsKey($Ext)) { $MimeTypes[$Ext] } else { "application/octet-stream" }
    $Context.Response.ContentType = $ContentType
    $Context.Response.Headers.Add("Cache-Control", "no-cache")
    $FileBytes = [System.IO.File]::ReadAllBytes($FullPath)
    $Context.Response.ContentLength64 = $FileBytes.Length
    $Context.Response.OutputStream.Write($FileBytes, 0, $FileBytes.Length)
    $Context.Response.OutputStream.Close()
  }
} finally {
  $Listener.Stop()
  $Listener.Close()
}
