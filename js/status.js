/**
 * LAWATAN MURID SAMBIL BELAJAR - Status Check Module
 * JPN Pahang
 * (Frontend aligned with backend response: { ok, mode, applications[] })
 */

// ===== STATUS CHECK =====
function setupStatusCheck() {
  const btn = $('checkStatusBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const input = ($('statusInput')?.value || '').trim();

    if (!input) {
      return Swal.fire({
        icon: 'warning',
        title: 'Sila masukkan Kod Sekolah atau Request ID'
      });
    }

    showLoading();
    // Reset paparan status lama (SELAMAT)
    const box = $('statusResult');
    if (box) {
      box.innerHTML = '';
      box.classList.add('hidden');
    }

    try {
      let url = CONFIG.GAS_URL + '?action=checkStatus';

        if (input.toUpperCase().startsWith('REQ-')) {
          url += '&id=' + encodeURIComponent(input);
        } else {
          url += '&schoolCode=' + encodeURIComponent(input);
        }
      const res = await fetch(url);
      const j = await res.json();
      hideLoading();

      if (!j || !j.ok) {
        await Swal.fire({
          icon: 'error',
          title: 'Tidak Dijumpai',
          text: j?.message || 'Permohonan tidak dijumpai.'
        });
        return;
      }

      // ===== BACKEND HANTAR applications[] =====
      const list = Array.isArray(j.applications) ? j.applications : [];

      if (list.length === 0) {
        await Swal.fire({
          icon: 'info',
          title: 'Status Permohonan',
          text: 'Tiada permohonan dijumpai.'
        });
        return;
      }

      // ===== KES: BANYAK PERMOHONAN (KOD SEKOLAH) – PAPAR DALAM PAGE =====
      const box = $('statusResult');
      if (!box) return;

      box.innerHTML = `
        <h3 class="text-lg font-bold mb-4">Senarai Permohonan Sekolah</h3>
        <div class="space-y-4">
          ${list.map((req, i) => {
            const S = String(req.status || '').toUpperCase();
            const isQuery = (S === 'QUERY' || S === 'QUERY_SENT');
            const suratKelulusan =
                Array.isArray(req.letters) ? req.letters[0] : null;

              const stampedPDFs = [
                getLastUrl(req.fileKertasKerja),
                getLastUrl(req.fileMaklumatAnggota)
              ].filter(Boolean);

            return `
              <div class="border-l-4 ${
                isQuery ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500 bg-blue-50'
              } p-4 rounded">
                <div class="font-semibold mb-1">
                  ${i + 1}. ${req.requestId}
                </div>
                <div class="text-sm text-gray-700 space-y-1">
                    <div><b>Sekolah:</b> ${req.schoolName}</div>
                    <div><b>Tarikh:</b> ${req.travelStart} - ${req.travelEnd}</div>
                    <div><b>Status:</b> ${req.status}</div>
                    ${req.queryId
                        ? `<div><b>Query ID:</b> ${req.queryId}</div>`
                        : ''
                      }
                    ${
                      isQuery && req.queryNote
                          ? `<div class="mt-2 p-2 bg-white border-l-4 border-yellow-400 text-sm">
                              <b>Catatan Pegawai:</b><br>${req.queryNote}
                            </div>`
                          : ''
                      }
                    ${suratKelulusan ? `
                        <div class="mt-2">
                          <b>📄 Surat Kelulusan:</b><br>
                          <a href="${suratKelulusan}" target="_blank"
                            class="inline-block mt-1 text-blue-600 underline">
                            Muat Turun Surat Kelulusan
                          </a>
                        </div>
                      ` : ''}
                      ${req.status.startsWith('FINAL_APPROVED') ? `
                        <div class="mt-3">
                          <b>📎 Dokumen Diluluskan (PDF):</b><br>
                          ${stampedPDFs.map((u, i) => `
                            <a href="${u}" target="_blank"
                              class="block mt-1 text-green-700 underline">
                              ${i === 0
                                ? 'Kertas Kerja / Cadangan (Disemak)'
                                : 'Lampiran A (Disemak)'}
                            </a>
                          `).join('')}
                        </div>
                      ` : ''}
                  </div>

                ${
                        isQuery
                          ? `<button
                              class="mt-3 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                              onclick="goToQueryFromStatus('${req.requestId}', '${req.queryId || ''}')">
                              💬 Respon Query
                            </button>`
                          : ''
                      }

              </div>
            `;
          }).join('')}
        </div>
      `;

      box.classList.remove('hidden');
      return;


    } catch (err) {
      hideLoading();
      console.error('Status check error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Ralat sambungan',
        text: err.message || 'Ralat tidak dijangka'
      });
    }
  });
}

// ===== HELPER =====
function renderPdfLinks(label, raw) {
  if (!raw) {
    return `<p>• <b>${label}</b>: <em>Tiada fail</em></p>`;
  }

  const urls = String(raw)
    .split(/\s*;\s*/)
    .filter(Boolean);

  return `
    <div class="mt-2">
      <b>📎 ${label}:</b><br>
      ${urls.map((u, i) => `
        <a href="${u}" target="_blank"
          class="block text-green-700 underline">
          Buka PDF ${urls.length > 1 ? `(${i + 1})` : ''}
        </a>
      `).join('')}
    </div>
  `;
}
function getLastUrl(raw) {
  const urls = String(raw || '')
    .split(/\s*;\s*/)
    .filter(Boolean);
  return urls.length ? urls[urls.length - 1] : null;
}
// ===== BUTANG RESPOND QUERY =====
function goToQueryFromStatus(requestId, queryId) {
  // Tukar ke tab "Respon Query"
  document.getElementById('tabQueryRespond')?.click();

  // Tunggu DOM tab siap render
  setTimeout(() => {
    const qIdEl = $('respQueryId');
    const schEl = $('respSchoolCode');

    if (qIdEl && queryId) qIdEl.value = queryId;
    if (schEl) schEl.value = '';

    if (queryId) {
      loadQueryInfo(queryId);
    }

    $('queryRespondSection')?.scrollIntoView({ behavior: 'smooth' });
  }, 300);
}

// ===== LOAD QUERY INFO (SAFE, READ-ONLY) =====
async function loadQueryInfo(queryId) {
  if (!queryId) return;

  try {
    const url = CONFIG.GAS_URL +
      '?action=checkStatus&id=' + encodeURIComponent(queryId);

    const res = await fetch(url);
    const j = await res.json();

    if (!j || !j.ok || !Array.isArray(j.applications) || j.applications.length === 0) {
    if (infoBox && txt) {
      txt.textContent = '❌ Maklumat tidak ditemui untuk Query ID ini.';
      infoBox.classList.remove('hidden');
    }
    return;
  }


    const req = j.applications[0];
    const infoBox = document.getElementById('queryOfficerNoteBox');
    const txt = document.getElementById('queryOfficerNoteText');

    if (infoBox && txt) {
      txt.textContent =
        `Sekolah: ${req.schoolName || '-'}\n` +
        `Tarikh: ${req.travelStart || ''} - ${req.travelEnd || ''}\n` +
        `Status: ${req.status || '-'}\n\n` +
        `Catatan Pegawai:\n${req.queryNote || '-'}`;

      infoBox.classList.remove('hidden');
    }

  } catch (err) {
    console.error('loadQueryInfo error', err);
  }
}

// ===== INITIALIZE STATUS MODULE =====
function initializeStatus() {
  setupStatusCheck();
}
