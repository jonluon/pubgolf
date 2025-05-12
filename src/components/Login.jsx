import { useState, useEffect, useRef } from "react";
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "../firebase";
import { User } from "lucide-react";

export default function Login({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const recaptchaRef = useRef(null);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        recaptchaRef.current,
        { size: "invisible", callback: () => {} },
        auth
      );
    }
  }, []);

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    const parts = [];
    if (digits.length > 0) parts.push("(" + digits.slice(0, 3));
    if (digits.length >= 4) parts.push(") " + digits.slice(3, 6));
    if (digits.length >= 7) parts.push("-" + digits.slice(6, 10));
    return parts.join("");
  };

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value));
  };

  const requestCode = async () => {
    setError("");
    try {
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = `+1${phone.replace(/\D/g, "")}`;
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmation(confirmationResult);
    } catch (err) {
      setError(err.message);
    }
  };

  const verifyCode = async () => {
    try {
      await confirmation.confirm(code);
      setVerified(true);
    } catch (err) {
      setError("Incorrect code.");
    }
  };

  const submitName = () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    onLogin({
      name,
      phone: `+1${phone.replace(/\D/g, "")}`
    });
  };

  return (
    <div className="max-w-xl mx-auto mt-2 p-4 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-black text-lg font-semibold">🍺⛳pubgolf.io</div>
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
          <User size={16} />
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-center">Join PubGolf Game</h2>

        {!confirmation && !verified && (
          <>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="Phone (e.g. (555) 123-4567)"
              className="w-full p-3 border border-gray-300 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-green-700"
            />
            <div ref={recaptchaRef} id="recaptcha-container" className="mb-3"></div>
            <button
              onClick={requestCode}
              className="w-full py-3 bg-green-900 text-white rounded-xl hover:bg-green-800 transition"
            >
              Send Code
            </button>
          </>
        )}

        {confirmation && !verified && (
          <>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full p-3 border border-gray-300 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-green-700"
            />
            <button
              onClick={verifyCode}
              className="w-full py-3 bg-green-900 text-white rounded-xl hover:bg-green-800 transition"
            >
              Verify Code
            </button>
          </>
        )}

        {verified && (
          <>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-3 border border-gray-300 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <button
              onClick={submitName}
              className="w-full py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition"
            >
              Join Game
            </button>
          </>
        )}

        {error && (
          <p className="text-red-500 mt-4 text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
