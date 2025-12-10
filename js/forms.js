/**
 * LAWATAN MURID SAMBIL BELAJAR - Forms Module
 * JPN Pahang
 */

// ===== SCHOOL AUTOFILL =====
function setupSchoolAutofill() {
  const codeInput = $('schoolCode');
  const nameInput = $('schoolName');
  const daerahInput = $('daerah');
  const peringkatInput = $('peringkat'); // TAMBAH field ni dalam form nanti
  
  if (!codeInput) return;
  
  codeInput.addEventListener('blur', async function() {
    const code = this.value.trim().toUpperCase();
    if (!code) return;
    
    // Check cache first
    if (schoolDataCache[code]) {
      const data = schoolDataCache[code];
      if (nameInput) {
        nameInput.value = data.nama;
        nameInput.readOnly = true;
        nameInput.classList.add('bg-gray-100');
      }
      if (daerahInput) {
        daerahInput.value = data.daerah;
        daerahInput.readOnly = true;
        daerahInput.classList.add('bg-gray-100');
      }
      if (peringkatInput) {
        peringkatInput.value = data.peringkat;
        peringkatInput.readOnly = true;
        peringkatInput.classList.add('bg-gray-100');
      }
      return;
    }
    
    // Fetch from backend
    try {
      const res = await fetch(CONFIG.GAS_URL + '?action=getSchoolData&schoolCode=' + encodeURIComponent(code));
      const json = await res.json();
      
      if (json.ok && json.data) {
        schoolDataCache[code] = json.data;
        
        if (nameInput) {
          nameInput.value = json.data.nama;
          nameInput.readOnly = true;
          nameInput.classList.add('bg-gray-100');
        }
        if (daerahInput) {
          daerahInput.value = json.data.daerah;
          daerahInput.readOnly = true;
          daerahInput.classList.add('bg-gray-100');
        }
        if (peringkatInput) {
          peringkatInput.value = json.data.peringkat;
          peringkatInput.readOnly = true;
          peringkatInput.classList.add('bg-gray-100');
        }
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Kod sekolah tidak dijumpai',
          text: json.message || 'Sila isi maklumat secara manual'
        });
        
        // Unlock fields for manual entry
        if (nameInput) {
          nameInput.readOnly = false;
          nameInput.classList.remove('bg-gray-100');
        }
        if (daerahInput) {
          daerahInput.readOnly = false;
          daerahInput.classList.remove('bg-gray-100');
        }
        if (peringkatInput) {
          peringkatInput.readOnly = false;
          peringkatInput.classList.remove('bg-gray-100');
        }
      }
    } catch (err) {
      logError('School autofill error', err);
    }
  });
  
  // Allow manual unlock if user changes code
  codeInput.addEventListener('input', function() {
    if (nameInput) {
      nameInput.readOnly = false;
      nameInput.classList.remove('bg-gray-100');
    }
    if (daerahInput) {
      daerahInput.readOnly = false;
      daerahInput.classList.remove('bg-gray-100');
    }
    if (peringkatInput) {
      peringkatInput.readOnly = false;
      peringkatInput.classList.remove('bg-gray-100');
    }
  });
}
// ===== FORM SUBMISSION =====
async function setupFormSubmission() {
  const form = $('permohonanForm');
  if (!form) return;
  
  form.addEventListener('submit', async function(ev) {
    ev.preventDefault();
    
    const submitBtn = $('submitBtn');
    if (submitBtn) submitBtn.disabled = true;
    
    const payload = {
      schoolCode: $('schoolCode').value.trim(),
      schoolName: $('schoolName').value.trim(),
      daerah: $('daerah').value.trim(),
      poskod: $('poskod').value.trim(),
      schoolEmail: $('schoolEmail').value.trim(),
      category: $('category').value,
      travelStartDate: $('travelStart').value,
      travelEndDate: $('travelEnd').value,
      leaderNames: leaders.map(l => l.name).filter(Boolean),
      leaderPhones: leaders.map(l => l.phone).filter(Boolean),
      vehicleCount: $('vehicleCount').value,
      participantCount: $('participantCount').value,
      bp: $('bp').value,
      bm: $('bm').value,
      placeVisit: $('placeVisit').value,
      accommodation: $('accommodation').value
    };
    
    // Validate dates
    const start = new Date(payload.travelStartDate);
    const end = new Date(payload.travelEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const min = new Date(today.getTime() + CONFIG.MIN_DAYS_ADVANCE * 24 * 60 * 60 * 1000);
    
    if (isNaN(start.getTime()) || start < min) {
      await Swal.fire({
        icon: 'error',
        title: 'Tarikh tidak sah',
        text: `Tarikh mula mesti sekurang-kurangnya ${CONFIG.MIN_DAYS_ADVANCE} hari dari hari ini.`
      });
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
    
    const maxEnd = new Date(start.getTime() + CONFIG.MAX_TRIP_DAYS * 24 * 60 * 60 * 1000);
    if (isNaN(end.getTime()) || end < start || end > maxEnd) {
      await Swal.fire({
        icon: 'error',
        title: 'Tarikh tamat tidak sah',
        text: `Tarikh tamat mesti antara ${start.toISOString().slice(0, 10)} dan ${maxEnd.toISOString().slice(0, 10)}.`
      });
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
    
    showLoading();
    
    try {
      // Validate and process files
      const fileMap = {
        kertasKerja: $('file_kertasKerja').files[0],
        maklumatAnggota: $('file_maklumatAnggota').files[0],
        permitBas: $('file_permitBas').files[0],
        lesenPemandu: $('file_lesenPemandu').files[0],
        taklimat: $('file_taklimat').files[0]
      };
      
      // Validate each file
      for (const key in fileMap) {
        if (fileMap[key]) {
          const validation = validateFile(fileMap[key]);
          if (!validation.ok) {
            hideLoading();
            await Swal.fire({
              icon: 'error',
              title: 'Fail tidak sah',
              text: validation.message
            });
            if (submitBtn) submitBtn.disabled = false;
            return;
          }
        }
      }
      
      const filesBase64 = {};
      for (const k in fileMap) {
        if (fileMap[k]) {
          filesBase64[k] = await fileToBase64(fileMap[k]);
        }
      }
      
      const body = JSON.stringify({ type: 'new', payload, filesBase64 });
      const res = await fetch(CONFIG.GAS_URL, { method: 'POST', body });
      const j = await res.json();
      
      hideLoading();
      
      if (j.ok) {
        await Swal.fire({
          icon: 'success',
          title: 'Permohonan berjaya dihantar',
          html: `Nombor rujukan: <b>${j.requestId || ''}</b>`
        });
        form.reset();
        leaders = [];
        renderLeaders();
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: j.message || j.error || JSON.stringify(j)
        });
      }
    } catch (err) {
      hideLoading();
      logError('Form submission error', err);
      await Swal.fire({
        icon: 'error',
        title: 'Ralat sambungan',
        text: err.message || ''
      });
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// Initialize form
function initializeForms() {
  setupSchoolAutofill();
  setupFormSubmission();
}
