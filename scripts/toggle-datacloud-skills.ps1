# Script bật / tắt Data Cloud skills (GCP, BigQuery, Airflow, Spark...) khi cần
param (
    [Parameter(Mandatory=$false)]
    [ValidateSet("enable", "disable")]
    [string]$Action = "enable"
)

$skillsDir = "C:\Users\trand\.gemini\config\skills"
$disabledDir = "C:\Users\trand\.gemini\config\skills-disabled"
$manifestPath = "$disabledDir\.datacloud_skills_manifest"

if (-not (Test-Path $manifestPath)) {
    $manifestPath = "$skillsDir\.datacloud_skills_manifest"
}

if (-not (Test-Path $manifestPath)) {
    Write-Error "Không tìm thấy file .datacloud_skills_manifest"
    exit 1
}

$manifest = Get-Content $manifestPath | ConvertFrom-Json
$skills = $manifest.skills.PSObject.Properties.Name

if ($Action -eq "enable") {
    foreach ($s in $skills) {
        $src = "$disabledDir\$s"
        $dst = "$skillsDir\$s"
        if (Test-Path $src) {
            Move-Item -Path $src -Destination $dst -Force
            Write-Host "Restored $s"
        }
    }
    Write-Host "Đã bật lại toàn bộ Data Cloud skills!"
} elseif ($Action -eq "disable") {
    if (-not (Test-Path $disabledDir)) {
        New-Item -ItemType Directory -Path $disabledDir -Force | Out-Null
    }
    foreach ($s in $skills) {
        $src = "$skillsDir\$s"
        $dst = "$disabledDir\$s"
        if (Test-Path $src) {
            Move-Item -Path $src -Destination $dst -Force
            Write-Host "Disabled $s"
        }
    }
    Write-Host "Đã tắt toàn bộ Data Cloud skills để tiết kiệm token!"
}
