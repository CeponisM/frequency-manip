import React, { useState, useEffect } from 'react';
import './App.css';

// CIA-inspired Hemi-Sync presets with third frequency
const presets = {
  'Focus 10 (Mind Awake, Body Asleep)': { left: 200, right: 208, third: 50, waveform: 'sine' }, // 8 Hz delta
  'Focus 12 (Expanded Awareness)': { left: 300, right: 310, third: 60, waveform: 'triangle' }, // 10 Hz theta-alpha
  'Deep Relaxation': { left: 250, right: 254, third: 40, waveform: 'sine' }, // 4 Hz delta
  'Enhanced Creativity': { left: 280, right: 288, third: 0, waveform: 'triangle' } // 8 Hz alpha
};

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [leftFreq, setLeftFreq] = useState(440);
  const [rightFreq, setRightFreq] = useState(440);
  const [thirdFreq, setThirdFreq] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [waveform, setWaveform] = useState('sine');
  const [pinkNoise, setPinkNoise] = useState(false);
  const [preset, setPreset] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') !== 'false');
  const [audioContext, setAudioContext] = useState(null);
  const [oscillators, setOscillators] = useState({ left: null, right: null, third: null });
  const [gainNode, setGainNode] = useState(null);
  const [panners, setPanners] = useState({ left: null, right: null });
  const [noiseNode, setNoiseNode] = useState(null);

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

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Update volume with smooth ramp
  useEffect(() => {
    if (gainNode && audioContext) {
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.05);
    }
  }, [volume, gainNode, audioContext]);

  // Update oscillator frequencies and waveform
  useEffect(() => {
    if (oscillators.left && oscillators.right && audioContext) {
      oscillators.left.frequency.linearRampToValueAtTime(leftFreq, audioContext.currentTime + 0.05);
      oscillators.right.frequency.linearRampToValueAtTime(rightFreq, audioContext.currentTime + 0.05);
      oscillators.left.type = waveform;
      oscillators.right.type = waveform;
      if (oscillators.third) {
        oscillators.third.frequency.linearRampToValueAtTime(thirdFreq, audioContext.currentTime + 0.05);
        oscillators.third.type = waveform;
      }
    }
  }, [leftFreq, rightFreq, thirdFreq, waveform, oscillators, audioContext]);

  // Handle pink noise
  useEffect(() => {
    if (!audioContext || !gainNode) return;
    if (pinkNoise && !noiseNode) {
      const bufferSize = 2 * audioContext.sampleRate;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 0.1; // Lower amplitude for background
      }
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainNode);
      source.start();
      setNoiseNode(source);
    } else if (!pinkNoise && noiseNode) {
      noiseNode.stop();
      setNoiseNode(null);
    }
  }, [pinkNoise, audioContext, gainNode, noiseNode]);

  // Toggle sound
  const toggleSound = () => {
    if (!audioContext || !gainNode || !panners.left || !panners.right) return;

    if (isPlaying) {
      oscillators.left?.stop();
      oscillators.right?.stop();
      oscillators.third?.stop();
      noiseNode?.stop();
      setOscillators({ left: null, right: null, third: null });
      setNoiseNode(null);
      setIsPlaying(false);
    } else {
      const leftOsc = audioContext.createOscillator();
      const rightOsc = audioContext.createOscillator();
      leftOsc.type = rightOsc.type = waveform;
      leftOsc.frequency.setValueAtTime(leftFreq, audioContext.currentTime);
      rightOsc.frequency.setValueAtTime(rightFreq, audioContext.currentTime);

      leftOsc.connect(panners.left);
      rightOsc.connect(panners.right);
      panners.left.connect(gainNode);
      panners.right.connect(gainNode);

      let thirdOsc = null;
      if (thirdFreq > 0) {
        thirdOsc = audioContext.createOscillator();
        thirdOsc.type = waveform;
        thirdOsc.frequency.setValueAtTime(thirdFreq, audioContext.currentTime);
        thirdOsc.connect(gainNode);
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
      setWaveform(presets[selected].waveform);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Calculate binaural beat frequency
  const beatFreq = Math.abs(leftFreq - rightFreq).toFixed(2);

  return (
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      <header className="App-header">
        <h1>Hemi-Sync Audio</h1>
        <button onClick={toggleDarkMode}>
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
            Waveform:
            <select value={waveform} onChange={(e) => setWaveform(e.target.value)}>
              <option value="sine">Sine</option>
              <option value="triangle">Triangle</option>
              <option value="square">Square</option>
            </select>
          </label>
          <label>
            Pink Noise:
            <input
              type="checkbox"
              checked={pinkNoise}
              onChange={(e) => setPinkNoise(e.target.checked)}
            />
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
          <p>Binaural Beat: {beatFreq} Hz</p>
          <button onClick={toggleSound}>{isPlaying ? 'Stop' : 'Play'}</button>
        </div>
      </header>
    </div>
  );
}

export default App;