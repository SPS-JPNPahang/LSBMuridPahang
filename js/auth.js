/**
 * LAWATAN MURID SAMBIL BELAJAR - Universal Login Module
 * JPN Pahang
 */
// ===== GLOBAL STATE =====
let currentUserRole = null; // Track current logged in role
let currentDashboard = null; // Track which dashboard to show

async function setupUniversalLogin() {
  const loginBtn = $('loginBtn');
  if (!loginBtn) return;
  
  loginBtn.addEventListener('click', async () => {
    // Show role selection first
    const { value: role } = await Swal.fire({
      title: 'Pilih Peranan',
      input: 'select',
      inputOptions: {
        'OFFICER': 'Pegawai JPN',
        'PPD': 'PPD',
        'TP': 'Timbalan Pengarah'
      },
      inputPlaceholder: '— Sila pilih —',
      showCancelButton: true,
      confirmButtonText: 'Teruskan',
      cancelButtonText: 'Batal',

      width: 420,
      padding: '1.25rem',

      customClass: {
        popup: 'swal-jpn-popup',
        title: 'swal-jpn-title',
        input: 'swal-jpn-input',
        confirmButton: 'swal-jpn-confirm',
        cancelButton: 'swal-jpn-cancel'
      },

      inputValidator: (value) => {
        if (!value) return 'Sila pilih peranan';
      }
    });

    if (!role) return;
    
    // Handle based on role
    if (role === 'PPD') {
      await handlePPDLogin();
    } else if (role === 'TP') {
      await handleTPLogin();
    } else {
      await handleOfficerLogin();
    }
  });
}

