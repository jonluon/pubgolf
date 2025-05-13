import { useState, useEffect } from "react";
import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import PlayerStats from "./PlayerStats";
import confetti from "canvas-confetti";
import HoleList from "./HoleList";

const holes = [
  { id: "as", name: "A's", drink: "24oz beer", par: 3, emoji: "🍺" },
  { id: "pmans", name: "Pmans", drink: "Mimosas", par: 5, emoji: "🥂" },
  { id: "dogs", name: "Doggies", drink: "Iced Coffee", par: 2, emoji: "☕" },
  { id: "cafe", name: "Cafe", drink: "Pitcher", par: 6, emoji: "🍻" },
  { id: "pickles", name: "Pickles", drink: "Busch Pitcher", par: 6, emoji: "🍺" },
  { id: "bdubs", name: "Bdubs", drink: "Any tall beer", par: 2, emoji: "🍺" },
  { id: "phyrst", name: "Phyrst", drink: "Trashcan (BJ shot = -1)", par: 3, emoji: "🧪" },
  { id: "champs", name: "Champs", drink: "Dirty Sprite", par: 2, emoji: "🥤" },
  { id: "zenos", name: "Zenos", drink: "Irish Goodbye", par: 4, emoji: "🥃" }
];

function getResult(sips, par) {
  const diff = sips - par;
  if (diff < -2) return `${diff}`;
  if (diff <= -2) return "Eagle";
  if (diff === -1) return "Birdie";
  if (diff === 0) return "✅ Par";
  if (diff === 1) return "Bogey";
  if (diff === 2) return "Double Bogey";
  if (diff > 2) return `+${diff}`;
  return "\u00A0";
}

