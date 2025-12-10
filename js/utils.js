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
// ===== PPD FUNCTIONS =====
async function loadPPDRequests() {
  if (!ppdSecret || !ppdDistrict) {
    Swal.fire({ icon: 'warning', title: 'Sila log masuk PPD dahulu' });
    return;
  }
  
  try {
    showLoading();
    const url = CONFIG.GAS_URL + 
      '?action=listRequests&secret=' + encodeURIComponent(ppdSecret) +
      '&district=' + encodeURIComponent(ppdDistrict);
    
    const res = await fetch(url);
    const json = await res.json();
    hideLoading();
    
    if (!json.ok) {
      throw new Error(json.message || 'Failed to load PPD requests');
    }
    
    renderPPDTables(json.requests || []);
  } catch (err) {
    hideLoading();
    logError('loadPPDRequests error', err);
    Swal.fire({
      icon: 'error',
      title: 'Ralat',
      text: err.message || String(err)
    });
  }
}

function renderPPDTables(requests) {
  const newTable = $('ppdNewTable');
  const reviewedTable = $('ppdReviewedTable');
  
  if (!newTable || !reviewedTable) return;
  
  // Filter NEW and PPD_REVIEWED
  const newReqs = requests.filter(r => {
    const status = String(r.Status || '').toUpperCase();
    return status === 'NEW' || (!status.includes('QUERY') && !status.includes('REVIEWED') && !status.includes('APPROVED'));
  });
  
  const reviewedReqs = requests.filter(r => {
    const status = String(r.Status || '').toUpperCase();
    return status.includes('PPD_REVIEWED');
  });
  
  // Render NEW table
  if (newReqs.length === 0) {
    newTable.innerHTML = '<p class="p-4 text-gray-500 italic">Tiada permohonan baru</p>';
  } else {
    const newRows = newReqs.map(r => ({
      'Request ID': r['Request ID'] || '',
      'Sekolah': r['School Name'] || '',
      'Tarikh': fmtDateToDisplay(r['Submission Time']),
      'Destinasi': r['PlaceVisit'] || '',
      'Status': r['Status'] || '',
      'Tindakan': `
        <button class="ppd-action-btn bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700" 
                data-id="${r['Request ID']}" data-action="view">
          👁️ Lihat
        </button>
        <button class="ppd-action-btn bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 ml-1" 
                data-id="${r['Request ID']}" data-action="forward">
          ✅ Hantar JPN
        </button>
        <button class="ppd-action-btn bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 ml-1" 
                data-id="${r['Request ID']}" data-action="query">
          ❓ Query
        </button>
      `
    }));
    
    const table = makeTable(newRows, ['Request ID', 'Sekolah', 'Tarikh', 'Destinasi', 'Status', 'Tindakan']);
    newTable.innerHTML = '';
    newTable.appendChild(table);
  }
  
  // Render REVIEWED table
  if (reviewedReqs.length === 0) {
    reviewedTable.innerHTML = '<p class="p-4 text-gray-500 italic">Tiada permohonan yang telah disemak</p>';
  } else {
    const reviewedRows = reviewedReqs.map(r => ({
      'Request ID': r['Request ID'] || '',
      'Sekolah': r['School Name'] || '',
      'Tarikh Semak': fmtDateToDisplay(r['ReviewedDate']),
      'Status': r['Status'] || '',
      'Tindakan': `
        <button class="ppd-action-btn bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700" 
                data-id="${r['Request ID']}" data-action="view">
          👁️ Lihat
        </button>
      `
    }));
    
    const table = makeTable(reviewedRows, ['Request ID', 'Sekolah', 'Tarikh Semak', 'Status', 'Tindakan']);
    reviewedTable.innerHTML = '';
    reviewedTable.appendChild(table);
  }
  
  setupPPDActions();
}

function setupPPDActions() {
  document.querySelectorAll('.ppd-action-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const id = this.dataset.id;
      const action = this.dataset.action;
      
      if (action === 'view') {
        await viewRequestDetails(id, ppdSecret);
      } else if (action === 'forward') {
        await ppdForwardToJPN(id);
      } else if (action === 'query') {
        await ppdSendQuery(id);
      }
    });
  });
}

async function ppdForwardToJPN(requestId) {
  const { value: note } = await Swal.fire({
    title: 'Hantar ke JPN',
    input: 'textarea',
    inputLabel: 'Catatan (optional)',
    inputPlaceholder: 'Tambah catatan jika perlu...',
    showCancelButton: true,
    confirmButtonText: 'Hantar ke JPN',
    cancelButtonText: 'Batal'
  });
  
  if (note === undefined) return; // User cancelled
  
  try {
    showLoading();
    const url = CONFIG.GAS_URL + 
      '?action=officerAction&secret=' + encodeURIComponent(ppdSecret) +
      '&id=' + encodeURIComponent(requestId) +
      '&type=preapprove' +
      '&isPPD=true' +
      '&district=' + encodeURIComponent(ppdDistrict) +
      '&pic=PPD-' + ppdDistrict +
      '&note=' + encodeURIComponent(note || 'Disemak oleh PPD');
    
    const res = await fetch(url);
    const json = await res.json();
    hideLoading();
    
    if (json.ok) {
      await Swal.fire({
        icon: 'success',
        title: 'Berjaya',
        text: 'Permohonan telah dihantar ke JPN'
      });
      await loadPPDRequests();
    } else {
      throw new Error(json.message || 'Gagal hantar');
    }
  } catch (err) {
    hideLoading();
    logError('ppdForwardToJPN error', err);
    Swal.fire({
      icon: 'error',
      title: 'Ralat',
      text: err.message || String(err)
    });
  }
}

