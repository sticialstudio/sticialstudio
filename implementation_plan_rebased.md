# Sticial Studio - Rebased Implementation Plan

> Current-state plan rebased against the live repository on April 12, 2026.
> This replaces the older desktop implementation plan as the executable roadmap.
> It reflects work already completed in Circuit Lab interaction clarity, Circuit Lab recovery, and guided Blockly UX.

---

## Plan Status

The older plan and audit were directionally useful, but they no longer match the codebase exactly.

Three important things are true now:

1. Several "Phase 1" items are already implemented.
2. The compile path exists, so the compile pipeline is no longer a missing-route problem.
3. The highest-risk remaining work has shifted from raw Circuit Lab interaction to:
   - compile-to-student feedback clarity
   - BlockEditor maintainability
   - stale global bridges in Blockly
   - remaining learner onboarding gaps

---

## What Is Already Done

### Circuit Lab interaction and safety
- Breadboard rails are modeled as full-length horizontal power rails in the standard board model.
- Mounting truth is preserved and preview-only placements no longer create electrical connections.
- Wire interaction supports endpoint, elbow, and segment handles.
- Targeting uses zoom-adaptive and intent-aware hit testing.
- Touch and desktop wire cancel affordances exist.
- Right-click component context menu exists.
- Circuit undo/redo keyboard shortcuts are bound.
- Dedicated Circuit Lab regression coverage exists and is passing.

Primary files:
- `apps/web/src/components/ide/BreadboardCanvas.tsx`
- `apps/web/src/components/ide/circuit-lab/useInteractionManager.ts`
- `apps/web/src/components/ide/circuit-lab/hitTesting.ts`
- `apps/web/src/components/ide/circuit-lab/WireEngine.tsx`
- `apps/web/src/lib/wiring/breadboardModel.ts`
- `apps/web/src/lib/wiring/NetlistEngine.ts`
- `apps/web/e2e/circuit-lab.spec.ts`

### Simulation warning surface
- Simulation warnings are already surfaced in the UI.

Primary files:
- `apps/web/src/components/ide/circuit-lab/SimulationWarningBar.tsx`
- `apps/web/src/components/ide/circuit-lab/TopBar.tsx`
- `apps/web/src/stores/simulationStore.ts`

### Guided beginner block experience
- Progressive Blockly learning levels exist: Starter, Builder, Explore.
- Toolbox is circuit-aware and filtered by current hardware.
- Next-step guidance exists in the block editor.
- Build -> Code -> Run signaling exists in the coding top bar.
- Starter mode is now the default.

Primary files:
- `apps/web/src/components/ide/BlockEditor.tsx`
- `apps/web/src/lib/blockly/guidedToolbox.ts`
- `apps/web/src/lib/blockly/toolbox.ts`
- `apps/web/src/stores/blocklyStore.ts`
- `apps/web/src/components/ide/coding-environment/TopBar.tsx`

---

## What Is Obsolete From the Older Plan

These items should not be treated as open work anymore:

- "Add SimulationWarningBar"
- "Add touch cancel wire button"
- "Add component context menu"
- "Bind Ctrl+Z / Ctrl+Y for circuit undo/redo"
- "Add zoom-adaptive wire hit test"
- "Add progressive block toolbox levels"
- "Add next-step guidance in Blockly"

These assumptions are also stale:

- "There is probably no `/api/compile/arduino` route yet"
  - The compile endpoint already exists on the backend service at `apps/api/routes/compile.js`.
- "The platform still needs initial Circuit Lab interaction clarity before guided coding work"
  - That work is already substantially complete.

---

## What Still Needs Revalidation

These areas exist in code, but still need an explicit product-level verification gate before broader testing:

### R1. Compile -> run -> student feedback
The compile path exists, but it still needs a firm validation gate:
- successful compile returns HEX and loads the AVR worker
- compile failure is human-readable
- build errors are surfaced in the IDE where the learner is looking

Primary files:
- `apps/web/src/lib/simulator/compiler.ts`
- `apps/web/src/components/ide/SimulationCanvas.tsx`
- `apps/api/routes/compile.js`

### R2. Project persistence under learner workflows
Project and circuit persistence have been improved, but should still be verified through save/reopen flows, especially for circuit + code together.

