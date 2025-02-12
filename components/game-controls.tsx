import { Button } from "@/components/ui/button";

interface GameControlsProps {
  onRoll: () => void;
  onBank: () => void;
  onPass: () => void;
  disabled: boolean;
  canBank: boolean;
}

export function GameControls({ onRoll, onBank, onPass, disabled, canBank }: GameControlsProps) {
  return (
    <div className="flex justify-center space-x-4">
      <Button
        size="lg"
        onClick={onRoll}
        disabled={disabled}
        className="w-32"
      >
        Roll Dice
      </Button>
      <Button
        size="lg"
        onClick={onBank}
        disabled={disabled || !canBank}
        variant="secondary"
        className="w-32"
      >
        Bank Points
      </Button>
      <Button
        size="lg"
        onClick={onPass}
        disabled={disabled}
        variant="outline"
        className="w-32"
      >
        Pass
      </Button>
    </div>
  );
}