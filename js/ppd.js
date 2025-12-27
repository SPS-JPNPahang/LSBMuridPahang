/**
 * LAWATAN MURID SAMBIL BELAJAR - PPD Module (VIEWER ONLY)
 * JPN Pahang
 */

// ===== LOAD PPD REQUESTS =====
async function loadPPDRequests(){
  if (!ppdSecret || !ppdDistrict) {
    $('ppdNewTable').innerHTML = '<p class="p-4 text-gray-500 italic">Sila log masuk PPD</p>';
    $('ppdReviewedTable').innerHTML = '<p class="p-4 text-gray-500 italic">Sila log masuk PPD</p>';
    return;
  }

  try {
    showLoading();
    const url = CONFIG.GAS_URL + '?action=listRequests&secret=' + encodeURIComponent(ppdSecret) + '&district=' + encodeURIComponent(ppdDistrict);
    const res = await fetch(url);
    const j = await res.json();
    hideLoading();

    if (!j.ok) {
      await Swal.fire({icon:'error', title:'Gagal', text:j.message||'Error'});
      return;
    }

    const allRequests = j.requests || [];
    const newReqs = [];
    const reviewedReqs = [];

    allRequests.forEach(req => {
      const s = String(req['Status'] || '').toUpperCase();
      if (s.indexOf('REVIEWED') > -1 || s.indexOf('PREAPPROVED') > -1 || s.indexOf('READY_FOR_DP') > -1 || s.indexOf('FINAL_APPROVED') > -1) {
        reviewedReqs.push(req);
      } else {
        newReqs.push(req);
      }
    });

    renderPPDTable('ppdNewTable', newReqs);
    renderPPDTable('ppdReviewedTable', reviewedReqs);

  } catch (err) {
    hideLoading();
    console.error('PPD load error:', err);
    Swal.fire({icon:'error', title:'Ralat sambungan', text:err.message||''});
  }
}

// ===== RENDER PPD TABLE (VIEWER ONLY - NO ACTION BUTTONS) =====
function renderPPDTable(containerId, requests) {
  const container = $(containerId);
  if (!container) return;

  container.innerHTML = '';

  if (!requests || !requests.length) {
    container.innerHTML = '<p class="p-4 text-gray-500 italic">Tiada permohonan.</p>';
    return;
  }

  const rows = requests
    .slice()
    .sort((a,b)=>{
      const da = new Date(a['Submission Time']||0);
      const db = new Date(b['Submission Time']||0);
      return db - da;
    })

    .map(req=>({
      'Kod Sekolah': req['School Code'] || '',
      'Nama Sekolah': req['School Name'] || '',
      'Kategori': req['Category'] || '',
      'Tarikh Permohonan': fmtDateToDisplay(req['Submission Time']),
      'Tarikh Lawatan Bermula': fmtDateToDisplay(req['Travel Start']),
      'Status': req['Status'] || '',
      'Tindakan': `
        <button data-id="${req['Request ID']}"
          class="ppd-view-files px-2 py-1 bg-blue-600 text-white rounded text-xs">
          👁️ Lihat Fail
        </button>`
    }));

  container.appendChild(makeTable(rows, Object.keys(rows[0])));

  container.querySelectorAll('.ppd-view-files').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id;
      const req = requests.find(r=>r['Request ID']===id);
      if (req) showPPDRequestDetails(req);
    });
  });
}

function showPPDRequestDetails(req) {
  const infoHtml = `
    <div style="text-align:left;line-height:1.6">
      <h3 style="font-weight:700;margin-bottom:6px">📄 Maklumat Permohonan</h3>
      <p><b>Request ID:</b> ${req['Request ID'] || '-'}</p>
      <p><b>Kod Sekolah:</b> ${req['School Code'] || '-'}</p>
      <p><b>Nama Sekolah:</b> ${req['School Name'] || '-'}</p>
      <p><b>Daerah:</b> ${req['Daerah'] || '-'}</p>
      <p><b>Tarikh Permohonan:</b> ${fmtDateToDisplay(req['Submission Time'])}</p>
      <p><b>Tarikh Lawatan:</b> ${fmtDateToDisplay(req['Travel Start'])} – ${fmtDateToDisplay(req['Travel End'])}</p>
      <p><b>Bil Murid:</b> ${req['BM'] || '-'}</p>
      <p><b>Bil Pengiring:</b> ${req['BP'] || '-'}</p>
      <p><b>Status:</b> <strong>${req['Status'] || '-'}</strong></p>
    </div>
  `;

  const filePairs = [
    { label:'Kertas Kerja / Cadangan', raw:req['File_KERTAS_KERJA'] },
    { label:'Lampiran A', raw:req['File_MAKLUMAT_ANGGOTA'] },
    { label:'Permit / Lesen Kenderaan', raw:req['File_PERMIT_BAS'] },
    { label:'Lesen Memandu', raw:req['File_LESEN_PEMANDU'] },
    { label:'Intipati Taklimat', raw:req['File_TAKLIMAT'] }
  ];

  const filesHtml = `
    <div style="margin-top:16px;text-align:left">
      <h3 style="font-weight:700;margin-bottom:6px">📎 Dokumen Dimuat Naik</h3>
      ${filePairs.map(fp => {
        const urls = String(fp.raw || '')
          .split(/\s*;\s*/)
          .filter(Boolean);

        if (urls.length === 0) {
          return `<p>• <b>${fp.label}</b>: <em>Tiada fail</em></p>`;
        }

        return `
          <p><b>${fp.label}</b>:</p>
          <ul style="margin-left:16px">
            ${urls.map((u,i)=>`
              <li>
                <a href="${u}" target="_blank" style="color:#2563eb;text-decoration:underline">
                  Buka PDF ${urls.length>1 ? `(${i+1})` : ''}
                </a>
              </li>
            `).join('')}
          </ul>
        `;
      }).join('')}
    </div>
  `;

  Swal.fire({
    title: 'Butiran Permohonan',
    html: infoHtml + filesHtml,
    width: 900,
    showCloseButton: true,
    confirmButtonText: 'Tutup'
  });
}

// ===== INITIALIZE PPD MODULE =====
function initializePPD() {
  // PPD module is ready (auth handlers in auth.js)
} 
