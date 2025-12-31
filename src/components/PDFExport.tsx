"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PDFExportProps {
  htmlContent: string;
  fileName?: string;
}

export default function PDFExport({
  htmlContent,
  fileName = "resume.pdf",
}: PDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const printToPDF = () => {
    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to use the print function");
      return;
    }

    // Create a complete HTML document for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resume</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 0.5in; }
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1, h2, h3, h4 { color: #333; margin-top: 20px; margin-bottom: 10px; }
            h1 { font-size: 2.5em; text-align: center; }
            h2 { font-size: 1.2em; color: #666; font-weight: normal; }
            h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 5px; }
            .resume-container { background: white; }
          </style>
        </head>
        <body>
          ${htmlContent}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    
    try {
      // Try html2canvas method first
      await exportWithCanvas();
    } catch (error) {
      console.warn("Canvas export failed, trying text-based export:", error);
      try {
        // Fallback to text-based export
        await exportAsText();
      } catch (fallbackError) {
        console.error("All export methods failed:", fallbackError);
        alert("Failed to export PDF. Please try the Print option instead.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const exportWithCanvas = async () => {
    // Create a temporary container for rendering
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = htmlContent;
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    tempContainer.style.width = "800px";
    tempContainer.style.backgroundColor = "white";
    tempContainer.style.padding = "20px";
    tempContainer.style.fontFamily = "Arial, sans-serif";
    tempContainer.style.lineHeight = "1.6";
    tempContainer.style.color = "#333";
    
    document.body.appendChild(tempContainer);

    // Wait for fonts and styles to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    const canvas = await html2canvas(tempContainer, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 800,
      height: tempContainer.scrollHeight,
      logging: false,
    });

    // Remove the temporary container
    document.body.removeChild(tempContainer);

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF("p", "mm", "a4");
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(fileName);
  };

  const exportAsText = async () => {
    // Fallback: Extract text content and create a simple PDF
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    const maxLineWidth = pageWidth - 2 * margin;
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    
    const lines = pdf.splitTextToSize(textContent, maxLineWidth);
    let y = margin;
    
    for (let i = 0; i < lines.length; i++) {
      if (y + lineHeight > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(lines[i], margin, y);
      y += lineHeight;
    }
    
    pdf.save(fileName);
  };

  const downloadAsHTML = () => {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(".pdf", ".html");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={printToPDF}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        title="Print to PDF using browser's print dialog"
      >
        🖨️ Print to PDF
      </button>
      <button
        onClick={exportToPDF}
        disabled={isExporting}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Generate PDF file directly"
      >
        {isExporting ? "Exporting..." : "📄 Export PDF"}
      </button>
      <button
        onClick={downloadAsHTML}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        title="Download as HTML file"
      >
        💾 Download HTML
      </button>
    </div>
  );
}