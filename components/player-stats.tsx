interface PlayerStatsProps {
  currentScore: number;
  totalScore: number;
  targetScore: number;
}

export function PlayerStats({ currentScore, totalScore, targetScore }: PlayerStatsProps) {
  const progress = (totalScore / targetScore) * 100;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Current Turn
          </h3>
          <p className="text-4xl font-bold">{currentScore}</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Score
          </h3>
          <p className="text-4xl font-bold">{totalScore}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-center text-muted-foreground">
          {totalScore} / {targetScore} points to win
        </p>
      </div>
    </div>
  );
}