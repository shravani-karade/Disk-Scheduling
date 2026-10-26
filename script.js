let currentMode = 'compare';
let currentVisual = 'platter'; // 'platter' or 'road'
let animTimer = null;

// Routing Functions
function selectMode(mode) {
  currentMode = mode;
  document.getElementById('homePage').classList.remove('active');
  document.getElementById('simPage').classList.add('active');

  const scanCard = document.getElementById('scanCard');
  const cscanCard = document.getElementById('cscanCard');
  const navTitle = document.getElementById('navTitle');

  if (mode === 'scan') {
    scanCard.style.display = 'flex';
    cscanCard.style.display = 'none';
    navTitle.innerText = "SCAN (Elevator Algorithm)";
  } else if (mode === 'cscan') {
    scanCard.style.display = 'none';
    cscanCard.style.display = 'flex';
    navTitle.innerText = "C-SCAN (Circular Algorithm)";
  } else {
    scanCard.style.display = 'flex';
    cscanCard.style.display = 'flex';
    navTitle.innerText = "SCAN vs C-SCAN Race Mode";
  }

  resetUI();
}

function goHome() {
  if (animTimer) clearInterval(animTimer);
  document.getElementById('simPage').classList.remove('active');
  document.getElementById('homePage').classList.add('active');
}

function switchVisualView(view) {
  currentVisual = view;
  document.getElementById('btnPlatterView').classList.toggle('active', view === 'platter');
  document.getElementById('btnRoadView').classList.toggle('active', view === 'road');

  const platterViews = document.querySelectorAll('.platter-view');
  const roadViews = document.querySelectorAll('.road-view');

  if (view === 'platter') {
    platterViews.forEach(el => el.classList.remove('hidden'));
    roadViews.forEach(el => el.classList.add('hidden'));
  } else {
    platterViews.forEach(el => el.classList.add('hidden'));
    roadViews.forEach(el => el.classList.remove('hidden'));
  }
}

function loadPreset(reqs, start) {
  document.getElementById('requests').value = reqs.join(', ');
  document.getElementById('startHead').value = start;
  resetUI();
}

function resetUI() {
  document.getElementById('scanDist').innerText = '0';
  document.getElementById('cscanDist').innerText = '0';
  document.getElementById('scanStatus').innerText = 'Ready to run...';
  document.getElementById('cscanStatus').innerText = 'Ready to run...';
  document.getElementById('winnerText').innerHTML = 'Press <strong>Start Race</strong> to run the interactive disk animation!';
}

// SCAN Algorithm
function solveSCAN(reqs, head, dir, max = 199) {
  let left = reqs.filter(r => r < head).sort((a, b) => a - b);
  let right = reqs.filter(r => r > head).sort((a, b) => a - b);
  let path = [head];
  let dist = 0;
  let curr = head;

  if (dir === 'right') {
    for (let r of right) 
      { 
        path.push(r); 
        dist += Math.abs(r - curr); 
        curr = r; 
      }
    if (left.length > 0 && curr !== max) 
      { path.push(max); 
        dist += Math.abs(max - curr); 
        curr = max; }
    for (let i = left.length - 1; i >= 0; i--) 
      { path.push(left[i]); 
        dist += Math.abs(left[i] - curr); 
        curr = left[i]; 
      }
  } 
  else {
    for (let i = left.length - 1; i >= 0; i--)
       { path.push(left[i]);
         dist += Math.abs(left[i] - curr);
          curr = left[i]; }
    if (right.length > 0 && curr !== 0) 
      { path.push(0);
         dist += Math.abs(0 - curr);
          curr = 0; }
    for (let r of right)
       { path.push(r);
         dist += Math.abs(r - curr);
        curr = r; }
  }
  return { path, dist };
}

// C-SCAN Algorithm
function solveCSCAN(reqs, head, dir, max = 199) {
  let left = reqs.filter(r => r < head).sort((a, b) => a - b);
  let right = reqs.filter(r => r > head).sort((a, b) => a - b);
  let path = [head];
  let dist = 0;
  let curr = head;

  if (dir === 'right') {
    for (let r of right) { path.push(r); dist += Math.abs(r - curr); curr = r; }
    if (curr !== max) { path.push(max); dist += Math.abs(max - curr); curr = max; }
    path.push(0); dist += max; curr = 0;
    for (let r of left) { path.push(r); dist += Math.abs(r - curr); curr = r; }
  } else {
    for (let i = left.length - 1; i >= 0; i--) { path.push(left[i]); dist += Math.abs(left[i] - curr); curr = left[i]; }
    if (curr !== 0) { path.push(0); dist += Math.abs(0 - curr); curr = 0; }
    path.push(max); dist += max; curr = max;
    for (let i = right.length - 1; i >= 0; i--) { path.push(right[i]); dist += Math.abs(right[i] - curr); curr = right[i]; }
  }
  return { path, dist };
}

