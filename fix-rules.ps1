# Fix Rules - Remove alwaysApply flags to prevent mass activation
# This script removes the alwaysApply: true flags that are causing all rules to load simultaneously

$rulesPath = "C:\Users\johng\Documents\GitHub\default\rules"
$files = Get-ChildItem -Path $rulesPath -Filter "*.md"

Write-Host "Fixing rules to prevent mass activation..." -ForegroundColor Yellow

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if file has alwaysApply: true
    if ($content -match "alwaysApply:\s*true") {
        Write-Host "Fixing: $($file.Name)" -ForegroundColor Cyan
        
        # Remove the alwaysApply line
        $newContent = $content -replace "alwaysApply:\s*true\r?\n?", ""
        
        # Also clean up empty frontmatter if that's all that was there
        $newContent = $newContent -replace "---\r?\n\r?\n---\r?\n", ""
        
        # Write back to file
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
    }
}

Write-Host "✅ Rules fixed! All alwaysApply flags removed." -ForegroundColor Green
Write-Host "This should prevent mass rule activation and reduce context bloat." -ForegroundColor Green