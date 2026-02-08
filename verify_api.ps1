$ErrorActionPreference = "Stop"
$BaseUrl = "http://127.0.0.1:8000"

# 1. Signup Admin
Write-Host "`n1. Signing up Admin..."
$AdminEmail = "admin_$(Get-Random)@city.gov"
$Password = "admin123"
$Body = @{
    email = $AdminEmail
    password = $Password
    role = "admin"
} | ConvertTo-Json -Depth 10

try {
    $Response = Invoke-WebRequest -Uri "$BaseUrl/signup" -Method Post -Body $Body -ContentType "application/json"
    if ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 300) {
        Write-Host "✅ Signup - Success" -ForegroundColor Green
    }
} catch {
    $statusCode = 0
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }
    
    if ($statusCode -eq 400) {
        Write-Host "ℹ️ Admin already exists, continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Signup Failed: $($_.ToString())" -ForegroundColor Red
        # Continue anyway to try login, maybe it exists
    }
}

# 2. Login
Write-Host "`n2. Logging in..."
$LoginBody = @{
    email = "admin_city@city.gov" # Use a fixed email for reliability if possible, or create a new one
} 
# Wait, I just created a random email. I should use that.
$LoginJson = @{
    email = $AdminEmail
    password = $Password
    role = "admin"
} | ConvertTo-Json

try {
    $Response = Invoke-WebRequest -Uri "$BaseUrl/token" -Method Post -Body $LoginJson -ContentType "application/json"
    $TokenData = $Response.Content | ConvertFrom-Json
    $Token = $TokenData.access_token
    Write-Host "✅ Login - Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Login Failed" -ForegroundColor Red
    Write-Host $_
    exit 1
}

# 3. Create Issue
Write-Host "`n3. Creating Issue..."
$DummyImage = "dummy.jpg"
Set-Content -Path $DummyImage -Value "fake content"

# Using curl for multipart/form-data
$curlArgs = @("-X", "POST", "$BaseUrl/reports", "-F", "type=Pothole", "-F", "location=123 Main St Test", "-F", "image=@$DummyImage")
$Res = & curl.exe $curlArgs
if ($LASTEXITCODE -eq 0) {
     Write-Host "`n✅ Create Issue - Success" -ForegroundColor Green
} else {
     Write-Host "`n❌ Create Issue - Failed" -ForegroundColor Red
     exit 1
}

# 4. Get Report ID
$Response = Invoke-WebRequest -Uri "$BaseUrl/reports" -Method Get
$Reports = $Response.Content | ConvertFrom-Json
$Latest = $Reports | Select-Object -Last 1
$ReportId = $Latest.id
Write-Host "ℹ️ Report ID: $ReportId"

# 5. Resolve
Write-Host "`n4. Resolving Issue..."
$curlArgs = @("-X", "POST", "$BaseUrl/reports/$ReportId/resolve", "-F", "file=@$DummyImage")
$Res = & curl.exe $curlArgs
if ($LASTEXITCODE -eq 0) {
     Write-Host "`n✅ Resolve Issue - Success" -ForegroundColor Green
} else {
     Write-Host "`n❌ Resolve Issue - Failed" -ForegroundColor Red
     exit 1
}

# 6. Approve
Write-Host "`n5. Approving Issue..."
try {
    $Response = Invoke-WebRequest -Uri "$BaseUrl/reports/$ReportId/approve" -Method Post -Headers @{ Authorization = "Bearer $Token" }
    Write-Host "✅ Approve Issue - Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Approve Issue - Failed" -ForegroundColor Red
    Write-Host $_
    exit 1
}

# 7. Verify
$Response = Invoke-WebRequest -Uri "$BaseUrl/reports/$ReportId" -Method Get
$Report = $Response.Content | ConvertFrom-Json
if ($Report.status -eq "APPROVED") {
    Write-Host "`n✅ FINAL VERIFICATION SUCCESS" -ForegroundColor Green
} else {
    Write-Host "`n❌ FINAL VERIFICATION FAILED: Status is $($Report.status)" -ForegroundColor Red
}

if (Test-Path $DummyImage) { Remove-Item $DummyImage }
