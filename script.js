let currentMode = 'compare';
let currentVisual = 'platter';
let animTimer = null;

function updateWeightLabels() {
  document.getElementById('valDist').innerText = document.getElementById('wDist').value;
  document.getElementById('valAge').innerText = document.getElementById('wAge').value;
  document.getElementById('valDeadline').innerText = document.getElementById('wDeadline').value;
  document.getElementById('valFreq').innerText = document.getElementById('wFreq').value;
}

function selectMode(mode) {
  currentMode = mode;
  document.getElementById('homePage').classList.remove('active');
  document.getElementById('simPage').classList.add('active');

  const scanCard = document.getElementById('scanCard');
  const cscanCard = document.getElementById('cscanCard');
  const adaptCard = document.getElementById('adaptCard');
  const navTitle = document.getElementById('navTitle');

  scanCard.style.display = 'none';
  cscanCard.style.display = 'none';
  adaptCard.style.display = 'none';

  if (mode === 'scan') {
    scanCard.style.display = 'flex';
    navTitle.innerText = "SCAN Algorithm";
  } else if (mode === 'cscan') {
    cscanCard.style.display = 'flex';
    navTitle.innerText = "C-SCAN Algorithm";
  } else if (mode === 'adaptive') {
    adaptCard.style.display = 'flex';
    navTitle.innerText = "Custom Adaptive Priority";
  } else {
    scanCard.style.display = 'flex';
    cscanCard.style.display = 'flex';
    adaptCard.style.display = 'flex';
    navTitle.innerText = "3-Way Algorithm Race";
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
  document.getElementById('adaptDist').innerText = '0';
  document.getElementById('scanStatus').innerText = 'Ready...';
  document.getElementById('cscanStatus').innerText = 'Ready...';
  document.getElementById('adaptStatus').innerText = 'Ready...';
  document.getElementById('winnerText').innerHTML = 'Press <strong>Start Race</strong> to run the adaptive priority race!';
}

function solveSCAN(reqs, head, dir, max = 199) {
  let left = reqs.filter(r => r < head).sort((a, b) => a - b);
  let right = reqs.filter(r => r > head).sort((a, b) => a - b);
  let path = [head], dist = 0, curr = head;

  if (dir === 'right') {
    for (let r of right) { path.push(r); dist += Math.abs(r - curr); curr = r; }
    if (left.length > 0 && curr !== max) { path.push(max); dist += Math.abs(max - curr); curr = max; }
    for (let i = left.length - 1; i >= 0; i--) { path.push(left[i]); dist += Math.abs(left[i] - curr); curr = left[i]; }
  } else {
    for (let i = left.length - 1; i >= 0; i--) { path.push(left[i]); dist += Math.abs(left[i] - curr); curr = left[i]; }
    if (right.length > 0 && curr !== 0) { path.push(0); dist += Math.abs(0 - curr); curr = 0; }
    for (let r of right) { path.push(r); dist += Math.abs(r - curr); curr = r; }
  }
  return { path, dist };
}

function solveCSCAN(reqs, head, dir, max = 199) {
  let left = reqs.filter(r => r < head).sort((a, b) => a - b);
  let right = reqs.filter(r => r > head).sort((a, b) => a - b);
  let path = [head], dist = 0, curr = head;

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

// USER-WEIGHTED ADAPTIVE MULTIPARAMETER PRIORITY LOGIC
function solveAdaptivePriority(reqs, head) {
  // Read User Weight Sliders (0 to 100)
  const wDistance = parseFloat(document.getElementById('wDist').value) / 100;
  const wAge = parseFloat(document.getElementById('wAge').value) / 100;
  const wDeadline = parseFloat(document.getElementById('wDeadline').value) / 100;
  const wFrequency = parseFloat(document.getElementById('wFreq').value) / 100;

  let remaining = reqs.map((r, index) => ({
    track: r,
    age: (index + 1) * 10,
    deadline: 200 - (r % 150),
    frequency: (r % 5) + 1
  }));

  let path = [head], dist = 0, curr = head;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let maxPriority = -Infinity;

    remaining.forEach((item, i) => {
      let d = Math.abs(item.track - curr);
      let a = item.age;
      let l = item.deadline;
      let f = item.frequency;

      // Scoring formula using User Weights
      let priorityScore = (a * wAge) + (f * wFrequency) + ((200 - l) * wDeadline) - (d * wDistance);

      if (priorityScore > maxPriority) {
        maxPriority = priorityScore;
        bestIndex = i;
      }
    });

    let selected = remaining.splice(bestIndex, 1)[0];
    dist += Math.abs(selected.track - curr);
    curr = selected.track;
    path.push(curr);

    remaining.forEach(item => item.age += 15);
  }

  return { path, dist };
}

function renderPlatterPins(containerId, reqs) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  reqs.forEach(r => {
    const angle = (r / 199) * 330 - 165;
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * 75;
    const y = Math.sin(rad) * 75;

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

function updatePosition(armId, carId, badgeId, pos) {
  const arm = document.getElementById(armId);
  if (arm) arm.style.transform = `rotate(${(pos / 199) * 330 - 165}deg)`;

  const car = document.getElementById(carId);
  const badge = document.getElementById(badgeId);
  if (car && badge) {
    car.style.left = `calc(${(pos / 199) * 100}% * 0.9 + 5%)`;
    badge.innerText = pos;
  }
}

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
  const adapt = solveAdaptivePriority(reqs, head);

  renderPlatterPins('scanPlatterPins', reqs);
  renderPlatterPins('cscanPlatterPins', reqs);
  renderPlatterPins('adaptPlatterPins', reqs);

  renderRoadPins('scanRoadPins', reqs);
  renderRoadPins('cscanRoadPins', reqs);
  renderRoadPins('adaptRoadPins', reqs);

  updatePosition('scanArm', 'scanCar', 'scanCarPos', head);
  updatePosition('cscanArm', 'cscanCar', 'cscanCarPos', head);
  updatePosition('adaptArm', 'adaptCar', 'adaptCarPos', head);

  let step = 0;
  const maxSteps = Math.max(scan.path.length, cscan.path.length, adapt.path.length);

  animTimer = setInterval(() => {
    if (step < scan.path.length) {
      const pos = scan.path[step];
      updatePosition('scanArm', 'scanCar', 'scanCarPos', pos);
      document.getElementById('scanStatus').innerHTML = `Track: <strong>${pos}</strong>`;
      const p = document.getElementById(`scanPlatterPins-pin-${pos}`); if (p) p.classList.add('visited');
      const r = document.getElementById(`scanRoadPins-pin-${pos}`); if (r) r.classList.add('visited');
    }

    if (step < cscan.path.length) {
      const pos = cscan.path[step];
      updatePosition('cscanArm', 'cscanCar', 'cscanCarPos', pos);
      document.getElementById('cscanStatus').innerHTML = `Track: <strong>${pos}</strong>`;
      const p = document.getElementById(`cscanPlatterPins-pin-${pos}`); if (p) p.classList.add('visited');
      const r = document.getElementById(`cscanRoadPins-pin-${pos}`); if (r) r.classList.add('visited');
    }

    if (step < adapt.path.length) {
      const pos = adapt.path[step];
      updatePosition('adaptArm', 'adaptCar', 'adaptCarPos', pos);
      document.getElementById('adaptStatus').innerHTML = `Track: <strong>${pos}</strong>`;
      const p = document.getElementById(`adaptPlatterPins-pin-${pos}`); if (p) p.classList.add('visited');
      const r = document.getElementById(`adaptRoadPins-pin-${pos}`); if (r) r.classList.add('visited');
    }

    step++;

    if (step >= maxSteps) {
      clearInterval(animTimer);
      document.getElementById('scanDist').innerText = scan.dist;
      document.getElementById('cscanDist').innerText = cscan.dist;
      document.getElementById('adaptDist').innerText = adapt.dist;

      const banner = document.getElementById('winnerText');
      const scores = [
        { name: 'Custom Adaptive', dist: adapt.dist },
        { name: 'SCAN', dist: scan.dist },
        { name: 'C-SCAN', dist: cscan.dist }
      ].sort((a, b) => a.dist - b.dist);

      banner.innerHTML = `🏆 <strong>${scores[0].name} Won!</strong> Traveled only <strong>${scores[0].dist} tracks</strong> (vs ${scores[1].name}: ${scores[1].dist}, ${scores[2].name}: ${scores[2].dist}).`;
    }
  }, 650);
}