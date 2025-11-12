/**
 * LAWATAN MURID SAMBIL BELAJAR - Configuration File
 * JPN Pahang
 */

// ===== CONFIGURATION - KEKALKAN URL ASAL ANDA =====
const CONFIG = {
  // Google Apps Script URL (JANGAN UBAH)
  GAS_URL: 'https://script.google.com/macros/s/AKfycbx_B7hzQrDtlks5fAynamk1s143zUvCxVWEQwfeNC3-BmKCAR9CZ27Sqml7qhIWZN3O/exec',
  
  // File Settings
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['application/pdf'],
  
  // Date Settings
  MIN_DAYS_ADVANCE: 30, // minimum 30 days notice
  MAX_TRIP_DAYS: 4,     // maximum 4 days trip
  
  // Debug Mode (set to false for production)
  DEBUG: false
};

// ===== GLOBAL STATE =====
let requestsCache = [];
let officerSecret = null;
let dpSecret = null;
let leaders = [];

// ===== HELPER FUNCTIONS =====
const $ = id => document.getElementById(id);

function showLoading() {
  const modal = $('loadingModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function hideLoading() {
  const modal = $('loadingModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function log(message, data = null) {
  if (CONFIG.DEBUG) {
    console.log(`[LSBM] ${message}`, data || '');
  }
}

function logError(message, error) {
  console.error(`[LSBM ERROR] ${message}`, error);
}

// ===== DATE FORMATTING =====
function fmtDateToDisplay(isoOrRaw) {
  if (!isoOrRaw) return '';
  const d = new Date(isoOrRaw);
  if (isNaN(d.getTime())) {
    const m = String(isoOrRaw).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return String(isoOrRaw);
    return `${m[3]}-${m[2]}-${m[1]}`;
  }
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// ===== FILE VALIDATION =====
function validateFile(file) {
  if (!file) return { ok: false, message: 'Tiada fail dipilih' };
  
  // Check size
  if (file.size > CONFIG.MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    return { 
      ok: false, 
      message: `${file.name} terlalu besar (max 10MB). Saiz sebenar: ${sizeMB}MB` 
    };
  }
  
  // Check type
  if (!CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
    return { 
      ok: false, 
      message: `${file.name} bukan fail PDF. Hanya fail PDF dibenarkan.` 
    };
  }
  
  return { ok: true };
}

// ===== FILE CONVERSION =====
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type || 'application/pdf',
      data: reader.result.split(',')[1]
    });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ===== PDF-LIB HELPERS =====
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

// ===== EXPORT FOR OTHER MODULES =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, $, showLoading, hideLoading, log, logError };
}