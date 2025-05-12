import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { RotateCcw } from "lucide-react";

export default function Leaderboard({ gameId, refreshKey }) {
  const [players, setPlayers] = useState([]);
  const [localRefresh, setLocalRefresh] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const playerSnaps = await getDocs(collection(db, "games", gameId, "players"));

      const data = await Promise.all(
        playerSnaps.docs.map(async (docSnap) => {
          const player = docSnap.data();
          const scoresSnap = await getDocs(
            collection(db, "games", gameId, "players", player.phone, "scores")
          );

          const totalStrokes = scoresSnap.docs.reduce((sum, doc) => {
            return sum + (doc.data().sips || 0);
          }, 0);

          return { ...player, totalStrokes };
        })
      );

      const sorted = data.sort((a, b) => {
        if (a.totalStrokes === 0 && b.totalStrokes > 0) return 1;
        if (b.totalStrokes === 0 && a.totalStrokes > 0) return -1;
        return a.totalStrokes - b.totalStrokes;
      });

      setPlayers(sorted);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLeaderboard();
  }, [gameId, refreshKey, localRefresh]);

  const getMedal = (index, player) => {
    if (player.totalStrokes === 0) return "\u00A0";
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  return (
    <div className="relative bg-white p-6 rounded-xl shadow border border-gray-200 mb-3">
      <style>
        {`
          @keyframes spin-reverse {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(-360deg); }
          }
          .animate-spin-reverse {
            animation: spin-reverse 1s linear infinite;
          }
        `}
      </style>

      <button
        onClick={() => setLocalRefresh((r) => r + 1)}
        className="absolute top-4 right-4 text-gray-600 hover:text-black"
        aria-label="Refresh leaderboard"
      >
        <RotateCcw
          size={20}
          className={loading ? "animate-spin-reverse transition-transform" : ""}
        />
      </button>

      <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">Leaderboard</h2>

      <ul className="space-y-2">
        {players.map((player, index) => (
          <li
            key={player.phone}
            className="flex justify-between items-center text-gray-800 border-b pb-2 last:border-none"
          >
            <span className="font-medium">
              {getMedal(index, player)} {player.name || "Unnamed Player"}
            </span>
            <span className="text-sm text-gray-600">
              {player.totalStrokes} Strokes
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
