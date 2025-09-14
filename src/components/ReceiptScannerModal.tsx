"use client";

import { useState, useRef } from "react";
import {
  X,
  Camera,
  Upload,
  Scan,
  CheckCircle,
  AlertCircle,
  Shrink,
} from "lucide-react";
import Image from "next/image";
import {
  compressImage,
  canCompressImage,
  formatFileSize,
  getCompressionSuggestions,
} from "@/lib/imageCompression";

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
  paymentDate?: string;
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
  const [showingCamera, setShowingCamera] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionResult, setCompressionResult] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    success: boolean;
    error?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setError("");
    setScanResult(null);
    setCompressionResult(null);

    // Check if file needs compression
    const maxSize = 4 * 1024 * 1024; // 4MB
    let fileToUse = file;

    if (file.size > maxSize && canCompressImage(file)) {
      setCompressing(true);
      try {
        const result = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
          maxSizeKB: 4000,
        });

        setCompressionResult({
          originalSize: result.originalSize,
          compressedSize: result.compressedSize,
          compressionRatio: result.compressionRatio,
          success: result.success,
          error: result.error,
        });

        if (result.success) {
          fileToUse = result.file;
          setSelectedFile(result.file);
        } else {
          setError(`Compression failed: ${result.error || "Unknown error"}`);
          setCompressing(false);
          return;
        }
      } catch (error) {
        setError(
          `Compression failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setCompressing(false);
        return;
      } finally {
        setCompressing(false);
      }
    } else if (file.size > maxSize) {
      setError(
        `File too large (${formatFileSize(
          file.size
        )}). Maximum size is 4MB. Please use a smaller file.`
      );
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(fileToUse);
    setPreviewUrl(url);

    // Auto-start scanning for images immediately after selection
    if (fileToUse.type.startsWith("image/")) {
      setTimeout(() => {
        scanReceipt(fileToUse);
      }, 500); // Small delay to allow UI to update
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (file) {
        setShowingCamera(false);
        setError(""); // Clear any previous errors
        console.log('Camera capture successful on iPhone Chrome:', file.name, file.size);
        handleFileSelect(file);
      } else {
        // Reset camera state if no file was selected (user cancelled)
        setShowingCamera(false);
        setError("");
        console.log('Camera capture cancelled by user');
      }
    } catch (error) {
      console.error('Camera capture error on iPhone Chrome:', error);
      setShowingCamera(false);
      setError('Failed to capture image. Please try again or upload from your photo library.');
    }
  };

  const openCamera = () => {
    setShowingCamera(true);
    setError(""); // Clear any previous errors
    
    // For iOS Chrome, we need to trigger the camera with a delay to ensure proper handling
    if (cameraInputRef.current) {
      // Add more robust iPhone/Chrome detection and handling
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isChrome = navigator.userAgent.includes('Chrome');
      const isSafari = navigator.userAgent.includes('Safari') && !isChrome;
      
      if (isIOS && isChrome) {
        // Longer delay for iPhone Chrome to prevent race conditions
        setTimeout(() => {
          try {
            cameraInputRef.current?.click();
          } catch (error) {
            console.error('Camera trigger failed on iPhone Chrome:', error);
            setError('Camera access failed. Please try uploading from your photo library instead.');
          }
        }, 300);
      } else if (isIOS && isSafari) {
        // Shorter delay for Safari
        setTimeout(() => {
          cameraInputRef.current?.click();
        }, 150);
      } else {
        // Standard delay for other browsers
        setTimeout(() => {
          cameraInputRef.current?.click();
        }, 100);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
      ];
      if (allowedTypes.includes(file.type)) {
        handleFileSelect(file);
      } else {
        setError("Invalid file type. Only images and PDFs are allowed.");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const scanReceipt = async (fileToScan?: File) => {
    const file = fileToScan || selectedFile;
    if (!file) return;

    setScanning(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("receipt", file);

      const response = await fetch("/api/scan-receipt", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setScanResult({
          extractedText: result.extractedText,
          parsedData: result.parsedData,
          suggestedExpense: result.suggestedExpense,
        });

        // Show warning if upload failed but processing succeeded
        if (result.warning) {
          console.warn("Receipt processing warning:", result.warning);
        }
      } else {
        console.error("Receipt scan error:", result);
        let errorMessage = result.error || "Failed to scan receipt";

        // Provide helpful error messages
        if (result.error?.includes("AWS") || result.error?.includes("S3")) {
          errorMessage =
            "Upload service temporarily unavailable. Your receipt has been processed locally.";
        } else if (result.error?.includes("Unauthorized")) {
          errorMessage = "Session expired. Please sign in again.";
        } else if (
          result.error?.includes("File too large") ||
          response.status === 413
        ) {
          errorMessage =
            result.error ||
            "File is too large. Please use a file smaller than 4MB.";
        } else if (result.error?.includes("Invalid file type")) {
          errorMessage =
            "Invalid file type. Please use JPG, PNG, GIF, WebP, or PDF files.";
        } else if (result.error?.includes("Network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (result.error?.includes("timeout")) {
          errorMessage =
            "Request timed out. Your file may be too large or your connection is slow. Please try again.";
        }

        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error scanning receipt:", error);
      
      // Provide more specific error messages for mobile/network issues
      let errorMessage = "Failed to scan receipt. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes("NetworkError") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else if (error.message.includes("abort")) {
          errorMessage = "Request was cancelled. Please try again.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        }
      }
      
      setError(errorMessage);
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
    setShowingCamera(false);
    setCompressing(false);
    setCompressionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
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
      <div className="bg-white rounded-2xl max-w-md w-full mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
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
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-6 sm:p-8 text-center hover:border-[#006BFF] transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-[#A6BBD1] mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-[#0B3558] mb-2">
                  Upload Receipt
                </h3>
                <p className="text-sm text-[#476788] mb-3 sm:mb-4">
                  Drag and drop your receipt image or PDF, or click to browse
                </p>
                <p className="text-xs text-[#A6BBD1] mb-4">
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

              {/* Camera Option - Primary */}
              <div className="text-center">
                <button
                  onClick={openCamera}
                  className="w-full inline-flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-base transition-colors mb-4"
                >
                  <Camera className="w-5 h-5" />
                  <span>Take Photo with Camera</span>
                </button>
                <p className="text-sm text-[#476788] mb-4">
                  Recommended: Use your device&apos;s camera for best results
                </p>

                <div className="flex items-center justify-center mb-3">
                  <hr className="flex-1 border-gray-300" />
                  <span className="px-3 text-xs text-gray-500 font-medium">
                    OR UPLOAD FILE
                  </span>
                  <hr className="flex-1 border-gray-300" />
                </div>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  className="hidden"
                  multiple={false}
                  onClick={(e) => {
                    // Reset the input value to allow re-selecting the same file
                    e.currentTarget.value = '';
                  }}
                />
              </div>
            </div>
          ) : !scanResult ? (
            /* File Preview and Scan */
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {/* Preview */}
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-[#0B3558] mb-2">
                    Preview
                  </h3>
                  <div className="border border-[#E5E7EB] rounded-lg p-4 bg-gray-50">
                    {selectedFile.type.startsWith("image/") ? (
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
                          <p className="text-sm text-gray-600">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF - {Math.round(selectedFile.size / 1024)} KB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* File Info */}
                <div className="w-full sm:w-80">
                  <h3 className="text-sm font-medium text-[#0B3558] mb-2">
                    File Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#476788]">Name:</span>
                      <span className="text-[#0B3558] truncate ml-2">
                        {selectedFile.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#476788]">Size:</span>
                      <span className="text-[#0B3558]">
                        {Math.round(selectedFile.size / 1024)} KB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#476788]">Type:</span>
                      <span className="text-[#0B3558]">
                        {selectedFile.type}
                      </span>
                    </div>

                    {/* Compression Status */}
                    {compressing && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <Shrink className="w-4 h-4 animate-pulse" />
                        <span className="text-sm">Compressing image...</span>
                      </div>
                    )}

                    {compressionResult && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shrink className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Image Compressed
                          </span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-blue-700">Original:</span>
                            <span className="text-blue-800">
                              {formatFileSize(compressionResult.originalSize)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Compressed:</span>
                            <span className="text-blue-800">
                              {formatFileSize(compressionResult.compressedSize)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Reduction:</span>
                            <span className="text-blue-800">
                              {(
                                (1 - compressionResult.compressionRatio) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
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
                  onClick={() => scanReceipt()}
                  disabled={scanning}
                  className="btn-primary w-full sm:w-auto inline-flex items-center justify-center space-x-2"
                >
                  <Scan className="w-4 h-4" />
                  <span>{scanning ? "Scanning..." : "Scan Receipt"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Scan Results */
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <h3 className="text-base font-medium">
                  Receipt Scanned Successfully!
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Extracted Data */}
                <div>
                  <h4 className="text-sm font-medium text-[#0B3558] mb-3">
                    Extracted Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    {scanResult.parsedData.merchantName && (
                      <div className="flex justify-between">
                        <span className="text-[#476788]">Merchant:</span>
                        <span className="text-[#0B3558] font-medium">
                          {scanResult.parsedData.merchantName}
                        </span>
                      </div>
                    )}
                    {scanResult.parsedData.totalAmount && (
                      <div className="flex justify-between">
                        <span className="text-[#476788]">Total:</span>
                        <span className="text-[#0B3558] font-medium">
                          ${scanResult.parsedData.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {scanResult.parsedData.date && (
                      <div className="flex justify-between">
                        <span className="text-[#476788]">Date:</span>
                        <span className="text-[#0B3558]">
                          {scanResult.parsedData.date}
                        </span>
                      </div>
                    )}
                    {scanResult.parsedData.category && (
                      <div className="flex justify-between">
                        <span className="text-[#476788]">Category:</span>
                        <span className="text-[#0B3558]">
                          {scanResult.parsedData.category}
                        </span>
                      </div>
                    )}
                    {scanResult.parsedData.taxAmount && (
                      <div className="flex justify-between">
                        <span className="text-[#476788]">Tax:</span>
                        <span className="text-[#0B3558]">
                          ${scanResult.parsedData.taxAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggested Expense */}
                <div>
                  <h4 className="text-sm font-medium text-[#0B3558] mb-3">
                    Suggested Expense
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2 text-sm">
                    <div>
                      <span className="text-blue-700 font-medium">Name:</span>
                      <p className="text-blue-800">
                        {scanResult.suggestedExpense.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">
                        Description:
                      </span>
                      <p className="text-blue-800">
                        {scanResult.suggestedExpense.description}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Amount:</span>
                      <p className="text-blue-800 font-semibold">
                        ${scanResult.suggestedExpense.amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">
                        Category:
                      </span>
                      <p className="text-blue-800">
                        {scanResult.suggestedExpense.category}
                      </p>
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