export default function Scorecard({ user, onScoreSubmit }) {
  const gameId = "drinkers-society";
  const [scores, setScores] = useState({});
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = parseInt(localStorage.getItem("pubgolf-currentIndex"));
    return isNaN(saved) ? 0 : saved;
  });
  
  const [sips, setSips] = useState();
  const [players, setPlayers] = useState([]);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const currentHole = holes[currentIndex];

  const loadSipsForHole = (holeId) => scores[holeId]?.sips;

  const updateScore = async () => {
    if (sips === undefined) return;
    const result = getResult(sips, currentHole.par);
    const ref = doc(db, "games", gameId, "players", user.phone, "scores", currentHole.id);
    await setDoc(ref, {
      sips,
      holeId: currentHole.id,
      par: currentHole.par,
      result,
      updatedAt: new Date()
    });
    if (typeof onScoreSubmit === "function") onScoreSubmit();
    setRefreshKey((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    await updateScore();
    const nextUnscoredIndex = holes.findIndex((h, i) => !scores[h.id] && i > currentIndex);
    const nextIndex = nextUnscoredIndex !== -1 ? nextUnscoredIndex : currentIndex + 1;
    const clampedIndex = Math.min(nextIndex, holes.length);
    setCurrentIndex(clampedIndex);
    localStorage.setItem("pubgolf-currentIndex", clampedIndex); // ✅ only here
  };
  

  const handleBack = async () => {
    const prevIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(prevIndex);
  };

  const resetScorecard = async () => {
    if (window.confirm("Are you sure you want to reset your scorecard?")) {
      for (let hole of holes) {
        const ref = doc(db, "games", gameId, "players", user.phone, "scores", hole.id);
        await deleteDoc(ref);
      }
      setScores({});
      setCurrentIndex(0);
      localStorage.setItem("pubgolf-currentIndex", 0); // ✅ this line
      setSips();
      if (typeof onScoreSubmit === "function") onScoreSubmit();
      setRefreshKey((prev) => prev + 1);
    }
  };
  

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "games", gameId, "players", user.phone, "scores"),
      (snapshot) => {
        const loaded = {};
        snapshot.forEach((doc) => (loaded[doc.id] = doc.data()));
        setScores(loaded);
      }
    );
    return () => unsub();
  }, [user.phone]);

  useEffect(() => {
    const fetchPlayersWithScores = async () => {
      const snap = await getDocs(collection(db, "games", gameId, "players"));
      const all = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const player = { ...docSnap.data(), id: docSnap.id };
          const scoreSnap = await getDocs(collection(db, "games", gameId, "players", player.id, "scores"));
          const scores = {};
          scoreSnap.forEach((s) => (scores[s.id] = s.data()));
          player.scores = scores;
          return player;
        })
      );
      setPlayers(all);
    };
    fetchPlayersWithScores();
  }, [refreshKey]);

  useEffect(() => {
    setSips(loadSipsForHole(holes[currentIndex]?.id));
  }, [currentIndex, scores]);

  const totalSips = Object.values(scores).reduce((sum, s) => sum + (s?.sips || 0), 0);
  const totalPar = Object.entries(scores).reduce((sum, [id, s]) => {
    const hole = holes.find(h => h.id === id);
    return sum + (hole?.par || 0);
  }, 0);
  const parDiff = totalSips - totalPar;

  const sorted = [...players].map((p) => {
    const total = Object.values(p?.scores || {}).reduce((sum, s) => sum + (s?.sips || 0), 0);
    return { ...p, total };
  }).sort((a, b) => a.total - b.total);

  const myRank = totalSips > 0 ? sorted.findIndex((p) => p.phone === user.phone) + 1 : "--";

  const myStrokes = totalSips;
  const totalPlayers = sorted.length;

  if (currentIndex >= holes.length) {
    if (!hasCelebrated) {
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
      setHasCelebrated(true);
    }

    return (
      <div className="bg-green-50 p-6 rounded-xl shadow-sm mb-6 text-center">
        <h2 className="text-xl font-bold text-green-700 mb-2">🍾 Congrats You’re Blacked Out!</h2>
        <p className="text-lg">
          You finished {holes.length} drinks in {totalSips} sips.
        </p>
        <button
          onClick={resetScorecard}
          className="mt-4 px-6 py-3 text-red-600 font-semibold rounded-xl"
        >
          Reset Scorecard
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-full overflow-x-auto mb-3">
        <div className="relative w-full flex flex-col items-center mb-3">
          <div className="absolute top-9 left-5 right-5 h-1 bg-gray-200 rounded-full z-0">
            <div
              className="h-1 bg-green-700 rounded-full transition-all"
              style={{
                width: `${(holes.findIndex(h => !scores[h.id]) / (holes.length - 1)) * 100}%`
              }}
            ></div>
          </div>
          <div className="flex justify-between w-full px-2 z-10">
            {holes.map((hole, i) => {
              const isSelected = i === currentIndex;
              const isCompleted = scores[hole.id];
              const isNextHole = !isCompleted && i === holes.findIndex(h => !scores[h.id]);
              const isPerfect = isCompleted && scores[hole.id].sips === 1;
              const statusColor = isNextHole
                ? "bg-green-900 text-white"
                : isPerfect
                ? "bg-gradient-to-r from-yellow-300 to-yellow-500 text-white"
                : isCompleted
                ? "bg-green-700 text-white"
                : "bg-gray-200 text-gray-600";
              const scale = isSelected ? "scale-110" : "";
              const shadow = isSelected ? "shadow-md" : "";
              const scoreDiff = isCompleted ? scores[hole.id].sips - hole.par : null;
              const diffLabel =
                scoreDiff === 0
                  ? "Par"
                  : scoreDiff > 0
                  ? `+${scoreDiff}`
                  : `${scoreDiff}`;

              return (
                <div key={hole.id} className="flex flex-col items-center text-xs space-y-1 w-[30px]">
                  <div className="text-gray-500">{isCompleted ? diffLabel : "\u00A0"}</div>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-transform duration-200 ${statusColor} ${scale} ${shadow}`}
                  >
                    {i + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative bg-white p-6 rounded-xl shadow border border-gray-200 mb-3">
        <div className="text-center mb-2 mt-4">
          <h2 className="text-3xl font-bold text-neutral-800">
            ⛳ Hole {currentIndex + 1}: {currentHole.name}
          </h2>
        </div>

        <p className="text-center text-lg font-semibold text-gray-800 mb-6">
          {currentHole.emoji} {currentHole.drink} <span className="text-gray-500 font-normal">(Par {currentHole.par})</span>
        </p>

        <div className="flex items-center justify-center space-x-4 mb-2">
          <button
            onClick={() => setSips((prev) => Math.max(1, (prev ?? 0) - 1))}
            className="px-4 py-2 bg-black rounded-full hover:bg-gray-900 text-lg text-white font-bold"
          >
            –
          </button>
          <span className="text-xl font-semibold px-6 py-2 rounded-full bg-white border border-gray-300 text-gray-800">
            {sips ?? "--"}
          </span>
          <button
            onClick={() => setSips((prev) => Math.min(20, (prev ?? 0) + 1))}
            className="px-4 py-2 bg-black rounded-full hover:bg-gray-900 text-lg text-white font-bold"
          >
            +
          </button>
        </div>

        <p className="text-center mb-4 text-gray-600 text-lg">
          {sips !== undefined ? getResult(sips, currentHole.par) : "\u00A0"}
        </p>

        <div className="flex flex-col items-center space-y-2 mt-4">
          <button
            onClick={handleSubmit}
            disabled={sips === undefined}
            className={`w-full py-3 text-lg font-semibold rounded-xl ${
              sips === undefined
                ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                : "bg-green-900 hover:bg-green-999 text-white"
            }`}
          >
            {currentIndex === holes.length - 1 ? "Finish Game" : "Next Hole →"}
          </button>
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="text-sm text-gray-600 disabled:opacity-50"
          >
            Back
          </button>
        </div>
      </div>
      <HoleList scores={scores} />
      <PlayerStats
        key={refreshKey}
        totalSips={totalSips}
        parDiff={parDiff}
        myRank={myRank}
        totalPlayers={totalPlayers}
        user={user}
      />
    </>
  );
}