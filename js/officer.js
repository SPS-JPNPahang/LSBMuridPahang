/**
 * LAWATAN MURID SAMBIL BELAJAR - Officer Module
 * JPN Pahang
 */

// ===== GET LATEST LETTER INFO (MAX JILID, THEN MAX BIL) =====
function getLatestLetterInfo(data) {
  let maxJilid = 0;
  let maxBil = 0;
  
  data.forEach(req => {
    const jilid = parseInt(req['LetterJilid'] || '0', 10);
    const bil = parseInt(req['LetterNo'] || '0', 10);
    
    if (jilid > maxJilid) {
      maxJilid = jilid;
      maxBil = bil;
    } else if (jilid === maxJilid && bil > maxBil) {
      maxBil = bil;
    }
  });
  
  return {
    jilid: maxJilid || '-',
    bil: maxBil || '-'
  };
}

// ===== LOAD REQUESTS =====
async function loadRequests(){
  if (!officerSecret) {
    if (requestsCache && requestsCache.length) { renderTablesFromCache(); return; }
    return Swal.fire({icon:'warning',title:'Sila log masuk dahulu.'});
  }
  try {
    showLoading();
    const res = await fetch(CONFIG.GAS_URL + '?action=listRequests&secret=' + encodeURIComponent(officerSecret));
    const j = await res.json();
    hideLoading();
    if (!j.ok) return Swal.fire({icon:'error',title:'Gagal',text:j.message||''});
    const requests = j.requests || [];
    requestsCache = requests;
    renderTablesFromCache();
  } catch (err) { 
    hideLoading(); 
    Swal.fire({icon:'error',title:'Ralat',text:err.message||''}); 
  }
}

