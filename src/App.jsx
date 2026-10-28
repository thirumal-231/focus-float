import { useEffect, useRef, useState } from "react";
import "./App.css";

// const DURATIONS = {
//   focus: 5,
//   break: 3,
//   longBreak: 4,
// };
const DURATIONS = {
  focus: 25 * 60,
  break: 5 * 60,
  longBreak: 15 * 60,
};

const SESSIONS_BEFORE_LONG_BREAK = 4;
// [frequency Hz, start offset s, duration s]
const sounds = {
  focusEnd: new Audio("/sounds/focus-end.mp3"),
  breakEnd: new Audio("/sounds/break-end.mp3"),
};

function playSound(name) {
  const audio = sounds[name];
  audio.currentTime = 0;
  audio.volume = 1;
  audio.play().catch(console.error);
}

export default function App() {
  const [mode, setMode] = useState("focus");
  const [seconds, setSeconds] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState(null);
  const [sessions, setSessions] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!running || deadline === null) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);

      if (remaining > 0) return;

      // Timer finished: play sound, then start the next phase automatically
      let nextMode;
      if (mode === "focus") {
        playSound("focusEnd");
        const count = sessions + 1;
        setSessions(count);
        nextMode =
          count % SESSIONS_BEFORE_LONG_BREAK === 0 ? "longBreak" : "break";
      } else {
        playSound("breakEnd");
        nextMode = "focus";
      }

      setMode(nextMode);
      setSeconds(DURATIONS[nextMode]);
      setDeadline(Date.now() + DURATIONS[nextMode] * 1000);
    };

    tick();
    const intervalId = setInterval(tick, 250);

    return () => clearInterval(intervalId);
  }, [running, deadline, mode, sessions]);

  function startOrResume() {
    if (seconds === 0) return;

    setDeadline(Date.now() + seconds * 1000);
    setRunning(true);
  }

  function pause() {
    if (deadline !== null) {
      setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }

    setRunning(false);
    setDeadline(null);
  }

  function reset() {
    setRunning(false);
    setDeadline(null);
    setSeconds(DURATIONS[mode]);
  }

  function switchMode(nextMode) {
    setRunning(false);
    setDeadline(null);
    setMode(nextMode);
    setSeconds(DURATIONS[nextMode]);
  }

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const isBreak = mode !== "focus";

  const label =
    mode === "focus"
      ? "TIME TO FOCUS"
      : mode === "longBreak"
        ? "LONG BREAK"
        : "TAKE A BREATHER";

  const status = running
    ? mode === "focus"
      ? `Session ${(sessions % SESSIONS_BEFORE_LONG_BREAK) + 1} of ${SESSIONS_BEFORE_LONG_BREAK}`
      : "Relax and recharge."
    : "Ready when you are.";

  return (
    <main className="panel" data-tauri-drag-region>
      <header data-tauri-drag-region>FOCUS FLOAT</header>

      <nav>
        <button
          className={mode === "focus" ? "active" : ""}
          onClick={() => switchMode("focus")}
        >
          Focus
        </button>

        <button
          className={isBreak ? "active" : ""}
          onClick={() => switchMode("break")}
        >
          Break
        </button>
      </nav>

      <p className="session-label" data-tauri-drag-region>
        {label}
      </p>

      <h1 data-tauri-drag-region>
        {minutes}:{secs}
      </h1>

      <div className="controls">
        <button className="start" onClick={running ? pause : startOrResume}>
          {running
            ? "Pause"
            : seconds < DURATIONS[mode] && seconds > 0
              ? "Resume"
              : "Start"}
        </button>

        <button onClick={reset}>Reset</button>
      </div>

      <p className="status" data-tauri-drag-region>
        {status}
      </p>
    </main>
  );
}
