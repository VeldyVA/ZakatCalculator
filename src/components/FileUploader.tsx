import React from 'react';
import * as XLSX from 'xlsx';
import { getDocument } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

interface FileUploaderProps {
  onFileUpload: (data: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();

      if (file.type === 'application/pdf') {
        reader.onload = async (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdf = await getDocument(data).promise;
          let content = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            content += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
          }
          onFileUpload(content);
        };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          onFileUpload(JSON.stringify(jsonData, null, 2));
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

  return (
    <div className="mb-3">
      <label htmlFor="formFile" className="form-label">Upload Excel or PDF File</label>
      <input className="form-control" type="file" id="formFile" onChange={handleFileChange} accept=".xlsx, .xls, .pdf" />
    </div>
  );
};

export default FileUploader;