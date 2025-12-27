import { useEffect, useMemo, useState } from "react";
import "./App.css";

// Firebase (Firestore)
import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";

const MAX_MISTAKES = 6;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function makeRoomCode() {
  // 6-char code, easy to type
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function sanitizeWord(input) {
  return input
    .toUpperCase()
    .replace(/[^A-Z ]/g, "") // allow letters and spaces only
    .replace(/\s+/g, " ")
    .trim();
}

function maskedWord(secret, guessedArr) {
  const guessed = new Set(guessedArr);
  return secret
    .split("")
    .map((c) => {
      if (c === " ") return "  ";
      if (!/[A-Z]/.test(c)) return c + " ";
      return guessed.has(c) ? c + " " : "_ ";
    })
    .join("");
}

function isWin(secret, guessedArr) {
  const guessed = new Set(guessedArr);
  for (const c of secret) {
    if (/[A-Z]/.test(c) && !guessed.has(c)) return false;
  }
  return true;
}

function HangmanAscii({ mistakes }) {
  const h = mistakes >= 1 ? "O" : " ";
  const b = mistakes >= 2 ? "|" : " ";
  const la = mistakes >= 3 ? "/" : " ";
  const ra = mistakes >= 4 ? "\\" : " ";
  const ll = mistakes >= 5 ? "/" : " ";
  const rl = mistakes >= 6 ? "\\" : " ";

  return (
    <pre className="ascii">
{` +---+
 |   |
 ${h}   |
${la}${b}${ra}  |
${ll} ${rl}  |
     |
=========`}
    </pre>
  );
}

export default function App() {
  // screens: menu, host_create, host_setword, guest_join, game
  const [screen, setScreen] = useState("menu");

  // local inputs
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [error, setError] = useState("");

  // multiplayer state
  const [role, setRole] = useState(null); // "host" | "guest"
  const [roomCode, setRoomCode] = useState("");
  const [room, setRoom] = useState(null); // firestore doc data

  // realtime listener
  useEffect(() => {
    if (!roomCode) return;
    const ref = doc(db, "rooms", roomCode);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setError("Room not found (it may have been deleted).");
        setRoom(null);
        return;
      }
      setRoom(snap.data());
    });
    return () => unsub();
  }, [roomCode]);

  const guessedList = useMemo(() => {
    const arr = room?.guessed ?? [];
    return [...arr].sort();
  }, [room]);

  async function createRoomAsHost() {
    setError("");
    const code = makeRoomCode();
    const ref = doc(db, "rooms", code);

    await setDoc(ref, {
      hostConnected: true,
      guestConnected: false,
      secret: "",
      guessed: [],
      mistakes: 0,
      maxMistakes: MAX_MISTAKES,
      status: "waiting",
      createdAt: serverTimestamp(),
    });

    setRole("host");
    setRoomCode(code);
    setScreen("host_setword");
  }

  async function hostSetSecret() {
    setError("");
    const clean = sanitizeWord(secretInput);
    if (!clean || clean.length < 2) {
      setError("Secret word must be at least 2 letters.");
      return;
    }

    const ref = doc(db, "rooms", roomCode);
    await updateDoc(ref, {
      secret: clean,
      status: "playing",
      guessed: [],
      mistakes: 0,
    });

    setSecretInput("");
    setScreen("game");
  }

  async function joinRoomAsGuest() {
    setError("");
    const code = roomCodeInput.trim().toUpperCase();
    if (code.length < 4) {
      setError("Enter a valid room code.");
      return;
    }

    const ref = doc(db, "rooms", code);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      setError("Room code not found.");
      return;
    }

    await updateDoc(ref, { guestConnected: true });

    setRole("guest");
    setRoomCode(code);
    setRoomCodeInput("");
    setScreen("game");
  }

  async function guessLetter(letter) {
    setError("");
    if (!room) return;
    if (role !== "guest") return; // only guest guesses in this simple model
    if (room.status !== "playing") return;
    if (!room.secret) return;

    const already = (room.guessed ?? []).includes(letter);
    if (already) return;

    const ref = doc(db, "rooms", roomCode);
    const secret = room.secret;
    const guessedNext = [...(room.guessed ?? []), letter];
    const wrong = !secret.includes(letter);

    let mistakesNext = room.mistakes ?? 0;
    if (wrong) mistakesNext += 1;

    // compute status
    let statusNext = "playing";
    if (mistakesNext >= (room.maxMistakes ?? MAX_MISTAKES)) {
      statusNext = "lost";
    } else if (isWin(secret, guessedNext)) {
      statusNext = "won";
    }

    await updateDoc(ref, {
      guessed: arrayUnion(letter),
      mistakes: mistakesNext,
      status: statusNext,
    });
  }

  async function hostRestart() {
    setError("");
    if (!room) return;
    if (role !== "host") return;

    const ref = doc(db, "rooms", roomCode);
    await updateDoc(ref, {
      secret: "",
      guessed: [],
      mistakes: 0,
      status: "waiting",
    });
    setScreen("host_setword");
  }

  function backToMenu() {
    setError("");
    setRole(null);
    setRoomCode("");
    setRoom(null);
    setScreen("menu");
  }

  // -------- UI --------

  if (screen === "menu") {
    return (
      <div className="container">
        <h1>Hangman (Multiplayer)</h1>

        <div className="card">
          <div className="gap">
            <button className="btn primary" onClick={createRoomAsHost}>
              Host: Create Room
            </button>
            <button className="btn" onClick={() => setScreen("guest_join")}>
              Guest: Join Room
            </button>
          </div>

          <p className="hint">
            Host creates a room and sets the secret word. Guest joins with the code and guesses.
          </p>

          {error && <div className="error">{error}</div>}
        </div>
      </div>
    );
  }

  if (screen === "guest_join") {
    return (
      <div className="container">
        <div className="header">
          <h1>Join Room</h1>
          <button className="btn" onClick={backToMenu}>Menu</button>
        </div>

        <div className="card">
          <label>
            Room Code:
            <input
              className="input"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              placeholder="e.g. A1B2C3"
            />
          </label>

          <button className="btn primary full" onClick={joinRoomAsGuest}>
            Join
          </button>

          {error && <div className="error">{error}</div>}
        </div>
      </div>
    );
  }

  if (screen === "host_setword") {
    return (
      <div className="container">
        <div className="header">
          <h1>Host Room</h1>
          <button className="btn" onClick={backToMenu}>Menu</button>
        </div>

        <div className="card">
          <p><strong>Room Code:</strong> {roomCode}</p>
          <p className="hint">
            Share this code with the guest. Wait for them to join, then set the secret word.
          </p>

          <p>
            <strong>Guest connected:</strong> {room?.guestConnected ? "Yes" : "No"}
          </p>

          <label>
            Secret word (letters/spaces only):
            <input
              className="input"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="e.g. SOFTWARE"
              type="password"
            />
          </label>

          <button
            className="btn primary full"
            onClick={hostSetSecret}
            disabled={!room?.guestConnected}
            title={!room?.guestConnected ? "Guest must join first" : ""}
          >
            Start Game
          </button>

          {error && <div className="error">{error}</div>}
        </div>
      </div>
    );
  }

  // GAME SCREEN
  const secret = room?.secret ?? "";
  const guessed = room?.guessed ?? [];
  const mistakes = room?.mistakes ?? 0;
  const status = room?.status ?? "waiting";

  return (
    <div className="container">
      <div className="header">
        <h1>Hangman</h1>
        <button className="btn" onClick={backToMenu}>Menu</button>
      </div>

      <div className="card">
        <p>
          <strong>Room:</strong> {roomCode} &nbsp;|&nbsp; <strong>You:</strong> {role}
        </p>

        {status === "waiting" && (
          <p className="hint">
            Waiting for host to set the word...
          </p>
        )}

        <p>
          <strong>Mistakes:</strong> {mistakes} / {MAX_MISTAKES}
        </p>

        <HangmanAscii mistakes={mistakes} />

        <div className="word">
          {status === "waiting" ? "_ _ _ _" : maskedWord(secret, guessed)}
        </div>

        <div className="row">
          <strong>Guessed:</strong> {guessedList.join(", ")}
        </div>

        <div className="keyboard">
          {LETTERS.map((l) => (
            <button
              key={l}
              className="key"
              disabled={role !== "guest" || status !== "playing" || guessed.includes(l)}
              onClick={() => guessLetter(l)}
              title={role !== "guest" ? "Only guest guesses in this mode" : ""}
            >
              {l}
            </button>
          ))}
        </div>

        {status === "won" && (
          <div className="result">
            <h2>Guest Wins!</h2>
            <p>The word was: <strong>{secret}</strong></p>
            {role === "host" && (
              <button className="btn primary" onClick={hostRestart}>Play Again (Host)</button>
            )}
          </div>
        )}

        {status === "lost" && (
          <div className="result">
            <h2>Game Over</h2>
            <p>The word was: <strong>{secret}</strong></p>
            {role === "host" && (
              <button className="btn primary" onClick={hostRestart}>Play Again (Host)</button>
            )}
          </div>
        )}

        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
