import { Dice1Icon as DiceIcon } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container flex h-16 items-center px-4">
        <div className="flex items-center space-x-2">
          <DiceIcon className="h-6 w-6" />
          <span className="font-bold">BANK! Dice Game</span>
        </div>
      </div>
    </header>
  );
}