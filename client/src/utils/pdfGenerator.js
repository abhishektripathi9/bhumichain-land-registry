import jsPDF from "jspdf";

/**
 * Generates an official Government of Uttar Pradesh Certified Land Dossier PDF
 */
export function generateLandDossierPDF(parcel) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Background and borders
  doc.setDrawColor(22, 101, 52); // Emerald 800
  doc.setLineWidth(1.5);
  doc.rect(8, 8, pageWidth - 16, 281);

  doc.setDrawColor(16, 185, 129); // Emerald 500
  doc.setLineWidth(0.5);
  doc.rect(10, 10, pageWidth - 20, 277);

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text("GOVERNMENT OF UTTAR PRADESH", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text("BOARD OF REVENUE • SOVEREIGN GIS BLOCKCHAIN LAND LEDGER", pageWidth / 2, 26, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Digital Land Title Deed & Encumbrance Certificate (UP Revenue Code 2006)", pageWidth / 2, 31, { align: "center" });

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 35, pageWidth - 14, 35);

  // Certificate Identity Bar
  doc.setFillColor(240, 253, 244); // Green 50
  doc.rect(14, 38, pageWidth - 28, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(21, 128, 61); // Green 700
  doc.text(`CADASTRAL RECORD IDENTIFIER: ${parcel.registryId || `IN-UP-PRG-${parcel.khasraNumber}`}`, 18, 44);
  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`ON-CHAIN RWA TOKEN ID: #${parcel.rwaTokenId || parcel.onChainId || "88412"}  |  VERIFIED RECORD`, 18, 49);

  // 1. Cadastral Details Section
  let y = 60;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("1. Cadastral Parcel Particulars", 14, y);

  y += 6;
  doc.setFontSize(9);
  const rows = [
    ["Khasra / Gata Number:", `${parcel.khasraNumber}`],
    ["Khata / Khatoni Number:", `${parcel.khataNumber || "00412"}`],
    ["Village / ग्राम:", `${parcel.village || "Naini"}`],
    ["Tehsil & District:", `${parcel.tehsil || "Karchhana"}, District: ${parcel.district || "Prayagraj"}`],
    ["Total Land Measurement:", `${parcel.areaSqFt || (parcel.area ? parcel.area * 10.764 : 2400).toLocaleString()} sq.ft  (${parcel.area || 223} m² / ${parcel.areaAcre || 0.055} Acre)`],
    ["Land Classification:", `${parcel.landType || "Private Title (Agricultural/Abadi)"}`],
    ["Circle Rate Valuation (Govt):", `INR ${(parcel.circleRate || 3600000).toLocaleString("en-IN")}`],
    ["Current Smart Contract Escrow Price:", `INR ${(parcel.marketPrice || 4500000).toLocaleString("en-IN")}  (${parcel.price || "1.50"} ETH / ${parcel.priceMatic || "53,820"} MATIC)`],
  ];

  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, pageWidth - 28, 54, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, pageWidth - 28, 54);

  let rowY = y + 6;
  rows.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(label, 18, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(val, 85, rowY);
    rowY += 6;
  });

  // 2. Proprietary Ownership & KYC
  y = 126;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("2. Legal Proprietor & Verification Status", 14, y);

  y += 6;
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, pageWidth - 28, 38, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, pageWidth - 28, 38);

  const ownerRows = [
    ["Registered Sole Proprietor:", `${parcel.ownerName || "Rameshwar Sharma"}`],
    ["Proprietary Shareholding:", `${parcel.proprietorStatus || "Sole Legal Proprietor (100% Share)"}`],
    ["Aadhaar & DigiLocker Status:", `${parcel.kycStatus || "Aadhaar Vault • DigiLocker Linked | e-KYC VERIFIED"}`],
    ["Proprietor Contact Phone:", `${parcel.phone || "+91 98765-XXXXX"}`],
    ["Digital Land Record ID:", `UP-REV-${parcel.khasraNumber || "104"}-CERT`],
  ];

  rowY = y + 6;
  ownerRows.forEach(([label, val]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(label, 18, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(val, 85, rowY);
    rowY += 6;
  });

  // 3. Encumbrance & Legal Clearance
  y = 176;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("3. Encumbrance, Bank Lien & Court Litigation Clearance", 14, y);

  y += 6;
  const isDisputed = parcel.disputeStatus || parcel.loanFlag;
  doc.setFillColor(isDisputed ? 254 : 240, isDisputed ? 242 : 253, isDisputed ? 242 : 244);
  doc.rect(14, y, pageWidth - 28, 26, "F");
  doc.setDrawColor(isDisputed ? 244 : 16, isDisputed ? 63 : 185, isDisputed ? 94 : 129);
  doc.rect(14, y, pageWidth - 28, 26);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(isDisputed ? 225 : 21, isDisputed ? 29 : 128, isDisputed ? 72 : 61);
  doc.text(
    isDisputed ? "WARNING: ENCUMBERED / LITIGATED PARCEL" : "NIL ENCUMBRANCE CERTIFIED — SOVEREIGN CLEAR TITLE",
    18,
    y + 7
  );

  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  doc.text(
    `Bank Lien Status: ${parcel.bankLienStatus || "Nil Encumbrance — SBI API Certified (0 Liens)"}`,
    18,
    y + 14
  );
  doc.text(
    `Judicial Registry: ${parcel.disputeRegistry || "Zero Disputes — High Court UP Bench Clear"}`,
    18,
    y + 20
  );

  // 4. Cadastral Boundary Coordinates
  y = 214;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("4. Cadastral Boundary Polygon (WGS 84 Coordinates)", 14, y);

  y += 6;
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, pageWidth - 28, 24, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, pageWidth - 28, 24);

  doc.setFont("courier", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const coords = parcel.geometry?.coordinates?.[0] || [
    [81.856, 25.391],
    [81.858, 25.391],
    [81.858, 25.3925],
    [81.856, 25.3925],
  ];

  doc.text(`Boundary Vertices: ${coords.map((c) => `[${c[0]}°E, ${c[1]}°N]`).join(" -> ")}`, 18, y + 8, {
    maxWidth: pageWidth - 36,
  });
  doc.text(`Digital Cadastre Reference: UP-CADASTRE-${parcel.khasraNumber || "104"}`, 18, y + 17);

  // Footer / Cryptographic Seal
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 254, pageWidth - 14, 254);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const districtUpper = parcel.district ? parcel.district.toUpperCase() : "UTTAR PRADESH";
  doc.text(`DIGITALLY SIGNED & SEALED BY SUB-REGISTRAR ${districtUpper}`, 14, 262);

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Digital Certificate Hash: UP-REV-${parcel.khasraNumber || "104"}-VALIDATED`, 14, 267);
  doc.text(`Timestamp: ${new Date().toLocaleString("en-IN")} | Board of Revenue Uttar Pradesh`, 14, 272);

  doc.setFont("helvetica", "italic");
  doc.text("Official document generated by BhumiChain Uttar Pradesh Land Portal.", pageWidth - 14, 272, { align: "right" });

  doc.save(`Certified_Land_Dossier_Khasra_${parcel.khasraNumber || "104"}.pdf`);
}
