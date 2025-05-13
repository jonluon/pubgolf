import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  doc,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

export default function PlayerStats({ totalSips, parDiff, myRank, totalPlayers, user }) {
  const [teamStats, setTeamStats] = useState(null);
  const [teamRank, setTeamRank] = useState("--");
  const [totalTeams, setTotalTeams] = useState("--");

  const playerDiffLabel =
    parDiff === 0 ? "+0" : parDiff > 0 ? `+${parDiff}` : `${parDiff}`;

  useEffect(() => {
    if (!user?.phone) return;

    const unsub = onSnapshot(collection(db, "games", "drinkers-society", "players"), async (snap) => {
      try {
        const players = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        const player = players.find(p => p.id === user.phone);
        if (!player?.team) return;

        const teams = {};

        for (const p of players) {
          if (!p.team) continue;
          if (!teams[p.team]) teams[p.team] = { members: [], total: 0, par: 0 };

          teams[p.team].members.push(p);

          const scoreSnap = await getDocs(collection(db, "games", "drinkers-society", "players", p.id, "scores"));
          let playerTotal = 0;
          let playerPar = 0;

          scoreSnap.docs.forEach(doc => {
            const data = doc.data();
            playerTotal += data?.sips || 0;
            playerPar += data?.par || 0;
          });

          teams[p.team].total += playerTotal;
          teams[p.team].par += playerPar;
        }

        const sortedTeams = Object.entries(teams)
          .map(([name, data]) => ({ name, total: data.total, par: data.par }))
          .sort((a, b) => a.total - b.total);

        const thisTeam = sortedTeams.findIndex(t => t.name === player.team);

        setTeamStats({
          name: player.team,
          total: teams[player.team].total,
          par: teams[player.team].par,
          diff: teams[player.team].total - teams[player.team].par,
        });

        const allTeamsHaveZero = sortedTeams.every(t => t.total === 0);
setTeamRank(allTeamsHaveZero ? "--" : thisTeam + 1);
        setTotalTeams(sortedTeams.length);
      } catch (err) {
        console.error("Failed to fetch team stats", err);
      }
    });

    return () => unsub();
  }, [user]);

  const teamDiffLabel =
    teamStats?.diff === 0 ? "+0" :
    teamStats?.diff > 0 ? `+${teamStats?.diff}` :
    `${teamStats?.diff}`;

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mb-3">
      <div className="flex justify-between items-center text-center">
        {/* Team Stats */}
        <div className="flex-1">
          <p className="text-sm text-gray-500">Team Rank</p>
          <p className="text-xl font-bold text-purple-700">
            👥 {teamRank} / {totalTeams}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {teamStats ? `${teamStats.total} strokes (${teamDiffLabel})` : "--"}
          </p>
        </div>

        {/* Divider */}
        <div className="w-px h-16 bg-gray-200 mx-4"></div>

        {/* Player Stats */}
        <div className="flex-1">
          <p className="text-sm text-gray-500">Player Rank</p>
          <p className="text-xl font-bold text-yellow-700">
            🏆 {myRank || "--"} / {totalPlayers || "--"}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {totalSips ?? "--"} strokes ({playerDiffLabel})
          </p>
        </div>
      </div>
    </div>
  );
}
