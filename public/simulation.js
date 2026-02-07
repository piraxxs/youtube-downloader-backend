const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

const controls = {
  ballCount: document.getElementById('ballCount'),
  spawnInterval: document.getElementById('spawnInterval'),
  circleCount: document.getElementById('circleCount'),
  shrinkRate: document.getElementById('shrinkRate'),
  holeSize: document.getElementById('holeSize'),
  baseSpeed: document.getElementById('baseSpeed'),
  gravity: document.getElementById('gravity'),
  minSpeed: document.getElementById('minSpeed')
};

const state = {
  running: false,
  balls: [],
  circles: [],
  lastTime: 0,
  spawnTimer: 0
};

const center = {
  x: canvas.width / 2,
  y: canvas.height / 2
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function createBall() {
  const angle = rand(0, Math.PI * 2);
  const speed = Number(controls.baseSpeed.value);
  return {
    x: center.x,
    y: center.y,
    radius: 10,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    color: '#ffffff'
  };
}

function initCircles() {
  const count = Number(controls.circleCount.value);
  const maxRadius = canvas.width * 0.42;
  const step = maxRadius / count;
  state.circles = Array.from({ length: count }, (_, index) => ({
    radius: maxRadius - index * step,
    baseRadius: maxRadius - index * step
  }));
}

function resetScene() {
  state.balls = [];
  initCircles();
  const count = Number(controls.ballCount.value);
  for (let i = 0; i < count; i += 1) {
    state.balls.push(createBall());
  }
}

function applyGravity(ball, dt) {
  const gravity = Number(controls.gravity.value);
  ball.vy += gravity * dt;
}

function keepMinSpeed(ball) {
  const minSpeed = Number(controls.minSpeed.value);
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed < minSpeed) {
    const factor = minSpeed / (speed || 1);
    ball.vx *= factor;
    ball.vy *= factor;
  }
}

function handleCollisions(ball) {
  const holeAngle = (Number(controls.holeSize.value) * Math.PI) / 180;
  const holeStart = -holeAngle / 2;
  const holeEnd = holeAngle / 2;

  state.circles.forEach((circle) => {
    const dx = ball.x - center.x;
    const dy = ball.y - center.y;
    const distance = Math.hypot(dx, dy);
    const collisionDistance = circle.radius - ball.radius;

    if (distance >= collisionDistance) {
      const angle = Math.atan2(dy, dx);
      const withinHole = holeAngle > 0 && angle >= holeStart && angle <= holeEnd;
      if (withinHole) {
        return;
      }
      const nx = dx / distance;
      const ny = dy / distance;
      const dot = ball.vx * nx + ball.vy * ny;
      ball.vx -= 2 * dot * nx;
      ball.vy -= 2 * dot * ny;
      ball.x = center.x + nx * collisionDistance;
      ball.y = center.y + ny * collisionDistance;
    }
  });
}

function updateCircles(dt) {
  const shrinkRate = Number(controls.shrinkRate.value);
  if (shrinkRate <= 0) {
    return;
  }
  state.circles.forEach((circle) => {
    circle.radius = Math.max(60, circle.radius - shrinkRate * dt);
  });
}

function updateBalls(dt) {
  state.balls.forEach((ball) => {
    applyGravity(ball, dt);
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    handleCollisions(ball);
    keepMinSpeed(ball);
  });
}

function spawnBalls(dt) {
  const interval = Number(controls.spawnInterval.value);
  if (!interval || interval <= 0) {
    return;
  }
  state.spawnTimer += dt;
  if (state.spawnTimer >= interval) {
    state.spawnTimer = 0;
    state.balls.push(createBall());
  }
}

function drawCircles() {
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  const holeAngle = (Number(controls.holeSize.value) * Math.PI) / 180;
  state.circles.forEach((circle) => {
    ctx.beginPath();
    if (holeAngle > 0) {
      ctx.arc(center.x, center.y, circle.radius, holeAngle / 2, Math.PI * 2 - holeAngle / 2);
    } else {
      ctx.arc(center.x, center.y, circle.radius, 0, Math.PI * 2);
    }
    ctx.stroke();
  });
}

function drawBalls() {
  state.balls.forEach((ball) => {
    ctx.beginPath();
    ctx.fillStyle = ball.color;
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function render() {
  ctx.fillStyle = '#0c0c0c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawCircles();
  drawBalls();
}

function tick(timestamp) {
  if (!state.running) {
    return;
  }
  const dt = Math.min((timestamp - state.lastTime) / 1000, 0.033) || 0.016;
  state.lastTime = timestamp;

  updateCircles(dt);
  spawnBalls(dt);
  updateBalls(dt);
  render();

  requestAnimationFrame(tick);
}

function start() {
  if (state.running) {
    return;
  }
  state.running = true;
  state.lastTime = performance.now();
  requestAnimationFrame(tick);
}

function stop() {
  state.running = false;
}

function reset() {
  stop();
  state.spawnTimer = 0;
  resetScene();
  render();
}

resetScene();
render();

document.getElementById('start').addEventListener('click', start);
document.getElementById('stop').addEventListener('click', stop);
document.getElementById('reset').addEventListener('click', reset);

Object.values(controls).forEach((input) => {
  input.addEventListener('change', () => {
    resetScene();
    render();
  });
});
