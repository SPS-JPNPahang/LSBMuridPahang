/**
 * LAWATAN MURID SAMBIL BELAJAR - Utility Functions
 * JPN Pahang
 */

// ===== TABLE GENERATOR =====
function makeTable(rows, cols) {
  const t = document.createElement('table');
  t.className = 'w-full text-sm';
  
  // Create header
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  trh.className = 'bg-gray-100';
  
  cols.forEach(c => {
    const th = document.createElement('th');
    th.className = 'p-2 text-left';
    th.textContent = c;
    trh.appendChild(th);
  });
  
  thead.appendChild(trh);
  t.appendChild(thead);
  
  // Create body
  const tb = document.createElement('tbody');
  
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.className = 'border-b align-top';
    
    cols.forEach(c => {
      const td = document.createElement('td');
      td.className = 'p-2 align-top';
      td.innerHTML = r[c] || '';
      
      // Add color coding for Status column
      if (c === 'Status' && r[c]) {
        const status = String(r[c]).toUpperCase();
        if (status.includes('NEW')) {
          td.classList.add('status-new');
        } else if (status.includes('QUERY')) {
          td.classList.add('status-query');
        } else if (status.includes('REVIEWED') || status.includes('PREAPPROVED')) {
          td.classList.add('status-reviewed');
        } else if (status.includes('FINAL_APPROVED')) {
          td.classList.add('status-approved');
        }
      }
      
      tr.appendChild(td);
    });
    
    tb.appendChild(tr);
  });
  
  t.appendChild(tb);
  return t;
}

// ===== HEADER INDEX BUILDER =====
function buildHeaderIndex(headers) {
  const map = {};
  (headers || []).forEach((h, i) => {
    const key = (h || '').toString().trim();
    if (key) map[key] = i;
  });
  return map;
}

// ===== EXTRACT QUERIES FROM REQUEST =====
function extractQueries(req) {
  if (!req) return [];
  
  if (Array.isArray(req['QueryHistory']) && req['QueryHistory'].length) {
    return req['QueryHistory'].map(q => ({
      id: q.id || q.QueryID || q.queryId || '',
      sentDate: q.sentDate || q.QuerySentDate || q.sent_at || q.date || '',
      respondedDate: q.respondedDate || q.QueryRespondDate || q.responded_at || q.response_date || '',
      note: q.note || q.note_text || q.message || ''
    }));
  }
  
  const queries = [];
  const txt = String(req['OfficerNote'] || req['OfficerNotes'] || '');
  
  if (txt) {
    const re = /QueryID[:\s]*([A-Z0-9\-_]+)/ig;
    let m;
    while ((m = re.exec(txt)) !== null) {
      const id = m[1];
      const slice = txt.slice(Math.max(0, m.index - 120), m.index + 120);
      const dateMatch = slice.match(/(\d{4}-\d{2}-\d{2})/);
      queries.push({
        id,
        sentDate: dateMatch ? dateMatch[0] : '',
        respondedDate: '',
        note: slice.trim()
      });
    }
  }
  
  if (req['QueryID'] && !queries.find(q => q.id === req['QueryID'])) {
    queries.push({
      id: req['QueryID'],
      sentDate: req['QuerySentDate'] || req['QueryDate'] || '',
      respondedDate: req['QueryRespondDate'] || req['QueryRespondedDate'] || '',
      note: req['OfficerNote'] || ''
    });
  }
  
  return queries;
}

// ===== DATE BOUNDS SETUP =====
function setupDateBounds() {
  const start = $('travelStart');
  const end = $('travelEnd');
  
  if (!start || !end) return;
  
  const setMin = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const min = new Date(today.getTime() + CONFIG.MIN_DAYS_ADVANCE * 24 * 60 * 60 * 1000);
    start.min = `${min.getFullYear()}-${String(min.getMonth() + 1).padStart(2, '0')}-${String(min.getDate()).padStart(2, '0')}`;
  };
  
  const updateEndBounds = () => {
    if (!start.value) {
      end.removeAttribute('max');
      return;
    }
    
    const s = new Date(start.value);
    const max = new Date(s.getTime() + CONFIG.MAX_TRIP_DAYS * 24 * 60 * 60 * 1000);
    end.min = start.value;
    end.max = `${max.getFullYear()}-${String(max.getMonth() + 1).padStart(2, '0')}-${String(max.getDate()).padStart(2, '0')}`;
    
    if (end.value) {
      const cur = new Date(end.value);
      if (cur < s) end.value = start.value;
      if (cur > max) end.value = end.max;
    }
  };
  
  setMin();
  start.addEventListener('change', updateEndBounds);
  updateEndBounds();
}

