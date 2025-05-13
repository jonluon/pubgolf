import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { RotateCcw } from "lucide-react";

const holeOrder = [
  "as", "pmans", "dogs", "cafe", "pickles", "bdubs", "phyrst", "champs", "zenos"
];

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

          const scores = {};
          let totalStrokes = 0;

          scoresSnap.docs.forEach(doc => {
            const score = doc.data();
            scores[doc.id] = score.sips || 0;
            totalStrokes += score.sips || 0;
          });

          return { ...player, scores, totalStrokes };
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
    if (player.totalStrokes === 0) return "—";
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}.`;
  };

  return (
    <div className="relative bg-white p-6 rounded-xl shadow border border-gray-200 mb-3 overflow-x-auto">
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

      <table className="table-auto w-full text-sm text-center border-collapse">
        <thead>
          <tr>
            <th className="text-left px-2 py-2 border-b border-gray-300">Player</th>
            {holeOrder.map((holeId, i) => (
              <th key={holeId} className="px-2 py-2 border-b border-gray-300">
                {i + 1}
              </th>
            ))}
            <th className="px-2 py-2 border-b border-gray-300">Total</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr key={player.phone} className="border-t border-gray-100">
              <td className="text-left font-medium px-2 py-2 whitespace-nowrap">
                {getMedal(index, player)} {player.name || "Unnamed"}
              </td>
              {holeOrder.map((holeId) => (
                <td key={holeId} className="px-2 py-1 text-gray-700">
                  {player.scores?.[holeId] ?? "-"}
                </td>
              ))}
              <td className="font-semibold text-gray-800">{player.totalStrokes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
