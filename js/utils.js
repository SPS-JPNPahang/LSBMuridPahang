/**
 * LAWATAN MURID SAMBIL BELAJAR - Utility Functions
 * JPN Pahang
 */

// ===== DELAY HELPER =====
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== PDF-LIB CONVERSION HELPERS =====
function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBlob(u8, mime = 'application/pdf') {
  return new Blob([u8], { type: mime });
}

function blobToFile(blob, name) {
  try {
    return new File([blob], name, { type: blob.type });
  } catch (e) {
    blob.name = name;
    return blob;
  }
}

// ===== PDF ANNOTATION & UPLOAD =====
async function annotatePdfAndUpload({
  requestId,
  fileBlobOrFile,
  stampText = 'Disemak',
  stampImageFile = null,
  sourceLabel = 'ANNOTATED'
}) {
  if (!fileBlobOrFile) throw new Error('missing file');

  const ab = await (fileBlobOrFile.arrayBuffer
    ? fileBlobOrFile.arrayBuffer()
    : fileBlobOrFile);

  const pdfDoc = await PDFLib.PDFDocument.load(ab);
  const helv = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);

  let imgEmbed = null;
  if (stampImageFile) {
    const imgAB = await stampImageFile.arrayBuffer();
    const mime = stampImageFile.type || 'image/png';
    imgEmbed =
      mime === 'image/png'
        ? await pdfDoc.embedPng(imgAB)
        : await pdfDoc.embedJpg(imgAB);
  }

  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const { width, height } = p.getSize();

    const fontSize = Math.max(
      10,
      Math.min(36, Math.floor(Math.min(width, height) / 18))
    );

    const text = stampText || `Disemak ${new Date().toLocaleDateString()}`;
    const textWidth = helv.widthOfTextAtSize(text, fontSize);
    const marginRight = 50;  // Jarak dari tepi kanan
    const marginBottom = 80; // Jarak dari bawah (tinggi sikit dari margin asal)

    // === IMEJ COP - KANAN BAWAH ===
    if (imgEmbed) {
      const scaled = imgEmbed.scale(
        Math.min(120 / imgEmbed.width, 60 / imgEmbed.height)
      );
      p.drawImage(imgEmbed, {
        x: width - scaled.width - marginRight,  // Kanan
        y: marginBottom,                         // Bawah (tapi tak terlalu bawah)
        width: scaled.width,
        height: scaled.height,
        opacity: 0.95
      });

      // === TEKS COP - ATAS IMEJ ===
      p.drawText(text, {
        x: width - textWidth - marginRight,
        y: marginBottom + scaled.height + 10,  // Atas imej sikit
        size: fontSize,
        font: helv,
        color: PDFLib.rgb(0.85, 0.1, 0.1),
        opacity: 0.95
      });
    } else {
      // Kalau takde imej, teks je
      p.drawText(text, {
        x: width - textWidth - marginRight,
        y: marginBottom,
        size: fontSize,
        font: helv,
        color: PDFLib.rgb(0.85, 0.1, 0.1),
        opacity: 0.95
      });
    }
  }

  const modifiedBytes = await pdfDoc.save();

  let binary = '';
  const u8 = new Uint8Array(modifiedBytes);
  for (let i = 0; i < u8.length; i++) {
    binary += String.fromCharCode(u8[i]);
  }
  const b64 = btoa(binary);

  const fileName =
    'ANNOTATED_' +
    (fileBlobOrFile.name || 'file_' + Date.now() + '.pdf');

  // === MAP LABEL FRONTEND → BACKEND COLUMN ===
  const labelToColumn = {
    'Kertas Kerja / Cadangan': 'File_KERTAS_KERJA',
    'KERTAS KERJA/CADANGAN': 'File_KERTAS_KERJA',
    'Lampiran A': 'File_MAKLUMAT_ANGGOTA',
    'LAMPIRAN A': 'File_MAKLUMAT_ANGGOTA',
    'Permit Bas': 'File_PERMIT_BAS',
    'Lesen Pemandu': 'File_LESEN_PEMANDU',
    'Taklimat Keselamatan': 'File_TAKLIMAT'
  };

  const backendColumn = labelToColumn[sourceLabel] || sourceLabel;

  const payload = {
    requestId: requestId || '',
    fileName: fileName,
    dataBase64: b64,
    sourceLabel: backendColumn
  };

  const res = await fetch(CONFIG.GAS_URL, {
    method: 'POST',
    body: JSON.stringify({
      type: 'uploadAnnotatedPdf',
      payload
    })
  });

  return await res.json();
}


