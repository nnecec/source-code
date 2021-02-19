# Constant

```javascript
// TypeOfMode
export const NoContext = 0b000;
export const ConcurrentMode = 0b001;
export const StrictMode = 0b010;
export const ProfileMode = 0b100;

// WorkPhase
const NotWorking = 0;
const BatchedPhase = 1;
const LegacyUnbatchedPhase = 2;
const FlushSyncPhase = 3;
const RenderPhase = 4;
const CommitPhase = 5;

// priorityLevel
export const ImmediatePriority = 99;
export const UserBlockingPriority = 98;
export const NormalPriority = 97;
export const LowPriority = 96;
export const IdlePriority = 95;
export const NoPriority = 90;

// expiration time
MAX_SIGNED_31_BIT_INT = 1073741823; // V8在32位系统上的最大整形值 Math.pow(2, 30) - 1
const MAGIC_NUMBER_OFFSET = MAX_SIGNED_31_BIT_INT - 1;
NoWork = 0;
Never = 1;
Sync = MAGIC_NUMBER_OFFSET;

export type TypeOfMode = number;

export const NoMode = 0b0000;
export const StrictMode = 0b0001;
// TODO: Remove BlockingMode and ConcurrentMode by reading from the root
// tag instead
export const BlockingMode = 0b0010;
export const ConcurrentMode = 0b0100;
export const ProfileMode = 0b1000;

// RootTag
export type RootTag = 0 | 1 | 2;
export const LegacyRoot = 0;
export const BatchedRoot = 1;
export const ConcurrentRoot = 2;

// RootExitStatus
type RootExitStatus = 0 | 1 | 2 | 3 | 4;
const RootIncomplete = 0;
const RootErrored = 1;
const RootSuspended = 2;
const RootSuspendedWithDelay = 3;
const RootCompleted = 4;

// ReactFiberFlags
export const Placement = /*                    */ 0b00000000000000000010;
export const Update = /*                       */ 0b00000000000000000100;
export const PlacementAndUpdate = /*           */ Placement | Update;
export const Deletion = /*                     */ 0b00000000000000001000;
export const ChildDeletion = /*                */ 0b00000000000000010000;
export const ContentReset = /*                 */ 0b00000000000000100000;
export const Callback = /*                     */ 0b00000000000001000000;
export const DidCapture = /*                   */ 0b00000000000010000000;
export const Ref = /*                          */ 0b00000000000100000000;
export const Snapshot = /*                     */ 0b00000000001000000000;
export const Passive = /*                      */ 0b00000000010000000000;
export const Hydrating = /*                    */ 0b00000000100000000000;
export const HydratingAndUpdate = /*           */ Hydrating | Update;
export const Visibility = /*                   */ 0b00000001000000000000;
```
