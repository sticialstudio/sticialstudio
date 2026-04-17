# Sticial Studio: Comprehensive Architectural & Technical Audit
**Date:** April 2026
**Role:** Senior Software Architect & Performance Engineer

---

## 1. Executive Summary
The Sticial Studio platform exhibits immense ambition and functional density, successfully combining hardware integration, visual code generation, circuit simulation, and a professional text IDE. However, the platform is suffering from "MVP Scaling Syndrome." Many core engines and UI components were built rapidly and have bloated into unmanageable monoliths. 

### Platform Health
- **Strengths:** Excellent user experience vision, successful hardware Web Serial integration, sophisticated layout orchestration (recently refactored into `split-view/*`), and a highly resilient Error Boundary system.
- **Weaknesses:** Deep architectural flaws in state synchronization (relying heavily on cascading `useEffect` hooks instead of unidirectional event flows), severe CPU bottlenecks in the simulator's drag-and-drop cycle, and massive "God Components" (like `BlockEditor.tsx`).
- **Maturity Level:** Alpha / Prototype-Heavy.
- **Verdict on Testing:** The platform is **ready for internal team testing** to evaluate UX and hardware stability. It is **NOT ready for pilot/school use**. The CPU performance will degrade entirely on low-end Chromebooks, and the risk of file loss via state-sync race conditions is too high for production classrooms.

---

## 2. Architecture Review
### Current state
The platform uses **Next.js 15 (Turbopack)** for routing, **Zustand** for localized fast-updating stores (circuit, blockly, simulation), and **React Context** for global user/project state. Sub-systems communicate via a custom event bus (`SplitViewEventBus`).

### Major Architectural Risks
1. **Synchronous Graph Engines on the UI Thread:** `NetlistEngine.generateNetlist` runs deep graph resolution algorithms directly inside React DOM state updaters.
2. **Context-Driven Infinite Loops:** As recently debugged out of `BoardContext` and `ProjectContext`, relying on React render cycles to synchronize metadata (like language or generator types) causes catastrophic "ping-pong" loops. State synchronization should be isolated from the render tree.
3. **Implicit Global Coupling:** `window.__CIRCUIT_DATA` and other window injections are used as backdoor channels to bypass React state, creating untraceable data mutations that break debugging tools and hydration.

### Recommended Direction
Adopt a **Strict Action-Driven Architecture**. React Context should *only* hold read-only observables. All project, board, and simulation state mutations should run via explicit Zustand actions that coordinate together asynchronously, completely outside of the `<MainLayout>` render tree.

---

## 3. Page-by-Page Audit

- **`/` , `/dashboard` (Dashboard Routes)**
  - *Status:* Functioning as expected.
  - *Debt:* Minimal. Safe to scale.
- **`/projects/ide/page.tsx` (Core Workspace)**
  - *Purpose:* Mounts the main orchestrator.
  - *Issues Found:* High fragility in initial mounting logic depending heavily on `readPendingProjectIntent()`. Susceptible to race conditions if the user interacts before the project is fetched.
- **`/projects/select-mode`, `/projects/select-board`**
  - *Purpose:* Onboarding and environment setup.
  - *Issues Found:* Clean, separated. Safe and well-designed.

---

## 4. Engine-by-Engine Audit

### Circuit Engine (`src/stores/circuitStore.ts`)
- **Purpose:** Manages wiring, component placement, and breadboard routing.
- **Weakness:** `deriveCircuit` runs graph resolution combining `NetlistEngine.generateNetlist` and `resolveConnections` synchronously inside `updateComponentPosition`. Dragging a component at 60 FPS fires a heavy algorithm 60 times a second.
- **Failure Risk:** Severe stuttering and UI freeze on lower-end devices as circuit complexity grows.
- **Recommendation:** `updateComponentPosition` should *never* generate a netlist. Graph resolution should be delayed/debounced to `onPointerUp` or run inside a WebWorker.

### Blockly Editor (`src/components/ide/BlockEditor.tsx`)
- **Status:** Critical Tech Debt.
- **Weakness:** A 2MB, 2300-line "God Component". It manages DOM injection, Blockly serialization, window bindings, custom flyout math, theme injection, and event bus piping in one single file.
- **Recommendation:** Immediately shatter this file. Blockly logic must be extracted to `useBlocklyWorkspace.ts`, theme logic to `useBlocklyTheme.ts`, and events to `useBlocklySync.ts`.

### Project and File Engine (`src/contexts/ProjectContext.tsx`)
- **Status:** Unstable.
- **Weakness:** Synchronizing React state (`setProjectNameState`, `setFiles`) and triggering background API calls inside `useEffect`. This was the root of the Turbopack `Maximum update depth` crash.
- **Recommendation:** Deprecate Context for project state. Move tracking of files to a `useProjectStore` Zustand module, which explicitly handles saving and loading via discrete functional triggers (`fetchProject(id)`, `saveProject()`).

---

## 5. State Management Audit
- **Contexts:** Used too frequently for highly active data. `ProjectContext` is carrying too much dynamic weight.
- **Stores:** `Zustand` stores are well structured but over-eager. 
- **Effect Risks:** "Stale Closures" were a consistent problem (e.g., inside `FileExplorer` when mapping the visible tree). 

---

## 6. Performance Audit
- **Rendering Bottlenecks:** Re-renders cascading from `MainLayout` downward if a top-level Context changes.
- **Heavy Calculations:** `JSON.stringify` used aggressively inside `useMemo` hooks (e.g., `circuitRefreshSignature` in `BlockEditor.tsx`). This causes massive garbage collection pauses on large circuits.
- **Suggestions:** Replace `JSON.stringify` comparisons with shallow/deep comparators like `fast-deep-equal`. Debounce all resize and drag operations. 

