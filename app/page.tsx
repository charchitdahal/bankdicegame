import { GameBoard } from '@/components/game-board';
import { Header } from '@/components/header';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <GameBoard />
      </div>
    </main>
  );
}