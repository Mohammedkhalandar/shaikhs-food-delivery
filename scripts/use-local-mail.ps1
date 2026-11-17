New-Item -ItemType Directory -Force (Join-Path (Split-Path $PSScriptRoot -Parent) '.test-artifacts') | Out-Null
$taskMailKeyPath=Join-Path (Split-Path $PSScriptRoot -Parent) '.test-artifacts/dev-mail-key.xml'
if(-not(Test-Path -LiteralPath $taskMailKeyPath)){$taskMailBytes=New-Object byte[] 32; $taskRng=[System.Security.Cryptography.RandomNumberGenerator]::Create();$taskRng.GetBytes($taskMailBytes);$taskRng.Dispose();$taskMailHex=([BitConverter]::ToString($taskMailBytes)).Replace('-','').ToLowerInvariant();ConvertTo-SecureString $taskMailHex -AsPlainText -Force | Export-Clixml -LiteralPath $taskMailKeyPath}
$taskMailSecure=Import-Clixml -LiteralPath $taskMailKeyPath
$env:DEV_MAIL_KEY=[System.Net.NetworkCredential]::new('local',$taskMailSecure).Password
$env:MAIL_DELIVERY_MODE='local'