// ===== LEADERS MANAGEMENT =====
function renderLeaders() {
  const c = $('leaderList');
  if (!c) return;
  
  c.innerHTML = '';
  if (leaders.length === 0) leaders.push({ name: '', phone: '' });
  
  leaders.forEach((l, i) => {
    const div = document.createElement('div');
    div.className = 'flex gap-2 items-center';
    div.innerHTML = `
      <input class="flex-1 border p-2 rounded leaderName" placeholder="Nama Ketua ${i + 1}" data-index="${i}" value="${l.name || ''}" />
      <input class="w-40 border p-2 rounded leaderPhone" placeholder="No. Tel" data-index="${i}" value="${l.phone || ''}" />
      <button type="button" data-index="${i}" class="removeLead bg-red-500 text-white px-2 rounded hover:bg-red-600">X</button>
    `;
    c.appendChild(div);
  });
  
  c.querySelectorAll('.removeLead').forEach(b => 
    b.addEventListener('click', e => {
      leaders.splice(+e.target.dataset.index, 1);
      renderLeaders();
    })
  );
  
  c.querySelectorAll('.leaderName').forEach(i => 
    i.addEventListener('input', e => leaders[+e.target.dataset.index].name = e.target.value)
  );
  
  c.querySelectorAll('.leaderPhone').forEach(i => 
    i.addEventListener('input', e => leaders[+e.target.dataset.index].phone = e.target.value)
  );
}

function initializeLeaders() {
  if ($('addLeader')) {
    $('addLeader').addEventListener('click', () => {
      leaders.push({ name: '', phone: '' });
      renderLeaders();
    });
  }
  renderLeaders();
}

// ===== PDF ANNOTATION HELPERS =====
async function annotatePdfAndUpload({ requestId, fileBlobOrFile, stampText = 'Disemak', stampImageFile = null, sourceLabel = 'ANNOTATED' }) {
  if (!fileBlobOrFile) throw new Error('missing file');
  
  const ab = await (fileBlobOrFile.arrayBuffer ? fileBlobOrFile.arrayBuffer() : fileBlobOrFile);
  const pdfDoc = await PDFLib.PDFDocument.load(ab);
  const helv = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
  
  let imgEmbed = null;
  if (stampImageFile) {
    const imgAB = await stampImageFile.arrayBuffer();
    const mime = stampImageFile.type || 'image/png';
    imgEmbed = (mime === 'image/png') ? await pdfDoc.embedPng(imgAB) : await pdfDoc.embedJpg(imgAB);
  }
  
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const { width, height } = p.getSize();
    const fontSize = Math.max(10, Math.min(36, Math.floor(Math.min(width, height) / 18)));
    const text = stampText || `Disemak ${new Date().toLocaleDateString()}`;
    const textWidth = helv.widthOfTextAtSize(text, fontSize);
    const margin = 18;
    
    p.drawText(text, {
      x: width - textWidth - margin,
      y: margin + (imgEmbed ? 40 : 0),
      size: fontSize,
      font: helv,
      color: PDFLib.rgb(0.85, 0.1, 0.1),
      opacity: 0.95
    });
    
    if (imgEmbed) {
      const scaled = imgEmbed.scale(Math.min(120 / imgEmbed.width, 60 / imgEmbed.height));
      p.drawImage(imgEmbed, {
        x: margin,
        y: margin,
        width: scaled.width,
        height: scaled.height,
        opacity: 0.95
      });
    }
  }
  
  const modifiedBytes = await pdfDoc.save();
  let binary = '';
  const u8 = new Uint8Array(modifiedBytes);
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]);
  const b64 = btoa(binary);
  
  const fileName = 'ANNOTATED_' + (fileBlobOrFile.name || ('file_' + Date.now() + '.pdf'));
  const payload = {
    requestId: requestId || '',
    fileName: fileName,
    dataBase64: b64,
    sourceLabel: sourceLabel
  };
  
  const res = await fetch(CONFIG.GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ type: 'uploadAnnotatedPdf', payload })
  });
  
  return await res.json();
}

