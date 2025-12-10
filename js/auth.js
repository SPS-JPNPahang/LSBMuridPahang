/**
 * LAWATAN MURID SAMBIL BELAJAR - Authentication Module
 * JPN Pahang
 */

// ===== OFFICER LOGIN =====
async function setupOfficerAuth() {
  const loginBtn = $('loginOfficer');
  if (!loginBtn) return;
  
  loginBtn.addEventListener('click', async () => {
    const { value: pw } = await Swal.fire({
      title: 'Akses Pegawai',
      input: 'password',
      inputLabel: 'Masukkan kata laluan Pegawai',
      showCancelButton: true,
      confirmButtonText: 'LOG IN',
      inputAttributes: {
        autocomplete: 'off'
      }
    });
    
    if (!pw) return;
    
    try {
      showLoading();
      const check = await fetch(CONFIG.GAS_URL + '?action=checkSecret&secret=' + encodeURIComponent(pw));
      const cj = await check.json();
      hideLoading();
      
      if (cj.ok) {
        officerSecret = pw;
        
        // Update UI
        loginBtn.textContent = 'Akses Dibenarkan';
        loginBtn.classList.remove('bg-blue-600');
        loginBtn.classList.add('btn-access-granted', 'animate-gentle-pulse');
        loginBtn.disabled = true;
        
        const statusEl = $('officerLoggedAs');
        if (statusEl) {
          statusEl.textContent = ' (Sistem Online)';
          statusEl.classList.add('status-pulse');
        }
        
        const logoutBtn = $('logoutOfficer');
        if (logoutBtn) logoutBtn.classList.remove('hidden-inline');
        
        await loadRequests();
        
        Swal.fire({
          icon: 'success',
          title: 'Akses Dibenarkan',
          text: 'Sistem Online.',
          timer: 1800,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Kata laluan salah'
        });
      }
    } catch (err) {
      hideLoading();
      logError('Officer login error', err);
      Swal.fire({
        icon: 'error',
        title: 'Ralat sambungan',
        text: err.message || ''
      });
    }
  });
}

// ===== OFFICER LOGOUT =====
function setupOfficerLogout() {
  const logoutBtn = $('logoutOfficer');
  if (!logoutBtn) return;
  
  logoutBtn.addEventListener('click', async () => {
    const ok = await Swal.fire({
      title: 'Log Out?',
      text: 'Adakah anda pasti?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Log Out',
      cancelButtonText: 'Batal'
    });
    
    if (!ok.isConfirmed) return;
    
    officerSecret = null;
    
    const loginBtn = $('loginOfficer');
    if (loginBtn) {
      loginBtn.textContent = 'LOGIN Pegawai';
      loginBtn.classList.remove('btn-access-granted', 'animate-gentle-pulse');
      loginBtn.classList.add('bg-blue-600');
      loginBtn.disabled = false;
    }
    
    logoutBtn.classList.add('hidden-inline');
    
    const statusEl = $('officerLoggedAs');
    if (statusEl) statusEl.textContent = '';
    
    requestsCache = [];
    renderTablesFromCache();
    
    Swal.fire({
      icon: 'success',
      title: 'Log Out berjaya',
      timer: 1500,
      showConfirmButton: false
    });
  });
}

// ===== OFFICER REFRESH =====
function setupOfficerRefresh() {
  const refreshBtn = $('refreshOfficer');
  if (!refreshBtn) return;
  
  refreshBtn.addEventListener('click', async () => {
    if (!officerSecret) {
      return Swal.fire({
        icon: 'warning',
        title: 'Sila log masuk dahulu'
      });
    }
    
    const originalText = refreshBtn.textContent;
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Refreshing...';
    
    showLoading();
    try {
      await loadRequests();
      Swal.fire({
        icon: 'success',
        title: 'Data dikemaskini',
        timer: 900,
        showConfirmButton: false
      });
    } catch (err) {
      logError('Refresh error', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal kemaskini',
        text: err.message || String(err)
      });
    } finally {
      hideLoading();
      refreshBtn.disabled = false;
      refreshBtn.textContent = originalText;
    }
  });
}

