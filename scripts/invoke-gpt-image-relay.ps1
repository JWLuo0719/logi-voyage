param(
    [ValidateSet("generate", "chat")]
    [string]$Mode = "generate",

    [string]$BaseUrl,
    [string]$ApiKey,
    [string]$Model = "gpt-image-2",
    [string]$Prompt,
    [string]$ImagePath,
    [string]$OutputPath,
    [string]$ConfigPath = "scripts\image-relay.config.json"
)

$ErrorActionPreference = "Stop"

function Fail([string]$Message) {
    throw $Message
}

function Require-Value([string]$Name, [string]$Value) {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        Fail("$Name is required.")
    }
}

function Read-ConfigFile([string]$PathValue) {
    $absolutePath = Resolve-AbsolutePath $PathValue
    if ([string]::IsNullOrWhiteSpace($absolutePath) -or -not (Test-Path -LiteralPath $absolutePath)) {
        return $null
    }

    return Get-Content -LiteralPath $absolutePath -Raw | ConvertFrom-Json
}

function Resolve-AbsolutePath([string]$PathValue) {
    if ([string]::IsNullOrWhiteSpace($PathValue)) {
        return $null
    }

    if ([System.IO.Path]::IsPathRooted($PathValue)) {
        return $PathValue
    }

    return [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $PathValue))
}

function Get-SettingValue([string]$ParameterValue, $ConfigValue, [string]$EnvVarName) {
    if (-not [string]::IsNullOrWhiteSpace($ParameterValue)) {
        return $ParameterValue
    }

    if ($null -ne $ConfigValue -and -not [string]::IsNullOrWhiteSpace([string]$ConfigValue)) {
        return [string]$ConfigValue
    }

    $envValue = [Environment]::GetEnvironmentVariable($EnvVarName)
    if (-not [string]::IsNullOrWhiteSpace($envValue)) {
        return $envValue
    }

    return $null
}

function Ensure-Directory([string]$FilePath) {
    $directory = Split-Path -Parent $FilePath
    if (-not [string]::IsNullOrWhiteSpace($directory) -and -not (Test-Path -LiteralPath $directory)) {
        New-Item -ItemType Directory -Path $directory | Out-Null
    }
}

function Get-MimeType([string]$FilePath) {
    switch ([System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()) {
        ".png" { return "image/png" }
        ".jpg" { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".webp" { return "image/webp" }
        ".gif" { return "image/gif" }
        default { Fail("Unsupported image type: $FilePath") }
    }
}

function Convert-ImageFileToDataUrl([string]$FilePath) {
    $absolutePath = Resolve-AbsolutePath $FilePath
    if (-not (Test-Path -LiteralPath $absolutePath)) {
        Fail("Image file not found: $absolutePath")
    }

    $mimeType = Get-MimeType $absolutePath
    $bytes = [System.IO.File]::ReadAllBytes($absolutePath)
    $base64 = [Convert]::ToBase64String($bytes)
    return "data:$mimeType;base64,$base64"
}

function Save-Base64Png([string]$Base64Value, [string]$TargetPath) {
    $absoluteTarget = Resolve-AbsolutePath $TargetPath
    Ensure-Directory $absoluteTarget
    $bytes = [Convert]::FromBase64String($Base64Value)
    [System.IO.File]::WriteAllBytes($absoluteTarget, $bytes)
    return $absoluteTarget
}

function Invoke-JsonApi([string]$Uri, [hashtable]$Body) {
    $headers = @{
        Authorization = "Bearer $ApiKey"
        "Content-Type" = "application/json"
    }

    $jsonBody = $Body | ConvertTo-Json -Depth 10
    return Invoke-RestMethod -Method Post -Uri $Uri -Headers $headers -Body $jsonBody
}

function Normalize-RelayBaseUrl([string]$UrlValue) {
    $trimmed = $UrlValue.TrimEnd("/")
    foreach ($suffix in @(
        "/gpt/v1/images/generations",
        "/gpt/v1/images/edits",
        "/gpt/v1/chat/completions",
        "/gpt/v1"
    )) {
        if ($trimmed.EndsWith($suffix, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $trimmed.Substring(0, $trimmed.Length - $suffix.Length)
        }
    }

    return $trimmed
}

function Parse-ChatImageBase64([string]$Content) {
    if ($Content -match 'data:image\/png;base64,([^)\s]+)') {
        return $matches[1]
    }

    Fail("No PNG data URL was found in the chat response.")
}

if (-not [string]::IsNullOrWhiteSpace($ConfigPath)) {
    $config = Read-ConfigFile $ConfigPath
}

$BaseUrl = Get-SettingValue $BaseUrl $config.baseUrl "GPT_IMAGE_RELAY_BASE_URL"
$ApiKey = Get-SettingValue $ApiKey $config.apiKey "GPT_IMAGE_RELAY_API_KEY"
$Model = Get-SettingValue $Model $config.model "GPT_IMAGE_RELAY_MODEL"

Require-Value "BaseUrl" $BaseUrl
Require-Value "ApiKey" $ApiKey
Require-Value "Prompt" $Prompt

$normalizedBaseUrl = Normalize-RelayBaseUrl $BaseUrl
$defaultOutput = if ($Mode -eq "chat") {
    "assets\relay-chat-output.png"
} else {
    "assets\relay-generated-image.png"
}
$finalOutputPath = if ([string]::IsNullOrWhiteSpace($OutputPath)) { $defaultOutput } else { $OutputPath }

if ($Mode -eq "generate") {
    $response = Invoke-JsonApi "$normalizedBaseUrl/gpt/v1/images/generations" @{
        model = $Model
        prompt = $Prompt
    }

    if (-not $response.data -or -not $response.data[0].b64_json) {
        Fail("The relay response does not include data[0].b64_json.")
    }

    $savedPath = Save-Base64Png $response.data[0].b64_json $finalOutputPath
    [PSCustomObject]@{
        mode = $Mode
        model = $Model
        prompt = $Prompt
        revised_prompt = $response.data[0].revised_prompt
        output = $savedPath
    } | ConvertTo-Json -Depth 5
    exit 0
}

Require-Value "ImagePath" $ImagePath

$dataUrl = Convert-ImageFileToDataUrl $ImagePath
$response = Invoke-JsonApi "$normalizedBaseUrl/gpt/v1/chat/completions" @{
    model = $Model
    messages = @(
        @{
            role = "user"
            content = @(
                @{
                    type = "text"
                    text = $Prompt
                },
                @{
                    type = "image_url"
                    image_url = @{
                        url = $dataUrl
                    }
                }
            )
        }
    )
}

if (-not $response.choices -or -not $response.choices[0].message.content) {
    Fail("The relay response does not include choices[0].message.content.")
}

$imageBase64 = Parse-ChatImageBase64 $response.choices[0].message.content
$savedPath = Save-Base64Png $imageBase64 $finalOutputPath
[PSCustomObject]@{
    mode = $Mode
    model = $Model
    prompt = $Prompt
    output = $savedPath
} | ConvertTo-Json -Depth 5
