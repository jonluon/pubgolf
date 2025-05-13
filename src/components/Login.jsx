import { useState, useEffect } from "react";
import { User, Trash2, Pencil } from "lucide-react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs
} from "firebase/firestore";

export default function Login({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminStep, setAdminStep] = useState("password");
  const [adminName, setAdminName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminTeam, setAdminTeam] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    let formatted = "";
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length >= 4) formatted += " - " + digits.slice(3, 6);
    if (digits.length >= 7) formatted += " - " + digits.slice(6, 10);
    return formatted;
  };

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value));
  };

  const attemptLogin = async () => {
    const rawPhone = `+1${phone.replace(/\D/g, "")}`;
    if (rawPhone.length !== 12) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const ref = doc(db, "games", "drinkers-society", "players", rawPhone);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setError("This phone number is not registered for this game.");
        setLoading(false);
        return;
      }

      const player = snap.data();
      onLogin({ name: player.name || "Unnamed", phone: rawPhone });
    } catch (err) {
      console.error(err);
      setError("Login failed. Please try again.");
    }

    setLoading(false);
  };

  const handleAdminLogin = () => {
    if (password === "123456") {
      setAdminStep("form");
      loadPlayers();
    } else {
      setMessage("Incorrect password.");
    }
  };

  const handleAdminRegister = async () => {
    const cleanPhone = `+1${adminPhone.replace(/\D/g, "")}`;
    if (cleanPhone.length !== 12 || !adminName.trim()) {
      setMessage("Please enter valid name and 10-digit phone number");
      return;
    }

    try {
      await setDoc(doc(db, "games", "drinkers-society", "players", cleanPhone), {
        name: adminName,
        phone: cleanPhone,
        team: adminTeam || "",
        scores: {}
      });
      setMessage("✅ Registered successfully");
      setAdminPhone("");
      setAdminName("");
      setAdminTeam("");
      loadPlayers();
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to register");
    }
  };

  const loadPlayers = async () => {
    const snap = await getDocs(collection(db, "games", "drinkers-society", "players"));
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPlayers(data);
    const uniqueTeams = Array.from(new Set(data.map(p => p.team).filter(Boolean)));
    setTeams(uniqueTeams);
  };

  const deletePlayer = async (id) => {
    await deleteDoc(doc(db, "games", "drinkers-society", "players", id));
    loadPlayers();
  };

  const updatePlayer = async (id, name, team) => {
    await setDoc(doc(db, "games", "drinkers-society", "players", id), {
      name,
      phone: id,
      team,
      scores: {}
    });
    loadPlayers();
  };

  const addTeam = () => {
    if (newTeamName && !teams.includes(newTeamName)) {
      setTeams(prev => [...prev, newTeamName]);
      setNewTeamName("");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-2 p-4 relative">
      <div className="flex justify-between items-center mb-4">
        <div className="text-black text-lg font-semibold">🍺🏌️pubgolf</div>
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
          <User size={16} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
        {!adminMode && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">Enter Your Phone #</h2>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="123 - 456 - 7890"
              className="w-full text-2xl font-mono text-center p-4 border border-green-700 border-2 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-green-700"
            />
            <button
              onClick={attemptLogin}
              disabled={loading}
              className="w-full py-3 bg-green-900 text-white rounded-xl hover:bg-green-800 transition"
            >
              {loading ? "Checking..." : "Log In"}
            </button>
            <p className="mt-4 text-sm text-center">
              <button onClick={() => setAdminMode(true)} className="text-blue-600 underline">
                Register new numbers
              </button>
            </p>
            {error && <p className="text-red-500 mt-4 text-sm text-center">{error}</p>}
          </>
        )}

        {adminMode && adminStep === "password" && (
          <>
            <h2 className="text-xl font-semibold mb-3 text-center">Admin Access</h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full p-3 border border-gray-300 rounded-xl mb-3 focus:outline-none"
            />
            <button
              onClick={handleAdminLogin}
              className="w-full py-3 bg-green-900 text-white rounded-xl hover:bg-green-800 transition"
            >
              Continue
            </button>
            <p className="mt-4 text-sm text-center">
              <button onClick={() => setAdminMode(false)} className="text-gray-500 underline">
                Back to login
              </button>
            </p>
            {message && <p className="text-red-500 mt-4 text-sm text-center">{message}</p>}
          </>
        )}

        {adminMode && adminStep === "form" && (
          <>
            <h2 className="text-xl font-semibold mb-3 text-center">Register New Player</h2>
            <input
              type="tel"
              value={adminPhone}
              onChange={(e) => setAdminPhone(formatPhone(e.target.value))}
              placeholder="123 - 456 - 7890"
              className="w-full text-lg font-mono p-3 border border-gray-300 rounded-xl mb-3"
            />
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Player Name"
              className="w-full p-3 border border-gray-300 rounded-xl mb-3"
            />
            <select
              value={adminTeam}
              onChange={(e) => setAdminTeam(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl mb-3"
            >
              <option value="">Select Team</option>
              {teams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
            <button
              onClick={handleAdminRegister}
              className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
            >
              Register Player
            </button>

            <div className="mt-6">
              <h3 className="font-bold mb-2">Create Team</h3>
              <div className="flex gap-2">
                <input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="New team name"
                  className="flex-1 p-2 border rounded"
                />
                <button
                  onClick={addTeam}
                  className="bg-green-700 text-white px-4 rounded"
                >Add</button>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-bold mb-2">All Players</h3>
              <ul className="space-y-2">
                {players.map((player) => (
                  <li key={player.id} className="flex justify-between items-center border p-2 rounded">
                    <div>
                      <input
                        className="font-medium mr-2 border px-2 rounded"
                        defaultValue={player.name}
                        onBlur={(e) => updatePlayer(player.id, e.target.value, player.team)}
                      />
                      <select
                        defaultValue={player.team || ""}
                        onBlur={(e) => updatePlayer(player.id, player.name, e.target.value)}
                        className="ml-2 border px-2 py-1 rounded"
                      >
                        <option value="">No Team</option>
                        {teams.map(team => (
                          <option key={team} value={team}>{team}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => deletePlayer(player.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-sm text-center">
              <button onClick={() => setAdminMode(false)} className="text-gray-500 underline">
                Back to login
              </button>
            </p>
            {message && <p className="text-green-700 mt-4 text-sm text-center">{message}</p>}
          </>
        )}
      </div>
    </div>
  );
}
