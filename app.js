/* ==========================================================================
   QUOTATIONMAKER - HYBRID STATE ENGINE & RESPONSIVE CONTROLLER
   ========================================================================== */

// --- DEFAULT TEMPLATE (MATCHES USER'S EXACT REFERENCE SAMPLE) ---
const DEFAULT_QUOTATION = {
  id: "q_default",
  businessName: "Virendra Vishwakarma",
  businessAddress: "Siddhivinayak CHS, Singh Estate, Road No.1, Samta Nagar, Kandivali East, Mumbai - 400101.",
  mobile: "9082356335",
  date: new Date().toISOString().split('T')[0],
  clientName: "",
  clientPhone: "",
  clientAddress: "",
  subject: "Door Shutter Fixing with Fixtures.",
  items: [
    { desc: "Main Door", rate: "1800", qty: 1 },
    { desc: "Bed Room Door", rate: "1500", qty: 1 },
    { desc: "Toilet Door", rate: "1000", qty: 1 },
    { desc: "Staircase Door", rate: "2200", qty: 1 },
    { desc: "Molding Patti Fixing", rate: "15 fit", qty: 1 },
    { desc: "Frame & Door Dhar Polish", rate: "1500", qty: 1 }
  ],
  terms: [
    "Payment terms: Done in 15 days."
  ],
  tableMode: "standard", // 'standard' or 'calculated'
  showOuterBorder: true,
  showTotal: true,
  showClient: false,
  showSignatory: true,
  signatoryName: "Virendra Vishwakarma"
};

// --- APP STATE ---
let currentQuotation = JSON.parse(JSON.stringify(DEFAULT_QUOTATION));
let savedQuotations = JSON.parse(localStorage.getItem("qm_saved_quotations")) || [];
let businessProfile = JSON.parse(localStorage.getItem("qm_business_profile")) || null;
let currentMobileMode = "edit"; // 'edit' or 'preview'

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  // Theme initialization
  const savedTheme = localStorage.getItem("qm_theme") || "theme-light";
  document.body.className = `${savedTheme} view-mode-edit`;
  updateThemeIcon();

  // Load business profile if available
  if (businessProfile) {
    populateProfileForm();
  }

  // Load cached draft or default sample
  const cachedDraft = localStorage.getItem("qm_current_draft");
  if (cachedDraft) {
    try {
      currentQuotation = JSON.parse(cachedDraft);
    } catch (e) {
      currentQuotation = JSON.parse(JSON.stringify(DEFAULT_QUOTATION));
    }
  }

  // Sync Form & Live Document
  syncFormFromState();
  renderItemsInEditor();
  renderTermsInEditor();
  renderLiveDocument();
  updateSavedBadges();

  // Handle window resize
  window.addEventListener("resize", handleWindowResize);
  handleWindowResize();
});

// --- RESPONSIVE LAYOUT HELPER ---
function handleWindowResize() {
  const isDesktop = window.innerWidth > 960;
  if (isDesktop) {
    // On laptop/desktop: both form and preview panes are visible side-by-side
    document.body.classList.remove("view-mode-edit", "view-mode-preview");
  } else {
    // On mobile: activate current mobile mode (edit or preview)
    document.body.classList.remove("view-mode-edit", "view-mode-preview");
    document.body.classList.add(currentMobileMode === "preview" ? "view-mode-preview" : "view-mode-edit");
  }
}

// --- HAPTIC FEEDBACK ---
function triggerHaptic() {
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(8);
    } catch (e) {}
  }
}

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 250);
  }, 2400);
}

// --- THEME TOGGLE ---
function toggleTheme() {
  triggerHaptic();
  const isDark = document.body.classList.contains("theme-dark");
  const targetTheme = isDark ? "theme-light" : "theme-dark";

  document.body.classList.remove("theme-dark", "theme-light");
  document.body.classList.add(targetTheme);
  localStorage.setItem("qm_theme", targetTheme);

  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  const isDark = document.body.classList.contains("theme-dark");
  btn.innerHTML = isDark ? "☀️" : "🌙";
}

