import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { db } from "./firebase";

import {
  doc,
  setDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

const MAX_MISTAKES = 6;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const WORDS = ["HANGMAN", "SOFTWARE", "MOBILE APP", "ENGINEERING", "DEBUGGING", "REACT"];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalizeSecret(input) {
  return input
    .toUpperCase()
    .replace(/[^A-Z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function maskedWord(secret, guessed) {
  return secret
    .split("")
    .map((c) => {
      if (c === " ") return "  ";
      if (!/[A-Z]/.test(c)) return c + " ";
      return guessed.has(c) ? c + " " : "_ ";
    })
    .join("");
}

function isWin(secret, guessed) {
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

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function App() {
  // screens: menu | game | onlineMenu | enterWord | onlineRoom
  const [screen, setScreen] = useState("menu");

  // ---------- single player state ----------
  const [secret, setSecret] = useState("");
  const [guessed, setGuessed] = useState(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [status, setStatus] = useState("playing"); // playing | won | lost
  const guessedList = useMemo(() => [...guessed].sort(), [guessed]);

  function startSingle() {
    setSecret(pickRandom(WORDS));
    setGuessed(new Set());
    setMistakes(0);
    setStatus("playing");
    setScreen("game");
  }

  function guessLocal(letter) {
    if (status !== "playing") return;
    if (guessed.has(letter)) return;

    const next = new Set(guessed);
    next.add(letter);
    setGuessed(next);

    if (!secret.includes(letter)) {
      const m = mistakes + 1;
      setMistakes(m);
      if (m >= MAX_MISTAKES) setStatus("lost");
    } else {
      if (isWin(secret, next)) setStatus("won");
    }
  }

  // ---------- online multiplayer state ----------
  const [roomCode, setRoomCode] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [wordInput, setWordInput] = useState("");

  // mirrored room state from Firestore
  const [rSecret, setRSecret] = useState("");
  const [rGuessed, setRGuessed] = useState(new Set());
  const [rMistakes, setRMistakes] = useState(0);
  const [rStatus, setRStatus] = useState("waiting"); // waiting | playing | won | lost
  const rGuessedList = useMemo(() => [...rGuessed].sort(), [rGuessed]);

  useEffect(() => {
    if (!roomCode) return;
    const ref = doc(db, "rooms", roomCode);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setRSecret(data.secret || "");
      setRGuessed(new Set(data.guessed || []));
      setRMistakes(data.mistakes ?? 0);
      setRStatus(data.status || "waiting");
    });

    return () => unsub();
  }, [roomCode]);

  async function createRoom() {
    const code = makeRoomCode();
    const ref = doc(db, "rooms", code);

    await setDoc(ref, {
      createdAt: serverTimestamp(),
      status: "waiting",
      secret: "",
      guessed: [],
      mistakes: 0,
    });

    setRoomCode(code);
    setIsHost(true);
    setWordInput("");
    setScreen("enterWord");
  }

  async function joinRoom() {
    const code = roomInput.trim().toUpperCase();
    if (!code) return;

    const ref = doc(db, "rooms", code);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      alert("Room not found. Check the code.");
      return;
    }

    setRoomCode(code);
    setIsHost(false);
    setScreen("onlineRoom");
  }

  async function hostSetWord() {
    const normalized = normalizeSecret(wordInput);
    if (normalized.length < 2) {
      alert("Enter a longer word/phrase (letters and spaces only).");
      return;
    }

    const ref = doc(db, "rooms", roomCode);
    await setDoc(
      ref,
      { status: "playing", secret: normalized, guessed: [], mistakes: 0 },
      { merge: true }
    );

    setScreen("onlineRoom");
  }

  async function guessOnline(letter) {
    if (!roomCode) return;
    const ref = doc(db, "rooms", roomCode);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;

      const data = snap.data();
      if (data.status !== "playing") return;

      const secret = data.secret || "";
      const guessedArr = data.guessed || [];
      const guessedSet = new Set(guessedArr);

      if (guessedSet.has(letter)) return;
      guessedSet.add(letter);

      let mistakes = data.mistakes ?? 0;
      let status = "playing";

      if (!secret.includes(letter)) {
        mistakes += 1;
        if (mistakes >= MAX_MISTAKES) status = "lost";
      } else {
        if (isWin(secret, guessedSet)) status = "won";
      }

      tx.update(ref, {
        guessed: [...guessedSet],
        mistakes,
        status,
      });
    });
  }

  function leaveOnline() {
    setRoomCode("");
    setRoomInput("");
    setIsHost(false);
    setWordInput("");
    setRSecret("");
    setRGuessed(new Set());
    setRMistakes(0);
    setRStatus("waiting");
    setScreen("onlineMenu");
  }

  // ---------- UI ----------
  if (screen === "menu") {
    return (
      <div className="container">
        <h1>Hangman</h1>
        <div className="card">
          <button className="btn primary full" onClick={startSingle}>
            Single Player
          </button>

          <button className="btn full" onClick={() => setScreen("onlineMenu")}>
            Online Multiplayer (2 devices)
          </button>

          <p className="hint">
            Online mode uses a room code so two devices share the same game.
          </p>
        </div>
      </div>
    );
  }

  if (screen === "onlineMenu") {
    return (
      <div className="container">
        <div className="header">
          <h1>Online Multiplayer</h1>
          <button className="btn" onClick={() => setScreen("menu")}>
            Menu
          </button>
        </div>

        <div className="card">
          <button className="btn primary full" onClick={createRoom}>
            Create Room (Host)
          </button>

          <label className="label">Join room code</label>
          <input
            className="input"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            placeholder="e.g. A7K3PZ"
          />
          <button className="btn full" onClick={joinRoom}>
            Join
          </button>

          <p className="hint">
            Host creates a room and shares the code with the other device.
          </p>
        </div>
      </div>
    );
  }

  if (screen === "enterWord") {
    return (
      <div className="container">
        <div className="header">
          <h1>Host Setup</h1>
          <button className="btn" onClick={leaveOnline}>
            Back
          </button>
        </div>

        <div className="card">
          <p className="hint">
            Room Code: <strong style={{ letterSpacing: 1 }}>{roomCode}</strong>
            <br />
            Share this with Player 2.
          </p>

          <label className="label">Secret word/phrase</label>
          <input
            className="input"
            type="password"
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            placeholder="Letters and spaces only"
          />

          <button className="btn primary full" onClick={hostSetWord}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (screen === "onlineRoom") {
    return (
      <div className="container">
        <div className="header">
          <h1>Online Room</h1>
          <button className="btn" onClick={leaveOnline}>
            Leave
          </button>
        </div>

        <div className="card">
          <p className="hint">
            Room: <strong style={{ letterSpacing: 1 }}>{roomCode}</strong>{" "}
            {isHost ? "(Host)" : "(Guest)"}
          </p>

          {rStatus === "waiting" && <p className="hint">Waiting for host to start…</p>}

          <p>
            <strong>Mistakes:</strong> {rMistakes} / {MAX_MISTAKES}
          </p>

          <HangmanAscii mistakes={rMistakes} />

          <div className="word">{rSecret ? maskedWord(rSecret, rGuessed) : "_ _ _"}</div>

          <div className="row">
            <strong>Guessed:</strong> {rGuessedList.join(", ")}
          </div>

          <div className="keyboard">
            {LETTERS.map((l) => (
              <button
                key={l}
                className="key"
                disabled={rGuessed.has(l) || rStatus !== "playing"}
                onClick={() => guessOnline(l)}
              >
                {l}
              </button>
            ))}
          </div>

          {rStatus !== "playing" && rStatus !== "waiting" && (
            <div className="result">
              <h2>{rStatus === "won" ? "Win!" : "Game Over"}</h2>
              <p>
                The word was: <strong>{rSecret}</strong>
              </p>
              {isHost && (
                <button className="btn primary" onClick={() => setScreen("enterWord")}>
                  New Word (Host)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // single player game screen (your original)
  return (
    <div className="container">
      <div className="header">
        <h1>Hangman</h1>
        <button className="btn" onClick={() => setScreen("menu")}>
          Menu
        </button>
      </div>

      <div className="card">
        <p>
          <strong>Mistakes:</strong> {mistakes} / {MAX_MISTAKES}
        </p>

        <HangmanAscii mistakes={mistakes} />

        <div className="word">{maskedWord(secret, guessed)}</div>

        <div className="row">
          <strong>Guessed:</strong> {guessedList.join(", ")}
        </div>

        <div className="keyboard">
          {LETTERS.map((l) => (
            <button
              key={l}
              className="key"
              disabled={guessed.has(l) || status !== "playing"}
              onClick={() => guessLocal(l)}
            >
              {l}
            </button>
          ))}
        </div>

        {status !== "playing" && (
          <div className="result">
            <h2>{status === "won" ? "You Win!" : "Game Over"}</h2>
            <p>
              The word was: <strong>{secret}</strong>
            </p>
            <button className="btn primary" onClick={startSingle}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
