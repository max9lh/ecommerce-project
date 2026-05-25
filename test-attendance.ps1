$ErrorActionPreference = "Stop"

[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$baseUrl = "https://localhost/api"

# 1. Register Admin
Write-Host "Registrando ADMIN..."
$adminData = @{
    username = "adm_$(Get-Random -Maximum 9999)"
    password = "password123"
    role = "ADMIN"
    pct_merchandise = 0.60
    pct_fixed_expenses = 0.30
    pct_savings = 0.10
}
$adminResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body ($adminData | ConvertTo-Json) -ContentType "application/json"
Write-Host "Admin registrado: $($adminResponse.data.username)"

# 2. Login Admin
Write-Host "Iniciando sesión..."
$loginData = @{
    username = $adminData.username
    password = "password123"
}
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body ($loginData | ConvertTo-Json) -ContentType "application/json"
$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }

# 3. Create Employee
Write-Host "Creando Empleado..."
$empData = @{
    username = "emp_$(Get-Random -Maximum 9999)"
    password = "password123"
    first_name = "Juan"
    last_name = "Perez"
    hourly_rate = 1500
    salary_type = "hourly"
}
$empResponse = Invoke-RestMethod -Uri "$baseUrl/admin/employees" -Method Post -Body ($empData | ConvertTo-Json) -ContentType "application/json" -Headers $headers
$empId = $empResponse.data.id
Write-Host "Empleado creado con ID: $empId"

# 4. Create Provider
Write-Host "Creando Proveedor..."
$provData = @{
    name = "Proveedor Test"
    payment_condition = "Contado"
}
$provResponse = Invoke-RestMethod -Uri "$baseUrl/providers" -Method Post -Body ($provData | ConvertTo-Json) -ContentType "application/json" -Headers $headers
$provId = $provResponse.data.id
Write-Host "Proveedor creado con ID: $provId"

# 5. Get Accounts
Write-Host "Obteniendo Cuentas..."
$accountsResponse = Invoke-RestMethod -Uri "$baseUrl/accounts" -Method Get -Headers $headers
$accountId = $accountsResponse.data[0].id
Write-Host "Usando Cuenta ID: $accountId"

# 6. Register Attendance
Write-Host "Registrando Asistencia..."
$attData = @{
    employeeId = $empId
    checkIn = (Get-Date).AddHours(-8).ToString("o")
    checkOut = (Get-Date).ToString("o")
}
$attResponse = Invoke-RestMethod -Uri "$baseUrl/attendance" -Method Post -Body ($attData | ConvertTo-Json) -ContentType "application/json" -Headers $headers
$attId = $attResponse.data.id
Write-Host "Asistencia registrada con ID: $attId, Horas: $($attResponse.data.hours_worked), Ganado: $($attResponse.data.amount_earned)"

# 7. Get Summary
Write-Host "Obteniendo Resumen..."
$summaryResponse = Invoke-RestMethod -Uri "$baseUrl/attendance/summary?employeeId=$empId" -Method Get -Headers $headers
Write-Host "Resumen: $($summaryResponse.data | ConvertTo-Json -Depth 5)"

# 8. Liquidate
Write-Host "Liquidando Sueldo..."
$liqData = @{
    employeeId = $empId
    from = (Get-Date).AddDays(-1).ToString("o")
    to = (Get-Date).AddDays(1).ToString("o")
    providerId = $provId
    accountId = $accountId
}
$liqResponse = Invoke-RestMethod -Uri "$baseUrl/attendance/liquidate" -Method Post -Body ($liqData | ConvertTo-Json) -ContentType "application/json" -Headers $headers
Write-Host "Liquidación exitosa. Egreso Creado ID: $($liqResponse.data.id)"
Write-Host "TEST FINALIZADO CON EXITO"