// ===== FETCH DRIVE FILE AS FILE OBJECT =====
async function fetchDriveFileAsFile(driveUrlOrId) {
  let id = '';
  const m = String(driveUrlOrId||'').match(/\/d\/([a-zA-Z0-9_-]{10,})/);
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

// ===== TABLE BUILDER =====
function makeTable(rows, cols){
  const t = document.createElement('table'); 
  t.className='w-full text-sm';
  const thead = document.createElement('thead'); 
  const trh = document.createElement('tr'); 
  trh.className='bg-gray-100';
  cols.forEach(c=>{ 
    const th=document.createElement('th'); 
    th.className='p-2 text-left'; 
    th.textContent=c; 
    trh.appendChild(th); 
  }); 
  thead.appendChild(trh); 
  t.appendChild(thead);
  
  const tb=document.createElement('tbody');
  rows.forEach(r=>{ 
    const tr=document.createElement('tr'); 
    tr.className='border-b align-top';
    cols.forEach(c=>{ 
      const td=document.createElement('td'); 
      td.className='p-2 align-top'; 
      td.innerHTML = r[c]||''; 
      
      if (c === 'Status' && r[c]) {
        const status = String(r[c]).toUpperCase();
        if (status.includes('NEW')) td.classList.add('status-new');
        else if (status.includes('QUERY')) td.classList.add('status-query');
        else if (status.includes('REVIEWED') || status.includes('PREAPPROVED')) td.classList.add('status-reviewed');
        else if (status.includes('FINAL_APPROVED')) td.classList.add('status-approved');
      }
      
      tr.appendChild(td); 
    });
    tb.appendChild(tr);
  });
  t.appendChild(tb); 
  return t;
}

// ===== QUERY EXTRACTION HELPER =====
function extractQueries(req){
  if (!req) return [];

  // If there is an explicit QueryHistory array (preferred), use it and return latest entry only
  if (Array.isArray(req['QueryHistory']) && req['QueryHistory'].length) {
    // return only the most recent entry (assumes QueryHistory is chronological)
    const last = req['QueryHistory'][req['QueryHistory'].length - 1];
    return [{
      id: last.id || last.QueryID || last.queryId || '',
      sentDate: last.sentDate || last.QuerySentDate || last.sent_at || last.date || '',
      respondedDate: last.respondedDate || last.QueryRespondDate || last.responded_at || last.response_date || '',
      note: last.note || last.note_text || last.message || ''
    }];
  }

  // If QueryID column exists (current query), prefer that as single current query
  if (req['QueryID']) {
    return [{
      id: String(req['QueryID']),
      sentDate: req['QuerySentDate'] || req['QueryDate'] || '',
      respondedDate: req['QueryRespondDate'] || req['QueryRespondedDate'] || '',
      note: req['OfficerNote'] || ''
    }];
  }

  // Fallback: try to parse any QueryID tokens from OfficerNote but only return the latest one
  const txt = String(req['OfficerNote']||req['OfficerNotes']||'');
  if (!txt) return [];
  const re = /QueryID[:\s]*([A-Z0-9\-_]+)/ig;
  let m, lastMatch = null;
  while ((m = re.exec(txt)) !== null) lastMatch = m;
  if (lastMatch) {
    const id = lastMatch[1];
    const slice = txt.slice(Math.max(0, lastMatch.index-120), lastMatch.index+120);
    const dateMatch = slice.match(/(\d{4}-\d{2}-\d{2})/);
    return [{ id, sentDate: dateMatch ? dateMatch[0] : '', respondedDate:'', note: slice.trim() }];
  }

  return [];
}

// ===== BUILD HEADER INDEX =====
function buildHeaderIndex(headers) {
  const map = {};
  (headers || []).forEach((h, i) => {
    const key = (h || '').toString().trim();
    if (key) map[key] = i;
  });
  return map;
}
// ===== DATE FORMATTER (MALAYSIA - GMT+8) =====
function fmtDateToDisplay(d) {
  if (!d) return '';

  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';

  return dt.toLocaleDateString('ms-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
function toggleSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('hidden');
}
function getYearFromDate(d) {
  if (!d) return '';
  const x = new Date(d);
  if (isNaN(x)) return '';
  return String(x.getFullYear());
}
