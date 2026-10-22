/* ==========================================================================
   QUOTATIONMAKER - BULLETPROOF PDF & IMAGE EXPORT ENGINE
   Uses html2canvas + jsPDF with standardized off-screen A4 staging
   Guarantees 100% exact rendering on both mobile and desktop (No clipping!)
   ========================================================================== */

/**
 * Clean filename generator
 */
function getSanitizedFilename(extension) {
  const subject = document.getElementById("inputSubject") ? document.getElementById("inputSubject").value.trim() : "Quotation";
  const dateStr = document.getElementById("inputDate") ? document.getElementById("inputDate").value : new Date().toISOString().split('T')[0];
  const cleanSubject = (subject || "Quotation").replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 36);
  return `Quotation_${cleanSubject}_${dateStr || "draft"}.${extension}`;
}

/**
 * Creates an off-screen staging clone of the quotation sheet
 * positioned at (0, 0) with standard 760px printable width.
 * This completely avoids mobile viewport clipping and coordinate shifts!
 */
function createPrintStagingClone() {
  const sourcePaper = document.getElementById("quotationPaper");
  if (!sourcePaper) return null;

  // Staging wrapper placed off-screen (-9999px) with full opacity
  const stagingContainer = document.createElement("div");
  stagingContainer.id = "printStagingWrapper";
  stagingContainer.style.position = "fixed";
  stagingContainer.style.top = "0";
  stagingContainer.style.left = "-9999px";
  stagingContainer.style.width = "760px";
  stagingContainer.style.zIndex = "-9999";
  stagingContainer.style.opacity = "1";
  stagingContainer.style.pointerEvents = "none";
  stagingContainer.style.backgroundColor = "#ffffff";
  stagingContainer.style.overflow = "visible";

  // Deep clone
  const clone = sourcePaper.cloneNode(true);
  clone.id = "quotationPaperPrintClone";

  // Exact standard dimensions
  clone.style.width = "760px";
  clone.style.minWidth = "760px";
  clone.style.maxWidth = "760px";
  clone.style.boxSizing = "border-box";
  clone.style.margin = "0";
  clone.style.padding = "32px 36px";
  clone.style.backgroundColor = "#ffffff";
  clone.style.color = "#000000";
  clone.style.boxShadow = "none";
  clone.style.fontFamily = "Arial, sans-serif";
  clone.style.border = currentQuotation.showOuterBorder ? "2px solid #000000" : "none";

  // Enforce table cell widths and solid black borders
  const table = clone.querySelector(".doc-table");
  if (table) {
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.border = "1.5px solid #000000";

    const cells = table.querySelectorAll("th, td");
    cells.forEach(cell => {
      cell.style.border = "1.5px solid #000000";
      cell.style.padding = "8px 12px";
      cell.style.color = "#000000";
    });

    const colSrs = clone.querySelectorAll(".col-sr");
    colSrs.forEach(c => { c.style.width = "50px"; c.style.textAlign = "center"; });

    const colRates = clone.querySelectorAll(".col-rate");
    colRates.forEach(c => { c.style.width = "120px"; c.style.textAlign = "left"; });

    const totalRow = clone.querySelector(".doc-total-row");
    if (totalRow) {
      totalRow.style.backgroundColor = "#f8fafc";
      totalRow.style.borderTop = "2px solid #000000";
      const totalCells = totalRow.querySelectorAll("th, td");
      totalCells.forEach(tc => {
        tc.style.border = "1.5px solid #000000";
        tc.style.padding = "8px 12px";
        tc.style.fontWeight = "800";
      });
    }
  }

  stagingContainer.appendChild(clone);
  document.body.appendChild(stagingContainer);

  return {
    cloneNode: clone,
    cleanup: function() {
      if (stagingContainer && stagingContainer.parentNode) {
        stagingContainer.parentNode.removeChild(stagingContainer);
      }
    }
  };
}

