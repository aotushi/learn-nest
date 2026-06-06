# Troubleshooting

## `EADDRINUSE: address already in use :::3000`

### Symptom

Running:

```bash
pnpm start:dev
```

fails with:

```text
Error: listen EADDRINUSE: address already in use :::3000
```

This means another process is already listening on port `3000`.

### Step 1: Check whether the app is already running

```powershell
Invoke-RestMethod http://localhost:3000/
```

If it returns a response such as `Hello World!`, the Nest app is already running.

In that case, do not start another `pnpm start:dev` process. Use the existing server or stop it first.

### Step 2: Find the process occupying port 3000

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress, LocalPort, State, OwningProcess
```

The important field is `OwningProcess`.

Example:

```text
LocalAddress LocalPort State  OwningProcess
------------ --------- -----  -------------
::                3000 Listen         37972
```

Here, the process id is `37972`.

### Step 3: Inspect the process

```powershell
Get-Process -Id 37972 | Select-Object Id, ProcessName, Path, StartTime
```

For the full command line:

```powershell
Get-CimInstance Win32_Process -Filter "ProcessId = 37972" |
  Select-Object ProcessId, ParentProcessId, CommandLine
```

If the command line points to this project, for example:

```text
node --enable-source-maps E:\code\github\learn-nest\dist\main
```

then it is the current Nest app.

### Step 4: Stop the old dev server

If it is safe to stop that process:

```powershell
Stop-Process -Id 37972
```

If the process does not stop:

```powershell
Stop-Process -Id 37972 -Force
```

Then confirm the port is free:

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

No output means nothing is listening on port `3000`.

### Step 5: Start again

```bash
pnpm start:dev
```

### Alternative: use another port

This project reads `process.env.PORT` in `src/main.ts`, so another port can be used:

```powershell
$env:PORT = "3001"
pnpm start:dev
```

Then visit:

```text
http://localhost:3001/
```

### Common Cause

This usually happens when:

- `pnpm start:dev` was already running in another terminal.
- A background dev server was started and not stopped.
- The previous watch process restarted the app, then a second watcher was launched.

Keep one dev server per port.
