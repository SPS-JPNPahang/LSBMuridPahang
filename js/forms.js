/**
 * LAWATAN MURID SAMBIL BELAJAR - Forms Module
 * JPN Pahang
 */

// ===== DATE FIELD VALIDATION SETUP =====
(function setupDateValidation(){
  const start = $('travelStart'), end = $('travelEnd');
  if (!start||!end) return;
  const setMin = () => {
    const today = new Date(); today.setHours(0,0,0,0);
    const min = new Date(today.getTime() + 30*24*60*60*1000);
    start.min = `${min.getFullYear()}-${String(min.getMonth()+1).padStart(2,'0')}-${String(min.getDate()).padStart(2,'0')}`;
  };
  const updateEndBounds = () => {
    if (!start.value) { end.removeAttribute('max'); return; }
    const s = new Date(start.value);
    // Sekatan bulan November (10) & Disember (11)
    const m = s.getMonth(); // 0=Jan, 10=Nov, 11=Dis
    if (m === 10 || m === 11) {
      Swal.fire({
        icon: 'warning',
        title: 'Tarikh tidak dibenarkan',
        text: 'Permohonan lawatan tidak dibenarkan bagi bulan November dan Disember.'
      });
      start.value = '';
      end.value = '';
      return;
    }
    const max = new Date(s.getTime() + 4*24*60*60*1000);
    end.min = start.value;
    end.max = `${max.getFullYear()}-${String(max.getMonth()+1).padStart(2,'0')}-${String(max.getDate()).padStart(2,'0')}`;
    if (end.value) {
      const cur = new Date(end.value);
      if (cur < s) end.value = start.value;
      if (cur > max) end.value = end.max;
    }
  };
  setMin(); 
  start.addEventListener('change', updateEndBounds); 
  updateEndBounds();
})();

// ===== SCHOOL CODE AUTOFILL =====
async function loadSchoolData() {
  if (schoolDataCache) return schoolDataCache;
  
  try {
    const res = await fetch(CONFIG.GAS_URL + '?action=getSchoolData');
    const j = await res.json();
    if (j.ok && j.schools) {
      schoolDataCache = j.schools;
      console.log('✅ School data loaded:', j.schools.length, 'schools');
      return j.schools;
    }
  } catch (err) {
    console.error('❌ Failed to load school data:', err);
  }
  return [];
}

function setupSchoolAutofill() {
  const codeInput = $('schoolCode');
  if (!codeInput) return;
  
  codeInput.addEventListener('input', async function(e) {
     e.target.value = e.target.value.toUpperCase();
    const code = e.target.value.trim().toUpperCase();
    
    // Ensure message element exists
    let msg = document.getElementById('schoolCodeMsg');
    if (!msg) {
      msg = document.createElement('div');
      msg.id = 'schoolCodeMsg';
      msg.className = 'text-sm mt-1';
      msg.style.color = '#dc2626';
      $('schoolCode').insertAdjacentElement('afterend', msg);
    }

    // Clear fields if code too short
    if (code.length < 3) {
      $('schoolName').value = '';
      $('daerah').value = '';
      $('peringkat').value = '';
      msg.textContent = '';
      return;
    }
    
    // Load school data
    const schools = await loadSchoolData();
    if (!schools || schools.length === 0) return;
    
    // Find matching school
    const match = schools.find(s => String(s.code || '').toUpperCase() === code);
    
    if (match) {
      // Autofill fields
      $('schoolName').value = match.name || '';
      $('daerah').value = match.daerah || '';
      $('peringkat').value = match.peringkat || '';
      msg.textContent = '';

      // Visual feedback - green flash
      $('schoolCode').classList.add('bg-green-50', 'border-green-500');
      setTimeout(() => {
        $('schoolCode').classList.remove('bg-green-50', 'border-green-500');
      }, 1000);
      
      console.log('✅ Autofill success:', match.name);
    } else {
      // No match - clear fields
      $('schoolName').value = '';
      $('daerah').value = '';
      $('peringkat').value = '';
      msg.textContent = 'Kod Sekolah tiada dalam sistem. CTH: TCF0840';
    }
  });
}

// Preload school data on page load
(async function() {
  await loadSchoolData();
})();

function setupLeaderManagement() {
  // Single leader only - no dynamic rendering needed
}