// Render Disk Pins on Platter
function renderPlatterPins(containerId, reqs) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  reqs.forEach(r => {
    const angle = (r / 199) * 330 - 165;
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * 90;
    const y = Math.sin(rad) * 90;

    const pin = document.createElement('div');
    pin.className = 'disk-pin';
    pin.id = `${containerId}-pin-${r}`;
    pin.style.left = `calc(50% + ${x}px)`;
    pin.style.top = `calc(50% + ${y}px)`;

    const label = document.createElement('span');
    label.innerText = r;
    pin.appendChild(label);
    container.appendChild(pin);
  });
}

// Render Pins on Road Track
function renderRoadPins(containerId, reqs) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  reqs.forEach(r => {
    const pct = (r / 199) * 100;
    const pin = document.createElement('div');
    pin.className = 'road-pin';
    pin.id = `${containerId}-pin-${r}`;
    pin.style.left = `calc(${pct}% * 0.9 + 5%)`;

    const label = document.createElement('span');
    label.innerText = r;
    pin.appendChild(label);
    container.appendChild(pin);
  });
}

// Animate Head & Car Movement
function updatePosition(armId, carId, badgeId, pos) {
  // Rotate arm
  const arm = document.getElementById(armId);
  const angle = (pos / 199) * 330 - 165;
  arm.style.transform = `rotate(${angle}deg)`;

  // Move car
  const car = document.getElementById(carId);
  const badge = document.getElementById(badgeId);
  const pct = (pos / 199) * 100;
  car.style.left = `calc(${pct}% * 0.9 + 5%)`;
  badge.innerText = pos;
}

// Start Main Race Simulation
function startSimulation() {
  if (animTimer) clearInterval(animTimer);

  const reqStr = document.getElementById('requests').value;
  const head = parseInt(document.getElementById('startHead').value);
  const dir = document.getElementById('direction').value;

  const reqs = reqStr.split(',')
    .map(x => parseInt(x.trim()))
    .filter(x => !isNaN(x) && x >= 0 && x <= 199);

  if (reqs.length === 0) return alert("Enter valid track numbers between 0 and 199!");

  const scan = solveSCAN(reqs, head, dir);
  const cscan = solveCSCAN(reqs, head, dir);

  renderPlatterPins('scanPlatterPins', reqs);
  renderPlatterPins('cscanPlatterPins', reqs);
  renderRoadPins('scanRoadPins', reqs);
  renderRoadPins('cscanRoadPins', reqs);

  updatePosition('scanArm', 'scanCar', 'scanCarPos', head);
  updatePosition('cscanArm', 'cscanCar', 'cscanCarPos', head);

  let step = 0;
  const maxSteps = Math.max(scan.path.length, cscan.path.length);

  animTimer = setInterval(() => {
    if (step < scan.path.length) {
      const pos = scan.path[step];
      updatePosition('scanArm', 'scanCar', 'scanCarPos', pos);
      document.getElementById('scanStatus').innerHTML = `Moved to Track <strong>${pos}</strong>`;

      const pPin = document.getElementById(`scanPlatterPins-pin-${pos}`);
      if (pPin) pPin.classList.add('visited');
      const rPin = document.getElementById(`scanRoadPins-pin-${pos}`);
      if (rPin) rPin.classList.add('visited');
    }

    if (step < cscan.path.length) {
      const pos = cscan.path[step];
      updatePosition('cscanArm', 'cscanCar', 'cscanCarPos', pos);
      document.getElementById('cscanStatus').innerHTML = `Moved to Track <strong>${pos}</strong>`;

      const pPin = document.getElementById(`cscanPlatterPins-pin-${pos}`);
      if (pPin) pPin.classList.add('visited');
      const rPin = document.getElementById(`cscanRoadPins-pin-${pos}`);
      if (rPin) rPin.classList.add('visited');
    }

    step++;

    if (step >= maxSteps) {
      clearInterval(animTimer);
      document.getElementById('scanDist').innerText = scan.dist;
      document.getElementById('cscanDist').innerText = cscan.dist;

      const banner = document.getElementById('winnerText');
      if (currentMode === 'scan') {
        banner.innerHTML = `✅ <strong>SCAN Complete!</strong> Total cylinder head movement: <strong>${scan.dist} tracks</strong>.`;
      } else if (currentMode === 'cscan') {
        banner.innerHTML = `✅ <strong>C-SCAN Complete!</strong> Total cylinder head movement: <strong>${cscan.dist} tracks</strong>.`;
      } else {
        if (scan.dist < cscan.dist) {
          banner.innerHTML = `🏆 <strong>SCAN Wins!</strong> It traveled ${cscan.dist - scan.dist} fewer track movements than C-SCAN!`;
        } else if (cscan.dist < scan.dist) {
          banner.innerHTML = `🏆 <strong>C-SCAN Wins!</strong> It traveled ${scan.dist - cscan.dist} fewer track movements than SCAN!`;
        } else {
          banner.innerHTML = `🤝 <strong>Tie Game!</strong> Both algorithms traveled ${scan.dist} track movements.`;
        }
      }
    }
  }, 650);
}