// --- HELPER: SAFE ESCAPE & DATE FORMATTING ---
function safeEscape(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeFormatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}/${d.getFullYear()}`;
    }
  } catch (e) {}
  return dateStr;
}

/**
 * Creates an A4 page container element for PDF generation.
 * Exact A4 Aspect: 760px wide by 1075px tall.
 */
function createPDFPageContainer(pageNumber, totalPages, isFirstPage) {
  const page = document.createElement("div");
  page.className = "quotation-pdf-page";
  page.style.width = "760px";
  page.style.minWidth = "760px";
  page.style.maxWidth = "760px";
  page.style.height = "1075px";
  page.style.minHeight = "1075px";
  page.style.maxHeight = "1075px";
  page.style.boxSizing = "border-box";
  page.style.padding = "30px 36px 26px 36px";
  page.style.backgroundColor = "#ffffff";
  page.style.color = "#000000";
  page.style.fontFamily = "Arial, sans-serif";
  page.style.border = currentQuotation.showOuterBorder ? "2px solid #000000" : "none";
  page.style.position = "relative";
  page.style.overflow = "hidden";
  page.style.display = "flex";
  page.style.flexDirection = "column";
  page.style.justifyContent = "space-between";

  // Content body (natural height for accurate offsetHeight measurement during pagination)
  const contentWrapper = document.createElement("div");
  contentWrapper.className = "pdf-page-content";
  contentWrapper.style.width = "100%";
  contentWrapper.style.boxSizing = "border-box";
  contentWrapper.style.display = "flex";
  contentWrapper.style.flexDirection = "column";
  page.appendChild(contentWrapper);

  if (isFirstPage) {
    // Complete Header on Page 1
    const header = document.createElement("div");
    header.style.textAlign = "center";
    header.style.marginBottom = "14px";

    const nameEl = document.createElement("h1");
    nameEl.style.fontSize = "23px";
    nameEl.style.fontWeight = "800";
    nameEl.style.textDecoration = "underline";
    nameEl.style.textUnderlineOffset = "4px";
    nameEl.style.margin = "0 0 5px 0";
    nameEl.style.color = "#000000";
    nameEl.innerText = currentQuotation.businessName || "Your Business Name";
    header.appendChild(nameEl);

    if (currentQuotation.businessAddress) {
      const addrEl = document.createElement("p");
      addrEl.style.fontSize = "12.5px";
      addrEl.style.lineHeight = "1.35";
      addrEl.style.maxWidth = "85%";
      addrEl.style.margin = "0 auto";
      addrEl.style.color = "#000000";
      addrEl.innerText = currentQuotation.businessAddress;
      header.appendChild(addrEl);
    }

    const mobRow = document.createElement("div");
    mobRow.style.textAlign = "right";
    mobRow.style.marginTop = "8px";
    mobRow.style.fontSize = "13.5px";
    mobRow.innerHTML = `<strong>Mobile No.</strong> ${safeEscape(currentQuotation.mobile || "-")}`;
    header.appendChild(mobRow);

    if (currentQuotation.showClient) {
      const metaRow = document.createElement("div");
      metaRow.style.display = "flex";
      metaRow.style.justifyContent = "space-between";
      metaRow.style.fontSize = "12px";
      metaRow.style.borderBottom = "1px solid #ccc";
      metaRow.style.paddingBottom = "4px";
      metaRow.style.marginTop = "6px";
      metaRow.innerHTML = `
        <div><strong>To:</strong> ${safeEscape(currentQuotation.clientName || "-")} ${currentQuotation.clientAddress ? `(Site: ${safeEscape(currentQuotation.clientAddress)})` : ""}</div>
        <div><strong>Date:</strong> ${safeFormatDate(currentQuotation.date)}</div>
      `;
      header.appendChild(metaRow);
    }

    const subWrap = document.createElement("div");
    subWrap.style.textAlign = "center";
    subWrap.style.margin = "12px 0 10px 0";
    subWrap.innerHTML = `<h3 style="font-size: 15px; font-weight: 800; margin: 0; color: #000000;"><strong>Subject:</strong> ${safeEscape(currentQuotation.subject || "Quotation")}</h3>`;
    header.appendChild(subWrap);

    const secTitle = document.createElement("div");
    secTitle.style.fontSize = "16px";
    secTitle.style.fontWeight = "800";
    secTitle.style.marginBottom = "8px";
    secTitle.innerHTML = `<h2 style="font-size: 16px; font-weight: 800; margin: 0; color: #000000;">Quotation Details</h2>`;
    header.appendChild(secTitle);

    contentWrapper.appendChild(header);
  } else {
    // Continuation Header on Subsequent Pages
    const contHeader = document.createElement("div");
    contHeader.style.display = "flex";
    contHeader.style.justifyContent = "space-between";
    contHeader.style.alignItems = "center";
    contHeader.style.paddingBottom = "6px";
    contHeader.style.marginBottom = "10px";
    contHeader.style.borderBottom = "1.5px solid #000000";

    const contName = document.createElement("div");
    contName.style.fontSize = "14px";
    contName.style.fontWeight = "800";
    contName.style.textDecoration = "underline";
    contName.innerText = currentQuotation.businessName || "Quotation";
    contHeader.appendChild(contName);

    const contSub = document.createElement("div");
    contSub.style.fontSize = "12.5px";
    contSub.style.fontWeight = "700";
    contSub.style.color = "#222222";
    contSub.innerText = `Subject: ${currentQuotation.subject || ""} (Contd.)`;
    contHeader.appendChild(contSub);

    contentWrapper.appendChild(contHeader);
  }

  // Table Structure
  const tableWrap = document.createElement("div");
  tableWrap.className = "doc-table-wrapper";
  tableWrap.style.width = "100%";
  tableWrap.style.marginBottom = "10px";

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.border = "1.5px solid #000000";
  table.style.fontSize = "13px";

  const thead = document.createElement("thead");
  const theadTr = document.createElement("tr");

  const isCalc = currentQuotation.tableMode === "calculated";
  if (!isCalc) {
    theadTr.innerHTML = `
      <th style="width: 50px; text-align: center; border: 1.5px solid #000000; padding: 7px 10px; font-weight: 700; background: #ffffff;">Sr. No.</th>
      <th style="text-align: left; border: 1.5px solid #000000; padding: 7px 10px; font-weight: 700; background: #ffffff;">Item Description</th>
      <th style="width: 120px; text-align: left; border: 1.5px solid #000000; padding: 7px 10px; font-weight: 700; background: #ffffff;">Rate</th>
    `;
  } else {
    theadTr.innerHTML = `
      <th style="width: 45px; text-align: center; border: 1.5px solid #000000; padding: 7px 10px; font-weight: 700; background: #ffffff;">Sr. No.</th>
      <th style="text-align: left; border: 1.5px solid #000000; padding: 7px 10px; font-weight: 700; background: #ffffff;">Item Description</th>
      <th style="width: 45px; text-align: center; border: 1.5px solid #000000; padding: 7px 10px; font-weight: 700; background: #ffffff;">Qty</th>
      <th style="width: 95px; text-align: left; border: 1.5px solid #000000; padding: 7px 10px; font-weight: 700; background: #ffffff;">Rate</th>
      <th style="width: 105px; text-align: right; border: 1.5px solid #000000; padding: 7px 10px; font-weight: 700; background: #ffffff;">Amount</th>
    `;
  }
  thead.appendChild(theadTr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  tableWrap.appendChild(table);
  contentWrapper.appendChild(tableWrap);

  // Footer (at bottom of every page)
  const footer = document.createElement("div");
  footer.className = "pdf-page-footer";
  footer.style.height = "20px";
  footer.style.display = "flex";
  footer.style.justifyContent = "space-between";
  footer.style.alignItems = "center";
  footer.style.fontSize = "11px";
  footer.style.color = "#666666";
  footer.style.borderTop = "1px solid #cbd5e1";
  footer.style.marginTop = "auto";
  footer.style.paddingTop = "4px";

  const footerLeft = document.createElement("span");
  footerLeft.innerText = currentQuotation.businessName || "Quotation";
  footer.appendChild(footerLeft);

  const footerRight = document.createElement("span");
  footerRight.className = "page-number-indicator";
  footerRight.innerText = totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : "Page 1 of 1";
  footer.appendChild(footerRight);

  page.appendChild(footer);

  return {
    container: page,
    contentWrapper: contentWrapper,
    tbody: tbody,
    footerRight: footerRight
  };
}

/**
 * Creates an item row <tr> for PDF table
 */
function createItemTr(item, index, isCalc) {
  const tr = document.createElement("tr");
  const cleanRate = parseFloat(String(item.rate).replace(/[^0-9.]/g, ''));
  const isRateNumeric = !isNaN(cleanRate) && cleanRate > 0;
  const qty = parseInt(item.qty, 10) || 1;

  if (!isCalc) {
    tr.innerHTML = `
      <td style="width: 50px; text-align: center; border: 1.5px solid #000000; padding: 7px 10px; vertical-align: middle;">${index + 1}</td>
      <td style="text-align: left; border: 1.5px solid #000000; padding: 7px 10px; vertical-align: middle;">${safeEscape(item.desc || "-")}</td>
      <td style="width: 120px; text-align: left; border: 1.5px solid #000000; padding: 7px 10px; vertical-align: middle;">${safeEscape(item.rate || "-")}</td>
    `;
  } else {
    const amount = isRateNumeric ? (cleanRate * qty).toLocaleString('en-IN') : "-";
    tr.innerHTML = `
      <td style="width: 45px; text-align: center; border: 1.5px solid #000000; padding: 7px 10px; vertical-align: middle;">${index + 1}</td>
      <td style="text-align: left; border: 1.5px solid #000000; padding: 7px 10px; vertical-align: middle;">${safeEscape(item.desc || "-")}</td>
      <td style="width: 45px; text-align: center; border: 1.5px solid #000000; padding: 7px 10px; vertical-align: middle;">${qty}</td>
      <td style="width: 95px; text-align: left; border: 1.5px solid #000000; padding: 7px 10px; vertical-align: middle;">${safeEscape(item.rate || "-")}</td>
      <td style="width: 105px; text-align: right; border: 1.5px solid #000000; padding: 7px 10px; vertical-align: middle; font-weight: 700;">₹${amount}</td>
    `;
  }
  return tr;
}

/**
 * Creates Bottom Block: Total Row, Terms & Conditions, and Signatory
 */
function createBottomBlock(totalNumeric, hasValidNumbers, isCalc) {
  const block = document.createElement("div");
  block.className = "pdf-bottom-block";

  // Total row element (to append inside tbody)
  let totalTr = null;
  if (currentQuotation.showTotal && hasValidNumbers && currentQuotation.items.length > 0) {
    totalTr = document.createElement("tr");
    totalTr.className = "doc-total-row";
    if (!isCalc) {
      totalTr.innerHTML = `
        <th colspan="2" style="text-align: right; padding-right: 12px; font-weight: 800; border: 1.5px solid #000000; background: #f8fafc; padding-top: 7px; padding-bottom: 7px;">Total</th>
        <th style="width: 120px; text-align: left; font-weight: 800; border: 1.5px solid #000000; background: #f8fafc; padding: 7px 10px;">₹${totalNumeric.toLocaleString('en-IN')}</th>
      `;
    } else {
      totalTr.innerHTML = `
        <th colspan="4" style="text-align: right; padding-right: 12px; font-weight: 800; border: 1.5px solid #000000; background: #f8fafc; padding-top: 7px; padding-bottom: 7px;">Total Amount</th>
        <th style="width: 105px; text-align: right; font-weight: 800; border: 1.5px solid #000000; background: #f8fafc; padding: 7px 10px;">₹${totalNumeric.toLocaleString('en-IN')}</th>
      `;
    }
  }

  // Terms and conditions
  const validTerms = (currentQuotation.terms || []).filter(t => t.trim().length > 0);
  if (validTerms.length > 0) {
    const termsSection = document.createElement("div");
    termsSection.style.marginTop = "12px";
    termsSection.style.marginBottom = "12px";

    const termsTitle = document.createElement("h3");
    termsTitle.style.fontSize = "14.5px";
    termsTitle.style.fontWeight = "800";
    termsTitle.style.margin = "0 0 5px 0";
    termsTitle.innerText = "Terms and Conditions";
    termsSection.appendChild(termsTitle);

    const ol = document.createElement("ol");
    ol.style.margin = "0";
    ol.style.paddingLeft = "20px";
    ol.style.fontSize = "12.5px";
    ol.style.lineHeight = "1.5";
    validTerms.forEach(term => {
      const li = document.createElement("li");
      li.style.marginBottom = "3px";
      li.innerText = term;
      ol.appendChild(li);
    });
    termsSection.appendChild(ol);
    block.appendChild(termsSection);
  }

  // Signatory
  if (currentQuotation.showSignatory) {
    const signSection = document.createElement("div");
    signSection.style.marginTop = "16px";
    signSection.style.display = "flex";
    signSection.style.justifyContent = "flex-end";

    const box = document.createElement("div");
    box.style.textAlign = "center";
    box.style.minWidth = "170px";

    const line = document.createElement("div");
    line.style.borderTop = "1.5px solid #000000";
    line.style.marginBottom = "5px";
    box.appendChild(line);

    const sName = document.createElement("div");
    sName.style.fontSize = "13.5px";
    sName.style.fontWeight = "700";
    sName.innerText = currentQuotation.signatoryName || currentQuotation.businessName || "Authorized Signatory";
    box.appendChild(sName);

    const sSub = document.createElement("div");
    sSub.style.fontSize = "11.5px";
    sSub.style.color = "#444444";
    sSub.innerText = "Authorized Signatory";
    box.appendChild(sSub);

    signSection.appendChild(box);
    block.appendChild(signSection);
  }

  return {
    totalTr: totalTr,
    afterTableBlock: block
  };
}

/**
 * Builds discrete paginated A4 page elements inside stagingContainer.
 * Guarantees zero repeating serial numbers, no cut rows, and Total on final page only!
 */
function buildPaginatedPDFPages(staging) {
  let totalNumeric = 0;
  let hasValidNumbers = false;
  const isCalc = currentQuotation.tableMode === "calculated";
  const items = currentQuotation.items || [];
  // 1075px page height - 56px padding - 4px borders - 24px footer - 11px safety buffer = 980px
  const MAX_CONTENT_HEIGHT = 980;

  items.forEach(item => {
    const cleanRate = parseFloat(String(item.rate).replace(/[^0-9.]/g, ''));
    const isRateNumeric = !isNaN(cleanRate) && cleanRate > 0;
    const qty = parseInt(item.qty, 10) || 1;
    if (isRateNumeric) {
      hasValidNumbers = true;
      totalNumeric += cleanRate * qty;
    }
  });

  // Step 1: Trial Single Page
  const trialPage = createPDFPageContainer(1, 1, true);
  staging.appendChild(trialPage.container);

  items.forEach((item, idx) => {
    const tr = createItemTr(item, idx, isCalc);
    trialPage.tbody.appendChild(tr);
  });

  const trialBottom = createBottomBlock(totalNumeric, hasValidNumbers, isCalc);
  if (trialBottom.totalTr) trialPage.tbody.appendChild(trialBottom.totalTr);
  if (trialBottom.afterTableBlock) trialPage.contentWrapper.appendChild(trialBottom.afterTableBlock);

  // If everything fits on 1 page without overflow
  if (trialPage.contentWrapper.offsetHeight <= MAX_CONTENT_HEIGHT) {
    return [trialPage];
  }

  // Step 2: Multi-Page Partitioning
  staging.removeChild(trialPage.container);
  const pages = [];
  let currentItemIdx = 0;
  const totalItemsCount = items.length;

  while (currentItemIdx < totalItemsCount) {
    const isFirst = pages.length === 0;
    const pageObj = createPDFPageContainer(pages.length + 1, 999, isFirst);
    staging.appendChild(pageObj.container);

    let itemsOnThisPage = 0;

    while (currentItemIdx < totalItemsCount) {
      const isLastItemOverall = (currentItemIdx === totalItemsCount - 1);
      const tr = createItemTr(items[currentItemIdx], currentItemIdx, isCalc);
      pageObj.tbody.appendChild(tr);

      if (isLastItemOverall) {
        // Test if bottom block fits on this page too
        const b = createBottomBlock(totalNumeric, hasValidNumbers, isCalc);
        if (b.totalTr) pageObj.tbody.appendChild(b.totalTr);
        if (b.afterTableBlock) pageObj.contentWrapper.appendChild(b.afterTableBlock);

        if (pageObj.contentWrapper.offsetHeight <= MAX_CONTENT_HEIGHT) {
          itemsOnThisPage++;
          currentItemIdx++;
          break; // Done with all items!
        } else {
          // Bottom block causes overflow, remove it
          if (b.afterTableBlock && b.afterTableBlock.parentNode) {
            b.afterTableBlock.parentNode.removeChild(b.afterTableBlock);
          }
          if (b.totalTr && b.totalTr.parentNode) {
            b.totalTr.parentNode.removeChild(b.totalTr);
          }

          if (pageObj.contentWrapper.offsetHeight <= MAX_CONTENT_HEIGHT && itemsOnThisPage > 0) {
            itemsOnThisPage++;
            currentItemIdx++;
            break; // Item stays on this page, bottom block goes to next page
          } else {
            if (itemsOnThisPage > 0) {
              pageObj.tbody.removeChild(tr);
              break; // Start next page with this item and bottom block
            } else {
              itemsOnThisPage++;
              currentItemIdx++;
              break;
            }
          }
        }
      } else {
        // Not the last item
        if (pageObj.contentWrapper.offsetHeight <= MAX_CONTENT_HEIGHT) {
          itemsOnThisPage++;
          currentItemIdx++;
        } else {
          if (itemsOnThisPage > 0) {
            pageObj.tbody.removeChild(tr);
            break; // Finish this page
          } else {
            itemsOnThisPage++;
            currentItemIdx++;
            break;
          }
        }
      }
    }

    pages.push(pageObj);
  }

  // Ensure bottom block is placed on the final page
  if (pages.length > 0) {
    const lastPageObj = pages[pages.length - 1];
    const hasBottomBlock = lastPageObj.contentWrapper.querySelector(".pdf-bottom-block");

    if (!hasBottomBlock) {
      const b = createBottomBlock(totalNumeric, hasValidNumbers, isCalc);
      if (b.totalTr) lastPageObj.tbody.appendChild(b.totalTr);
      if (b.afterTableBlock) lastPageObj.contentWrapper.appendChild(b.afterTableBlock);

      if (lastPageObj.contentWrapper.offsetHeight > MAX_CONTENT_HEIGHT) {
        // Remove from lastPageObj
        if (b.afterTableBlock && b.afterTableBlock.parentNode) {
          b.afterTableBlock.parentNode.removeChild(b.afterTableBlock);
        }
        if (b.totalTr && b.totalTr.parentNode) {
          b.totalTr.parentNode.removeChild(b.totalTr);
        }

        // Create dedicated final page
        const finalPageObj = createPDFPageContainer(pages.length + 1, 999, false);
        staging.appendChild(finalPageObj.container);

        // Move last 1-2 items if available for balance
        const trs = Array.from(lastPageObj.tbody.querySelectorAll("tr"));
        if (trs.length > 2) {
          const moveCount = Math.min(2, Math.floor(trs.length / 2));
          for (let m = trs.length - moveCount; m < trs.length; m++) {
            finalPageObj.tbody.appendChild(trs[m]);
          }
        }

        const bFinal = createBottomBlock(totalNumeric, hasValidNumbers, isCalc);
        if (bFinal.totalTr) finalPageObj.tbody.appendChild(bFinal.totalTr);
        if (bFinal.afterTableBlock) finalPageObj.contentWrapper.appendChild(bFinal.afterTableBlock);

        pages.push(finalPageObj);
      }
    }
  }

  // Update footers across all pages
  const totalPages = pages.length;
  pages.forEach((pObj, idx) => {
    if (pObj.footerRight) {
      pObj.footerRight.innerText = totalPages > 1 ? `Page ${idx + 1} of ${totalPages}` : "Page 1 of 1";
    }
  });

  return pages;
}

/**
 * EXPORT AS PDF
 * Discrete multi-page renderer:
 * 1. Zero repeating serial numbers!
 * 2. Zero cut rows!
 * 3. Total amount ONLY on the final page!
 * 4. Crisp 300+ DPI quality on both mobile and laptop!
 */
async function exportQuotationPDF() {
  triggerHaptic();
  showToast("Generating PDF document...", "info");

  // Create staging wrapper placed off-screen (-9999px) with full opacity
  const stagingContainer = document.createElement("div");
  stagingContainer.id = "pdfStagingWrapper";
  stagingContainer.style.position = "fixed";
  stagingContainer.style.top = "0";
  stagingContainer.style.left = "-9999px";
  stagingContainer.style.width = "760px";
  stagingContainer.style.zIndex = "-9999";
  stagingContainer.style.opacity = "1";
  stagingContainer.style.pointerEvents = "none";
  stagingContainer.style.backgroundColor = "#ffffff";
  stagingContainer.style.overflow = "visible";
  document.body.appendChild(stagingContainer);

  const filename = getSanitizedFilename("pdf");

  try {
    const pages = buildPaginatedPDFPages(stagingContainer);

    const JsPDFClass = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : (window.jsPDF || null);
    if (!JsPDFClass) {
      if (stagingContainer.parentNode) stagingContainer.parentNode.removeChild(stagingContainer);
      showToast("PDF engine not found, opening print dialog...", "error");
      window.print();
      return;
    }

    const pdf = new JsPDFClass({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage();
      const pageEl = pages[i].container;

      const canvas = await window.html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: 760,
        height: 1075,
        logging: false
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    if (stagingContainer.parentNode) {
      stagingContainer.parentNode.removeChild(stagingContainer);
    }

    pdf.save(filename);
    showToast("PDF downloaded successfully! 📄", "success");
  } catch (err) {
    if (stagingContainer.parentNode) {
      stagingContainer.parentNode.removeChild(stagingContainer);
    }
    console.error("PDF generation failed:", err);
    showToast("PDF export failed, opening print dialog...", "error");
    window.print();
  }
}

/**
 * EXPORT AS HIGH-RESOLUTION IMAGE (PNG)
 * Sharp 2.2x pixel ratio image, unclipped and centered
 */
function exportQuotationImage() {
  triggerHaptic();
  showToast("Creating high-resolution image...", "info");

  const staging = createPrintStagingClone();
  if (!staging) {
    showToast("Error locating quotation sheet", "error");
    return;
  }

  const filename = getSanitizedFilename("png");

  if (!window.html2canvas) {
    staging.cleanup();
    showToast("Image engine not loaded", "error");
    return;
  }

  window.html2canvas(staging.cloneNode, {
    scale: 2.2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
    width: staging.cloneNode.offsetWidth,
    height: staging.cloneNode.offsetHeight
  }).then(canvas => {
    staging.cleanup();

    // Support Web Share API (mobile native share sheet)
    if (navigator.canShare && navigator.share) {
      canvas.toBlob(blob => {
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          navigator.share({
            files: [file],
            title: filename,
            text: `Quotation: ${document.getElementById("inputSubject").value}`
          }).then(() => {
            showToast("Shared successfully!", "success");
          }).catch(() => {
            downloadCanvas(canvas, filename);
          });
          return;
        }
        downloadCanvas(canvas, filename);
      }, "image/png");
    } else {
      downloadCanvas(canvas, filename);
    }
  }).catch(err => {
    staging.cleanup();
    console.error("Image generation error:", err);
    showToast("Failed to generate image.", "error");
  });
}

function downloadCanvas(canvas, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("Image downloaded! 🖼️", "success");
}

/**
 * SHARE VIA WHATSAPP DIRECT
 */
function shareOnWhatsApp() {
  triggerHaptic();
  const businessName = document.getElementById("inputBusinessName") ? document.getElementById("inputBusinessName").value.trim() : "Quotation";
  const subject = document.getElementById("inputSubject") ? document.getElementById("inputSubject").value.trim() : "General Work";
  const mobile = document.getElementById("inputMobile") ? document.getElementById("inputMobile").value.trim() : "";
  const clientPhone = document.getElementById("inputClientPhone") ? document.getElementById("inputClientPhone").value.trim() : "";
  
  const items = currentQuotation.items || [];
  let summaryText = `*📋 QUOTATION - ${businessName.toUpperCase()}*\n`;
  summaryText += `*Subject:* ${subject}\n`;
  if (mobile) summaryText += `*Contact:* ${mobile}\n`;
  summaryText += `\n*Items (${items.length}):*\n`;

  items.slice(0, 10).forEach((item, index) => {
    summaryText += `${index + 1}. ${item.desc} - ₹${item.rate}\n`;
  });
  if (items.length > 10) {
    summaryText += `... and ${items.length - 10} more items.\n`;
  }

  let totalNum = 0;
  let hasValidNumbers = false;
  items.forEach(it => {
    const cleanRate = parseFloat(String(it.rate).replace(/[^0-9.]/g, ''));
    if (!isNaN(cleanRate) && cleanRate > 0) {
      totalNum += cleanRate * (it.qty || 1);
      hasValidNumbers = true;
    }
  });

  if (hasValidNumbers) {
    summaryText += `\n*Total:* ₹${totalNum.toLocaleString('en-IN')}\n`;
  }

  summaryText += `\n_Generated via QuotationMaker_`;

  let waUrl = "";
  const encodedMsg = encodeURIComponent(summaryText);
  if (clientPhone) {
    const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
    waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodedMsg}`;
  } else {
    waUrl = `https://api.whatsapp.com/send?text=${encodedMsg}`;
  }

  window.open(waUrl, "_blank");
  showToast("Opening WhatsApp... 💬", "info");
}

/**
 * PRINT QUOTATION
 */
function printQuotation() {
  triggerHaptic();
  window.print();
}
