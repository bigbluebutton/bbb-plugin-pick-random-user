export interface PickedUserReelProps {
  names: string[];
  targetIndex: number;
  // Identifies the pick; a new value spins the reel again.
  spinKey: string;
  onSpinningChange?: (spinning: boolean) => void;
  // Called once per pick when the reel stops on the result (see useReelSpin).
  onLanded?: () => void;
}