async function ppdSendQuery(requestId) {
  const { value: note } = await Swal.fire({
    title: 'Hantar Query',
    input: 'textarea',
    inputLabel: 'Catatan Query',
    inputPlaceholder: 'Nyatakan maklumat yang diperlukan...',
    showCancelButton: true,
    confirmButtonText: 'Hantar Query',
    cancelButtonText: 'Batal',
    inputValidator: (value) => {
      if (!value) return 'Sila masukkan catatan query';
    }
  });
  
  if (!note) return;
  
  try {
    showLoading();
    const url = CONFIG.GAS_URL + 
      '?action=officerAction&secret=' + encodeURIComponent(ppdSecret) +
      '&id=' + encodeURIComponent(requestId) +
      '&type=query' +
      '&isPPD=true' +
      '&district=' + encodeURIComponent(ppdDistrict) +
      '&pic=PPD-' + ppdDistrict +
      '&note=' + encodeURIComponent(note);
    
    const res = await fetch(url);
    const json = await res.json();
    hideLoading();
    
    if (json.ok) {
      await Swal.fire({
        icon: 'success',
        title: 'Query dihantar',
        html: `Query ID: <b>${json.queryId || ''}</b>`
      });
      await loadPPDRequests();
    } else {
      throw new Error(json.message || 'Gagal hantar query');
    }
  } catch (err) {
    hideLoading();
    logError('ppdSendQuery error', err);
    Swal.fire({
      icon: 'error',
      title: 'Ralat',
      text: err.message || String(err)
    });
  }
}

// ===== BULK APPROVE (TP) =====
async function bulkApproveAll() {
  if (!dpSecret) {
    return Swal.fire({
      icon: 'warning',
      title: 'Sila log masuk dahulu'
    });
  }
  
  const confirm = await Swal.fire({
    title: 'Lulus Semua?',
    html: 'Adakah anda pasti mahu meluluskan <b>SEMUA</b> permohonan yang telah disemak?<br><br>⚠️ Tindakan ini akan:<br>• Jana surat kelulusan<br>• Hantar email ke semua sekolah<br>• Tidak boleh dibatalkan',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: '✅ Ya, Lulus Semua',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#dc2626'
  });
  
  if (!confirm.isConfirmed) return;
  
  try {
    showLoading();
    const url = CONFIG.GAS_URL + 
      '?action=bulkApprove&secret=' + encodeURIComponent(dpSecret);
    
    const res = await fetch(url);
    const json = await res.json();
    hideLoading();
    
    if (json.ok) {
      await Swal.fire({
        icon: 'success',
        title: 'Selesai!',
        html: `
          <p class="text-lg mb-2">${json.message || ''}</p>
          <div class="text-left bg-gray-100 p-3 rounded">
            <p>✅ Diluluskan: <b>${json.approved || 0}</b></p>
            <p>❌ Gagal: <b>${json.failed || 0}</b></p>
          </div>
        `
      });
      
      if (json.failed > 0 && json.results) {
        const failedList = json.results
          .filter(r => !r.success)
          .map(r => `• ${r.requestId}: ${r.error || 'Unknown error'}`)
          .join('<br>');
        
        if (failedList) {
          await Swal.fire({
            icon: 'info',
            title: 'Senarai Gagal',
            html: failedList,
            width: 600
          });
        }
      }
      
      await loadDpList();
    } else {
      throw new Error(json.message || 'Bulk approve gagal');
    }
  } catch (err) {
    hideLoading();
    logError('bulkApproveAll error', err);
    Swal.fire({
      icon: 'error',
      title: 'Ralat',
      text: err.message || String(err)
    });
  }
}

// ===== VIEW REQUEST DETAILS (Universal) =====
async function viewRequestDetails(requestId, secret) {
  if (!requestId || !secret) return;
  
  try {
    showLoading();
    const url = CONFIG.GAS_URL + 
      '?action=getRequest&secret=' + encodeURIComponent(secret) +
      '&id=' + encodeURIComponent(requestId);
    
    const res = await fetch(url);
    const json = await res.json();
    hideLoading();
    
    if (!json.ok || !json.request) {
      throw new Error(json.message || 'Request not found');
    }
    
    const req = json.request;
    
    const html = `
      <div class="text-left space-y-2 text-sm">
        <p><b>Request ID:</b> ${req['Request ID'] || ''}</p>
        <p><b>Sekolah:</b> ${req['School Name'] || ''}</p>
        <p><b>Daerah:</b> ${req['Daerah'] || ''}</p>
        <p><b>Email:</b> ${req['School Email'] || ''}</p>
        <p><b>Destinasi:</b> ${req['PlaceVisit'] || ''}</p>
        <p><b>Tarikh Mula:</b> ${fmtDateToDisplay(req['Travel Start'])}</p>
        <p><b>Tarikh Tamat:</b> ${fmtDateToDisplay(req['Travel End'])}</p>
        <p><b>Bilangan Peserta:</b> ${req['ParticipantCount'] || ''}</p>
        <p><b>Status:</b> <span class="font-bold">${req['Status'] || ''}</span></p>
      </div>
    `;
    
    Swal.fire({
      title: 'Maklumat Permohonan',
      html: html,
      width: 600,
      confirmButtonText: 'Tutup'
    });
  } catch (err) {
    hideLoading();
    logError('viewRequestDetails error', err);
    Swal.fire({
      icon: 'error',
      title: 'Ralat',
      text: err.message || String(err)
    });
  }
}
