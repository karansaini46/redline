/* eslint-disable @typescript-eslint/no-require-imports */
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function createPdf(filename, text) {
  const doc = new PDFDocument();
  doc.pipe(
    fs.createWriteStream(path.join(__dirname, "../tests/fixtures", filename)),
  );
  doc.text(text);
  doc.end();
}

createPdf(
  "v1.pdf",
  "Master Service Agreement\n\n1. Indemnification\nBoth parties agree to mutual indemnification.\n\n2. Liability Cap\nThe liability under this agreement is strictly unlimited.\n\n3. Warranty\nThe software is provided as-is without any warranties.",
);

createPdf(
  "v2.pdf",
  "Master Service Agreement\n\n1. Indemnification\nBoth parties agree to mutual indemnification.\n\n2. Liability Cap\nThe liability under this agreement is strictly capped at $100k.\n\n3. Warranty\nThe software is provided with a 90-day functional warranty.",
);

console.log("PDFs created successfully.");
