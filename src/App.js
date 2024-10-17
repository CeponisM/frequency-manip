import React, { useState, useEffect } from 'react';
import './App.css';

// CIA-inspired Hemi-Sync presets based on Monroe Institute (Focus 10, Focus 12, etc.)
const presets = {
  'Focus 10 (Mind Awake, Body Asleep)': { left: 200, right: 208, diff: 8 }, // Delta (4-8 Hz) for cerebellum, low beta for cortex
  'Focus 12 (Expanded Awareness)': { left: 300, right: 310, diff: 10 }, // Theta-alpha transition
  'Deep Relaxation': { left: 250, right: 254, diff: 4 }, // Delta for sleep
  'Enhanced Creativity': { left: 280, right: 288, diff: 8 } // Alpha for creativity
};

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [leftFreq, setLeftFreq] = useState(440);
  const [rightFreq, setRightFreq] = useState(440);
  const [volume, setVolume] = useState(0.5);
  const [preset, setPreset] = useState('');
  const [audioContext, setAudioContext] = useState(null);
  const [oscillators, setOscillators] = useState({ left: null, right: null });
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
    }
  }, [leftFreq, rightFreq, oscillators, audioContext]);

  // Toggle sound
  const toggleSound = () => {
    if (!audioContext || !gainNode || !panners.left || !panners.right) return;

    if (isPlaying) {
      oscillators.left?.stop();
      oscillators.right?.stop();
      setOscillators({ left: null, right: null });
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
      gainNode.connect(audioContext.destination);

      leftOsc.start();
      rightOsc.start();
      setOscillators({ left: leftOsc, right: rightOsc });
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
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Hemi-Sync Audio</h1>
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