async function fetchDriveFileAsFile(driveUrlOrId) {
  let id = '';
  const m = String(driveUrlOrId || '').match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (m) id = m[1];
  else id = driveUrlOrId;
  
  if (!id) throw new Error('Invalid Drive URL/ID');
  
  const r = await fetch(CONFIG.GAS_URL + '?action=fetchFileBase64&fileId=' + encodeURIComponent(id));
  const j = await r.json();
  
  if (!j.ok || !j.dataBase64) throw new Error('fetchFileBase64 failed');
  
  const u8 = base64ToUint8Array(j.dataBase64);
  const blob = uint8ArrayToBlob(u8, j.mimeType || 'application/pdf');
  return blobToFile(blob, j.name || ('file_' + id + '.pdf'));
}

// ===== TAB MANAGEMENT =====
function hideAllSections() {
  ['introSection', 'formSection', 'officerSection', 'dpSection', 'queryResponseSection', 'downloadsSection']
    .forEach(id => {
      const el = $(id);
      if (el) el.classList.add('hidden');
    });
}

function setActiveTab(btnId) {
  document.querySelectorAll('.nav-tab').forEach(b => {
    b.classList.remove('tab-active', 'bg-blue-600', 'text-white');
  });
  
  const el = $(btnId);
  if (el) el.classList.add('tab-active');
}

function setupTabs() {
  const tabMap = {
    tabIntroBtn: 'introSection',
    tabFormBtn: 'formSection',
    tabOfficerBtn: 'officerSection',
    tabDPBtn: 'dpSection',
    tabQueryResponseBtn: 'queryResponseSection',
    tabDownloadsBtn: 'downloadsSection'
  };
  
  Object.keys(tabMap).forEach(btnId => {
    const btn = $(btnId);
    if (btn) {
      btn.addEventListener('click', () => {
        hideAllSections();
        const sectionId = tabMap[btnId];
        const section = $(sectionId);
        if (section) section.classList.remove('hidden');
        setActiveTab(btnId);
      });
    }
  });
  
  // Default: show intro
  hideAllSections();
  setActiveTab('tabIntroBtn');
  const intro = $('introSection');
  if (intro) intro.classList.remove('hidden');
}

// ===== SIDEBAR MOBILE MENU =====
function setupMobileMenu() {
  const sidebar = document.querySelector('.sidebar');
  const menuToggle = $('menuToggle');
  const closeSidebar = $('closeSidebar');
  
  if (!sidebar || !menuToggle || !closeSidebar) return;
  
  menuToggle.addEventListener('click', () => {
    sidebar.classList.remove('hidden');
    sidebar.classList.add('fixed', 'z-40', 'bg-gray-900', 'text-white', 'w-64', 'h-screen', 'p-6');
    closeSidebar.classList.remove('hidden');
  });
  
  closeSidebar.addEventListener('click', () => {
    sidebar.classList.add('hidden');
    closeSidebar.classList.add('hidden');
  });
  
  document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && window.innerWidth < 768) {
      sidebar.classList.add('hidden');
      closeSidebar.classList.add('hidden');
    }
  });
}

// ===== DOWNLOADS SECTION =====
function setupDownloads() {
  document.addEventListener('click', function(e) {
    const btn = e.target.closest && e.target.closest('#downloadsSection .download-btn');
    if (!btn) return;
    
    const url = btn.getAttribute('data-link') || btn.dataset.link || '#';
    if (!url || url === '#') {
      Swal.fire({
        icon: 'info',
        title: 'Tiada fail',
        text: 'Link muat turun belum dikonfigurasikan.'
      });
      return;
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}