// ==========================================================================
// DESKTOP & GLOBAL MAIN TAB NAVIGATION (EDITOR / SAVED / PROFILE)
// ==========================================================================
function switchMainTab(tabKey) {
  triggerHaptic();

  // Hide all main views
  document.querySelectorAll(".main-tab-view").forEach(v => v.classList.remove("active"));

  // Desktop tab buttons
  document.querySelectorAll(".desk-nav-btn").forEach(b => b.classList.remove("active"));
  const deskBtn = document.getElementById(`deskTab${capitalize(tabKey)}`);
  if (deskBtn) deskBtn.classList.add("active");

  // Mobile tab buttons
  document.querySelectorAll(".mob-tab-btn").forEach(b => b.classList.remove("active"));

  const viewEditor = document.getElementById("viewEditor");
  const viewSaved = document.getElementById("viewSaved");
  const viewProfile = document.getElementById("viewProfile");
  const floatingBtn = document.getElementById("floatingToggleBtn");

  if (tabKey === "editor") {
    viewEditor.classList.add("active");
    if (window.innerWidth <= 960) {
      setMobileMode("edit", false);
    } else {
      if (floatingBtn) floatingBtn.style.display = "none";
    }
  } else if (tabKey === "saved") {
    viewSaved.classList.add("active");
    const mobSaved = document.getElementById("mobTabSaved");
    if (mobSaved) mobSaved.classList.add("active");
    if (floatingBtn) floatingBtn.style.display = "none";
    renderSavedList();
  } else if (tabKey === "profile") {
    viewProfile.classList.add("active");
    const mobProf = document.getElementById("mobTabProfile");
    if (mobProf) mobProf.classList.add("active");
    if (floatingBtn) floatingBtn.style.display = "none";
    populateProfileForm();
  }
}

