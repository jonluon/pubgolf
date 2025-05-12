import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import Scorecard from "./components/Scorecard";
import Leaderboard from "./components/Leaderboard";
import Login from "./components/Login";
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const gameId = "drinkers-society";

  const handleLogin = async ({ name, phone }) => {
    const playerRef = doc(db, "games", gameId, "players", phone);
    try {
      await setDoc(playerRef, {
        name,
        phone,
        joinedAt: new Date()
      });
      setUser({ name, phone });
    } catch (err) {
      console.error("Firestore join error:", err);
      setError("❌ Couldn't join game. You're likely offline or blocked by network.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setShowLogout(false);
  };

  const handleScoreSubmit = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const phone = user.phoneNumber;
        try {
          const docRef = doc(db, "games", gameId, "players", phone);
          const snapshot = await getDoc(docRef);
          if (snapshot.exists()) {
            setUser({ phone, name: snapshot.data().name });
          }
        } catch (err) {
          console.error("Auto-login fetch failed:", err);
        }
      }
    });

    const unsubPlayers = onSnapshot(
      collection(db, "games", gameId, "players"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => doc.data());
        setPlayers(data);
      },
      (err) => {
        console.error("Realtime fetch error:", err);
        setError("❌ Failed to load player list. Firestore may be blocked.");
      }
    );

    return () => {
      unsubAuth();
      unsubPlayers();
    };
  }, []);

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="max-w-xl mx-auto mt-2 p-4 relative">
      <div className="flex justify-between items-center mb-2">
        <div className="text-black text-lg">🍺⛳pubgolf.io</div>
        <div className="relative">
          <div
            onClick={() => setShowLogout((prev) => !prev)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer"
            style={{
              backgroundColor: `hsl(${(user.name.charCodeAt(0) * 47) % 360}, 70%, 50%)`
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          {showLogout && (
            <div className="absolute right-0 mt-2 bg-white border border-gray-300 rounded-md shadow text-sm z-50">
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-left text-red-500 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

<div className="p-6 text-center mb-0">
        <p className="text-3xl font-bold text-gray-800 mb-2">Drinker's Society Open</p>
          <p className="text-xl font-semibold text-gray-800 mb-2">Tuesday, May 13th</p>
  <div className="flex items-center justify-center space-x-4">
    <div className="flex-grow h-px bg-gray-200 mt-1"></div>
<p className="text-md text-gray-400 mb-0">
  {players.length} player{players.length !== 1 ? "s" : ""} joined
</p>
    <div className="flex-grow h-px bg-gray-200 mt-1"></div>
  </div>
</div>


      {error && (
        <div className="bg-red-100 text-red-800 p-2 rounded mb-4 text-center">
          {error}
        </div>
      )}

      <Scorecard user={user} onScoreSubmit={handleScoreSubmit} />
      <Leaderboard gameId={gameId} refreshKey={refreshKey} />
    </div>
  );
}

export default App;
