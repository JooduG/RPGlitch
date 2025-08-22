# Automated Conversation Summary Saver
# Usage: .\save-conversation-summary.ps1 "Your conversation summary content here"

param(
    [Parameter(Mandatory=$true)]
    [string]$SummaryContent
)

# Get current date and time
$date = Get-Date -Format "yyyy-MM-dd"
$time = Get-Date -Format "HHmmss"
$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:sszzz"

# Create directory structure
$summaryDir = "memory-bank\conversation-summaries\$date"
if (!(Test-Path $summaryDir)) {
    New-Item -ItemType Directory -Path $summaryDir -Force | Out-Null
}

# Create summary file
$filename = "$summaryDir\summary-$time.md"
$content = @"
# Conversation Summary - $timestamp

$SummaryContent

---
*Automatically saved by save-conversation-summary.ps1*
"@

$content | Out-File -FilePath $filename -Encoding UTF8
Write-Host "Conversation summary saved to: $filename"