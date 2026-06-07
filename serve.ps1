# Windows PowerShell HTTP Server (Zero Dependencies, ES Modules compatible)
$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "--------------------------------------------------"
    Write-Host "Servidor local iniciado correctamente."
    Write-Host "Acceso local: http://localhost:$port/"
    Write-Host "Presione Ctrl+C en esta terminal para detenerlo."
    Write-Host "--------------------------------------------------"
} catch {
    Write-Host "--------------------------------------------------"
    Write-Host "AVISO: El servidor local ya esta corriendo"
    Write-Host "en otra ventana (Puerto 3000 ocupado)."
    Write-Host "Abriendo en tu navegador..."
    Write-Host "--------------------------------------------------"
    Start-Sleep -Seconds 3
    exit
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq "/" -or $path -eq "") {
            $path = "/index.html"
        }

        # Manejar POST /log para capturar errores del navegador
        if ($request.HttpMethod -eq "POST" -and $path -eq "/log") {
            $reader = New-Object System.IO.StreamReader($request.InputStream)
            $body = $reader.ReadToEnd()
            $reader.Close()

            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            $logMsg = "[$timestamp] $body"
            Add-Content -Path (Join-Path $PSScriptRoot "browser_errors.txt") -Value $logMsg
            Write-Host "Capturado log de navegador: $body"

            $response.StatusCode = 200
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("Logged")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }
        
        # Remover slash inicial para combinar con la ruta actual
        $relPath = $path.TrimStart('/')
        $filePath = Join-Path $PSScriptRoot $relPath

        if (Test-Path $filePath -PathType Leaf) {
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "text/plain"
            switch ($extension) {
                ".html" { $contentType = "text/html; charset=utf-8" }
                ".css"  { $contentType = "text/css; charset=utf-8" }
                ".js"   { $contentType = "application/javascript; charset=utf-8" }
                ".png"  { $contentType = "image/png" }
                ".jpg"  { $contentType = "image/jpeg" }
                ".jpeg" { $contentType = "image/jpeg" }
                ".gif"  { $contentType = "image/gif" }
                ".svg"  { $contentType = "image/svg+xml" }
                ".json" { $contentType = "application/json; charset=utf-8" }
                ".pdf"  { $contentType = "application/pdf" }
            }

            try {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $response.StatusCode = 500
                $bytes = [System.Text.Encoding]::UTF8.GetBytes("Error 500: No se pudo leer el archivo.")
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } else {
            $response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("Error 404: Archivo no encontrado.")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        $response.Close()
    }
} catch {
    # Capturar Ctrl+C u otros cierres
} finally {
    $listener.Stop()
    Write-Host "Servidor detenido."
}
