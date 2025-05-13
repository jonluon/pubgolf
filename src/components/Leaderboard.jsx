import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc } from "firebase/firestore";
import { RotateCcw } from "lucide-react";

const holeOrder = [
  "as", "pmans", "dogs", "cafe", "pickles", "bdubs", "phyrst", "champs", "zenos"
];

export default function Leaderboard({ gameId, refreshKey }) {
  const [teams, setTeams] = useState([]);
  const [localRefresh, setLocalRefresh] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const playerSnaps = await getDocs(collection(db, "games", gameId, "players"));

      const data = await Promise.all(
        playerSnaps.docs.map(async (docSnap) => {
          const player = { phone: docSnap.id, ...docSnap.data() };

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

      const validPlayers = data.filter(p => p);

      const teamMap = {};
      for (const player of validPlayers) {
        const teamName = player.team?.trim() || "No Team";
        if (!teamMap[teamName]) teamMap[teamName] = [];
        teamMap[teamName].push(player);
      }

      const teamList = Object.entries(teamMap).map(([teamName, members]) => {
        const teamTotal = members.reduce((sum, p) => sum + (p.totalStrokes || 0), 0);
        return { teamName, members, teamTotal };
      });

      teamList.sort((a, b) => a.teamTotal - b.teamTotal);
      setTeams(teamList);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLeaderboard();
  }, [gameId, refreshKey, localRefresh]);

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
            <th className="text-left px-2 py-2 border-b border-gray-300">Team / Player</th>
            {holeOrder.map((holeId, i) => (
              <th key={holeId} className="px-2 py-2 border-b border-gray-300">
                {i + 1}
              </th>
            ))}
            <th className="px-2 py-2 border-b border-gray-300">Total</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, index) => (
            <>
              <tr key={`team-${team.teamName}`} className="border-t border-gray-200 bg-gray-50">
                <td className="text-left font-bold px-2 py-2 whitespace-nowrap">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`} {team.teamName}
                </td>
                {holeOrder.map((_, i) => (
                  <td key={`spacer-${i}`}></td>
                ))}
                <td className="font-bold text-gray-900">{team.teamTotal}</td>
              </tr>
              {team.members.map((player) => (
                <tr key={`player-${player.phone}`} className="text-gray-500">
                  <td className="text-left px-2 py-1 whitespace-nowrap">{player.name || "Unnamed"}</td>
                  {holeOrder.map((holeId) => (
                    <td key={holeId} className="px-2 py-1">
                      {player.scores?.[holeId] ?? "-"}
                    </td>
                  ))}
                  <td className="font-medium">{player.totalStrokes}</td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