// ===== FORM SUBMISSION =====
function setupFormSubmission() {
  const form = $('permohonanForm');
  if (!form) return;

  form.addEventListener('submit', async function(ev){
    ev.preventDefault(); 
    $('submitBtn').disabled=true;
    
    const payload = {
      schoolCode: $('schoolCode').value.trim(),
      schoolName: $('schoolName').value.trim(),
      daerah: $('daerah').value.trim(),
      poskod: $('poskod').value.trim(),
      schoolEmail: $('schoolEmail').value.trim(),
      category: $('peringkat').value.includes('Rendah') ? 'Rendah' : 'Menengah',
      travelStartDate: $('travelStart').value,
      travelEndDate: $('travelEnd').value,
      leaderNames: [$('leaderName').value.trim()].filter(Boolean),
      leaderPhones: [$('leaderPhone').value.trim()].filter(Boolean),
      vehicleCount: $('vehicleCount').value,
      participantCount: $('participantCount').value,
      bp: $('bp').value,
      bm: $('bm').value,
      placeVisit: $('placeVisit').value
    };

    const start=new Date(payload.travelStartDate), end=new Date(payload.travelEndDate);
    // Sekatan bulan November & Disember (defensive)
    const startMonth = start.getMonth(); // 0=Jan
    if (startMonth === 10 || startMonth === 11) {
      hideLoading();
      await Swal.fire({
        icon:'error',
        title:'Tarikh tidak dibenarkan',
        text:'Permohonan lawatan tidak dibenarkan bagi bulan November dan Disember.'
      });
      $('submitBtn').disabled = false;
      return;
    }
    const today=new Date(); today.setHours(0,0,0,0); 
    const min=new Date(today.getTime()+30*24*60*60*1000);
    
    if (isNaN(start.getTime())||start<min){ 
      await Swal.fire({icon:'error',title:'Tarikh tidak sah',text:'Tarikh mula mesti sekurang-kurangnya 30 hari.'}); 
      $('submitBtn').disabled=false; 
      return; 
    }
    
    const maxEnd = new Date(start.getTime()+4*24*60*60*1000);
    if (isNaN(end.getTime())||end<start||end>maxEnd){ 
      await Swal.fire({icon:'error',title:'Tarikh tamat tidak sah',text:`Tarikh tamat mesti antara ${start.toISOString().slice(0,10)} dan ${maxEnd.toISOString().slice(0,10)}.`}); 
      $('submitBtn').disabled=false; 
      return; 
    }

    showLoading();
    try {
      const fileMap = {
        kertasKerja:$('file_kertasKerja').files[0], 
        maklumatAnggota:$('file_maklumatAnggota').files[0],
        permitBas:$('file_permitBas').files[0], 
        lesenPemandu:$('file_lesenPemandu').files[0], 
        taklimat:$('file_taklimat').files[0]
      };
      
      for (const key in fileMap) {
        if (fileMap[key]) {
          const validation = validateFile(fileMap[key]);
          if (!validation.ok) {
            hideLoading();
            await Swal.fire({icon:'error',title:'Fail tidak sah',text:validation.message});
            $('submitBtn').disabled=false;
            return;
          }
        }
      }
      
      const filesBase64 = {};
      for (const k in fileMap) if (fileMap[k]) filesBase64[k]=await fileToBase64(fileMap[k]);
      
      const body = JSON.stringify({type:'new', payload, filesBase64});
      const res = await fetch(CONFIG.GAS_URL, {method:'POST', body});
      const j = await res.json(); 
      hideLoading();
      
      if (j.ok){ 
        await Swal.fire({icon:'success',title:'Permohonan berjaya dihantar',html:`Nombor rujukan: <b>${j.requestId||''}</b>`}); 
        this.reset(); 
      }
      else await Swal.fire({icon:'error',title:'Gagal',text:j.message||j.error||JSON.stringify(j)});
    } catch (err){ 
      hideLoading(); 
      await Swal.fire({icon:'error',title:'Ralat sambungan',text:err.message||''}); 
    }
    finally{ $('submitBtn').disabled=false; }
  });
}

