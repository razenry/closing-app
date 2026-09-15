"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title: string;
  subtitle?: string;
  downloadUrl?: string;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
  downloadUrl,
}: ImagePreviewModalProps) {
  const [hasError, setHasError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Reset state when a new image is opened
  useEffect(() => {
    setHasError(false);
    setZoom(1);
    setRotation(0);
  }, [imageUrl, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleReset();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(2.5, Math.round((prev + 0.2) * 10) / 10));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.4, Math.round((prev - 0.2) * 10) / 10));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-700/30 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/95">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{subtitle}</p>
            )}
          </div>

          {/* Controls: Zoom, Rotate, Download, Tab, Close */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-200/80 rounded-lg p-0.5 text-xs text-slate-700">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.4}
                className="p-1 sm:p-1.5 hover:text-slate-950 hover:bg-white rounded transition-colors disabled:opacity-40 cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-1.5 py-0.5 text-[11px] font-semibold hover:bg-white rounded transition-colors cursor-pointer text-center min-w-[42px]"
                title="Reset Zoom (0)"
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 2.5}
                className="p-1 sm:p-1.5 hover:text-slate-950 hover:bg-white rounded transition-colors disabled:opacity-40 cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rotate Button */}
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Putar 90°"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Download Button */}
            {downloadUrl && (
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-xs"
                title="Unduh file gambar"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh</span>
              </a>
            )}

            {/* Open in new tab */}
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors"
              title="Buka gambar di tab baru"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Image Display Canvas */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 sm:p-6 min-h-[260px] max-h-[68vh] overflow-auto select-none">
          {hasError ? (
            <div className="text-center p-8 text-slate-300 max-w-md">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                <ZoomIn className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-sm mb-1">Gagal Memuat Gambar</h4>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                File foto tidak ditemukan atau penyimpanan cloud belum tersinkron. Silakan hapus dan unggah ulang foto ini.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={title}
                onError={() => setHasError(true)}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: "transform 0.15s ease-out",
                }}
                className="max-h-[58vh] max-w-[85%] object-contain rounded-lg shadow-2xl origin-center"
              />
            </div>
          )}
        </div>

        {/* Hint footer */}
        <div className="px-4 py-1.5 bg-slate-900 text-slate-400 text-[10px] flex items-center justify-between border-t border-slate-800">
          <span>Gunakan tombol +/- untuk memperbesar atau mengecilkan gambar</span>
          <span className="hidden sm:inline">Tekan <strong>Esc</strong> untuk menutup</span>
        </div>
      </div>
    </div>
  );
}