// ===== RENDER TABLES =====
function renderTablesFromCache(){
  const requests = requestsCache || [];

  const selCategory = $('filterCategory')?.value || '';
  const selStatus = $('filterStatus')?.value || '';
  const search = ($('searchBox')?.value || '').toLowerCase();
  const selYear = $('filterYear')?.value || '';

  const newRows = [];
  const queryRows = [];
  const approvedRows = [];

  requests
    .slice()
    .sort((a, b) => {
      const da = new Date(a['Submission Time'] || 0);
      const db = new Date(b['Submission Time'] || 0);
      return db - da; // TERKINI MASUK DI ATAS
    })

    .forEach(req=>{
      const status = String(req['Status']||'').toUpperCase();
      const category = req['Category'] || '';
      const school = String(req['School Name']||'').toLowerCase();
      const code = String(req['School Code']||'').toLowerCase();
      const submissionTime = req['Submission Time'] || '';
      const travelStart = req['Travel Start'] || '';

      const year = submissionTime
        ? new Date(submissionTime).getFullYear().toString()
        : '';


      // FILTER
      if (selCategory && category !== selCategory) return;
      if (selStatus && !status.includes(selStatus)) return;
      if (selYear && year !== selYear) return;
      if (search && !school.includes(search) && !code.includes(search)) return;

// ===== DYNAMIC TINDAKAN BUTTONS & SURAT LINK BASED ON STATUS =====
      let tindakanButtons = '';
      let suratLink = '-';
      
      if (status.includes('FINAL_APPROVED')) {
        // FINAL_APPROVED: Show letter link + PDF only
        const letters = req['Letters'] || req['letters'] || '';
        
        if (letters) {
          const letterUrls = String(letters).split(/\s*;\s*/).filter(Boolean);
          
          if (letterUrls.length > 0) {
            const letterLinks = letterUrls.map((url, idx) => {
              const label = letterUrls.length > 1 ? `📄 Surat ${idx + 1}` : '📄 Surat Kelulusan';
              return `<a href="${url}" target="_blank" class="text-blue-600 underline text-xs">${label}</a>`;
            }).join('<br>');
            
            suratLink = letterLinks;
          }
        }
        
        tindakanButtons = `
          <button data-id="${req['Request ID']}" class="view-files px-2 py-1 bg-pink-500 text-white rounded text-xs">INFO</button>
        `;
        
      } else if (status.includes('REVIEWED_FOR_TP')) {
        // REVIEWED_FOR_TP: PDF only (waiting TP approval)
        tindakanButtons = `
          <button data-id="${req['Request ID']}" class="view-files px-2 py-1 bg-pink-500 text-white rounded text-xs">INFO</button>
        `;
        
      } else if (status === 'QUERY') {
        // QUERY: PDF only (waiting school response)
        tindakanButtons = `
          <button data-id="${req['Request ID']}" class="view-files px-2 py-1 bg-pink-500 text-white rounded text-xs">INFO</button>
        `;
        
      } else {
        // NEW / QUERY_RESPONDED: Show all action buttons
        tindakanButtons = `
          <button data-id="${req['Request ID']}" class="view-files px-2 py-1 bg-pink-500 text-white rounded text-xs">INFO</button>
          <button data-id="${req['Request ID']}" class="btn-query px-2 py-1 bg-yellow-400 rounded text-xs">Query</button>
          <button data-id="${req['Request ID']}" class="btn-preapprove px-2 py-1 bg-green-600 text-white rounded text-xs">SAHKAN</button>
        `;
      }

      const row = {
        'Kod Sekolah': req['School Code'] || '',
        'Nama Sekolah': req['School Name'] || '',
        'Nama Ketua': (req['LeaderNames'] || '').replace(/[\[\]"]/g,''),
        'No Tel Ketua': (req['LeaderPhones'] || '').replace(/[\[\]"]/g,''),
        'Kategori': category,
        'Tarikh Permohonan': fmtDateToDisplay(submissionTime),
        'Tarikh Lawatan Bermula': fmtDateToDisplay(travelStart),
        'Status': status,
        'Surat': suratLink,
        'Tindakan': tindakanButtons
      };

      // ===== PUSH TO CORRECT TABLE =====
      if (status === 'QUERY') {
        queryRows.push(row);
        
      } else if (
        status === 'QUERY_RESPONDED' ||
        status === 'NEW'
      ) {
        newRows.push(row);
        
      } else if (
        status.includes('FINAL_APPROVED') ||
        status.includes('REVIEWED_FOR_TP')
      ) {
        approvedRows.push(row);
        
      } else {
        newRows.push(row);
      }

    });
 // ===== MAKLUMAN BOX - OUTSIDE ALL TABLES =====
  const latestLetter = getLatestLetterInfo(requestsCache || []);
  
  const existingMakluman = document.getElementById('maklumanBox');
  if (existingMakluman) existingMakluman.remove();
  
  const contentDiv = document.getElementById('content');
  const firstCollapsible = contentDiv?.querySelector('.collapse-header');
  
  if (contentDiv && firstCollapsible) {
    const maklumanBox = document.createElement('div');
    maklumanBox.id = 'maklumanBox';
    maklumanBox.className = 'bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r';
    maklumanBox.innerHTML = `
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-yellow-800">
            <strong>MAKLUMAN:</strong> Surat Kelulusan Terkini 
            <span class="font-bold">JILID ${latestLetter.jilid}</span> & 
            <span class="font-bold">BIL ${latestLetter.bil}</span>
          </p>
        </div>
      </div>
    `;
    
    contentDiv.insertBefore(maklumanBox, firstCollapsible);
  }
  $('tableNew').innerHTML = '';
  $('tableQuery').innerHTML = '';
  $('tableApproved').innerHTML = '';

  if (newRows.length) $('tableNew').appendChild(makeTable(newRows, Object.keys(newRows[0])));
  if (queryRows.length) $('tableQuery').appendChild(makeTable(queryRows, Object.keys(queryRows[0])));
  if (approvedRows.length) $('tableApproved').appendChild(makeTable(approvedRows, Object.keys(approvedRows[0])));

  // ===== UPDATE COUNTER =====
  $('countNew').textContent = newRows.length;
  $('countQuery').textContent = queryRows.length;
  $('countApproved').textContent = approvedRows.length;

  attachOfficerEventHandlers();
}
// ===== ATTACH EVENT HANDLERS =====
function attachOfficerEventHandlers() {
        document.querySelectorAll('.view-files').forEach(btn=>{
        btn.addEventListener('click', async (ev)=>{
          const id = ev.currentTarget.dataset.id;
          const req = (requestsCache || []).find(r => String(r['Request ID']) === String(id));
          if (!req) {
            return Swal.fire({ icon:'error', title:'Rekod tidak ditemui' });
          }

          // ===== RINGKASAN PERMOHONAN =====
          const infoHtml = `
            <div style="text-align:left;line-height:1.6">
              <h3 style="font-weight:700;margin-bottom:6px">📄 Maklumat Permohonan</h3>
              <p><b>Request ID:</b> ${req['Request ID'] || '-'}</p>
              <p><b>Kod Sekolah:</b> ${req['School Code'] || '-'}</p>
              <p><b>Nama Sekolah:</b> ${req['School Name'] || '-'}</p>
              <p><b>Daerah:</b> ${req['Daerah'] || '-'}</p>
              <p><b>Tarikh Lawatan:</b> ${fmtDateToDisplay(req['Travel Start'])} – ${fmtDateToDisplay(req['Travel End'])}</p>
              <p><b>Bil Murid:</b> ${req['BM'] || '-'}</p>
              <p><b>Bil Pengiring:</b> ${req['BP'] || '-'}</p>
              <p><b>Status:</b> <strong>${req['Status'] || '-'}</strong></p>
            </div>
          `;

          // ===== CATATAN PEGAWAI (JIKA QUERY) =====
          let historyHtml = '';
            if (req['QueryHistory']) {
              historyHtml = `
                <div style="margin-top:14px;padding:10px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;text-align:left">
                  <b>🕘 Sejarah Query Pegawai</b>
                  <pre style="margin-top:6px;font-size:0.85em;white-space:pre-wrap">
            ${req['QueryHistory']}
                  </pre>
                </div>
              `;
            }


          // ===== FAIL PDF =====
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
                let urls = String(fp.raw||'').split(/\s*;\s*/).filter(Boolean);
                    // TAPIS: hanya PDF yang telah dicop
                    if (fp.onlyStamped) {
                      urls = urls.filter(u => /COP|DISEMAK|STAMP/i.test(u));
                    }

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
            html: infoHtml + historyHtml + filesHtml,
            width: 900,
            showCloseButton: true,
            confirmButtonText: 'Tutup'
          });
        });
      });


  document.querySelectorAll('.btn-query').forEach(btn=>{
    btn.addEventListener('click', async ev=>{
      const id = ev.currentTarget.dataset.id;
      const targetBtn = ev.currentTarget;
      targetBtn.disabled = true;
      const origText = targetBtn.textContent;
      targetBtn.textContent = 'Processing...';
      
      try {
        const { value: note } = await Swal.fire({ 
          title:'Catatan (kenapa query):', 
          input:'textarea', 
          inputPlaceholder:'Tulis sebab...', 
          showCancelButton:true, 
          confirmButtonText:'Hantar Query' 
        });
        if (!note) return;
        const req = (requestsCache || []).find(r => String(r['Request ID']) === String(id));
        const pic = req?.Category || req?.category || 'Menengah';

        const ok = await sendOfficerAction(id,'query', note, pic);

        if (ok && officerSecret) await loadRequests();
      } finally {
        targetBtn.disabled = false;
        targetBtn.textContent = origText;
      }
    });
  });

  document.querySelectorAll('.btn-preapprove').forEach(btn=>{
    btn.addEventListener('click', async ev=>{
      const id = ev.currentTarget.dataset.id;
      const req = (requestsCache || []).find(r => String(r['Request ID']) === String(id));
      if (!req) return Swal.fire({ icon:'error', title:'Tidak jumpa rekod' });
      
      const targetBtn = ev.currentTarget;
      targetBtn.disabled = true;
      const origText = targetBtn.textContent;
      targetBtn.textContent = 'Processing...';
      
      try {
        const { value: formValues } = await Swal.fire({
          title: 'Semak & Hantar kepada Timbalan',
          html: `
            <div style="text-align:left">
              <label for="swal_noJilid" style="font-weight:600;margin-bottom:4px;display:block">No Jilid (contoh: 24)</label>
              <input id="swal_noJilid" class="swal2-input" placeholder="No Jilid (contoh: 24)">

              <label for="swal_bilSurat" style="font-weight:600;margin-bottom:4px;display:block">Bil Surat (contoh: 25)</label>
              <input id="swal_bilSurat" class="swal2-input" placeholder="Bil Surat (contoh: 25)">

              <label for="swal_tarikhSurat" style="font-weight:600;margin-bottom:4px;display:block">Tarikh Surat</label>
              <input id="swal_tarikhSurat" type="date" class="swal2-input" value="${new Date().toISOString().slice(0,10)}">

              <label for="swal_note" style="font-weight:600;margin-bottom:4px;display:block;margin-top:8px">Catatan pendek untuk Timbalan (pilihan)</label>
              <textarea id="swal_note" class="swal2-textarea" placeholder="Catatan pendek untuk Timbalan (pilihan)..."></textarea>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: 'Seterusnya →',
          cancelButtonText: 'Batal',
          preConfirm: () => {
            const noJ = (document.getElementById('swal_noJilid')||{}).value.trim();
            const bil = (document.getElementById('swal_bilSurat')||{}).value.trim();
            const tar = (document.getElementById('swal_tarikhSurat')||{}).value;
            const note = (document.getElementById('swal_note')||{}).value.trim();

            if (!noJ || !bil) {
              Swal.showValidationMessage('Sila isi sekurang-kurangnya No Jilid dan Bil Surat');
              return false;
            }
            return { noJilid: noJ, bilSurat: bil, tarikhSurat: tar, note };
          }
        });

        if (!formValues) {
          targetBtn.disabled = false;
          targetBtn.textContent = origText;
          return;
        }

        const { value: wantStamp } = await Swal.fire({
          title: 'Tambah Cop Pada PDF?',
          html: `
            <p>Adakah anda mahu menambah cop rasmi pada PDF sebelum hantar ke Timbalan?</p>
            <p style="font-size:0.9em;color:#666;margin-top:8px">
              <strong>Cop akan ditambah pada:</strong><br/>
              • KERTAS KERJA / CADANGAN<br/>
              • LAMPIRAN A<br/>
              • Semua mukasurat dalam setiap PDF
            </p>
          `,
          icon: 'question',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: 'Ya, Tambah Cop',
          denyButtonText: 'Tidak, Terus Hantar',
          cancelButtonText: 'Batal'
        });

        if (wantStamp === undefined) {
          targetBtn.disabled = false;
          targetBtn.textContent = origText;
          return;
        }

        const composedNote = `No Jilid: ${formValues.noJilid}, Bil: ${formValues.bilSurat}, Tarikh: ${formValues.tarikhSurat || '-'}, ${formValues.note ? ' | Catatan: ' + formValues.note : ''}`;

        function toIsoDateIfNeeded(s) {
          if (!s) return '';
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
          const cleaned = s.replace(/\//g, '-');
          const parts = cleaned.split('-');
          if (parts.length === 3) {
            const dd = parts[0].padStart(2,'0'), mm = parts[1].padStart(2,'0'), yyyy = parts[2];
            return `${yyyy}-${mm}-${dd}`;
          }
          return s;
        }

        const backendOptions = {
          letterJilid: formValues.noJilid || '',
          letterNo: formValues.bilSurat || '',
          letterDate: toIsoDateIfNeeded(formValues.tarikhSurat || '')
        };

        if (wantStamp === true) {
          showLoading();
          
          try {
            const filesToStamp = [
              { label: 'KERTAS KERJA/CADANGAN', url: req['File_KERTAS_KERJA'] || req['kertasKerjaUrl'] || '' },
              { label: 'LAMPIRAN A', url: req['File_MAKLUMAT_ANGGOTA'] || req['maklumatAnggotaUrl'] || '' }
            ].filter(f => f.url);

            if (filesToStamp.length === 0) {
              hideLoading();
              await Swal.fire({
                icon: 'warning',
                title: 'Tiada PDF',
                text: 'Tiada PDF untuk dicop. Sistem akan teruskan tanpa cop.'
              });
            } else {
              let stampImageFile = null;
              try {
                const stampUrl = 'https://sps-jpnpahang.github.io/LSBMuridPahang/images/cop_jpnpahang.png';
                const stampResp = await fetch(stampUrl);
                const stampBlob = await stampResp.blob();
                stampImageFile = new File([stampBlob], 'cop_jpnpahang.png', { type: 'image/png' });
              } catch (e) {
                console.log('Failed to load stamp, using text only:', e);
              }

              for (const fileInfo of filesToStamp) {
                try {
                  const urls = fileInfo.url.split(/\s*;\s*/).filter(Boolean);
                  if (urls.length === 0) continue;
                  const firstUrl = urls[0];

                  const driveFile = await fetchDriveFileAsFile(firstUrl);
                  
                  const res = await annotatePdfAndUpload({
                    requestId: id,
                    fileBlobOrFile: driveFile,
                    stampText: '',
                    stampImageFile: stampImageFile,
                    sourceLabel: fileInfo.label
                  });

                  if (!res || !res.ok) {
                    console.error('Failed to stamp:', fileInfo.label, res);
                  }
                } catch (err) {
                  console.error('Error stamping:', fileInfo.label, err);
                }
              }

              hideLoading();
              await Swal.fire({
                icon: 'success',
                title: 'Cop Berjaya Ditambah',
                text: `${filesToStamp.length} PDF telah dicop dan disimpan.`,
                timer: 1500,
                showConfirmButton: false
              });
            }
          } catch (err) {
            hideLoading();
            console.error('Stamping error:', err);
            await Swal.fire({
              icon: 'error',
              title: 'Ralat Cop',
              text: 'Gagal tambah cop. Sistem akan teruskan tanpa cop.'
            });
          }
        }

        showLoading();
        const ok = await sendOfficerAction(id, 'preapprove', composedNote, 'TP', backendOptions);
        hideLoading();

        if (!ok) {
          targetBtn.disabled = false;
          targetBtn.textContent = origText;
          return;
        }

        await Swal.fire({
          icon: 'success',
          title: 'Maklumat disimpan',
          text: 'Permohonan telah dihantar ke Timbalan untuk tindakan.',
          timer: 1400,
          showConfirmButton: false
        });

        if (officerSecret) await loadRequests();
        else renderTablesFromCache();

      } catch (err) {
        hideLoading();
        console.error('Preapprove error:', err);
        await Swal.fire({
          icon: 'error',
          title: 'Ralat',
          text: err.message || String(err)
        });
      } finally {
        targetBtn.disabled = false;
        targetBtn.textContent = origText;
      }
    });
  });
}

// ===== SEND OFFICER ACTION =====
async function sendOfficerAction(id, type, note = '', pic = 'Menengah', options = {}) {
  if (!officerSecret) {
    return Swal.fire({ icon: 'warning', title: 'Sila log masuk sebagai Pegawai untuk tindakan ini.' });
  }
  showLoading();

  let url = CONFIG.GAS_URL + '?action=officerAction' +
            '&id=' + encodeURIComponent(id) +
            '&type=' + encodeURIComponent(type) +
            '&note=' + encodeURIComponent(note) +
            '&pic=' + encodeURIComponent(pic) +
            '&secret=' + encodeURIComponent(officerSecret);

  if (options.letterJilid !== undefined && options.letterJilid !== null && String(options.letterJilid).length) {
    url += '&letterJilid=' + encodeURIComponent(options.letterJilid);
  }
  if (options.letterNo !== undefined && options.letterNo !== null && String(options.letterNo).length) {
    url += '&letterNo=' + encodeURIComponent(options.letterNo);
  }
  if (options.letterDate !== undefined && options.letterDate !== null && String(options.letterDate).length) {
    url += '&letterDate=' + encodeURIComponent(options.letterDate);
  }

  try {
    const r = await fetch(url);
    const j = await r.json();
    hideLoading();
    if (!j || !j.ok) {
      console.error('sendOfficerAction failed', j);
      Swal.fire({ icon: 'error', title: 'Tindakan gagal', text: (j && j.message) ? j.message : 'Server returned error' });
      return false;
    }
    return true;
  } catch (err) {
    hideLoading();
    console.error('sendOfficerAction catch', err);
    Swal.fire({ icon: 'error', title: 'Ralat Sambungan', text: String(err) });
    return false;
  }
}

// ===== FILTER HANDLERS =====
function setupOfficerFilters() {
  ['filterCategory','filterStatus','filterYear','searchBox'].forEach(id=>{
    const el = $(id);
    if (el) el.addEventListener('input', renderTablesFromCache);
    if (el) el.addEventListener('change', renderTablesFromCache);
  });
}
function setupCollapseHeaders() {
  document.querySelectorAll('.collapse-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const content = document.getElementById(targetId);
      const arrow = btn.querySelector('.arrow');

      if (!content) return;

      const isHidden = content.classList.contains('hidden');
      content.classList.toggle('hidden');

      arrow.textContent = isHidden ? '▼' : '▶';
    });
  });
}

// ===== INITIALIZE OFFICER MODULE =====
function initializeOfficer() {
  setupOfficerFilters();
  setupCollapseHeaders();
}
