# Run after loading the approved DATABASE_URL. No secrets are printed or persisted into .env.
$taskRoot=Split-Path $PSScriptRoot -Parent
New-Item -ItemType Directory -Force (Join-Path $taskRoot '.test-artifacts') | Out-Null
$taskBackupKeyPath=Join-Path $taskRoot '.test-artifacts/backup-signing-key.xml'
if(-not(Test-Path -LiteralPath $taskBackupKeyPath)){$taskBackupBytes=New-Object byte[] 32;$taskBackupRng=[System.Security.Cryptography.RandomNumberGenerator]::Create();$taskBackupRng.GetBytes($taskBackupBytes);$taskBackupRng.Dispose();$taskBackupHex=([BitConverter]::ToString($taskBackupBytes)).Replace('-','').ToLowerInvariant();ConvertTo-SecureString $taskBackupHex -AsPlainText -Force | Export-Clixml -LiteralPath $taskBackupKeyPath}
$env:BACKUP_SIGNING_KEY=[System.Net.NetworkCredential]::new('backup',(Import-Clixml -LiteralPath $taskBackupKeyPath)).Password
$env:BACKUP_EXPECT_DATABASE=([uri]$env:DATABASE_URL).AbsolutePath.TrimStart('/')
$env:RESTORE_ADMIN_URL=$env:DATABASE_URL