Primary files:
- `apps/web/src/contexts/ProjectContext.tsx`
- `apps/web/src/lib/projects/projectPersistence.ts`
- `apps/web/src/components/ide/split-view/CircuitOrchestrator.tsx`

### R3. Guided Blockly flow on fresh-user scenarios
The new guided block UX is implemented, but should still be explicitly checked against true first-run, empty-canvas, and hardware-change scenarios.

Primary files:
- `apps/web/src/components/ide/BlockEditor.tsx`
- `apps/web/src/lib/blockly/toolbox.ts`
- `apps/web/e2e/phase1-smoke.spec.ts`

---

## Current Open Work

## Phase A - Trust and Feedback
**Goal:** make the code -> compile -> simulate path trustworthy for a learner.

### A1. Add compile-error -> Monaco decoration bridge
The text editor still does not visually decorate compile error lines.

Primary files:
- `apps/web/src/components/ide/TextEditor.tsx`
- `apps/web/src/components/ide/SimulationCanvas.tsx`
- `apps/web/src/stores/simulationStore.ts`

Acceptance:
- compile error line is highlighted in Monaco
- learner can immediately see where the problem is

### A2. Add compile error structure, not just raw message text
`SimulationCanvas.tsx` stores a compile error string locally, but the system still lacks a structured line-aware compile error model.

Primary files:
- `apps/web/src/components/ide/SimulationCanvas.tsx`
- `apps/web/src/stores/simulationStore.ts`
- `apps/api/routes/compile.js`

Acceptance:
- structured compile feedback includes message and line when available
- editor and simulation panel both consume the same compile error state

### A3. Revalidate end-to-end compile pipeline with explicit gates
This is not a code-guessing task; it is a verification task with failure follow-up if needed.

Acceptance:
- valid code simulates successfully
- invalid code produces readable failure feedback
- reopening a project resets sim state correctly

---

## Phase B - Blockly Maintainability and Correctness
**Goal:** reduce the highest ongoing source of product fragility.

### B1. Split `BlockEditor.tsx`
`BlockEditor.tsx` is still approximately 2 MB and remains a severe maintainability hotspot.

Recommended extraction order:
1. `CodePreviewPanel.tsx`
2. `LearningLevelSelector.tsx`
3. `BlockCategoryBar.tsx`
4. toolbox builder helpers
5. keep workspace lifecycle in the core editor shell

Primary file:
- `apps/web/src/components/ide/BlockEditor.tsx`

Acceptance:
- core `BlockEditor.tsx` becomes a smaller lifecycle shell
- behavior remains identical

### B2. Remove global Blockly bridges
The app still writes:
- `window.__CIRCUIT_DATA`
- `window.__CIRCUIT_CODING_SNAPSHOT`
- `window.SELECTED_BOARD`

These are still active in:
- `apps/web/src/components/ide/BlockEditor.tsx`
- `apps/web/src/lib/blockly/generator.ts`
- `apps/web/src/lib/blockly/dropdowns.ts`
- `apps/web/src/lib/blockly/toolbox.ts`

Recommended replacement:
- use `useCircuitStore.getState()` and other direct store reads in non-React generator helpers

Acceptance:
- no `window.__CIRCUIT_DATA` write remains
- circuit-aware blocks and dropdowns still work

### B3. Stop deriving coding snapshot on every drag frame
`updateComponentPosition()` in `circuitStore.ts` still calls `deriveCircuit()`, which includes `buildCodingCircuitSnapshot()`.

Primary file:
- `apps/web/src/stores/circuitStore.ts`

Acceptance:
- component dragging no longer rebuilds coding snapshot every frame
- topology changes still refresh Blockly correctly

### B4. Stop unnecessary Blockly toolbox rebuilds on position-only changes
`BlockEditor.tsx` still computes `circuitRefreshSignature` from `circuitData.components`, which is broader than needed.

Primary file:
- `apps/web/src/components/ide/BlockEditor.tsx`

Acceptance:
- moving a component without changing topology does not rebuild the toolbox

---

## Phase C - Student-Pilot UX Gaps
**Goal:** close the remaining beginner-facing product gaps before a student pilot.

