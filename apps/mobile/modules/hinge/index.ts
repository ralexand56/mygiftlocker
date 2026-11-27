import { requireOptionalNativeModule, type NativeModule } from "expo";

export type HingeStatus = "unknown" | "closed" | "partial" | "open";
export interface HingeState {
  status: HingeStatus;
  /** Degrees: about 0 closed, 180 flat. null when there's no hinge. */
  angle: number | null;
}

declare class HingeModule extends NativeModule<{ onChange: (s: HingeState) => void }> {
  current(): HingeState;
}

/** null on devices and builds without the native module (web, Android, older builds). */
export default requireOptionalNativeModule<HingeModule>("MGLHinge");
