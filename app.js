const TAG_COLORS = {
  health:   { bg: '#E1F5EE', color: '#085041' },
  learning: { bg: '#EEEDFE', color: '#3C3489' },
  work:     { bg: '#E6F1FB', color: '#0C447C' },
  social:   { bg: '#FBEAF0', color: '#72243E' },
  creative: { bg: '#FAEEDA', color: '#633806' },
};

let selectedTag = 'work';
let entries = JSON.parse(localStorage.getItem('tiny-wins') || '[]');

document.querySelectorAll('.tag-btn').forEach(btn => {
  if (btn.dataset.tag === selectedTag) btn.classList.add('active');
  btn.addEventListener('click', () => {
    selectedTag = btn.dataset.tag;
    document.querySelectorAll('.tag-btn').forEach(b => {
      b.classList.remove('active');
      b.style.background = '';
      b.style.color = '';
    });
    const c = TAG_COLORS[selectedTag];
    btn.classList.add('active');
    btn.style.background = c.bg;
    btn.style.color = c.color;
  });
});

const activeBtn = document.querySelector(`.tag-btn[data-tag="${selectedTag}"]`);
if (activeBtn) {
  const c = TAG_COLORS[selectedTag];
  activeBtn.style.background = c.bg;
  activeBtn.style.color = c.color;
}

document.getElementById('add-btn').addEventListener('click', () => {
  const input = document.getElementById('win-input');
  const text = input.value.trim();
  if (!text) return;
  entries.unshift({
    text,
    tag: selectedTag,
    date: new Date().toISOString().split('T')[0],
    id: Date.now()
  });
  localStorage.setItem('tiny-wins', JSON.stringify(entries));
  input.value = '';
  render();
});

document.getElementById('win-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('add-btn').click();
});

function deleteEntry(id) {
  entries = entries.filter(e => e.id !== id);
  localStorage.setItem('tiny-wins', JSON.stringify(entries));
  render();
}

function computeStreak() {
  const dates = [...new Set(entries.map(e => e.date))].sort().reverse();
  if (!dates.length) return { current: 0, best: 0 };
  let best = 0, streak = 0, prev = null;
  dates.forEach(d => {
    if (!prev) { streak = 1; }
    else {
      const diff = (new Date(prev) - new Date(d)) / 86400000;
      streak = diff === 1 ? streak + 1 : 1;
    }
    best = Math.max(best, streak);
    prev = d;
  });
  let current = 0;
  let day = new Date();
  while (true) {
    const ds = day.toISOString().split('T')[0];
    if (dates.includes(ds)) { current++; day.setDate(day.getDate() - 1); }
    else break;
  }
  return { current, best };
}

function buildHeatmap() {
  const container = document.getElementById('heatmap');
  container.innerHTML = '';
  const dateCounts = {};
  entries.forEach(e => { dateCounts[e.date] = (dateCounts[e.date] || 0) + 1; });
  const today = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const count = dateCounts[ds] || 0;
    const shades = ['#E1F5EE', '#9FE1CB', '#1D9E75', '#085041'];
    const bg = count === 0 ? shades[0] : count === 1 ? shades[1] : count === 2 ? shades[2] : shades[3];
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    cell.style.background = bg;
    cell.title = `${ds}: ${count} win${count !== 1 ? 's' : ''}`;
    container.appendChild(cell);
  }
}

function render() {
  const { current, best } = computeStreak();
  document.getElementById('streak-count').textContent = current;
  document.getElementById('total-wins').textContent = entries.length;
  const thisMonth = new Date().toISOString().slice(0, 7);
  document.getElementById('month-wins').textContent = entries.filter(e => e.date.startsWith(thisMonth)).length;
  document.getElementById('best-streak').textContent = best;
  buildHeatmap();

  const list = document.getElementById('entries-list');
  list.innerHTML = '';

  if (!entries.length) {
    list.innerHTML = '<p class="empty-state">No wins yet — log your first one above!</p>';
    return;
  }

  entries.slice(0, 10).forEach(e => {
    const c = TAG_COLORS[e.tag] || TAG_COLORS.work;
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.innerHTML = `
      <div>
        <p class="entry-text">${e.text}</p>
        <div class="entry-meta">
          <span class="tag-pill" style="background:${c.bg};color:${c.color};">${e.tag}</span>
          <span class="entry-date">${e.date}</span>
        </div>
      </div>
      <button class="delete-btn" onclick="deleteEntry(${e.id})" aria-label="Delete">&#x2715;</button>
    `;
    list.appendChild(card);
  });
}

render();
