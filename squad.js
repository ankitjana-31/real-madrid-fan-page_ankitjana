(function () {
  const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];
  const POSITION_LABELS = {
    Goalkeeper: 'Goalkeepers',
    Defender: 'Defenders',
    Midfielder: 'Midfielders',
    Attacker: 'Attackers'
  };

  let allPlayers = [];
  let currentFilter = 'All';
  let currentSearch = '';

  const container = document.getElementById('squadContainer');
  const searchInput = document.getElementById('squadSearch');
  const filterBar = document.getElementById('squadFilterBar');
  const exportJsonBtn = document.getElementById('exportJsonBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const resultsCount = document.getElementById('squadResultsCount');

  if (!container) return;

  async function fetchPlayers() {
    container.innerHTML = '<p style="text-align:center; color:#888; font-family:Raleway,sans-serif; padding: 40px 0;">Loading squad...</p>';
    try {
      const res = await fetch('/api/players');
      if (!res.ok) throw new Error('Bad response from server');
      allPlayers = await res.json();
      renderSquad();
    } catch (err) {
      container.innerHTML = '<p style="text-align:center; color:#f87171; font-family:Raleway,sans-serif; padding: 40px 0;">Could not load squad data. Make sure the backend server (node server.js) is running.</p>';
    }
  }

  function getFilteredPlayers() {
    return allPlayers.filter(p => {
      const matchesPosition = currentFilter === 'All' || p.position === currentFilter;
      const matchesSearch = p.name.toLowerCase().includes(currentSearch.toLowerCase());
      return matchesPosition && matchesSearch;
    });
  }

  function renderSquad() {
    const filtered = getFilteredPlayers();

    if (resultsCount) {
      resultsCount.textContent = `${filtered.length} player${filtered.length === 1 ? '' : 's'}`;
    }

    if (!filtered.length) {
      container.innerHTML = '<p style="text-align:center; color:#888; font-family:Raleway,sans-serif; padding: 40px 0;">No players match your search.</p>';
      return;
    }

    const groups = {};
    filtered.forEach(p => {
      if (!groups[p.position]) groups[p.position] = [];
      groups[p.position].push(p);
    });

    const groupOrder = currentFilter === 'All' ? POSITION_ORDER : [currentFilter];

    container.innerHTML = groupOrder
      .filter(pos => groups[pos] && groups[pos].length)
      .map(pos => `
        <div class="squad-group">
          <h3 class="squad-position-title">${POSITION_LABELS[pos] || pos}</h3>
          <div class="squad-grid">
            ${groups[pos].map(renderCard).join('')}
          </div>
        </div>
      `).join('');
  }

  function renderCard(p) {
    const backImage = p.backImage || p.image;
    const backImgClass = p.backImage ? 'squad-back-img' : 'squad-back-img blurred-back';
    const signatureHtml = p.signature
      ? `<span class="squad-signature ${p.signature.class}">${p.signature.text}</span>`
      : '';
    const statsHtml = Object.entries(p.stats || {}).map(([label, value]) => `
      <div class="squad-stat-row">
        <span class="squad-stat-label">${label}</span>
        <span class="squad-stat-value">${value}</span>
      </div>
    `).join('');

    return `
      <div class="squad-card" data-id="${p.id}">
        <div class="squad-card-inner">
          <div class="squad-front">
            <img src="${p.image}" alt="${p.name}" class="squad-img" onerror="this.src='assets/rmlogo.png'">
            <div class="squad-info">
              <span class="squad-number">#${p.number}</span>
              <h4 class="squad-name">${p.name}</h4>
              <p class="squad-role">${p.role}</p>
              <p class="squad-nation">${p.flag ? p.flag + ' ' : ''}${p.nation || ''}</p>
              <p class="squad-bio">${p.bio || ''}</p>
            </div>
          </div>
          <div class="squad-back">
            <img src="${backImage}" alt="${p.name}" class="${backImgClass}" onerror="this.src='assets/rmlogo.png'">
            <div class="squad-stats-overlay">
              ${signatureHtml}
              <h4 class="squad-stats-name">${p.name}</h4>
              ${statsHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderSquad();
    });
  }

  if (filterBar) {
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      currentFilter = btn.dataset.filter;
      filterBar.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderSquad();
    });
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function playersToCSV(players) {
    const headers = ['Number', 'Name', 'Role', 'Position', 'Nation', ...new Set(players.flatMap(p => Object.keys(p.stats || {})))];
    const rows = players.map(p => {
      const base = [p.number, `"${p.name}"`, `"${p.role}"`, p.position, p.nation || ''];
      const statValues = headers.slice(5).map(h => (p.stats && p.stats[h]) || '');
      return [...base, ...statValues].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => {
      const data = getFilteredPlayers();
      downloadFile('real-madrid-squad.json', JSON.stringify(data, null, 2), 'application/json');
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      const data = getFilteredPlayers();
      downloadFile('real-madrid-squad.csv', playersToCSV(data), 'text/csv');
    });
  }

  fetchPlayers();
})();