// ===== PPD LOGIN =====
async function handlePPDLogin() {
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
        '<option value="PEKAN">PEKAN</option>' +
        '<option value="RAUB">RAUB</option>' +
        '<option value="ROMPIN">ROMPIN</option>' +
        '<option value="TEMERLOH">TEMERLOH</option>' +
        '</select>' +
        '<input id="swal-password" type="password" class="swal2-input" placeholder="Kata Laluan PPD">',

      showCancelButton: true,
      confirmButtonText: 'LOG IN',
      width: 420,
      padding: '1.25rem',

      customClass: {
        popup: 'swal-jpn-popup',
        title: 'swal-jpn-title',
        input: 'swal-jpn-input',
        confirmButton: 'swal-jpn-confirm',
        cancelButton: 'swal-jpn-cancel'
      },

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
      
      const loginBtn = $('loginBtn');
      loginBtn.textContent = `PPD ${formValues.district}`;
      loginBtn.classList.remove('bg-blue-600');
      loginBtn.classList.add('bg-green-600');
      loginBtn.disabled = true;
      
      // Save login state
      currentUserRole = 'PPD';
      currentDashboard = 'ppdSection';
      
      await loadPPDRequests();
      showDashboard('ppdSection');
      
      Swal.fire({
        icon: 'success',
        title: `PPD ${formValues.district}`,
        text: 'Sistem Online',
        timer: 1500,
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
    console.error('PPD login error:', err);
    Swal.fire({
      icon: 'error',
      title: 'Ralat sambungan',
      text: err.message || ''
    });
  }
}

// ===== TP LOGIN =====
async function handleTPLogin() {
  const { value: pw } = await Swal.fire({
      title: 'Kata Laluan Timbalan Pengarah',
      input: 'password',
      showCancelButton: true,
      confirmButtonText: 'Log Masuk',
      inputAttributes: { autocomplete: 'off' },

      width: 420,
      padding: '1.25rem',

      customClass: {
        popup: 'swal-jpn-popup',
        title: 'swal-jpn-title',
        input: 'swal-jpn-input',
        confirmButton: 'swal-jpn-confirm',
        cancelButton: 'swal-jpn-cancel'
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
      
      const loginBtn = $('loginBtn');
      loginBtn.textContent = 'Timbalan Pengarah';
      loginBtn.classList.remove('bg-blue-600');
      loginBtn.classList.add('bg-green-600', 'animate-gentle-pulse');
      loginBtn.disabled = true;
      
      // Save login state
      currentUserRole = 'TP';
      currentDashboard = 'deputySection';
      
      await loadDpList();
      showDashboard('deputySection');
      
      Swal.fire({
        icon: 'success',
        title: 'Timbalan Pengarah',
        timer: 1200,
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
    console.error('TP login error:', err);
    Swal.fire({
      icon: 'error',
      title: 'Ralat sambungan',
      text: err.message || ''
    });
  }
}

// ===== OFFICER LOGIN =====
async function handleOfficerLogin() {
const { value: pw } = await Swal.fire({
      title: 'Akses Pegawai',
      input: 'password',
      inputLabel: 'Kata laluan Pegawai',
      showCancelButton: true,
      confirmButtonText: 'LOG IN',
      inputAttributes: { autocomplete: 'off' },

      width: 420,
      padding: '1.25rem',

      customClass: {
        popup: 'swal-jpn-popup',
        title: 'swal-jpn-title',
        input: 'swal-jpn-input',
        confirmButton: 'swal-jpn-confirm',
        cancelButton: 'swal-jpn-cancel'
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
      
      const loginBtn = $('loginBtn');
      loginBtn.textContent = 'Pegawai JPN';
      loginBtn.classList.remove('bg-blue-600');
      loginBtn.classList.add('bg-green-600', 'animate-gentle-pulse');
      loginBtn.disabled = true;
      
      // Save login state
      currentUserRole = 'OFFICER';
      currentDashboard = 'officerSection';
      
      await loadRequests();
      showDashboard('officerSection');
      
      Swal.fire({
        icon: 'success',
        title: 'Pegawai JPN',
        text: 'Sistem Online',
        timer: 1500,
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
    console.error('Officer login error:', err);
    Swal.fire({
      icon: 'error',
      title: 'Ralat sambungan',
      text: err.message || ''
    });
  }
}

// ===== SHOW DASHBOARD =====
function showDashboard(sectionId) {
  // Hide login section
  const loginSection = $('loginSection');
  if (loginSection) loginSection.classList.add('hidden');
  
  // Hide all dashboard sections
  ['officerSection','ppdSection','deputySection'].forEach(id => {
    const el = $(id);
    if (el) el.classList.add('hidden');
  });
  
  // Show target dashboard
  const target = $(sectionId);
  if (target) target.classList.remove('hidden');

  // Setup dashboard buttons
  setupDashboardButtons(sectionId); 
}

// ===== SETUP DASHBOARD BUTTONS =====
function setupDashboardButtons(section) {
  if (section === 'officerSection') {
    // Setup Officer refresh button
    const refreshBtn = $('refreshOfficer');
    if (refreshBtn) {
      refreshBtn.onclick = async () => {
        const orig = refreshBtn.textContent;
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Refreshing...';
        showLoading();
        try {
          await loadRequests();
          Swal.fire({icon:'success', title:'Data dikemaskini', timer:900, showConfirmButton:false});
        } finally {
          hideLoading();
          refreshBtn.disabled = false;
          refreshBtn.textContent = orig;
        }
      };
    }
    
    // Hide LOGIN button, SHOW LOGOUT button
    const loginBtn = $('loginOfficer');
    const logoutBtn = $('logoutOfficer');
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) {
      logoutBtn.classList.remove('hidden-inline');  // ← REMOVE hidden class
      logoutBtn.style.display = 'inline-flex';      // ← FORCE show
      logoutBtn.onclick = () => {
          currentUserRole = null;
          currentDashboard = null;
          location.reload();
        };
    }
    
  } else if (section === 'ppdSection') {
    // Setup PPD refresh button
    const refreshBtn = $('refreshPPD');
    if (refreshBtn) {
      refreshBtn.onclick = async () => {
        const orig = refreshBtn.textContent;
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Refreshing...';
        showLoading();
        try {
          await loadPPDRequests();
          Swal.fire({icon:'success', title:'Data dikemaskini', timer:900, showConfirmButton:false});
        } finally {
          hideLoading();
          refreshBtn.disabled = false;
          refreshBtn.textContent = orig;
        }
      };
    }
    
    // Hide LOGIN button, SHOW LOGOUT button
    const loginBtn = $('loginPPD');
    const logoutBtn = $('logoutPPD');
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) {
      logoutBtn.classList.remove('hidden-inline');  // ← REMOVE hidden class
      logoutBtn.style.display = 'inline-flex';      // ← FORCE show
      logoutBtn.onclick = () => {
          currentUserRole = null;
          currentDashboard = null;
          location.reload();
        };
    }
    
  } else if (section === 'deputySection') {
    // Show bulk approve button
    const bulkBtn = $('bulkApproveBtn');
    if (bulkBtn) bulkBtn.classList.remove('hidden');
    
    // Hide LOGIN button, SHOW LOGOUT button
    const loginBtn = $('loginDP');
    const logoutBtn = $('logoutDP');
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) {
      logoutBtn.classList.remove('hidden');         // ← REMOVE hidden class
      logoutBtn.style.display = 'inline-block';     // ← FORCE show
      logoutBtn.onclick = () => {
          currentUserRole = null;
          currentDashboard = null;
          location.reload();
        };
    }
  }
}

// ===== RESTORE DASHBOARD IF LOGGED IN =====
function restoreDashboardIfLoggedIn() {
  if (currentUserRole && currentDashboard) {
    showDashboard(currentDashboard);
  }
}

// ===== INITIALIZE =====
function initializeAuth() {
  setupUniversalLogin();
}