### C1. Add empty-canvas onboarding overlay in Circuit Lab
There is still no true first-run canvas onboarding overlay. The palette copy is better, but it is not enough for blank-state guidance.

Primary file:
- `apps/web/src/components/ide/BreadboardCanvas.tsx`

Acceptance:
- an empty circuit tells the learner what to do first
- the component panel is one click away

### C2. Add explicit MicroPython "hardware only" messaging
MicroPython still presents like a normal coding mode even though simulation support is not clearly surfaced as unavailable.

Primary files:
- `apps/web/src/app/projects/select-language/page.tsx`
- `apps/web/src/components/ide/TextEditor.tsx`
- any simulate CTA gating layer that exposes text-mode run controls

Acceptance:
- learners are told clearly that MicroPython is upload-to-board only
- simulate controls do not imply support that is not there

### C3. Add component search to the in-canvas drawer or unify with the search-enabled manager
There is search in `ComponentManagerPanel.tsx`, but the in-canvas parts drawer in `BreadboardCanvas.tsx` still has no search field.

Primary files:
- `apps/web/src/components/ide/BreadboardCanvas.tsx`
- optionally `apps/web/src/components/ide/ComponentManagerPanel.tsx`

Acceptance:
- learners can quickly find a component by name in the primary placement surface

### C4. Add explicit FLOAT and CONFLICT wire/pin visuals
Warnings exist, but the circuit itself still needs stronger visual distinction for ambiguous electrical states.

Primary files:
- `apps/web/src/components/ide/circuit-lab/InteractionLayer.tsx`
- `apps/web/src/components/ide/circuit-lab/ComponentRenderer.tsx`

Acceptance:
- floating nets are visually distinct
- conflicting nets are visually distinct

### C5. Improve compile feedback in the text editor flow
Even after line decoration, learners still need a cleaner "what do I fix next?" path in text mode.

Primary files:
- `apps/web/src/components/ide/TextEditor.tsx`
- `apps/web/src/components/ide/split-view/CompileController.tsx`

Acceptance:
- learner sees error summary and line highlight together

---

## Phase D - Simulation Depth Gaps
**Goal:** reduce misleading behavior in supported learning scenarios.

### D1. Improve I2C read behavior
`InstrumentedTWIHandler.readByte()` in `avrWorker.ts` still returns `0xFF`, which blocks believable sensor read behavior.

Primary file:
- `apps/web/src/lib/simulator/avrWorker.ts`

Acceptance:
- unsupported devices still fail safely
- supported devices can return modeled data

### D2. Reassess approximate component simulators before student pilot
DHT22 and ultrasonic behavior remain approximate. This may be acceptable for internal use, but should be explicitly gated before student testing.

Primary files:
- `apps/web/src/lib/simulator/componentSimulators.ts`
- `apps/web/src/lib/simulator/circuitSimulation.ts`

Acceptance:
- either clearly labeled as approximate
- or made reliable enough for the pilot lessons that use them

---

## Recommended Execution Order

1. **A1-A3**: compile feedback and compile-path validation
2. **B2-B4**: remove global bridges and stop unnecessary Blockly rebuild work
3. **B1**: split `BlockEditor.tsx`
4. **C1-C3**: close first-run and discovery gaps for learners
5. **C4-C5**: improve visible feedback in circuit and text coding
6. **D1-D2**: deepen simulation fidelity only where needed for pilot scenarios

---

## Launch Gates

### Internal Team Test
Safe once:
- compile -> simulate works end-to-end
- compile errors are readable
- current Circuit Lab regression suite remains green

### Student Pilot
Safe once:
- empty-canvas onboarding exists
- MicroPython expectation gap is closed
- component discovery is easier
- compile feedback is visible in-editor
- pilot lesson components are simulation-reliable

### Public Demo
Safe once:
- current student-pilot gates pass
- BlockEditor maintainability risks are reduced
- visible circuit state feedback is stronger

---

## Practical Conclusion

We do not need to start from the older phased plan.
We also should not discard it completely.

The right move is:
- treat the older documents as historical audit context
- use this rebased plan as the executable roadmap
- execute from current open work instead of redoing already-shipped fixes
