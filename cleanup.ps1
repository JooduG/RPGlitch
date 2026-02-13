# cleanup.ps1

# 1. Renames
$renames = @(
    @{ Old = ".agent/skills/simulation-engine"; New = ".agent/skills/simulation" },
    @{ Old = ".agent/tools/knowledge"; New = ".agent/tools/memory" }
)

foreach ($item in $renames) {
    if (Test-Path $item.Old) {
        Write-Host "Renaming $($item.Old) to $($item.New)..."
        Move-Item -Path $item.Old -Destination $item.New -Force
    } else {
        Write-Host "Skipping rename: $($item.Old) not found."
    }
}

# 2. Deletes (Legacy Skills)
$legacySkills = @(
    "warden",
    "artificer",
    "scholar",
    "mesmer",
    "cortex",
    "gamemaster",
    "scribe"
)

foreach ($skill in $legacySkills) {
    $path = ".agent_legacy/skills/$skill"
    if (Test-Path $path) {
        Write-Host "Deleting legacy skill: $path..."
        Remove-Item -Path $path -Recurse -Force
    }
}

# 3. Code Patch: Update tooling.json validation command
$toolingPath = ".agent/tooling.json"
if (Test-Path $toolingPath) {
    $json = Get-Content $toolingPath | ConvertFrom-Json
    $json.validation_command = "node .agent/skills/project/scripts/sync.js"
    $json | ConvertTo-Json -Depth 10 | Set-Content $toolingPath
    Write-Host "Updated validation_command in tooling.json"
}

Write-Host "Cleanup complete."
