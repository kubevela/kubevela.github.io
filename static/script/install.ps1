# Implemented based on Dapr Cli https://github.com/dapr/cli/tree/master/install

param (
    [string]$Version,
    [string]$VelaRoot = "c:\vela"
)

Write-Output ""
$ErrorActionPreference = 'stop'

#Escape space of VelaRoot path
$VelaRoot = $VelaRoot -replace ' ', '` '

# Constants
$VelaCliBuildNameLegacy = "vela"
$VelaCliBuildName = "vela.exe"
$VelaCliFileName = "vela.exe"
$VelaCliFilePath = "${VelaRoot}\${VelaCliFileName}"
$RemoteURL = "https://static.kubevela.net/binary/vela"

if ((Get-ExecutionPolicy) -gt 'RemoteSigned' -or (Get-ExecutionPolicy) -eq 'ByPass') {
    Write-Output "PowerShell requires an execution policy of 'RemoteSigned'."
    Write-Output "To make this change please run:"
    Write-Output "'Set-ExecutionPolicy RemoteSigned -scope CurrentUser'"
    break
}

# Change security protocol to support TLS 1.2 / 1.1 / 1.0 - old powershell uses TLS 1.0 as a default protocol
[Net.ServicePointManager]::SecurityProtocol = "tls12, tls11, tls"

# Check if KubeVela CLI is installed.
if (Test-Path $VelaCliFilePath -PathType Leaf) {
    Write-Warning "vela is detected - $VelaCliFilePath"
    Invoke-Expression "$VelaCliFilePath --version"
    Write-Output "Reinstalling KubeVela..."
}
else {
    Write-Output "Installing Vela..."
}

# Create Vela Directory
Write-Output "Creating $VelaRoot directory"
New-Item -ErrorAction Ignore -Path $VelaRoot -ItemType "directory"
if (!(Test-Path $VelaRoot -PathType Container)) {
    throw "Cannot create $VelaRoot"
}

# Filter windows binary and download archive
$os_arch = "windows-amd64"
$vela_cli_filename = "vela"
if (!$Version) {
    $Version = Invoke-RestMethod -Headers $githubHeader -Uri "${RemoteURL}/latest_version" -Method Get
    $Version = $Version.Trim()
}
if (!$Version.startswith("v")) {
    $Version = "v" + $Version
}

$assetName = "${vela_cli_filename}-${Version}-${os_arch}.zip"
$zipFileUrl = "${RemoteURL}/${Version}/${assetName}"

$zipFilePath = $VelaRoot + "\" + $assetName
Write-Output "Downloading $zipFileUrl ..."

Invoke-WebRequest -Uri $zipFileUrl -OutFile $zipFilePath
if (!(Test-Path $zipFilePath -PathType Leaf)) {
    throw "Failed to download Vela Cli binary - $zipFilePath"
}

# Extract KubeVela CLI to $VelaRoot
Write-Output "Extracting $zipFilePath..."
Microsoft.Powershell.Archive\Expand-Archive -Force -Path $zipFilePath -DestinationPath $VelaRoot
$ExtractedVelaCliFilePath = "${VelaRoot}\${os_arch}\${VelaCliBuildNameLegacy}"
if (!(Test-Path $ExtractedVelaCliFilePath -PathType Leaf)) {
    $ExtractedVelaCliFilePath = "${VelaRoot}\${os_arch}\${VelaCliBuildName}"
}
Copy-Item $ExtractedVelaCliFilePath -Destination $VelaCliFilePath
if (!(Test-Path $VelaCliFilePath -PathType Leaf)) {
    throw "Failed to extract Vela Cli archive - $zipFilePath"
}

# Check the KubeVela CLI version
Invoke-Expression "$VelaCliFilePath --version"

# Clean up zipfile
Write-Output "Clean up $zipFilePath..."
Remove-Item $zipFilePath -Force

# Add VelaRoot directory to User Path environment variable
Write-Output "Try to add $VelaRoot to User Path Environment variable..."
$UserPathEnvironmentVar = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($UserPathEnvironmentVar -like '*vela*') {
    Write-Output "Skipping to add $VelaRoot to User Path - $UserPathEnvironmentVar"
}
else {
    [System.Environment]::SetEnvironmentVariable("PATH", $UserPathEnvironmentVar + ";$VelaRoot", "User")
    $UserPathEnvironmentVar = [Environment]::GetEnvironmentVariable("PATH", "User")
    Write-Output "Added $VelaRoot to User Path - $UserPathEnvironmentVar"
}

Write-Output "`r`nKubeVela CLI is installed successfully."
Write-Output "To get started with KubeVela, please visit https://kubevela.io ."
