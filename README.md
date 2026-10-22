# QuotationMaker - Fast & Professional Quotation Creator

A lightweight, user-friendly, offline-first Progressive Web Application (PWA) built with pure **HTML5, CSS3, and JavaScript (ES6)**. Designed specifically for contractors, carpenters, fabricators, freelancers, and small businesses to quickly generate and export clean quotations.

---

## 🌟 Key Features

1. **Exact Reference Document Fidelity**:
   - Matches the contractor quotation format with an outer border frame.
   - Centered, underlined business header (*Virendra Vishwakarma*).
   - Centered business address.
   - Right-aligned mobile contact (*9082356335*).
   - Centered bold subject heading (*Subject: Door Shutter Fixing with Fixtures.*).
   - Clean, bordered details table: `Sr. No.`, `Item Description`, `Rate` (supports flat rates like `1800` or unit rates like `15 fit`).
   - Terms and Conditions numbered list (*Payment terms: Done in 15 days.*).
   - Authorized signatory box.

2. **Full Editability & Real-Time Sync**:
   - Structured, easy-to-use form editor on the left.
   - Live real-time preview on the right (What You See Is What You Get).
   - Click-to-type: You can also click directly on the preview paper to make instant text edits!
   - 1-Click quick add presets for items and terms.

3. **Multiple Export Options**:
   - 📄 **Export PDF**: High-resolution, vector A4 document ready for download.
   - 🖼️ **Export Image (PNG)**: 2.2x high-DPI crisp image export, ideal for sharing directly on WhatsApp.
   - 💬 **Share WhatsApp**: Instant formatted WhatsApp message link.
   - 🖨️ **Print**: Flawless `@media print` A4 layout with browser print dialog.

4. **Saved Quotations & Management**:
   - Full history saved locally in `localStorage` (works 100% offline).
   - Search by client, subject, or date.
   - Clone / Duplicate past quotations with 1 click.
   - JSON Backup and Restore to transfer data across devices.

5. **Business Profile**:
   - Set your contractor or business details once. All new quotations auto-fill instantly.

6. **PWA (FinTrackPro Architecture)**:
   - Installable on Android, iPhone/iPad, Windows, and Mac as a native desktop/mobile app.
   - Offline-capable with `service-worker.js` and `manifest.json`.
   - Dark mode & Light mode toggle.
   - Mobile-optimized responsive layout with tabbed form/preview toggling.

---

## 🚀 How to Run

Because this app uses standard HTML, CSS, and JS with zero build steps, you can run it immediately:

### Option 1: Direct File Opening
Double-click `index.html` in `D:\Projects\websites\QuotationMaker` to open it directly in Google Chrome, Microsoft Edge, or any browser.

### Option 2: Local Web Server (Recommended for PWA installation)
Run in PowerShell:
```powershell
cd D:\Projects\websites\QuotationMaker
npx serve -l 3000
```
Then open `http://localhost:3000` in your browser. You can click the **Install** icon in the browser address bar to install it as an app on your computer or phone!
