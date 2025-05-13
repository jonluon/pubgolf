import { useState, useEffect } from "react";
import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection
} from "firebase/firestore";
import { db } from "../firebase";
import PlayerStats from "./PlayerStats";
import { X } from "lucide-react";

const holes = [
  { id: "as", name: "A's", drink: "24oz beer", par: 3 },
  { id: "pmans", name: "Pmans", drink: "Mimosas", par: 5 },
  { id: "dogs", name: "Doggies", drink: "Iced Coffee", par: 2 },
  { id: "cafe", name: "Cafe", drink: "Pitcher", par: 6 },
  { id: "pickles", name: "Pickles", drink: "Busch Pitcher", par: 6 },
  { id: "bdubs", name: "Bdubs", drink: "Any tall beer", par: 2 },
  { id: "phyrst", name: "Phyrst", drink: "Trashcan (BJ shot = -1)", par: 3 },
  { id: "champs", name: "Champs", drink: "Dirty Sprite", par: 2 },
  { id: "zenos", name: "Zenos", drink: "Irish Goodbye", par: 4 }
];

function getResult(sips, par) {
  const diff = sips - par;
  if (diff <= -2) return "🏆 Eagle";
  if (diff === -1) return "🗭️ Birdie";
  if (diff === 0) return "✅ Par";
  if (diff === 1) return "☹️ Bogey";
  if (diff === 2) return "💀 Double Bogey";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function getDrinkEmoji(drink) {
  const lower = drink.toLowerCase();
  if (lower.includes("beer")) return "🍺";
  if (lower.includes("pitcher")) return "🍻";
  if (lower.includes("mimosa")) return "🥂";
  if (lower.includes("coffee")) return "☕";
  if (lower.includes("trashcan")) return "🗑️";
  if (lower.includes("shot")) return "🥃";
  if (lower.includes("sprite")) return "🧃";
  if (lower.includes("goodbye")) return "👋";
  return "🍹";
}

export default function Scorecard({ user, onScoreSubmit }) {
  const gameId = "drinkers-society";
  const storedIndex = parseInt(localStorage.getItem("pubgolf-currentIndex")) || 0;
  const [scores, setScores] = useState({});
  const [currentIndex, setCurrentIndex] = useState(storedIndex);
  const [sips, setSips] = useState();
  const [players, setPlayers] = useState([]);
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
  };

  const handleSubmit = async () => {
    await updateScore();
    if (currentIndex < holes.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      localStorage.setItem("pubgolf-currentIndex", nextIndex);
      setSips(loadSipsForHole(holes[nextIndex].id));
    }
  };

  const handleBack = async () => {
    await updateScore();
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      localStorage.setItem("pubgolf-currentIndex", prevIndex);
      setSips(loadSipsForHole(holes[prevIndex].id));
    }
  };

  const resetScorecard = async () => {
    if (window.confirm("Are you sure you want to reset your scorecard?")) {
      for (let hole of holes) {
        const ref = doc(db, "games", gameId, "players", user.phone, "scores", hole.id);
        await deleteDoc(ref);
      }
      setScores({});
      setCurrentIndex(0);
      localStorage.setItem("pubgolf-currentIndex", 0);
      setSips();
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
    const unsub = onSnapshot(collection(db, "games", gameId, "players"), (snap) => {
      const all = snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setPlayers(all);
    });
    return () => unsub();
  }, []);

  const progressIndex = holes.findIndex(h => !scores[h.id]);
  const currentProgress = progressIndex === -1 ? holes.length : progressIndex;

  useEffect(() => {
    setSips(loadSipsForHole(holes[currentIndex]?.id));
  }, [currentIndex, scores]);

  const totalSips = Object.values(scores).reduce((sum, s) => sum + (s?.sips || 0), 0);
  const totalPar = Object.entries(scores).reduce((sum, [id, s]) => {
    const hole = holes.find(h => h.id === id);
    return sum + (hole?.par || 0);
  }, 0);
  const parDiff = totalSips - totalPar;

  const sorted = [...players].sort((a, b) => {
    const sum = (obj) => Object.values(obj?.scores || {}).reduce((s, val) => s + (val?.sips || 0), 0);
    return sum(a) - sum(b);
  });
  const myStrokes = totalSips;
  const myRank = myStrokes > 0 ? sorted.findIndex((p) => p.phone === user.phone) + 1 : "--";
  const totalPlayers = sorted.length;

  if (currentIndex >= holes.length) {
    return (
      <div className="bg-black text-white p-6 rounded-xl shadow-sm mb-6 text-center">
        <h2 className="text-2xl font-bold mb-3">🍾 Congrats on Blacking Out</h2>
        <p className="text-lg">Total Strokes: {totalSips}</p>
        <PlayerStats totalSips={totalSips} parDiff={parDiff} myRank={myRank} totalPlayers={totalPlayers} />
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
              style={{ width: `${(currentProgress / (holes.length - 1)) * 100}%` }}
            ></div>
          </div>

          <div className="flex justify-between w-full px-2 z-10">
            {holes.map((hole, i) => {
              const isCurrent = i === currentProgress;
              const isCompleted = scores[hole.id];
              const isPerfect = isCompleted && scores[hole.id].sips === 1;
              const statusColor = i === progressIndex
                ? "bg-green-900 text-white"
                : isPerfect
                ? "bg-gradient-to-r from-yellow-300 to-yellow-500 text-white"
                : isCompleted
                ? "bg-green-700 text-white"
                : "bg-gray-200 text-gray-600";
              const scale = i === currentIndex ? "scale-110" : "";
              const shadow = i === currentIndex ? "shadow-md" : "";
              const scoreDiff = isCompleted ? scores[hole.id].sips - hole.par : null;
              const diffLabel = scoreDiff === 0 ? "Par" : scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`;
              return (
                <div key={hole.id} className="flex flex-col items-center text-xs space-y-1 w-[30px]">
                  <div className="text-gray-500">{isCompleted ? diffLabel : "\u00A0"}</div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-transform duration-200 ${statusColor} ${scale} ${shadow}`}>{i + 1}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative bg-white p-6 rounded-xl shadow border border-gray-200 mb-3">
        <div className="absolute top-4 right-4 cursor-pointer text-gray-600" onClick={resetScorecard}>
          <X size={20} />
        </div>

        <div className="text-center mb-2 mt-4">
          <h2 className="text-3xl font-bold text-neutral-800">
            🚩 Hole {currentIndex + 1}: {currentHole.name}
          </h2>
        </div>

        <p className="text-center text-lg font-semibold text-gray-800 mb-6">
          {getDrinkEmoji(currentHole.drink)} {currentHole.drink} <span className="text-gray-500 font-normal">(Par {currentHole.par})</span>
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
            onClick={() => setSips((prev) => Math.min(10, (prev ?? 0) + 1))}
            className="px-4 py-2 bg-black rounded-full hover:bg-gray-900 text-lg text-white font-bold"
          >
            +
          </button>
        </div>

        <p className="text-center mb-4 text-gray-600 text-lg">
          {sips !== undefined ? getResult(sips, currentHole.par).replace(/^.*? /, '') : "\u00A0"}
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
            Next Hole →
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

      <PlayerStats totalSips={totalSips} parDiff={parDiff} myRank={myRank} totalPlayers={totalPlayers} />
    </>
  );
}
