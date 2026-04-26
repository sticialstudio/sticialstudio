# Diagnostic Report: API Connectivity & Disk Space

I have identified the root cause of the `Failed to fetch` and `AbortError` reports.

## 1. API Server Offline
The API server is not running on port 4000.
**Status**: `netstat` confirms no process is listening on port 4000.
**Impact**: Authentication (`/api/auth/me`) and project file syncing fail, causing timeouts and fetch errors.
**Resolution**: Run `npm run dev:full` from the root directory to start both the `api` and `web` workspaces.

## 2. Critical Disk Space Alert (C: Drive)
Your **C: drive is completely full (0 bytes free)**.
**Status**: `Get-PSDrive C` reports 0 bytes available.
**Impact**: 
- **Tool Failures**: My verification tools and artifact updates are failing because they cannot write to the `C:\Users\STEMAIDE\.gemini\...` directory.
- **System Instability**: General performance degradation and possible browser/Node.js crashes.
**Resolution**: Please free up space on the C: drive (at least a few hundred MBs) to restore full IDE functionality.