// ===== DEPUTY DIRECTOR LOGIN =====
async function setupDPAuth() {
  const loginBtn = $('loginDP');
  if (!loginBtn) return;
  
  loginBtn.addEventListener('click', async () => {
    const { value: pw } = await Swal.fire({
      title: 'Kata Laluan Timbalan Pengarah',
      input: 'password',
      showCancelButton: true,
      confirmButtonText: 'Log Masuk',
      inputAttributes: {
        autocomplete: 'off'
      }
    });
    
    if (!pw) return;
    
    try {
      showLoading();
      const res = await fetch(CONFIG.GAS_URL + '?action=checkSecret&secret=' + encodeURIComponent(pw));
      const j = await res.json();
      hideLoading();
      
      if (j.ok) {
        dpSecret = pw;
        
        loginBtn.textContent = 'Akses Dibenarkan';
        loginBtn.classList.remove('bg-blue-600');
        loginBtn.classList.add('bg-green-600', 'animate-gentle-pulse');
        loginBtn.disabled = true;
        
        const logoutBtn = $('logoutDP');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        
        const statusEl = $('dpLoggedAs');
        if (statusEl) {
          statusEl.textContent = '(Sistem dalam mod sedia)';
          statusEl.classList.add('text-green-600');
        }
        
        // Show bulk approve button
        const bulkBtn = $('bulkApproveBtn');
        if (bulkBtn) bulkBtn.classList.remove('hidden');
        
        await Swal.fire({
          icon: 'success',
          title: 'Selamat Datang Tuan Timbalan Pengarah',
          timer: 1200,
          showConfirmButton: false
        });
        
        await loadDpList();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Kata laluan salah'
        });
      }
    } catch (err) {
      hideLoading();
      logError('DP login error', err);
      Swal.fire({
        icon: 'error',
        title: 'Ralat sambungan',
        text: err.message || ''
      });
    }
  });
}

// ===== DEPUTY DIRECTOR LOGOUT =====
function setupDPLogout() {
  const logoutBtn = $('logoutDP');
  if (!logoutBtn) return;
  
  logoutBtn.addEventListener('click', async () => {
    const ok = await Swal.fire({
      title: 'Log Keluar?',
      text: 'Adakah anda pasti mahu log keluar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Log Keluar',
      cancelButtonText: 'Batal'
    });
    
    if (!ok.isConfirmed) return;
    
    dpSecret = null;
    
    // Hide bulk approve button
    const bulkBtn = $('bulkApproveBtn');
    if (bulkBtn) bulkBtn.classList.add('hidden');
    
    const loginBtn = $('loginDP');
    if (loginBtn) {
      loginBtn.textContent = 'Log masuk Timbalan';
      loginBtn.classList.remove('bg-green-600', 'animate-gentle-pulse');
      loginBtn.classList.add('bg-blue-600');
      loginBtn.disabled = false;
    }
    
    logoutBtn.classList.add('hidden');
    
    const statusEl = $('dpLoggedAs');
    if (statusEl) statusEl.textContent = '';
    
    const table = $('dpRequestsTable');
    if (table) table.innerHTML = `<p class="p-4 text-gray-500 italic">Sila log masuk Timbalan untuk melihat senarai permohonan.</p>`;
    
    Swal.fire({
      icon: 'success',
      title: 'Terima kasih Tuan Timbalan Pengarah',
      timer: 1200,
      showConfirmButton: false
    });
  });
}
// ===== PPD LOGIN =====
async function setupPPDAuth() {
  const loginBtn = $('loginPPD');
  if (!loginBtn) return;
  
  loginBtn.addEventListener('click', async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Akses PPD',
      html:
        '<select id="swal-district" class="swal2-input">' +
        '<option value="">Pilih Daerah</option>' +
        '<option value="BENTONG">BENTONG</option>' +
        '<option value="BERA">BERA</option>' +
        '<option value="CAMERON HIGHLANDS">CAMERON HIGHLANDS</option>' +
        '<option value="JERANTUT">JERANTUT</option>' +
        '<option value="KUANTAN">KUANTAN</option>' +
        '<option value="LIPIS">LIPIS</option>' +
        '<option value="MARAN">MARAN</option>' +
        '<option value="PAHANG">PAHANG</option>' +
        '<option value="PEKAN">PEKAN</option>' +
        '<option value="RAUB">RAUB</option>' +
        '<option value="ROMPIN">ROMPIN</option>' +
        '<option value="TEMERLOH">TEMERLOH</option>' +
        '</select>' +
        '<input id="swal-password" type="password" class="swal2-input" placeholder="Kata Laluan PPD">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'LOG IN',
      preConfirm: () => {
        const district = document.getElementById('swal-district').value;
        const password = document.getElementById('swal-password').value;
        
        if (!district) {
          Swal.showValidationMessage('Sila pilih daerah');
          return false;
        }
        if (!password) {
          Swal.showValidationMessage('Sila masukkan kata laluan');
          return false;
        }
        
        return { district, password };
      }
    });
    
    if (!formValues) return;
    
    try {
      showLoading();
      const res = await fetch(
        CONFIG.GAS_URL + 
        '?action=checkPPDSecret&secret=' + encodeURIComponent(formValues.password) +
        '&district=' + encodeURIComponent(formValues.district)
      );
      const json = await res.json();
      hideLoading();
      
      if (json.ok) {
        ppdSecret = formValues.password;
        ppdDistrict = formValues.district;
        
        loginBtn.textContent = `PPD ${formValues.district}`;
        loginBtn.classList.remove('bg-blue-600');
        loginBtn.classList.add('bg-green-600', 'animate-gentle-pulse');
        loginBtn.disabled = true;
        
        const statusEl = $('ppdLoggedAs');
        if (statusEl) {
          statusEl.textContent = ` - ${formValues.district}`;
          statusEl.classList.add('text-green-600');
        }
        
        const logoutBtn = $('logoutPPD');
        if (logoutBtn) logoutBtn.classList.remove('hidden-inline');
        
        await loadPPDRequests();
        
        Swal.fire({
          icon: 'success',
          title: 'Akses Dibenarkan',
          text: `PPD ${formValues.district} - Sistem Online`,
          timer: 1800,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Akses Ditolak',
          text: json.message || 'Password atau daerah salah'
        });
      }
    } catch (err) {
      hideLoading();
      logError('PPD login error', err);
      Swal.fire({
        icon: 'error',
        title: 'Ralat sambungan',
        text: err.message || ''
      });
    }
  });
}