// ==========================================================================
// MOBILE STICKY SUB-NAV CONTROLLER (EDIT VS PREVIEW)
// ==========================================================================
function setMobileMode(mode, triggerHaptics = true) {
  if (triggerHaptics) triggerHaptic();
  currentMobileMode = mode;

  // Make sure we are on the Editor view
  const viewEditor = document.getElementById("viewEditor");
  const viewSaved = document.getElementById("viewSaved");
  const viewProfile = document.getElementById("viewProfile");

  viewEditor.classList.add("active");
  viewSaved.classList.remove("active");
  viewProfile.classList.remove("active");

  // Update mobile tabs
  document.querySelectorAll(".mob-tab-btn").forEach(b => b.classList.remove("active"));
  const activeMobBtn = document.getElementById(mode === "preview" ? "mobTabPreview" : "mobTabEdit");
  if (activeMobBtn) activeMobBtn.classList.add("active");

  // Sync desktop tab
  const deskEditor = document.getElementById("deskTabEditor");
  if (deskEditor) {
    document.querySelectorAll(".desk-nav-btn").forEach(b => b.classList.remove("active"));
    deskEditor.classList.add("active");
  }

  // Update Body View Mode Class
  if (mode === "preview") {
    document.body.classList.remove("view-mode-edit");
    document.body.classList.add("view-mode-preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    document.body.classList.remove("view-mode-preview");
    document.body.classList.add("view-mode-edit");
  }

  updateFloatingButton();
}

function toggleMobileEditPreview() {
  if (currentMobileMode === "edit") {
    setMobileMode("preview");
  } else {
    setMobileMode("edit");
  }
}

function updateFloatingButton() {
  const floatingBtn = document.getElementById("floatingToggleBtn");
  const floatIcon = document.getElementById("floatingToggleIcon");
  const floatText = document.getElementById("floatingToggleText");

  if (!floatingBtn) return;

  if (window.innerWidth > 960) {
    floatingBtn.style.display = "none";
    return;
  }

  floatingBtn.style.display = "inline-flex";
  if (currentMobileMode === "preview") {
    if (floatIcon) floatIcon.innerText = "✏️";
    if (floatText) floatText.innerText = "Back to Edit";
  } else {
    if (floatIcon) floatIcon.innerText = "👁️";
    if (floatText) floatText.innerText = "Preview Quote";
  }
}

// --- ACCORDION TOGGLE ---
function toggleAccordion(headerEl) {
  const card = headerEl.closest(".form-card");
  if (card) card.classList.toggle("collapsed");
}

// --- SYNC FORM FROM STATE ---
function syncFormFromState() {
  document.getElementById("inputBusinessName").value = currentQuotation.businessName || "";
  document.getElementById("inputAddress").value = currentQuotation.businessAddress || "";
  document.getElementById("inputMobile").value = currentQuotation.mobile || "";
  document.getElementById("inputDate").value = currentQuotation.date || new Date().toISOString().split('T')[0];
  document.getElementById("inputSubject").value = currentQuotation.subject || "";

  document.getElementById("inputClientName").value = currentQuotation.clientName || "";
  document.getElementById("inputClientPhone").value = currentQuotation.clientPhone || "";
  document.getElementById("inputClientAddress").value = currentQuotation.clientAddress || "";

  const checkShowClient = document.getElementById("checkShowClient");
  checkShowClient.checked = !!currentQuotation.showClient;
  toggleClientFields(false);

  document.getElementById("checkOuterBorder").checked = currentQuotation.showOuterBorder !== false;
  document.getElementById("checkShowTotalRow").checked = currentQuotation.showTotal !== false;
  document.getElementById("checkShowSignatory").checked = currentQuotation.showSignatory !== false;
  document.getElementById("inputSignatoryName").value = currentQuotation.signatoryName || currentQuotation.businessName || "";

  setTableMode(currentQuotation.tableMode || "standard", false);
}

// --- HANDLE INPUT CHANGE ---
function handleInputChange() {
  currentQuotation.businessName = document.getElementById("inputBusinessName").value;
  currentQuotation.businessAddress = document.getElementById("inputAddress").value;
  currentQuotation.mobile = document.getElementById("inputMobile").value;
  currentQuotation.date = document.getElementById("inputDate").value;
  currentQuotation.subject = document.getElementById("inputSubject").value;

  currentQuotation.clientName = document.getElementById("inputClientName").value;
  currentQuotation.clientPhone = document.getElementById("inputClientPhone").value;
  currentQuotation.clientAddress = document.getElementById("inputClientAddress").value;
  currentQuotation.signatoryName = document.getElementById("inputSignatoryName").value;

  renderLiveDocument();
  autoSaveDraft();
}

function handleDirectEdit(field, value) {
  if (field in currentQuotation) {
    currentQuotation[field] = value.trim();
    syncFormFromState();
    autoSaveDraft();
  }
}

function autoSaveDraft() {
  localStorage.setItem("qm_current_draft", JSON.stringify(currentQuotation));
}

// --- TOGGLE CLIENT FIELDS ---
function toggleClientFields(shouldUpdateState = true) {
  const isChecked = document.getElementById("checkShowClient").checked;
  const container = document.getElementById("clientFieldsContainer");
  const docMeta = document.getElementById("docClientMetaRow");

  if (isChecked) {
    container.classList.remove("hidden");
    docMeta.classList.remove("hidden");
  } else {
    container.classList.add("hidden");
    docMeta.classList.add("hidden");
  }

  if (shouldUpdateState) {
    currentQuotation.showClient = isChecked;
    renderLiveDocument();
    autoSaveDraft();
  }
}

// --- DISPLAY OPTIONS ---
function toggleOuterBorder() {
  const isChecked = document.getElementById("checkOuterBorder").checked;
  currentQuotation.showOuterBorder = isChecked;
  const paper = document.getElementById("quotationPaper");
  if (isChecked) {
    paper.classList.add("with-border");
  } else {
    paper.classList.remove("with-border");
  }
  autoSaveDraft();
}

function toggleTotalRow() {
  currentQuotation.showTotal = document.getElementById("checkShowTotalRow").checked;
  renderLiveDocument();
  autoSaveDraft();
}

function toggleSignatory() {
  currentQuotation.showSignatory = document.getElementById("checkShowSignatory").checked;
  renderLiveDocument();
  autoSaveDraft();
}

// --- TABLE MODE ---
function setTableMode(mode, triggerRender = true) {
  currentQuotation.tableMode = mode;
  const btnStandard = document.getElementById("btnModeStandard");
  const btnCalculated = document.getElementById("btnModeCalculated");

  if (mode === "calculated") {
    btnCalculated.classList.add("active");
    btnStandard.classList.remove("active");
  } else {
    btnStandard.classList.add("active");
    btnCalculated.classList.remove("active");
  }

  if (triggerRender) {
    renderItemsInEditor();
    renderLiveDocument();
    autoSaveDraft();
  }
}

// --- RESPONSIVE ITEM ROWS ---
function renderItemsInEditor() {
  const container = document.getElementById("itemsContainer");
  container.innerHTML = "";

  const isCalc = currentQuotation.tableMode === "calculated";

  currentQuotation.items.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "item-card-row";

    if (!isCalc) {
      card.innerHTML = `
        <div class="item-row-top">
          <span class="item-badge-sr">${index + 1}</span>
          <input type="text" class="form-input" placeholder="Item Description" value="${escapeHtml(item.desc)}" oninput="updateItemField(${index}, 'desc', this.value)" style="flex:1;">
          <button type="button" class="btn-del-row" onclick="deleteItem(${index})" title="Delete Item">✕</button>
        </div>
        <div class="item-row-bottom">
          <label style="margin:0; font-size:0.75rem; color:var(--text-secondary); width:36px;">Rate:</label>
          <input type="text" class="form-input" placeholder="e.g. 1800 or 15 fit" value="${escapeHtml(item.rate)}" oninput="updateItemField(${index}, 'rate', this.value)" style="flex:1; max-width:200px;">
        </div>
      `;
    } else {
      const qty = parseInt(item.qty, 10) || 1;
      const cleanRate = parseFloat(String(item.rate).replace(/[^0-9.]/g, '')) || 0;
      const amount = (qty * cleanRate).toLocaleString('en-IN');

      card.innerHTML = `
        <div class="item-row-top">
          <span class="item-badge-sr">${index + 1}</span>
          <input type="text" class="form-input" placeholder="Item Description" value="${escapeHtml(item.desc)}" oninput="updateItemField(${index}, 'desc', this.value)" style="flex:1;">
          <button type="button" class="btn-del-row" onclick="deleteItem(${index})" title="Delete Item">✕</button>
        </div>
        <div class="item-row-bottom">
          <div style="display:flex; align-items:center; gap:6px; flex:1;">
            <label style="margin:0; font-size:0.75rem; color:var(--text-secondary);">Qty:</label>
            <input type="number" min="1" class="form-input" value="${qty}" oninput="updateItemField(${index}, 'qty', this.value)" style="width:65px;">
            <label style="margin:0; font-size:0.75rem; color:var(--text-secondary); margin-left:4px;">Rate:</label>
            <input type="text" class="form-input" placeholder="Rate" value="${escapeHtml(item.rate)}" oninput="updateItemField(${index}, 'rate', this.value)" style="width:85px;">
          </div>
          <span style="font-size:0.82rem; font-weight:800; color:var(--text-primary); margin-left:auto;">₹${amount}</span>
        </div>
      `;
    }

    container.appendChild(card);
  });

  const countBadge = document.getElementById("itemCountBadge");
  if (countBadge) countBadge.innerText = `${currentQuotation.items.length} Items`;
}

