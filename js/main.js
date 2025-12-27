/**
 * LAWATAN MURID SAMBIL BELAJAR - Main Initialization & Navigation
 * JPN Pahang
 */

// ===== NAVIGATION =====
function hideAllSections(){ 
  ['introSection','permohonanSection','queryRespondSection','loginSection','officerSection','ppdSection','deputySection','statusSection','downloadsSection'].forEach(id=>{ 
    const el = $(id); 
    if (el) el.classList.add('hidden'); 
  }); 
}

function setActiveTab(tabId){ 
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active-tab')); 
  const tab = $(tabId); 
  if (tab) tab.classList.add('active-tab'); 
}

function setupNavigation() {
  const navLinks = {
    'tabInt': 'introSection',
    'tabPermohonan': 'permohonanSection',
    'tabQueryRespond': 'queryRespondSection',
    'tabLogin': 'loginSection',
    'tabStatus': 'statusSection',
    'tabDownloads': 'downloadsSection'
  };

  for (const [tabId, sectionId] of Object.entries(navLinks)) {
    const tab = $(tabId);
    if (tab) {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllSections();
        setActiveTab(tabId);
        const section = $(sectionId);
        if (section) section.classList.remove('hidden');
        
        // Close mobile menu if open
        const mobileMenu = $('mobileMenu');
        if (mobileMenu) mobileMenu.classList.add('hidden');
        
        // If navigating to login tab and user is logged in, restore dashboard
        if (tabId === 'tabLogin' && typeof restoreDashboardIfLoggedIn === 'function') {
          restoreDashboardIfLoggedIn();
        }
      });
    }
  }

  // Set default view
  hideAllSections();
  setActiveTab('tabInt');
  const intro = $('introSection');
  if (intro) intro.classList.remove('hidden');
}

// ===== MOBILE MENU =====
function setupMobileMenu() {
  const burger = $('mobileMenuBtn');
  const menu = $('mobileMenu');
  const closeMobile = $('closeMobileMenu');

  if (burger && menu) {
    burger.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }

  if (closeMobile && menu) {
    closeMobile.addEventListener('click', () => {
      menu.classList.add('hidden');
    });
  }

  // Close menu when clicking nav link
  document.querySelectorAll('#mobileMenu .nav-tab').forEach(link => {
    link.addEventListener('click', () => {
      if (menu) menu.classList.add('hidden');
    });
  });
}
// ===== TOOLTIP HELPER =====
function showTooltip(message) {
  Swal.fire({
    icon: 'info',
    title: 'Maklumat',
    text: message,
    confirmButtonText: 'OK',
    timer: 5000
  });
}
// ===== DOWNLOADS =====
function setupDownloads() {
  const downloads = [
    { id: 'downloadKK', url: 'https://drive.google.com/file/d/1IbmtO2sCAvnPcjzqU0EaQKLPa5KGjrzT/view', name: 'PERMOHONAN KELULUSAN KUTIPAN LAWATAN.docx' },
    { id: 'downloadMA', url: 'https://drive.google.com/file/d/1RhUVrDDSTsFACgd4QHgzzqqkbNefuRxE/view', name: 'BORANG LAWATAN MURID SEKOLAH _ SPI BIL.9 THN 2023 LAMPIRAN A.pdf' },
    { id: 'downloadIT', url: 'https://drive.google.com/file/d/1VBd0YKVbYZ8KW-eFPizVh26KlifSfqRS/view', name: 'SPI KPM Bilangan 9 Tahun 2023 Garis Panduan Lawatan Murid Sekolah Bawah Kementerian Pendidikan Malaysia Mulai Tahun 2023.pdf' },
    { id: 'downloadAA', url: 'https://drive.google.com/file/d/1OouJG3DcWHQhc4fLvo_dDqVA6zx_A6ay/view', name: 'SURAT PEKELILING IKHTISAS KEMENTERIAN PENDIDIKAN MALAYSIA BILANGAN 3 TAHUN 2019.pdf' },
    { id: 'downloadBB', url: 'https://drive.google.com/file/d/1dxj1uCowSiFcAp80MGVHD10En-UMQrvw/view', name: 'SPK Bil.1_ 2021_Lampiran 7_Kertas Cadangan.pdf' },
    { id: 'downloadCC', url: 'https://drive.google.com/file/d/1rNUmrYzOBM-96OkpjDGBmUsgCQx1jcGZ/view', name: 'SENARAI SEMAK LAWATAN TERKINI 2025.pdf' }

  ];

  downloads.forEach(d => {
    const btn = $(d.id);
    if (btn) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          window.open(d.url, '_blank');
        } catch (err) {
          console.error('Download error:', err);
          Swal.fire({icon:'error', title:'Gagal muat turun', text:err.message||''});
        }
      });
    }
  });
}

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 LSBM Portal Loading...');
  
  // Initialize all modules
  initializeAuth();       // from auth.js
  initializeForms();      // from forms.js
  initializeOfficer();    // from officer.js
  initializePPD();        // from ppd.js
  initializeDeputy();     // from deputy.js
  initializeStatus();     // from status.js
  
  // Setup navigation and downloads
  setupNavigation();
  setupMobileMenu();
  setupDownloads();
  
  console.log('✅ LSBM Portal Ready');
});