---

## 7. Reliability and Error Handling
- **Strengths:** The `IDEErrorBoundary` implementation allows the terminal to crash without taking down the Monaco editor. This is world-class resiliency.
- **Weakness:** Async fetch operations inside `api.ts` use a `safeJson` wrapper but quietly discard strict server 500 stack traces, making backend debugging via the client impossible.

---

## 8. Workflow Stability Audit
| Workflow | Status | Risks | Recommendations |
|----------|--------|-------|-----------------|
| **Visual Coding (Blockly)** | Fragile | Code generation race conditions | Detach XML hydration from code generation. |
| **Text Coding (Monaco)** | Stable | N/A | Expand auto-completions safely. |
| **Circuit Lab** | In Danger | OOM / Jitter | Debounce Netlist evaluation. |
| **Hardware Upload** | Stable | Browser disconnects | Handle sudden serial port closure gracefully. |
| **Project Saving** | Stabilizing | Syncing conflicts | Implement offline-first local indexing before API pushes. |

---

## 9. File-Level Audit Map

### 🔥 Critical Risk Files (Overloaded / Fragile)
1. **`BlockEditor.tsx`**: (2300 lines). The primary bottleneck of visual logic. Completely overloaded with responsibilities ranging from Blockly mount to React state synchronization.
2. **`circuitStore.ts`**: Holds synchronous state updates deeply coupled with algorithmic validation. Causes UI thread blocking on coordinate updates.
3. **`ProjectContext.tsx`**: Contains cascading API fetch effects that react to its own local state changes.

### ⚠️ Moderate Risk Files (Needs Refactor)
1. **`FileExplorer.tsx`**: Improved heavily, but file trees should ideally be purely declarative against a normalized store rather than calculating visibility recursively on every render.
2. **`DeviceFiles.tsx`**: Serial port operations combined with rendering lists. 

### ✅ Safe and Well-Designed Files
1. **`split-view/*`**: The layout orchestrators (`IDELayoutContainer`, `CircuitOrchestrator`, `EditorOrchestrator`) are beautifully architected. They successfully decouple the monolithic layout from its children.
2. **`monacoConfigs.ts`**: Cleanly isolates language server protocols from the React layer.
3. **`ErrorBoundary.tsx`**: High-quality implementation of localized crash recovery.

---

## 10. Priority Issues List

1. **[CRITICAL] Synchronous Netlist Generation in Circuit Store** 
   - *Why:* Freezes the entire IDE instantly during dragging of a component.
   - *File:* `circuitStore.ts`.
   - *Fix:* Remove `deriveCircuit` from `updateComponentPosition`. Run it only on `onPointerUp` or via a debouncer.
2. **[CRITICAL] God Component: BlockEditor**
   - *Why:* Too dense to safely test or modify without breaking code generation.
   - *File:* `BlockEditor.tsx`.
   - *Fix:* Break into sub-components and isolated custom hooks.
3. **[HIGH] ProjectContext Fetch Patterns**
   - *Why:* Susceptible to infinite `Maximum update depth exceeded` boundaries.
   - *File:* `ProjectContext.tsx`.
   - *Fix:* Complete architectural migration of project data tracking into Zustand, deleting the Context entirely.
4. **[HIGH] useMemo JSON stringification**
   - *Why:* Massive memory churn and garbage collector spikes.
   - *File:* `BlockEditor.tsx` / `SplitViewEventBus.tsx`.
   - *Fix:* Replace `JSON.stringify` deep equality checks with reference equality or lightweight comparators.

---

## 11. Phased Improvement Plan & Refactor Map

### Phase 1: Stabilization & Threat Remediation (Immediate)
- **Goals:** Stop the bleeding. Prevent UI freezing and memory leaks so internal testers can work.
- **Actions:** 
  1. Patch `circuitStore.ts` so `updateComponentPosition` only updates X/Y coordinates without running `deriveCircuit`.
  2. Implement an external `useDebouncedNetlist` hook to resolve the circuit graph quietly.
  3. Swap `JSON.stringify` in the Event Bus with a faster equivalence library.

### Phase 2: Structural Refactoring (Next 2 Weeks)
- **Goals:** Eliminate the monolithic architecture.
- **Actions:**
  1. Shatter `BlockEditor.tsx`. Create `<BlocklyMount />`, `<BlocklyCodePanel />`, and `useBlocklyRuntime()`.
  2. Deprecate `ProjectContext.tsx`. Create `src/stores/projectStore.ts` using direct API action dispatchers.

### Phase 3: Performance & Scalability (Month 2)
- **Goals:** Ensure 60 FPS under heavy loads.
- **Actions:** Evaluate moving compiler validation, netlist parsing, and board-verification checks into WebWorkers off the main thread.

### Phase 4: Feature Hardening & Pilot Readiness (Month 3)
- **Goals:** Broad classroom testing capable.
- **Actions:** Offline saving strategy, indexedDB caching backup, and multi-file project imports.

---

## 12. Final Verdict

**Is this platform architecturally sound?** 
*At the macro level, yes. At the component execution level, absolutely not.* 

The layout wrappers (`split-view`) show great engineering foresight. However, the system's "guts" severely punish the browser. It is currently acting like a car with an incredibly beautiful chassis, but an engine where the pistons are tied directly to the steering wheel via synchronous JavaScript loops. 

**What must be fixed before broader testing?** 
1. CPU freezing during circuit drag-and-drop.
2. Infinite render loops via Context.
3. Breaking apart `BlockEditor.tsx`.

**Do not build any new features on top of `BlockEditor.tsx` until it is refactored into a declarative hook-based module.** Any further additions will risk irreversible structural rot. 
