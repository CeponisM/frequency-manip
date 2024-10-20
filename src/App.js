import React, { useState, useEffect } from 'react';
import './App.css';

// CIA-inspired Hemi-Sync presets with optional third frequency
const presets = {
  'Focus 10 (Mind Awake, Body Asleep)': { left: 200, right: 208, third: 50 }, // 8 Hz delta + low carrier
  'Focus 12 (Expanded Awareness)': { left: 300, right: 310, third: 60 }, // 10 Hz theta-alpha + carrier
  'Deep Relaxation': { left: 250, right: 254, third: 40 }, // 4 Hz delta + carrier
  'Enhanced Creativity': { left: 280, right: 288, third: 0 } // 8 Hz alpha, no carrier
};

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [leftFreq, setLeftFreq] = useState(440);
  const [rightFreq, setRightFreq] = useState(440);
  const [thirdFreq, setThirdFreq] = useState(0); // 0 means disabled
  const [volume, setVolume] = useState(0.5);
  const [preset, setPreset] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [audioContext, setAudioContext] = useState(null);
  const [oscillators, setOscillators] = useState({ left: null, right: null, third: null });
  const [gainNode, setGainNode] = useState(null);
  const [panners, setPanners] = useState({ left: null, right: null });

  // Initialize AudioContext and nodes
  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    const leftPanner = ctx.createPanner();
    const rightPanner = ctx.createPanner();
    leftPanner.panningModel = rightPanner.panningModel = 'HRTF';
    leftPanner.distanceModel = rightPanner.distanceModel = 'linear';
    leftPanner.positionX.setValueAtTime(-1, ctx.currentTime);
    rightPanner.positionX.setValueAtTime(1, ctx.currentTime);

    setAudioContext(ctx);
    setGainNode(gain);
    setPanners({ left: leftPanner, right: rightPanner });

    return () => ctx.close();
  }, []);

  // Update volume
  useEffect(() => {
    if (gainNode && audioContext) {
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    }
  }, [volume, gainNode, audioContext]);

  // Update oscillator frequencies
  useEffect(() => {
    if (oscillators.left && oscillators.right && audioContext) {
      oscillators.left.frequency.setValueAtTime(leftFreq, audioContext.currentTime);
      oscillators.right.frequency.setValueAtTime(rightFreq, audioContext.currentTime);
      if (oscillators.third) {
        oscillators.third.frequency.setValueAtTime(thirdFreq, audioContext.currentTime);
      }
    }
  }, [leftFreq, rightFreq, thirdFreq, oscillators, audioContext]);

  // Toggle sound
  const toggleSound = () => {
    if (!audioContext || !gainNode || !panners.left || !panners.right) return;

    if (isPlaying) {
      oscillators.left?.stop();
      oscillators.right?.stop();
      oscillators.third?.stop();
      setOscillators({ left: null, right: null, third: null });
      setIsPlaying(false);
    } else {
      const leftOsc = audioContext.createOscillator();
      const rightOsc = audioContext.createOscillator();
      leftOsc.type = rightOsc.type = 'sine';
      leftOsc.frequency.setValueAtTime(leftFreq, audioContext.currentTime);
      rightOsc.frequency.setValueAtTime(rightFreq, audioContext.currentTime);

      leftOsc.connect(panners.left);
      rightOsc.connect(panners.right);
      panners.left.connect(gainNode);
      panners.right.connect(gainNode);

      let thirdOsc = null;
      if (thirdFreq > 0) {
        thirdOsc = audioContext.createOscillator();
        thirdOsc.type = 'sine';
        thirdOsc.frequency.setValueAtTime(thirdFreq, audioContext.currentTime);
        thirdOsc.connect(gainNode); // Center channel for carrier
      }

      gainNode.connect(audioContext.destination);

      leftOsc.start();
      rightOsc.start();
      thirdOsc?.start();
      setOscillators({ left: leftOsc, right: rightOsc, third: thirdOsc });
      setIsPlaying(true);
    }
  };

  // Handle preset selection
  const handlePresetChange = (e) => {
    const selected = e.target.value;
    setPreset(selected);
    if (selected && presets[selected]) {
      setLeftFreq(presets[selected].left);
      setRightFreq(presets[selected].right);
      setThirdFreq(presets[selected].third);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      <header className="App-header">
        <h1>Hemi-Sync Audio</h1>
        <button onClick={toggleDarkMode} style={{marginBottom: "37px"}}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <div className="controls">
          <label>
            Preset:
            <select value={preset} onChange={handlePresetChange}>
              <option value="">Custom</option>
              {Object.keys(presets).map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </label>
          <label>
            Left Frequency: <input
              type="number"
              min="1"
              max="999"
              step="0.01"
              value={leftFreq}
              onChange={(e) => setLeftFreq(Number(e.target.value))}
            /> Hz
          </label>
          <label>
            Right Frequency: <input
              type="number"
              min="1"
              max="999"
              step="0.01"
              value={rightFreq}
              onChange={(e) => setRightFreq(Number(e.target.value))}
            /> Hz
          </label>
          <label>
            Carrier Frequency: <input
              type="number"
              min="0"
              max="200"
              step="0.01"
              value={thirdFreq}
              onChange={(e) => setThirdFreq(Number(e.target.value))}
            /> Hz (0 to disable)
          </label>
          <label>
            Volume: <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>
          <button onClick={toggleSound}>{isPlaying ? 'Stop' : 'Play'}</button>
        </div>
      </header>
    </div>
  );
}

export default App;