$ErrorActionPreference = 'Stop'

$mobileRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$signingDir = Join-Path $mobileRoot 'signing'
$keystorePath = Join-Path $signingDir 'anipins-upload-key.jks'
$passwordPath = Join-Path $signingDir 'upload-password.dpapi'
$bundlePath = Join-Path $mobileRoot 'app\build\outputs\bundle\release\app-release.aab'
$apkPath = Join-Path $mobileRoot 'app\build\outputs\apk\release\app-release.apk'
$originalJavaHome = $env:JAVA_HOME
$originalAndroidHome = $env:ANDROID_HOME
$originalAndroidSdkRoot = $env:ANDROID_SDK_ROOT
$jdkHome = $env:JAVA_HOME
$androidSdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } elseif ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }

if (-not (Test-Path -LiteralPath $keystorePath)) { throw "Upload keystore not found: $keystorePath" }
if (-not (Test-Path -LiteralPath $passwordPath)) { throw "Encrypted upload-key password not found: $passwordPath" }
if (-not $jdkHome) {
    $jdkHome = Get-ChildItem (Join-Path $env:LOCALAPPDATA 'Programs\Microsoft') -Directory -Filter 'jdk-17*' -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending |
        Select-Object -First 1 -ExpandProperty FullName
}
if (-not $jdkHome -or -not (Test-Path -LiteralPath (Join-Path $jdkHome 'bin\jarsigner.exe'))) { throw 'A JDK 17 installation was not found; set JAVA_HOME to the JDK used by Gradle.' }
if (-not (Test-Path -LiteralPath (Join-Path $androidSdk 'build-tools\36.0.0\apksigner.bat'))) { throw "Android build-tools 36.0.0 not found under $androidSdk" }
$env:JAVA_HOME = $jdkHome
$env:ANDROID_HOME = $androidSdk
$env:ANDROID_SDK_ROOT = $androidSdk

$securePassword = Get-Content -LiteralPath $passwordPath -Raw | ConvertTo-SecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$password = $null

try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    $env:ANIPINS_KEYSTORE_PATH = $keystorePath
    $env:ANIPINS_KEYSTORE_PASSWORD = $password
    $env:ANIPINS_KEY_ALIAS = 'anipins-upload'
    $env:ANIPINS_KEY_PASSWORD = $password

    Push-Location $mobileRoot
    try {
        & .\gradlew.bat --no-daemon bundleRelease assembleRelease
        if ($LASTEXITCODE -ne 0) { throw "Gradle release bundle failed with exit code $LASTEXITCODE." }
    }
    finally {
        Pop-Location
    }

    if (-not (Test-Path -LiteralPath $bundlePath)) { throw "Release AAB not found: $bundlePath" }
    & (Join-Path $jdkHome 'bin\jarsigner.exe') -verify $bundlePath
    if ($LASTEXITCODE -ne 0) { throw 'AAB signature verification failed.' }
    & (Join-Path $androidSdk 'build-tools\36.0.0\apksigner.bat') verify --print-certs $apkPath
    if ($LASTEXITCODE -ne 0) { throw 'Release APK signature verification failed.' }

    Write-Output "Signed AAB and APK verified. AAB for Play upload: $bundlePath"
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    $password = $null
    Remove-Item Env:ANIPINS_KEYSTORE_PATH, Env:ANIPINS_KEYSTORE_PASSWORD, Env:ANIPINS_KEY_ALIAS, Env:ANIPINS_KEY_PASSWORD -ErrorAction SilentlyContinue
    if ($null -eq $originalJavaHome) { Remove-Item Env:JAVA_HOME -ErrorAction SilentlyContinue } else { $env:JAVA_HOME = $originalJavaHome }
    if ($null -eq $originalAndroidHome) { Remove-Item Env:ANDROID_HOME -ErrorAction SilentlyContinue } else { $env:ANDROID_HOME = $originalAndroidHome }
    if ($null -eq $originalAndroidSdkRoot) { Remove-Item Env:ANDROID_SDK_ROOT -ErrorAction SilentlyContinue } else { $env:ANDROID_SDK_ROOT = $originalAndroidSdkRoot }
}
