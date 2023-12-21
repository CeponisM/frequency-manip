import React, { useState, useEffect } from 'react';
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
  const [reversalExtent, setReversalExtent] = useState(0); // Range from -1 to 1
  const [reversedLeftPosition, setReversedLeftPosition] = useState({ x: 0, y: 0, z: 0 });
  const [reversedRightPosition, setReversedRightPosition] = useState({ x: 0, y: 0, z: 0 });
  const [targetReversedLeftPosition, setTargetReversedLeftPosition] = useState({ x: 0, y: 0, z: 0 });
  const [targetReversedRightPosition, setTargetReversedRightPosition] = useState({ x: 0, y: 0, z: 0 });
  const [isAutomated, setIsAutomated] = useState(false);
  const [automationInterval, setAutomationInterval] = useState(100); // In milliseconds, adjust as needed

  const lerp = (start, end, amt) => {
    return (1 - amt) * start + amt * end;
  };

  useEffect(() => {
    let animationFrameId;

    const animate = () => {
      // Interpolate current reversed positions towards target positions
      setReversedLeftPosition(prev => ({
        x: lerp(prev.x, targetReversedLeftPosition.x, automationInterval),
      }));
      setReversedRightPosition(prev => ({
        x: lerp(prev.x, targetReversedRightPosition.x, automationInterval),
      }));
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrameId);
  }, [targetReversedLeftPosition, targetReversedRightPosition]);

  useEffect(() => {
    try {
      const newAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      const newGainNode = newAudioContext.createGain();
      newGainNode.gain.setValueAtTime(volume, newAudioContext.currentTime);

      // Create PannerNodes regardless of the isSplit state
      const newLeftPanner = newAudioContext.createPanner();
      const newRightPanner = newAudioContext.createPanner();

      // Set the panning model to HRTF for 3D spatial audio
      newLeftPanner.panningModel = 'HRTF';
      newRightPanner.panningModel = 'HRTF';

      // Set the distance model to linear for linear decrease in volume with distance
      newLeftPanner.distanceModel = 'linear';
      newLeftPanner.distanceModel = 'linear';

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

  const updatePannerPosition = (panner, newPosition) => {
    const rampDuration = 0.1; // Duration of the transition in seconds
  
    if (panner && audioContext && audioContext.state === 'running') {
      try {
        panner.positionX.linearRampToValueAtTime(newPosition.x, audioContext.currentTime + rampDuration);
        panner.positionY.linearRampToValueAtTime(newPosition.y, audioContext.currentTime + rampDuration);
        panner.positionZ.linearRampToValueAtTime(newPosition.z, audioContext.currentTime + rampDuration);
      } catch (error) {
        console.error("Error updating panner position:", error);
      }
    }
  };

  useEffect(() => {
    updatePannerPosition(leftPanner, reversedLeftPosition);
    updatePannerPosition(rightPanner, reversedRightPosition);
  }, [reversedLeftPosition, reversedRightPosition, leftPanner, rightPanner]);

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

        if (audioContext && leftPanner && rightPanner) {
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

  useEffect(() => {
    const targetReversedLeft = {
      x: leftPosition.x * reversalExtent,
      y: leftPosition.y * reversalExtent,
      z: leftPosition.z * reversalExtent
    };
    const targetReversedRight = {
      x: rightPosition.x * reversalExtent,
      y: rightPosition.y * reversalExtent,
      z: rightPosition.z * reversalExtent
    };

    // Store these target positions for the animation loop
    setTargetReversedLeftPosition(targetReversedLeft);
    setTargetReversedRightPosition(targetReversedRight);
  }, [reversalExtent, leftPosition, rightPosition]);

  useEffect(() => {
    let intervalId;
    let direction = 0.1; // Direction and step size combined
  
    if (isAutomated) {
      intervalId = setInterval(() => {
        setReversalExtent(prevExtent => {
          // Calculate the new extent
          let newExtent = prevExtent + direction;
  
          // Check and handle bounds
          if (newExtent > 1) {
            newExtent = 1;
            direction = -0.1; // Reverse direction
          } else if (newExtent < -1) {
            newExtent = -1;
            direction = 0.1; // Reverse direction
          }
  
          return newExtent;
        });
      }, automationInterval / 10); // Adjust for a smooth transition
    }
  
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutomated, automationInterval]);  
  
  useEffect(() => {
    updatePannerPosition(leftPanner, leftPosition);
  }, [leftPosition, leftPanner]);
  
  useEffect(() => {
    updatePannerPosition(rightPanner, rightPosition);
  }, [rightPosition, rightPanner]);

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
                  Left Frequency: <span>
                    <input
                      min="1"
                      max="999"
                      step="0.01"
                      value={leftFrequency}
                      onChange={(e) => setLeftFrequency(e.target.value)}
                    />hz
                  </span>
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
                  Right Frequency: <span>
                    <input
                      min="1"
                      max="999"
                      step="0.01"
                      value={rightFrequency}
                      onChange={(e) => setRightFrequency(e.target.value)}
                    />hz
                  </span>
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

              <div className='option'>
                <label>
                  Reversal Extent: <span>{reversalExtent}</span>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={reversalExtent}
                    onChange={(e) => setReversalExtent(e.target.value)}
                  />
                </label>
              </div>

              <div className='option'>
                <label>
                  Automate Reversal:
                  <input
                    type="checkbox"
                    checked={isAutomated}
                    onChange={(e) => setIsAutomated(e.target.checked)}
                  />
                </label>
              </div>

              <div className='option'>
                <label>
                  Automation Interval (ms):
                  <input
                    type="range"
                    min="1"
                    max="999"
                    step="1"
                    value={automationInterval}
                    onChange={(e) => setAutomationInterval(e.target.value)}
                  />
                  <span>{automationInterval} ms</span>
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
      </header>
    </div>
  );
}

export default App;