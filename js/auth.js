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

// ===== INITIALIZE ALL AUTH =====
function initializeAuth() {
  setupOfficerAuth();
  setupOfficerLogout();
  setupOfficerRefresh();
  setupDPAuth();
  setupDPLogout();
}