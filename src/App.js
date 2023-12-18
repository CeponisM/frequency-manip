import React, { useState, useEffect } from 'react';
import { ReactP5Wrapper } from 'react-p5-wrapper';
import sketch from './sketch.js';
import './App.css';

function App() {
  const [isSplit, setIsSplit] = useState(false);
  const [leftFrequency, setLeftFrequency] = useState(440);
  const [rightFrequency, setRightFrequency] = useState(440);
  const [volume, setVolume] = useState(0.5);
  const [audioContext, setAudioContext] = useState(null);
  const [oscillators, setOscillators] = useState({ left: null, right: null });
  const [gainNode, setGainNode] = useState(null);
  const [leftPanner, setLeftPanner] = useState(null);
  const [rightPanner, setRightPanner] = useState(null);
  const [leftPosition, setLeftPosition] = useState({ x: -1, y: 0, z: 0 });
  const [rightPosition, setRightPosition] = useState({ x: 1, y: 0, z: 0 });
  const [particleCount, setParticleCount] = useState(10000);

  useEffect(() => {
    try {
      const newAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      const newGainNode = newAudioContext.createGain();
      newGainNode.gain.setValueAtTime(volume, newAudioContext.currentTime);

      // Create PannerNodes regardless of the isSplit state
      const newLeftPanner = newAudioContext.createPanner();
      const newRightPanner = newAudioContext.createPanner();

      setAudioContext(newAudioContext);
      setGainNode(newGainNode);
      setLeftPanner(newLeftPanner);
      setRightPanner(newRightPanner);
    } catch (error) {
      console.error("Error initializing audio context and nodes:", error);
    }
  }, [isSplit]); // Depend on isSplit so this effect runs when isSplit changes  

  useEffect(() => {
    if (gainNode) {
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    }
  }, [volume, gainNode, audioContext]);

  const updateOscillatorFrequency = (oscillator, frequency) => {
    try {
      if (oscillator && audioContext) {
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      }
    } catch (error) {
      console.error("Error updating oscillator frequency:", error);
    }
  };

  useEffect(() => {
    updateOscillatorFrequency(oscillators.left, leftFrequency);
    updateOscillatorFrequency(oscillators.right, rightFrequency);
  }, [leftFrequency, rightFrequency, oscillators, audioContext]);

  const updatePannerPosition = (panner, position) => {
    try {
      if (panner) {
        panner.setPosition(position.x, position.y, position.z);
      }
    } catch (error) {
      console.error("Error updating panner position:", error);
    }
  };

  useEffect(() => {
    updatePannerPosition(leftPanner, leftPosition);
    updatePannerPosition(rightPanner, rightPosition);
  }, [leftPosition, rightPosition, leftPanner, rightPanner]);

  const toggleSound = () => {
    try {
      if (!audioContext || !gainNode) return;

      if (oscillators.left && oscillators.right) {
        oscillators.left.stop();
        oscillators.right.stop();
        setOscillators({ left: null, right: null });
      } else {
        const leftOscillator = audioContext.createOscillator();
        const rightOscillator = audioContext.createOscillator();

        updateOscillatorFrequency(leftOscillator, leftFrequency);
        updateOscillatorFrequency(rightOscillator, rightFrequency);

        if (leftPanner && rightPanner) {
          leftOscillator.connect(leftPanner);
          rightOscillator.connect(rightPanner);
          leftPanner.connect(gainNode);
          rightPanner.connect(gainNode);
        } else {
          console.error("Error: Panner nodes are not initialized.");
          return;
        }

        gainNode.connect(audioContext.destination);

        leftOscillator.start();
        rightOscillator.start();

        setOscillators({ left: leftOscillator, right: rightOscillator });
      }
    } catch (error) {
      console.error("Error toggling sound:", error);
    }
  };

  const handleVolumeChange = (e) => {
    setVolume(e.target.value);
  };

  // Handle position change
  const handlePositionChange = (channel, axis, value) => {
    try {
      const newPosition = parseFloat(value);
      if (channel === 'left' || !isSplit) {
        const updatedPosition = { ...leftPosition, [axis]: newPosition };
        setLeftPosition(updatedPosition);
        if (leftPanner) {
          leftPanner.setPosition(updatedPosition.x, updatedPosition.y, updatedPosition.z);
        }
      }
      if (channel === 'right' || !isSplit) {
        const updatedPosition = { ...rightPosition, [axis]: newPosition };
        setRightPosition(updatedPosition);
        if (rightPanner) {
          rightPanner.setPosition(updatedPosition.x, updatedPosition.y, updatedPosition.z);
        }
      }
    } catch (error) {
      console.error("Error handling position change:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className='options'>
          <div className={`option ${isSplit ? 'activeControl' : 'disabledControl'}`}>
            <label>
              Split?
              <input
                type="checkbox"
                checked={isSplit}
                onChange={(e) => setIsSplit(e.target.checked)}
              />
            </label>
          </div>

          <div className='option'>
            <label>
              Volume: <span>{volume}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
              />
            </label>
          </div>

          {isSplit ? (
            <>
              <div className='option'>
                <label>
                  Left Frequency: <span>{leftFrequency} hz</span>
                  <input
                    type="range"
                    min="1"
                    max="999"
                    step="0.01"
                    value={leftFrequency}
                    onChange={(e) => setLeftFrequency(e.target.value)}
                  />
                </label>
              </div>
              <div className='option'>
                <label>
                  Left Position X: <span>{leftPosition.x}</span>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.01"
                    value={leftPosition.x}
                    onChange={(e) => handlePositionChange('left', 'x', e.target.value)}
                  />
                </label>
              </div>

              <div className='option'>
                <label>
                  Right Frequency: <span>{rightFrequency} hz</span>
                  <input
                    type="range"
                    min="1"
                    max="999"
                    step="0.01"
                    value={rightFrequency}
                    onChange={(e) => setRightFrequency(e.target.value)}
                  />
                </label>
              </div>
              <div className='option'>
                <label>
                  Right Position X: <span>{rightPosition.x}</span>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.01"
                    value={rightPosition.x}
                    onChange={(e) => handlePositionChange('right', 'x', e.target.value)}
                  />
                </label>
              </div>
            </>
          ) : (
            <>
              <div className='option'>
                <label>
                  Frequency: <span>{leftFrequency} hz</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="999"
                  step="0.01"
                  value={leftFrequency}
                  onChange={(e) => {
                    setLeftFrequency(e.target.value);
                    setRightFrequency(e.target.value);
                  }}
                />
              </div>

              <div className='option'>
                <label>
                  Position X: <span>{leftPosition.x}</span>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.01"
                    value={leftPosition.x}
                    onChange={(e) => {
                      handlePositionChange('left', 'x', e.target.value);
                      handlePositionChange('right', 'x', e.target.value);
                    }}
                  />
                </label>
                <label>
                  Position Y: <span>{leftPosition.y}</span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="0.01"
                    value={leftPosition.y}
                    onChange={(e) => handlePositionChange('left', 'y', e.target.value)}
                  />
                </label>
                <label>
                  Position Z: <span>{leftPosition.z}</span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="0.01"
                    value={leftPosition.z}
                    onChange={(e) => handlePositionChange('left', 'z', e.target.value)}
                  />
                </label>
              </div>
            </>
          )}
        </div>
        <button onClick={toggleSound}>
          {oscillators.left && oscillators.right ? 'Stop Sound' : 'Play Sound'}
        </button>


        <div className='option'>
          <label>
            Particle Count: <span>{particleCount}</span>
            <input
              type="range"
              min="10"
              max="500"
              value={particleCount}
              onChange={(e) => setParticleCount(e.target.value)}
            />
          </label>
        </div>

        <ReactP5Wrapper sketch={sketch} audioData={{ leftFrequency, rightFrequency, isSplit }} />
      </header>
    </div>
  );
}

export default App;