// ===== QUERY RESPONSE FORM =====
function setupQueryResponseForm() {
  const btn = $('sendQueryResponseBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Menghantar...';
    const queryId = ($('respQueryId')?.value || '').trim();
    const schoolCode = ($('respSchoolCode')?.value || '').trim();

    if (!queryId && !schoolCode) {
      await Swal.fire({ icon: 'warning', title: 'Sila isi Query ID ATAU Kod Sekolah' });
      btn.disabled = false;
      btn.textContent = origText;
      return;
    }

    const fileMap = {
      kertasKerja: $('resp_file_kertasKerja') ? $('resp_file_kertasKerja').files[0] : null,
      maklumatAnggota: $('resp_file_maklumatAnggota') ? $('resp_file_maklumatAnggota').files[0] : null,
      permitBas: $('resp_file_permitBas') ? $('resp_file_permitBas').files[0] : null,
      lesenPemandu: $('resp_file_lesenPemandu') ? $('resp_file_lesenPemandu').files[0] : null,
      taklimat: $('resp_file_taklimat') ? $('resp_file_taklimat').files[0] : null
    };

    let anyFile = false;
    for (const k in fileMap) {
      if (fileMap[k]) {
        anyFile = true;
        const validation = validateFile(fileMap[k]);
        if (!validation.ok) {
          await Swal.fire({ icon: 'error', title: 'Fail tidak sah', text: validation.message });
          btn.disabled = false;
          btn.textContent = origText;
          return;
        }
      }
    }
    if (!anyFile) {
      await Swal.fire({ icon: 'warning', title: 'Tiada fail', text: 'Sila pilih sekurang-kurangnya satu fail PDF untuk muat naik.' });
      btn.disabled = false;
      btn.textContent = origText;
      return;
    }

    showLoading();
    try {
      const filesBase64 = {};
      for (const k in fileMap) {
        if (fileMap[k]) {
          filesBase64[k] = await fileToBase64(fileMap[k]);
        }
      }

      const payloadForGAS = {
        type: 'queryResponse',
        payload: {
          queryId: queryId ? String(queryId) : undefined,
          schoolCode: schoolCode ? String(schoolCode) : undefined
        },
        filesBase64: filesBase64
      };

      const response = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        body: JSON.stringify(payloadForGAS)
      });

      let j;
      try {
        j = await response.json();
      } catch (jsonErr) {
        const txt = await response.text().catch(() => '[no body]');
        console.error('Invalid JSON response from GAS (queryResponse):', jsonErr, txt);
        throw new Error('Server returned invalid response: ' + txt);
      }

      if (j && j.ok) {
        await Swal.fire({ icon: 'success', title: 'Respon query berjaya dihantar', text: j.message || '' });
        // RESET paparan query (kembali default)
          $('queryOfficerNoteBox')?.classList.add('hidden');
          $('queryOfficerNoteText') && ($('queryOfficerNoteText').textContent = '');
          $('respQueryId') && ($('respQueryId').value = '');
          $('respSchoolCode') && ($('respSchoolCode').value = '');


        const q = $('respQueryId');
          if (q) q.value = '';

          ['resp_file_kertasKerja',
          'resp_file_maklumatAnggota',
          'resp_file_permitBas',
          'resp_file_lesenPemandu',
          'resp_file_taklimat'
          ].forEach(id => {
            const el = $(id);
            if (el) el.value = '';
          });


        if (officerSecret) {
          try { await loadRequests(); } catch(e){ /* ignore */ }
        }
      } else {
        console.warn('GAS returned failure for queryResponse', j);
        throw new Error((j && j.message) ? j.message : 'Gagal hantar respon query');
      }
    } catch (err) {
      console.error('queryResponse error:', err);
      await Swal.fire({ icon: 'error', title: 'Gagal hantar respon', text: String(err.message || err) });
    } finally {
      hideLoading();
      btn.disabled = false;
      btn.textContent = origText;
    }
  });
}
// ===== AUTO LOAD QUERY INFO BILA QUERY ID DIISI =====
(function setupQueryInfoAutoload(){
  const qInput = $('respQueryId');
  const infoBox = $('queryOfficerNoteBox');
  const infoText = $('queryOfficerNoteText');
  if (!qInput) return;

  let timer = null;

  const handler = () => {
    const qid = qInput.value.trim();
    if (!qid) {
      if (infoBox && infoText) {
        infoText.textContent = '';
        infoBox.classList.add('hidden');
      }
      return;
    }


    // UX feedback awal
    if (infoBox && infoText) {
      infoText.textContent = '🔄 Sedang menyemak maklumat permohonan...';
      infoBox.classList.remove('hidden');
    }

    clearTimeout(timer);
    timer = setTimeout(() => {
      loadQueryInfo(qid);
    }, 400); // debounce – elak spam fetch
  };

  qInput.addEventListener('input', handler);
  qInput.addEventListener('paste', handler);
})();


// ===== INITIALIZE FORMS MODULE =====
function initializeForms() {
  setupSchoolAutofill();
  setupLeaderManagement();
  setupFormSubmission();
  setupQueryResponseForm();
}
