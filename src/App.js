import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// CIA-inspired Hemi-Sync presets
const presets = {
  'Focus 3 (Basic Relaxation)': { left: 200, right: 203, third: 40 }, // 3 Hz delta
  'Focus 10 (Mind Awake, Body Asleep)': { left: 200, right: 208, third: 50 }, // 8 Hz delta
  'Focus 12 (Expanded Awareness)': { left: 300, right: 310, third: 60 }, // 10 Hz theta-alpha
  'Focus 15 (No Time)': { left: 250, right: 256, third: 45 }, // 6 Hz theta
  'Focus 21 (Other Energy Systems)': { left: 280, right: 289, third: 55 }, // 9 Hz alpha
  'Focus 27 (Creation and Healing)': { left: 260, right: 272, third: 50 }, // 12 Hz alpha-beta
  'Deep Relaxation': { left: 250, right: 254, third: 40 }, // 4 Hz delta
  'Enhanced Creativity': { left: 280, right: 288, third: 0 } // 8 Hz alpha
};

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [leftFreq, setLeftFreq] = useState(440);
  const [rightFreq, setRightFreq] = useState(440);
  const [thirdFreq, setThirdFreq] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [pinkNoise, setPinkNoise] = useState(false);
  const [visualize, setVisualize] = useState(false);
  const [preset, setPreset] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') !== 'false');
  const [audioContext, setAudioContext] = useState(null);
  const [oscillators, setOscillators] = useState({ left: null, right: null, third: null });
  const [gainNode, setGainNode] = useState(null);
  const [panners, setPanners] = useState({ left: null, right: null });
  const [noiseNode, setNoiseNode] = useState(null);
  const canvasRef = useRef(null);

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

  // Update volume with debounced smooth ramp
  const updateVolume = debounce((newVolume) => {
    if (gainNode && audioContext && audioContext.state === 'running') {
      gainNode.gain.linearRampToValueAtTime(newVolume, audioContext.currentTime + 0.1);
    }
  }, 50);

  useEffect(() => {
    updateVolume(volume);
  }, [volume, gainNode, audioContext]);

  // Update oscillator frequencies with smoothing (sine waveform)
  useEffect(() => {
    if (oscillators.left && oscillators.right && audioContext) {
      oscillators.left.frequency.linearRampToValueAtTime(leftFreq, audioContext.currentTime + 0.1);
      oscillators.right.frequency.linearRampToValueAtTime(rightFreq, audioContext.currentTime + 0.1);
      oscillators.left.type = 'sine';
      oscillators.right.type = 'sine';
      if (oscillators.third) {
        oscillators.third.frequency.linearRampToValueAtTime(thirdFreq, audioContext.currentTime + 0.1);
        oscillators.third.type = 'sine';
      }
    }
  }, [leftFreq, rightFreq, thirdFreq, oscillators, audioContext]);

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
        data[i] *= 0.1;
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

  // Canvas visualization (wave-like representation)
  useEffect(() => {
    if (!visualize || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    let animationFrame;

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);

      // Draw left wave (blue)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 0, 255, 0.7)';
      for (let x = 0; x < width; x++) {
        const t = (x / width) * 2 * Math.PI - (time * 0.001 * leftFreq) / 3;
        const y = Math.sin(t) * 20 + height / 4;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw right wave (red)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      for (let x = 0; x < width; x++) {
        const t = (x / width) * 2 * Math.PI - (time * 0.001 * rightFreq) / 3;
        const y = Math.sin(t) * 20 + height / 2;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw binaural beat wave (green, interaction)
      const beatFreq = Math.abs(leftFreq - rightFreq);
      if (beatFreq > 0) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.9)';
        for (let x = 0; x < width; x++) {
          const t = (x / width) * 2 * Math.PI - (time * 0.001 * beatFreq) / 3;
          const leftY = Math.sin((x / width) * 2 * Math.PI - (time * 0.001 * leftFreq) / 100);
          const rightY = Math.sin((x / width) * 2 * Math.PI - (time * 0.001 * rightFreq) / 100);
          const y = (leftY + rightY) * 15 + (3 * height) / 4; // Interaction effect
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationFrame = requestAnimationFrame(draw);
    };

    if (visualize) {
      animationFrame = requestAnimationFrame(draw);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [visualize, leftFreq, rightFreq]);

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
      audioContext.suspend();
    } else {
      audioContext.resume();
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
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Calculate binaural beat frequency and brainwave state
  const beatFreq = Math.abs(leftFreq - rightFreq).toFixed(2);
  const brainwaveState = beatFreq < 4 ? 'Delta (deep sleep, relaxation)' :
                        beatFreq < 8 ? 'Theta (meditation, intuition)' :
                        beatFreq < 13 ? 'Alpha (calm focus, creativity)' :
                        'Beta (alertness, concentration)';

  return (
    <div className={`App ${darkMode ? 'dark' : 'light'}`}>
      <header className="App-header">
        <h1>Hemi-Sync Audio</h1>
        <button className="theme-toggle" onClick={toggleDarkMode} aria-label="Toggle theme">
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
        <div className="controls">
          <label>
            Preset:
            <select value={preset} onChange={handlePresetChange} aria-label="Select preset">
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
              aria-label="Left frequency"
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
              aria-label="Right frequency"
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
              aria-label="Carrier frequency"
            /> Hz (0 to disable)
          </label>
          <label>
            Pink Noise:
            <input
              type="checkbox"
              checked={pinkNoise}
              onChange={(e) => setPinkNoise(e.target.checked)}
              aria-label="Enable pink noise"
            />
          </label>
          <label>
            Visualize Hemi-Sync:
            <input
              type="checkbox"
              checked={visualize}
              onChange={(e) => setVisualize(e.target.checked)}
              aria-label="Enable visualization"
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
              aria-label="Volume"
            />
          </label>
          <div className="beat-info" title={`Binaural beat frequency (${beatFreq} Hz) induces ${brainwaveState}`}>
            Binaural Beat: {beatFreq} Hz
          </div>
          <button onClick={toggleSound} aria-label={isPlaying ? 'Stop audio' : 'Play audio'}>
            {isPlaying ? 'Stop' : 'Play'}
          </button>
          {visualize && (
            <canvas ref={canvasRef} width="300" height="150" className="visualizer" />
          )}
        </div>
      </header>
    </div>
  );
}

export default App;