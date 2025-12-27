/**
 * LAWATAN MURID SAMBIL BELAJAR - Deputy Director (Timbalan Pengarah) Module
 * JPN Pahang
 */

// ===== LOAD DP LIST =====
async function loadDpList(){
  if (!dpSecret) {
    $('dpRequestsTable').innerHTML = `<p class="p-4 text-gray-500 italic">Sila log masuk Timbalan untuk melihat senarai permohonan.</p>`;
    return;
  }
  try {
    showLoading();
    const res = await fetch(CONFIG.GAS_URL + '?action=listRequests&secret=' + encodeURIComponent(dpSecret));
    const j = await res.json();
    hideLoading();

    if (!j.ok) {
      $('dpRequestsTable').innerHTML = `<p class="p-4 text-red-500">${j.message||'Gagal'}</p>`;
      return;
    }

    const requests = (j.requests || []).filter(req => {
      const s = String(req['Status'] || '').toUpperCase();
      return s.indexOf('PREAPPROVED') > -1 || s.indexOf('READY_FOR_DP') > -1 || s.indexOf('REVIEWED_FOR_TP') > -1;
    });

    if (requests.length === 0) {
      $('dpRequestsTable').innerHTML = `<p class="p-4 text-gray-500 italic">Tiada permohonan menunggu kelulusan Timbalan.</p>`;
      return;
    }

    const rows = [];
    requests.forEach(req => {
      const id = req['Request ID'] || '';
      const kodSek = req['School Code'] || req['SchoolCode'] || req['schoolCode'] || '';
      const school = req['School Name'] || req['SchoolName'] || req['schoolName'] || '';
      const category = req['Category'] || req['category'] || '';

      let lnRaw = req['LeaderNames'] || req['LeaderName'] || req['leaderNames'] || '';
      let lpRaw = req['LeaderPhones'] || req['LeaderPhone'] || req['leaderPhones'] || '';
      let lnArr = [], lpArr = [];
      try {
        if (typeof lnRaw === 'string' && lnRaw.trim().startsWith('[')) lnArr = JSON.parse(lnRaw);
        else if (Array.isArray(lnRaw)) lnArr = lnRaw;
        else if (lnRaw) lnArr = [lnRaw];
      } catch(e){ lnArr = Array.isArray(lnRaw)? lnRaw: (lnRaw? [lnRaw]:[]); }
      try {
        if (typeof lpRaw === 'string' && lpRaw.trim().startsWith('[')) lpArr = JSON.parse(lpRaw);
        else if (Array.isArray(lpRaw)) lpArr = lpArr;
        else if (lpRaw) lpArr = [lpRaw];
      } catch(e){ lpArr = Array.isArray(lpRaw)? lpRaw: (lpRaw? [lpRaw]:[]); }

      const namaKetuaDisplay = lnArr.map(x=>String(x).trim()).filter(Boolean).join('<br/>');
      const noTelDisplay = lpArr.map(x=>String(x).trim()).filter(Boolean).join('<br/>');

      const travelStart = req['Travel Start'] || req['TravelStart'] || req['travelStart'] || '';
      const status = req['Status'] || '';

      const actions = `<div class="flex gap-2">
        <button data-id="${id}" class="dp-view-files px-2 py-1 border rounded text-xs hover:bg-gray-100">INFO</button>
        <button data-id="${id}" class="dp-approve px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Lulus & Hantar Surat</button>
      </div>`;

      rows.push({
        'Kod Sekolah': kodSek,
        'Nama Sekolah': school,
        'Nama Ketua': namaKetuaDisplay,
        'No Tel Ketua': noTelDisplay,
        'Kategori': category,
        'Tarikh': fmtDateToDisplay(travelStart),
        'Status': status,
        'Tindakan': actions
      });
    });

    $('dpRequestsTable').innerHTML = '';
    const cols = ['Kod Sekolah','Nama Sekolah','Nama Ketua','No Tel Ketua','Kategori','Tarikh','Status','Tindakan'];
    $('dpRequestsTable').appendChild(makeTable(rows, cols));

    // Attach handlers
    // ===== GUNA PAPARAN INFO SAMA SEPERTI PEGAWAI =====
document.querySelectorAll('.dp-view-files').forEach(btn => {
  btn.addEventListener('click', async (ev) => {
    const id = ev.currentTarget.dataset.id;

    // Cari rekod penuh (guna data yang sama)
    const req = requests.find(r => String(r['Request ID']) === String(id));
    if (!req) {
      return Swal.fire({ icon:'error', title:'Rekod tidak ditemui' });
    }

    // PINJAM terus logik paparan Pegawai
    // (salin minimum dari officer.js – view sahaja)
    const infoHtml = `
      <div style="text-align:left;line-height:1.6">
        <h3 style="font-weight:700;margin-bottom:6px">📄 Maklumat Permohonan</h3>
        <p><b>Request ID:</b> ${req['Request ID'] || '-'}</p>
        <p><b>Kod Sekolah:</b> ${req['School Code'] || '-'}</p>
        <p><b>Nama Sekolah:</b> ${req['School Name'] || '-'}</p>
        <p><b>Tarikh Lawatan:</b>
          ${fmtDateToDisplay(req['Travel Start'])} – ${fmtDateToDisplay(req['Travel End'])}
        </p>
        <p><b>Status:</b> <strong>${req['Status'] || '-'}</strong></p>
      </div>
    `;

    const filePairs = [
      { label:'Kertas Kerja / Cadangan', raw:req['File_KERTAS_KERJA'] },
      { label:'Lampiran A', raw:req['File_MAKLUMAT_ANGGOTA'] },
      { label:'Permit / Lesen Kenderaan', raw:req['File_PERMIT_BAS'] },
      { label:'Lesen Memandu & Vokasional', raw:req['File_LESEN_PEMANDU'] },
      { label:'Intipati Taklimat Keselamatan', raw:req['File_TAKLIMAT'] }
    ];

    const filesHtml = `
      <div style="margin-top:16px;text-align:left">
        <h3 style="font-weight:700;margin-bottom:6px">📎 Dokumen Dimuat Naik</h3>
        ${filePairs.map(fp=>{
          const urls = String(fp.raw||'').split(/\s*;\s*/).filter(Boolean);
          if (urls.length === 0) {
            return `<p>• <b>${fp.label}</b>: <em>Tiada fail</em></p>`;
          }
          return `
            <p><b>${fp.label}</b>:</p>
            <ul style="margin-left:16px">
              ${urls.map((u,i)=>`
                <li>
                  <a href="${u}" target="_blank" style="color:#2563eb;text-decoration:underline">
                    Buka PDF ${urls.length>1?`(${i+1})`:''}
                  </a>
                </li>
              `).join('')}
            </ul>
          `;
        }).join('')}
      </div>
    `;

    await Swal.fire({
      title: 'Butiran Permohonan',
      html: infoHtml + filesHtml,
      width: 900,
      showCloseButton: true,
      confirmButtonText: 'Tutup'
    });
  });
});


    document.querySelectorAll('.dp-approve').forEach(btn => {
      btn.addEventListener('click', async (ev) => {
        const id = ev.currentTarget.dataset.id;
        const req = requests.find(r => String(r['Request ID']) === String(id));
        if (!req) return Swal.fire({icon:'error', title:'Tidak jumpa rekod'});

        const targetBtn = ev.currentTarget;
        targetBtn.disabled = true;
        const origText = targetBtn.textContent;
        targetBtn.textContent = 'Processing...';

        try {
          const ok = await Swal.fire({
            title: 'Lulus Permohonan?',
            html: `<p>Adakah anda pasti untuk meluluskan permohonan <strong>${req['School Name']||''}</strong>?</p>
                   <p class="text-sm text-gray-600 mt-2">Sistem akan menjana surat kelulusan dan menghantar kepada sekolah.</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Lulus',
            cancelButtonText: 'Batal'
          });

          if (!ok.isConfirmed) {
            targetBtn.disabled = false;
            targetBtn.textContent = origText;
            return;
          }

          showLoading();
          const url = CONFIG.GAS_URL + '?action=finalApprove&id=' + encodeURIComponent(id) + '&secret=' + encodeURIComponent(dpSecret);
          const res = await fetch(url);
          const j = await res.json();
          hideLoading();

          if (!j || !j.ok) {
            await Swal.fire({icon:'error', title:'Gagal', text:j.message||'Error'});
            targetBtn.disabled = false;
            targetBtn.textContent = origText;
            return;
          }

          await Swal.fire({
            icon:'success',
            title:'Permohonan Diluluskan',
            html: j.letterUrl ? `<p>Surat kelulusan telah dijana.</p><a href="${j.letterUrl}" target="_blank" class="text-blue-600 underline">Buka Surat</a>` : 'Surat kelulusan telah dijana.',
            timer: 2000,
            showConfirmButton: false
          });

          await loadDpList();

        } catch (err) {
          hideLoading();
          console.error('DP approve error:', err);
          await Swal.fire({icon:'error', title:'Ralat', text:err.message||''});
          targetBtn.disabled = false;
          targetBtn.textContent = origText;
        }
      });
    });

  } catch (err) {
    hideLoading();
    console.error('DP load error:', err);
    Swal.fire({icon:'error', title:'Ralat sambungan', text:err.message||''});
  }
}

// ===== BULK APPROVE =====
async function setupBulkApprove() {
  const btn = $('bulkApproveBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    if (!dpSecret) {
      return Swal.fire({icon:'warning', title:'Sila log masuk Timbalan dahulu'});
    }

    const { value: idsText } = await Swal.fire({
      title: 'Bulk Approve',
      html: `
        <p style="text-align:left;margin-bottom:8px">Masukkan Request IDs yang hendak diluluskan sekaligus (satu ID per baris):</p>
        <textarea id="swal_bulkIds" class="swal2-textarea" placeholder="LSBM-2025-001
LSBM-2025-002
LSBM-2025-003" style="height:200px;font-family:monospace"></textarea>
      `,
      showCancelButton: true,
      confirmButtonText: 'Lulus Semua',
      preConfirm: () => {
        const val = (document.getElementById('swal_bulkIds')||{}).value || '';
        if (!val.trim()) {
          Swal.showValidationMessage('Sila masukkan sekurang-kurangnya satu Request ID');
          return false;
        }
        return val;
      }
    });

    if (!idsText) return;

    const ids = idsText.split('\n').map(s=>s.trim()).filter(Boolean);
    if (ids.length === 0) {
      return Swal.fire({icon:'warning', title:'Tiada ID', text:'Sila masukkan sekurang-kurangnya satu Request ID'});
    }

    const confirm = await Swal.fire({
      title: 'Sahkan Bulk Approve',
      html: `<p>Anda akan meluluskan <strong>${ids.length}</strong> permohonan sekaligus:</p>
             <ul style="text-align:left;max-height:200px;overflow:auto">${ids.map(id=>`<li>${id}</li>`).join('')}</ul>
             <p class="text-sm text-gray-600 mt-2">Sistem akan menjana surat untuk setiap permohonan.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lulus Semua',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    showLoading();
    try {
      const url = CONFIG.GAS_URL + '?action=bulkApprove&ids=' + encodeURIComponent(ids.join(',')) + '&secret=' + encodeURIComponent(dpSecret);
      const res = await fetch(url);
      const j = await res.json();
      hideLoading();

      if (!j || !j.ok) {
        await Swal.fire({icon:'error', title:'Gagal', text:j.message||'Error'});
        return;
      }

      const results = j.results || [];
      const success = results.filter(r=>r.ok).length;
      const failed = results.filter(r=>!r.ok).length;

      let html = `<p><strong>${success}</strong> permohonan berjaya diluluskan.</p>`;
      if (failed > 0) {
        html += `<p class="text-red-600"><strong>${failed}</strong> permohonan gagal.</p>`;
        html += `<ul style="text-align:left;max-height:150px;overflow:auto;font-size:0.9em">`;
        results.filter(r=>!r.ok).forEach(r=>{
          html += `<li>${r.id}: ${r.message||'Error'}</li>`;
        });
        html += `</ul>`;
      }

      await Swal.fire({
        icon: failed > 0 ? 'warning' : 'success',
        title: 'Bulk Approve Selesai',
        html: html
      });

      await loadDpList();

    } catch (err) {
      hideLoading();
      console.error('Bulk approve error:', err);
      Swal.fire({icon:'error', title:'Ralat', text:err.message||''});
    }
  });
}

// ===== INITIALIZE DEPUTY MODULE =====
function initializeDeputy() {
  setupBulkApprove();
}
