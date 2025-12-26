import { useMemo, useState } from "react";
import "./App.css";

const MAX_MISTAKES = 6;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const WORDS = [
  "HANGMAN",
  "SOFTWARE",
  "MOBILE APP",
  "ENGINEERING",
  "DEBUGGING",
  "REACT",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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

export default function App() {
  const [screen, setScreen] = useState("menu");
  const [secret, setSecret] = useState("");
  const [guessed, setGuessed] = useState(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [status, setStatus] = useState("playing");

  const guessedList = useMemo(() => [...guessed].sort(), [guessed]);

  function startSingle() {
    setSecret(pickRandom(WORDS));
    setGuessed(new Set());
    setMistakes(0);
    setStatus("playing");
    setScreen("game");
  }

  function guess(letter) {
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

  if (screen === "menu") {
    return (
      <div className="container">
        <h1>Hangman</h1>
        <div className="card">
          <button className="btn primary full" onClick={startSingle}>
            Start Game
          </button>
          <p className="hint">
            Guess letters before the hangman is complete.
          </p>
        </div>
      </div>
    );
  }

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
              onClick={() => guess(l)}
            >
              {l}
            </button>
          ))}
        </div>

        {status !== "playing" && (
          <div className="result">
            <h2>{status === "won" ? "You Win!" : "Game Over"}</h2>
            <p>The word was: <strong>{secret}</strong></p>
            <button className="btn primary" onClick={startSingle}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