function updateItemField(index, field, value) {
  if (currentQuotation.items[index]) {
    currentQuotation.items[index][field] = value;
    renderLiveDocument();
    autoSaveDraft();
  }
}

function addNewItem() {
  triggerHaptic();
  currentQuotation.items.push({
    desc: "",
    rate: "",
    qty: 1
  });
  renderItemsInEditor();
  renderLiveDocument();
  autoSaveDraft();

  setTimeout(() => {
    const container = document.getElementById("itemsContainer");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
    const inputs = document.querySelectorAll(".items-list-container .item-row-top input");
    if (inputs.length) inputs[inputs.length - 1].focus();
  }, 40);
}

function quickAddItem(desc, rate) {
  triggerHaptic();
  currentQuotation.items.push({
    desc: desc,
    rate: rate,
    qty: 1
  });
  renderItemsInEditor();
  renderLiveDocument();
  autoSaveDraft();
  showToast(`Added: ${desc}`, "info");

  setTimeout(() => {
    const container = document.getElementById("itemsContainer");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, 40);
}

function deleteItem(index) {
  triggerHaptic();
  currentQuotation.items.splice(index, 1);
  renderItemsInEditor();
  renderLiveDocument();
  autoSaveDraft();
}

// --- TERMS IN EDITOR ---
function renderTermsInEditor() {
  const container = document.getElementById("termsContainer");
  container.innerHTML = "";

  currentQuotation.terms.forEach((term, index) => {
    const row = document.createElement("div");
    row.className = "term-item-row";
    row.innerHTML = `
      <span class="term-index">${index + 1}.</span>
      <input type="text" class="form-input" value="${escapeHtml(term)}" oninput="updateTermField(${index}, this.value)" style="flex:1;">
      <button type="button" class="btn-del-row" onclick="deleteTerm(${index})" title="Delete Term">✕</button>
    `;
    container.appendChild(row);
  });
}

function updateTermField(index, value) {
  if (currentQuotation.terms[index] !== undefined) {
    currentQuotation.terms[index] = value;
    renderLiveDocument();
    autoSaveDraft();
  }
}

function addNewTerm() {
  triggerHaptic();
  currentQuotation.terms.push("");
  renderTermsInEditor();
  renderLiveDocument();
  autoSaveDraft();

  setTimeout(() => {
    const inputs = document.querySelectorAll(".terms-list-container input");
    if (inputs.length) inputs[inputs.length - 1].focus();
  }, 40);
}

function quickAddTerm(text) {
  triggerHaptic();
  currentQuotation.terms.push(text);
  renderTermsInEditor();
  renderLiveDocument();
  autoSaveDraft();
  showToast("Added condition", "info");
}

function deleteTerm(index) {
  triggerHaptic();
  currentQuotation.terms.splice(index, 1);
  renderTermsInEditor();
  renderLiveDocument();
  autoSaveDraft();
}

// --- LIVE DOCUMENT RENDERER (1:1 REFERENCE) ---
function renderLiveDocument() {
  // Business Name
  document.getElementById("docBusinessName").innerText = currentQuotation.businessName || "Your Business Name";

  // Address
  document.getElementById("docAddress").innerText = currentQuotation.businessAddress || "";

  // Mobile
  document.getElementById("docMobile").innerText = currentQuotation.mobile || "-";

  // Subject
  document.getElementById("docSubject").innerText = currentQuotation.subject || "Quotation Subject";

  // Client Meta
  const docMeta = document.getElementById("docClientMetaRow");
  if (currentQuotation.showClient) {
    docMeta.classList.remove("hidden");
    document.getElementById("docClientName").innerText = currentQuotation.clientName || "-";
    document.getElementById("docClientSite").innerText = currentQuotation.clientAddress ? `Site: ${currentQuotation.clientAddress}` : "";
    document.getElementById("docDate").innerText = formatDateDisplay(currentQuotation.date);
  } else {
    docMeta.classList.add("hidden");
  }

  // Border frame toggle
  const paper = document.getElementById("quotationPaper");
  if (currentQuotation.showOuterBorder) {
    paper.classList.add("with-border");
  } else {
    paper.classList.remove("with-border");
  }

  // Table header
  const theadRow = document.getElementById("docTableHeadRow");
  const isCalc = currentQuotation.tableMode === "calculated";

  if (!isCalc) {
    theadRow.innerHTML = `
      <th class="col-sr">Sr. No.</th>
      <th class="col-desc">Item Description</th>
      <th class="col-rate">Rate</th>
    `;
  } else {
    theadRow.innerHTML = `
      <th class="col-sr">Sr. No.</th>
      <th class="col-desc">Item Description</th>
      <th style="width: 45px; text-align: center;">Qty</th>
      <th class="col-rate">Rate</th>
      <th style="width: 90px; text-align: right;">Amount</th>
    `;
  }

  // Table Body Rows
  const tbody = document.getElementById("docTableBody");
  tbody.innerHTML = "";

  let totalNumeric = 0;
  let hasValidNumbers = false;

  currentQuotation.items.forEach((item, index) => {
    const tr = document.createElement("tr");
    const cleanRate = parseFloat(String(item.rate).replace(/[^0-9.]/g, ''));
    const isRateNumeric = !isNaN(cleanRate) && cleanRate > 0;
    const qty = parseInt(item.qty, 10) || 1;

    if (isRateNumeric) {
      hasValidNumbers = true;
      totalNumeric += cleanRate * qty;
    }

    if (!isCalc) {
      tr.innerHTML = `
        <td class="col-sr">${index + 1}</td>
        <td class="col-desc">${escapeHtml(item.desc || "-")}</td>
        <td class="col-rate">${escapeHtml(item.rate || "-")}</td>
      `;
    } else {
      const amount = isRateNumeric ? (cleanRate * qty).toLocaleString('en-IN') : "-";
      tr.innerHTML = `
        <td class="col-sr">${index + 1}</td>
        <td class="col-desc">${escapeHtml(item.desc || "-")}</td>
        <td style="text-align: center;">${qty}</td>
        <td class="col-rate">${escapeHtml(item.rate || "-")}</td>
        <td style="text-align: right; font-weight: 700;">₹${amount}</td>
      `;
    }

    tbody.appendChild(tr);
  });

  // Table Foot - Keep strictly empty to prevent browsers from repeating Total on Page 1 during print!
  const tfoot = document.getElementById("docTableFoot");
  if (tfoot) tfoot.innerHTML = "";

  // Append Total Row inside tbody directly after items (renders once at end, never repeats on Page 1 in print)
  if (currentQuotation.showTotal && hasValidNumbers && currentQuotation.items.length > 0) {
    const trTotal = document.createElement("tr");
    trTotal.className = "doc-total-row";

    if (!isCalc) {
      trTotal.innerHTML = `
        <th colspan="2" style="text-align: right; padding-right: 12px; font-weight: 800;">Total</th>
        <th class="col-rate" style="font-weight: 800;">₹${totalNumeric.toLocaleString('en-IN')}</th>
      `;
    } else {
      trTotal.innerHTML = `
        <th colspan="4" style="text-align: right; padding-right: 12px; font-weight: 800;">Total Amount</th>
        <th style="text-align: right; font-weight: 800;">₹${totalNumeric.toLocaleString('en-IN')}</th>
      `;
    }
    tbody.appendChild(trTotal);
  }

  // Terms and conditions
  const termsList = document.getElementById("docTermsList");
  termsList.innerHTML = "";
  currentQuotation.terms.forEach(term => {
    if (term.trim()) {
      const li = document.createElement("li");
      li.innerText = term;
      termsList.appendChild(li);
    }
  });

  // Signatory
  const signSection = document.getElementById("docSignatorySection");
  if (currentQuotation.showSignatory) {
    signSection.style.display = "flex";
    document.getElementById("docSignatoryName").innerText = currentQuotation.signatoryName || currentQuotation.businessName || "Authorized Signatory";
  } else {
    signSection.style.display = "none";
  }
}

// --- SAVED QUOTATIONS MANAGEMENT ---
function saveCurrentQuotation() {
  triggerHaptic();

  if (!currentQuotation.subject.trim()) {
    showToast("Please enter a subject before saving", "error");
    return;
  }

  if (!currentQuotation.id || currentQuotation.id === "q_default") {
    currentQuotation.id = "q_" + Date.now();
  }

  currentQuotation.updatedAt = new Date().toISOString();

  const existingIdx = savedQuotations.findIndex(q => q.id === currentQuotation.id);
  if (existingIdx >= 0) {
    savedQuotations[existingIdx] = JSON.parse(JSON.stringify(currentQuotation));
    showToast("Quotation updated! 💾", "success");
  } else {
    savedQuotations.unshift(JSON.parse(JSON.stringify(currentQuotation)));
    showToast("Quotation saved! 💾", "success");
  }

  localStorage.setItem("qm_saved_quotations", JSON.stringify(savedQuotations));
  updateSavedBadges();
}

function loadQuotation(id) {
  triggerHaptic();
  const found = savedQuotations.find(q => q.id === id);
  if (found) {
    currentQuotation = JSON.parse(JSON.stringify(found));
    syncFormFromState();
    renderItemsInEditor();
    renderTermsInEditor();
    renderLiveDocument();
    autoSaveDraft();
    switchMainTab("editor");
    showToast("Loaded quotation! 📝", "info");
  }
}

function duplicateQuotation(id) {
  triggerHaptic();
  const found = savedQuotations.find(q => q.id === id);
  if (found) {
    const clone = JSON.parse(JSON.stringify(found));
    clone.id = "q_" + Date.now();
    clone.subject = `Copy of ${clone.subject}`;
    clone.updatedAt = new Date().toISOString();
    savedQuotations.unshift(clone);
    localStorage.setItem("qm_saved_quotations", JSON.stringify(savedQuotations));
    updateSavedBadges();
    renderSavedList();
    showToast("Quotation duplicated! 📋", "success");
  }
}

function deleteQuotation(id) {
  triggerHaptic();
  if (confirm("Delete this quotation from saved history?")) {
    savedQuotations = savedQuotations.filter(q => q.id !== id);
    localStorage.setItem("qm_saved_quotations", JSON.stringify(savedQuotations));
    updateSavedBadges();
    renderSavedList();
    showToast("Quotation deleted.", "info");
  }
}

function renderSavedList(filterQuery = "") {
  const container = document.getElementById("savedQuotationsList");
  const emptyState = document.getElementById("savedEmptyState");
  container.innerHTML = "";

  const query = filterQuery.toLowerCase().trim();
  const filtered = savedQuotations.filter(q => {
    if (!query) return true;
    return (
      (q.subject && q.subject.toLowerCase().includes(query)) ||
      (q.clientName && q.clientName.toLowerCase().includes(query)) ||
      (q.businessName && q.businessName.toLowerCase().includes(query))
    );
  });

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  filtered.forEach(q => {
    const card = document.createElement("div");
    card.className = "saved-item-card";

    let total = 0;
    (q.items || []).forEach(it => {
      const cleanRate = parseFloat(String(it.rate).replace(/[^0-9.]/g, ''));
      if (!isNaN(cleanRate)) total += cleanRate * (it.qty || 1);
    });

    card.innerHTML = `
      <div class="saved-item-head">
        <h4 class="saved-item-title">${escapeHtml(q.subject || "Untitled Quotation")}</h4>
        <span class="saved-item-date">${formatDateDisplay(q.date)}</span>
      </div>
      <div class="saved-item-meta">
        <span>Items: <strong>${(q.items || []).length}</strong></span>
        ${total > 0 ? `<span>Total: <strong>₹${total.toLocaleString('en-IN')}</strong></span>` : ''}
      </div>
      ${q.clientName ? `<div style="font-size:0.75rem; color:var(--text-secondary);">Client: <strong>${escapeHtml(q.clientName)}</strong></div>` : ''}
      <div class="saved-item-actions">
        <button class="btn-pill btn-pill-primary" onclick="loadQuotation('${q.id}')">✏️ Edit</button>
        <button class="btn-pill" onclick="duplicateQuotation('${q.id}')">📋 Clone</button>
        <button class="btn-pill btn-pill-danger" onclick="deleteQuotation('${q.id}')">🗑️</button>
      </div>
    `;

    container.appendChild(card);
  });
}

function filterSavedQuotations() {
  const query = document.getElementById("savedSearchInput").value;
  renderSavedList(query);
}

function updateSavedBadges() {
  const count = savedQuotations.length;
  const deskBadge = document.getElementById("deskSavedCount");
  const mobBadge = document.getElementById("mobSavedCount");
  if (deskBadge) deskBadge.innerText = count;
  if (mobBadge) mobBadge.innerText = count;
}

// --- NEW QUOTATION & SAMPLES ---
function createNewQuotation() {
  triggerHaptic();
  currentQuotation = {
    id: "q_" + Date.now(),
    businessName: businessProfile ? businessProfile.name : "Virendra Vishwakarma",
    businessAddress: businessProfile ? businessProfile.address : "Siddhivinayak CHS, Singh Estate, Road No.1, Samta Nagar, Kandivali East, Mumbai - 400101.",
    mobile: businessProfile ? businessProfile.mobile : "9082356335",
    date: new Date().toISOString().split('T')[0],
    clientName: "",
    clientPhone: "",
    clientAddress: "",
    subject: "",
    items: [
      { desc: "", rate: "", qty: 1 }
    ],
    terms: businessProfile && businessProfile.terms && businessProfile.terms.length ? businessProfile.terms : ["Payment terms: Done in 15 days."],
    tableMode: "standard",
    showOuterBorder: true,
    showTotal: true,
    showClient: false,
    showSignatory: true,
    signatoryName: businessProfile ? businessProfile.name : "Virendra Vishwakarma"
  };

  syncFormFromState();
  renderItemsInEditor();
  renderTermsInEditor();
  renderLiveDocument();
  autoSaveDraft();
  switchMainTab("editor");
  showToast("Ready for new quotation!", "info");
}

function loadDefaultTemplate() {
  triggerHaptic();
  currentQuotation = JSON.parse(JSON.stringify(DEFAULT_QUOTATION));
  currentQuotation.id = "q_" + Date.now();
  currentQuotation.date = new Date().toISOString().split('T')[0];

  syncFormFromState();
  renderItemsInEditor();
  renderTermsInEditor();
  renderLiveDocument();
  autoSaveDraft();
  showToast("Loaded sample quotation!", "success");
}

function clearQuotationData() {
  triggerHaptic();
  if (confirm("Clear items and subject to start clean?")) {
    currentQuotation.subject = "";
    currentQuotation.items = [{ desc: "", rate: "", qty: 1 }];
    syncFormFromState();
    renderItemsInEditor();
    renderLiveDocument();
    autoSaveDraft();
    showToast("Editor cleared", "info");
  }
}

// --- BUSINESS PROFILE ---
function populateProfileForm() {
  if (!businessProfile) return;
  document.getElementById("profBusinessName").value = businessProfile.name || "";
  document.getElementById("profAddress").value = businessProfile.address || "";
  document.getElementById("profMobile").value = businessProfile.mobile || "";
  document.getElementById("profAltMobile").value = businessProfile.altMobile || "";
  document.getElementById("profDefaultTerms").value = (businessProfile.terms || []).join("\n");
}

function handleSaveProfile(e) {
  e.preventDefault();
  triggerHaptic();

  const termsText = document.getElementById("profDefaultTerms").value;
  const termsArr = termsText.split("\n").map(t => t.trim()).filter(Boolean);

  businessProfile = {
    name: document.getElementById("profBusinessName").value.trim(),
    address: document.getElementById("profAddress").value.trim(),
    mobile: document.getElementById("profMobile").value.trim(),
    altMobile: document.getElementById("profAltMobile").value.trim(),
    terms: termsArr
  };

  localStorage.setItem("qm_business_profile", JSON.stringify(businessProfile));
  showToast("Business profile saved! 🏢", "success");
}

function applyProfileToCurrent() {
  triggerHaptic();
  if (!businessProfile) {
    showToast("Please save a profile first.", "error");
    return;
  }
  currentQuotation.businessName = businessProfile.name;
  currentQuotation.businessAddress = businessProfile.address;
  currentQuotation.mobile = businessProfile.mobile;
  currentQuotation.signatoryName = businessProfile.name;
  if (businessProfile.terms && businessProfile.terms.length) {
    currentQuotation.terms = [...businessProfile.terms];
  }

  syncFormFromState();
  renderTermsInEditor();
  renderLiveDocument();
  autoSaveDraft();
  showToast("Profile applied to current quotation!", "success");
}

// --- BACKUP & RESTORE ---
function exportDataBackup() {
  triggerHaptic();
  const data = {
    quotations: savedQuotations,
    profile: businessProfile,
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `QuotationMaker_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(a);
  showToast("Backup downloaded! 📦", "success");
}

function importDataBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.quotations && Array.isArray(parsed.quotations)) {
        savedQuotations = parsed.quotations;
        localStorage.setItem("qm_saved_quotations", JSON.stringify(savedQuotations));
        if (parsed.profile) {
          businessProfile = parsed.profile;
          localStorage.setItem("qm_business_profile", JSON.stringify(businessProfile));
        }
        updateSavedBadges();
        renderSavedList();
        showToast("Backup restored! 🎉", "success");
      } else {
        showToast("Invalid backup file", "error");
      }
    } catch (err) {
      showToast("Error reading backup file", "error");
    }
  };
  reader.readAsText(file);
}

// --- UTILS ---
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateDisplay(dateString) {
  if (!dateString) return "";
  try {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
}
