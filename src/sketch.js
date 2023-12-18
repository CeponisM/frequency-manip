class Particle {
  constructor(p, x, y) {
    this.p = p;
    this.position = p.createVector(x, y);
    this.velocity = p.createVector(p.random(-2, 2), p.random(-2, 2));
    this.size = 5;
  }

  oscillate(audioData) {
    console.log(audioData)
    if (audioData) {
      let frequency = audioData.leftFrequency + audioData.rightFrequency;
      
      // Increase the impact of the frequency on the amplitude
      // The multiplier here might need to be adjusted based on your frequency data range
      let amp = Math.sin(this.p.millis() * 0.001 * frequency) * 0.5;
  
      // Add this amplitude to the velocity for more noticeable movement
      this.velocity.add(amp, amp);
  
      // Update position
      this.position.add(this.velocity);
      
      // Optionally, you can also make particles bounce off the edges
      this.edges();
      console.log("Frequency:", frequency, "Amplitude:", amp);

    }
  }  

  display() {
    this.p.fill(200, 100, 100);
    this.p.noStroke();
    this.p.ellipse(this.position.x, this.position.y, this.size, this.size);
  }

  edges() {
    if (this.position.x > this.p.width || this.position.x < 0) {
      this.velocity.x *= -1;
    }
    if (this.position.y > this.p.height || this.position.y < 0) {
      this.velocity.y *= -1;
    }
  }
}

// Define the sketch function
export default function sketch(p) {
  let particles = [];
  let particleCount = 1000; // Adjust particle count for performance

  p.setup = () => {
    p.createCanvas(600, 400);
    p.audioData = { leftFrequency: 0, rightFrequency: 0, isSplit: false };
    initParticles(particleCount);
  };

  function initParticles(count) {
    particles = [];
    let cols = Math.floor(p.width / 10);  // Adjust grid size
    let rows = Math.floor(p.height / 10);
    for (let i = 0; i < count; i++) {
      let x = (i % cols) * 10;
      let y = Math.floor(i / cols) * 10;
      particles.push(new Particle(p, x, y));
    }
  }

  p.draw = () => {
    p.background(255);
    particles.forEach(particle => {
      particle.oscillate(p.audioData);
      particle.display();
    });
  };

  p.myCustomRedrawAccordingToNewPropsHandler = (props) => {
    if (props.audioData) {
      p.audioData = props.audioData;
    }
    if (props.particleCount !== undefined && props.particleCount !== particleCount) {
      particleCount = props.particleCount;
      initParticles(particleCount);
    }
  };
}