// ===== PPD LOGOUT =====
function setupPPDLogout() {
  const logoutBtn = $('logoutPPD');
  if (!logoutBtn) return;
  
  logoutBtn.addEventListener('click', async () => {
    const ok = await Swal.fire({
      title: 'Log Out?',
      text: 'Adakah anda pasti?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Log Out',
      cancelButtonText: 'Batal'
    });
    
    if (!ok.isConfirmed) return;
    
    ppdSecret = null;
    ppdDistrict = '';
    
    const loginBtn = $('loginPPD');
    if (loginBtn) {
      loginBtn.textContent = 'LOGIN PPD';
      loginBtn.classList.remove('bg-green-600', 'animate-gentle-pulse');
      loginBtn.classList.add('bg-blue-600');
      loginBtn.disabled = false;
    }
    
    logoutBtn.classList.add('hidden-inline');
    
    const statusEl = $('ppdLoggedAs');
    if (statusEl) statusEl.textContent = '';
    
    const newTable = $('ppdNewTable');
    const reviewedTable = $('ppdReviewedTable');
    if (newTable) newTable.innerHTML = '<p class="p-4 text-gray-500 italic">Sila log masuk PPD</p>';
    if (reviewedTable) reviewedTable.innerHTML = '<p class="p-4 text-gray-500 italic">Sila log masuk PPD</p>';
    
    Swal.fire({
      icon: 'success',
      title: 'Log Out berjaya',
      timer: 1500,
      showConfirmButton: false
    });
  });
}

// ===== PPD REFRESH =====
function setupPPDRefresh() {
  const refreshBtn = $('refreshPPD');
  if (!refreshBtn) return;
  
  refreshBtn.addEventListener('click', async () => {
    if (!ppdSecret || !ppdDistrict) {
      return Swal.fire({
        icon: 'warning',
        title: 'Sila log masuk dahulu'
      });
    }
    
    const originalText = refreshBtn.textContent;
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Refreshing...';
    
    showLoading();
    try {
      await loadPPDRequests();
      Swal.fire({
        icon: 'success',
        title: 'Data dikemaskini',
        timer: 900,
        showConfirmButton: false
      });
    } catch (err) {
      logError('PPD refresh error', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal kemaskini',
        text: err.message || String(err)
      });
    } finally {
      hideLoading();
      refreshBtn.disabled = false;
      refreshBtn.textContent = originalText;
    }
  });
}
// ===== INITIALIZE ALL AUTH =====
function initializeAuth() {
  setupOfficerAuth();
  setupOfficerLogout();
  setupOfficerRefresh();
  setupPPDAuth();
  setupPPDLogout();
  setupPPDRefresh();
  setupDPAuth();
  setupDPLogout();
}


