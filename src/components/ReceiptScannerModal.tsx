"use client";

import { useState, useRef } from "react";
import { X, Camera, Upload, Scan, CheckCircle, AlertCircle } from "lucide-react";
import Image from "next/image";

interface ParsedReceiptData {
  merchantName?: string;
  totalAmount?: number;
  date?: string;
  category?: string;
  items?: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
  taxAmount?: number;
  subtotal?: number;
}

interface SuggestedExpense {
  name: string;
  description: string;
  amount: number;
  category: string;
  expenseType: string;
  receiptUrl: string;
  receiptS3Key: string;
  receiptFileName: string;
  receiptContentType: string;
  tags: string[];
}

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseCreated: (expenseData: SuggestedExpense) => void;
}

export default function ReceiptScannerModal({
  isOpen,
  onClose,
  onExpenseCreated,
}: ReceiptScannerModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    extractedText: string;
    parsedData: ParsedReceiptData;
    suggestedExpense: SuggestedExpense;
  } | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError("");
    setScanResult(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (allowedTypes.includes(file.type)) {
        handleFileSelect(file);
      } else {
        setError('Invalid file type. Only images and PDFs are allowed.');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const scanReceipt = async () => {
    if (!selectedFile) return;

    setScanning(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('receipt', selectedFile);

      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setScanResult({
          extractedText: result.extractedText,
          parsedData: result.parsedData,
          suggestedExpense: result.suggestedExpense,
        });
      } else {
        setError(result.error || 'Failed to scan receipt');
      }
    } catch (error) {
      console.error('Error scanning receipt:', error);
      setError('Failed to scan receipt. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const createExpense = () => {
    if (scanResult) {
      onExpenseCreated(scanResult.suggestedExpense);
      onClose();
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Scan className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-[#0B3558] truncate">
                Scan Receipt
              </h2>
              <p className="text-xs sm:text-sm text-[#476788] truncate">
                Upload a receipt to automatically extract expense data
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 sm:p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!selectedFile ? (
            /* File Upload Area */
            <div
              className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-8 sm:p-12 text-center hover:border-[#006BFF] transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-[#A6BBD1] mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-[#0B3558] mb-2">
                Upload Receipt
              </h3>
              <p className="text-sm text-[#476788] mb-4">
                Drag and drop your receipt image or PDF, or click to browse
              </p>
              <p className="text-xs text-[#A6BBD1]">
                Supported formats: JPG, PNG, GIF, WebP, PDF (max 10MB)
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : !scanResult ? (
            /* File Preview and Scan */
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Preview */}
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-[#0B3558] mb-2">Preview</h3>
                  <div className="border border-[#E5E7EB] rounded-lg p-4 bg-gray-50">
                    {selectedFile.type.startsWith('image/') ? (
                      <Image
                        src={previewUrl!}
                        alt="Receipt preview"
                        width={400}
                        height={300}
                        className="w-full h-48 sm:h-64 object-contain rounded"
                      />
                    ) : (
                      <div className="w-full h-48 sm:h-64 flex items-center justify-center bg-gray-100 rounded">
                        <div className="text-center">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">PDF - {Math.round(selectedFile.size / 1024)} KB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* File Info */}
                <div className="w-full sm:w-80">
                  <h3 className="text-sm font-medium text-[#0B3558] mb-2">File Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#476788]">Name:</span>
                      <span className="text-[#0B3558] truncate ml-2">{selectedFile.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#476788]">Size:</span>
                      <span className="text-[#0B3558]">{Math.round(selectedFile.size / 1024)} KB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#476788]">Type:</span>
                      <span className="text-[#0B3558]">{selectedFile.type}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={resetModal}
                  className="btn-secondary w-full sm:w-auto"
                  disabled={scanning}
                >
                  Choose Different File
                </button>
                <button
                  onClick={scanReceipt}
                  disabled={scanning}
                  className="btn-primary w-full sm:w-auto inline-flex items-center justify-center space-x-2"
                >
                  <Scan className="w-4 h-4" />
                  <span>{scanning ? 'Scanning...' : 'Scan Receipt'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Scan Results */
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <h3 className="text-base font-medium">Receipt Scanned Successfully!</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Extracted Data */}
                <div>
                  <h4 className="text-sm font-medium text-[#0B3558] mb-3">Extracted Information</h4>
                  <div className="space-y-2 text-sm">
                    {scanResult.parsedData.merchantName && (
                      <div className="flex justify-between">
                        <span className="text-[#476788]">Merchant:</span>
                        <span className="text-[#0B3558] font-medium">{scanResult.parsedData.merchantName}</span>
                      </div>
                    )}
                    {scanResult.parsedData.totalAmount && (
                      <div className="flex justify-between">
                        <span className="text-[#476788]">Total:</span>
                        <span className="text-[#0B3558] font-medium">${scanResult.parsedData.totalAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {scanResult.parsedData.date && (
                      <div className="flex justify-between">
                        <span className="text-[#476788]">Date:</span>
                        <span className="text-[#0B3558]">{scanResult.parsedData.date}</span>
                      </div>
                    )}
                    {scanResult.parsedData.category && (
                      <div className="flex justify-between">
                        <span className="text-[#476788]">Category:</span>
                        <span className="text-[#0B3558]">{scanResult.parsedData.category}</span>
                      </div>
                    )}
                    {scanResult.parsedData.taxAmount && (
                      <div className="flex justify-between">
                        <span className="text-[#476788]">Tax:</span>
                        <span className="text-[#0B3558]">${scanResult.parsedData.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggested Expense */}
                <div>
                  <h4 className="text-sm font-medium text-[#0B3558] mb-3">Suggested Expense</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Name:</span>
                      <p className="text-blue-800">{scanResult.suggestedExpense.name}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Description:</span>
                      <p className="text-blue-800">{scanResult.suggestedExpense.description}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Amount:</span>
                      <p className="text-blue-800 font-semibold">${scanResult.suggestedExpense.amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Category:</span>
                      <p className="text-blue-800">{scanResult.suggestedExpense.category}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw Text (Collapsible) */}
              <details className="border border-[#E5E7EB] rounded-lg">
                <summary className="p-3 sm:p-4 cursor-pointer text-sm font-medium text-[#0B3558] hover:bg-gray-50">
                  View Extracted Text
                </summary>
                <div className="p-3 sm:p-4 pt-0 text-xs font-mono bg-gray-50 whitespace-pre-wrap border-t">
                  {scanResult.extractedText}
                </div>
              </details>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  onClick={resetModal}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Scan Another Receipt
                </button>
                <button
                  onClick={createExpense}
                  className="btn-primary w-full sm:w-auto inline-flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Create Expense</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}