'use client'
import { useEffect, useState } from "react";

export default function Home() {
  const [isJumping, setIsJumping] = useState(false);
  const [dinoPosition, setDinoPosition] = useState(0);
  const [obstaclePosition, setObstaclePosition] = useState(100);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space" && !isJumping) {
        setIsJumping(true);
        setTimeout(() => setIsJumping(false), 1500);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isJumping]);

  useEffect(() => {
    if (!gameOver) {
      const obstacleInterval = setInterval(() => {
        setObstaclePosition((prev) => (prev > -10 ? prev - 2 : 100));
      }, 50);

      return () => clearInterval(obstacleInterval);
    }
  }, [gameOver]);

  useEffect(() => {
    if (obstaclePosition <= 20 && !isJumping) {
      setGameOver(true);
    }
  }, [obstaclePosition, isJumping]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative overflow-hidden">
      <h1 className="text-2xl font-bold mb-4">Dinosaur Game</h1>
      {gameOver && <p className="text-red-500 font-bold">Game Over! Refresh to Restart</p>}
      <div className="relative w-64 h-40 border border-black overflow-hidden">
        <div
          className={`absolute bottom-0 left-10 w-10 h-10 bg-black ${isJumping ? "animate-jump" : ""}`}
        ></div>
        <div
          className="absolute bottom-0 w-10 h-10 bg-red-600"
          style={{ left: `${obstaclePosition}%` }}
        ></div>
      </div>
      <p className="mt-4">Press Space to Jump!</p>
      <style jsx>{`
        .animate-jump {
          animation: jump 1s ease-in-out;
        }

        @keyframes jump {
          0% { transform: translateY(0); }
          50% { transform: translateY(-100px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}