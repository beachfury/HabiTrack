# scripts/snapshot.ps1
# Creates a single text snapshot of source/config files in the repo root.

param(
  [string]$OutputName = ("code-snapshot_{0}.txt" -f (Get-Date -Format "yyyyMMdd_HHmmss")),
  [int64]$MaxFileBytes = 10MB,
  [switch]$WriteSkippedReport
)

$root = Convert-Path .
$outFile = Join-Path $root $OutputName
$skippedFile = Join-Path $root ( ($OutputName -replace '\.txt$','') + "_skipped.txt" )

# Folders to ignore (substring match on full path)
$excludeDirs = @(
  "\.git\", "\node_modules\", "\dist\", "\build\", "\coverage\",
  "\.pnpm-store", "\.turbo\", "\.next\", "\out\", "\tmp\", "\logs\",
  "\.cache\", "\public\assets\", "\public\static\", "\assets\"
)

# File extensions to include
$includeExts = @(
  "ts","tsx","js","cjs","mjs",
  "json","md","sql","yml","yaml",
  "css","scss","html","sh","ps1"
)

# Specific filenames to include even if no extension
$includeNames = @(
  "Dockerfile","docker-compose.yml","docker-compose.yaml",
  "package.json","pnpm-workspace.yaml","tsconfig.json",
  ".eslintrc",".eslintrc.js",".eslintrc.cjs",".prettierrc",".prettierrc.json",
  ".gitignore",".gitattributes",".editorconfig"
)

# Sensitive files to exclude explicitly
$excludeNames = @(
  ".env",".env.local",".env.development",".env.production",".env.test",
  ".env.*"
)

# ALWAYS include anything under these paths (relative to repo root).
# This is the “make sure I always see new migrations & wiring” list.
$alwaysIncludeSubpaths = @(
  "\providers\storage-mariadb\migrations\",
  "\docker\",
  "\apps\api\scripts\",
  "\apps\api\src\",
  "\apps\web\",
  "\packages\"
)

function Is-ExcludedPath([string]$path) {
  foreach ($pat in $excludeDirs) {
    if ($path -like "*$pat*") { return $true }
  }
  return $false
}

function Is-AlwaysInclude([string]$path) {
  foreach ($p in $alwaysIncludeSubpaths) {
    if ($path -like "*$p*") { return $true }
  }
  return $false
}

function Is-IncludeFile($file) {
  $name = $file.Name
  $ext  = $file.Extension.TrimStart('.').ToLowerInvariant()

  # Exclude sensitive names
  foreach ($ex in $excludeNames) {
    if ($name -like $ex) { return $false }
  }

  if ($includeExts -contains $ext) { return $true }
  if ($includeNames -contains $name) { return $true }

  # Include common dotfile variants with dotted extensions (e.g. ".eslintrc.cjs")
  foreach ($special in $includeNames) {
    if ($special.StartsWith(".") -and $name -like "$special.*") { return $true }
  }

  return $false
}

Write-Host "Scanning repo…" -ForegroundColor Cyan

$all =
  Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue |
  Sort-Object FullName

$files = @()
$skipped = @()

foreach ($f in $all) {
  $excludedDir = Is-ExcludedPath $f.FullName
  $always = Is-AlwaysInclude $f.FullName
  $included = Is-IncludeFile $f
  $sizeOk = ($f.Length -le $MaxFileBytes)

  $take = (-not $excludedDir) -and $sizeOk -and ($always -or $included)

  if ($take) {
    $files += $f
  } else {
    if ($WriteSkippedReport) {
      $reason = @()
      if ($excludedDir) { $reason += "excluded_dir" }
      if (-not $sizeOk) { $reason += "too_large" }
      if (-not ($always -or $included)) { $reason += "not_included" }
      $skipped += [pscustomobject]@{
        Path   = $f.FullName
        Bytes  = $f.Length
        Reason = ($reason -join ",")
      }
    }
  }
}

"=== CODE SNAPSHOT ===" | Out-File -FilePath $outFile -Encoding utf8
"Generated: $(Get-Date -Format s)" | Out-File -FilePath $outFile -Append -Encoding utf8
"Root: $root" | Out-File -FilePath $outFile -Append -Encoding utf8
"Files: $($files.Count)" | Out-File -FilePath $outFile -Append -Encoding utf8
"MaxFileBytes: $MaxFileBytes" | Out-File -FilePath $outFile -Append -Encoding utf8
"`r`n" | Out-File -FilePath $outFile -Append -Encoding utf8

foreach ($f in $files) {
  try {
    $rel = Resolve-Path -Path $f.FullName -Relative
  } catch {
    $rel = $f.FullName.Substring($root.Length).TrimStart('\','/')
  }
  "`r`n>>>>>> START $rel" | Out-File -FilePath $outFile -Append -Encoding utf8
  Get-Content -LiteralPath $f.FullName -Raw -Encoding UTF8 | Out-File -FilePath $outFile -Append -Encoding utf8
  "`r`n<<<<<< END $rel`r`n" | Out-File -FilePath $outFile -Append -Encoding utf8
}

if ($WriteSkippedReport) {
  $skipped | Sort-Object Reason, Path | Format-Table -AutoSize | Out-String |
    Out-File -FilePath $skippedFile -Encoding utf8
  Write-Host "Wrote skipped report: $skippedFile  (skipped: $($skipped.Count))" -ForegroundColor Yellow
}

# Optional: print a checksum so you can verify/share reliably
$sha = [System.Security.Cryptography.SHA256]::Create()
$bytes = [System.IO.File]::ReadAllBytes($outFile)
$hash = ($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") }) -join ''
Write-Host "Wrote $outFile  (files: $($files.Count), SHA256: $hash)" -ForegroundColor Green
