"use client";

import React, { useState, useTransition } from "react";
import { createShareLinkAction, revokeShareLinkAction } from "@/actions/share";
import { Share2, X, Copy, Check, ShieldAlert, Link as LinkIcon } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface ShareLinkModalProps {
  closingId: string;
  shareLinks: any[];
  isOpen: boolean;
  onClose: () => void;
}

export function ShareLinkModal({ closingId, shareLinks, isOpen, onClose }: ShareLinkModalProps) {
  const [durationDays, setDurationDays] = useState<number>(7);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCopied(false);

    startTransition(async () => {
      const res = await createShareLinkAction(closingId, durationDays);
      if (res?.error) {
        setError(res.error);
      } else if (res?.shareUrl) {
        setGeneratedUrl(res.shareUrl);
      }
    });
  };

  const handleCopy = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRevoke = (linkId: string) => {
    if (!confirm("Apakah Anda yakin ingin mencabut tautan berbagi ini? Akses publik akan langsung dihentikan.")) {
      return;
    }
    startTransition(async () => {
      await revokeShareLinkAction(linkId, closingId);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-600" />
            Tautan Berbagi Publik (Guest Read-Only)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 leading-relaxed">
            Tautan berbagi menggunakan token acak kriptografis yang aman dan memiliki batas waktu kedaluwarsa. Pengunjung publik (tamu) hanya memiliki hak <strong>Read-Only</strong> (melihat & mengunduh tanpa login).
          </div>

          <form onSubmit={handleGenerate} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block font-semibold text-slate-700 mb-1">
                Masa Berlaku Tautan
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <option value={1}>1 Hari</option>
                <option value={3}>3 Hari</option>
                <option value={7}>7 Hari (Direkomendasikan)</option>
                <option value={30}>30 Hari</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-500 hover:bg-amber-600 rounded-lg shadow-xs cursor-pointer"
            >
              {isPending ? "Membuat..." : "Buat Tautan Baru"}
            </button>
          </form>

          {generatedUrl && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="font-semibold text-emerald-900 mb-1">Tautan Baru Berhasil Dibuat:</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedUrl}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-emerald-300 rounded text-slate-700"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-emerald-700 text-white rounded font-medium flex items-center gap-1 hover:bg-emerald-800 shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Tersalin" : "Salin"}</span>
                </button>
              </div>
            </div>
          )}

          {/* List of existing links */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="font-semibold text-slate-800 mb-2">Riwayat Tautan Berbagi Closing Ini:</h4>
            {shareLinks.length === 0 ? (
              <p className="text-slate-400 italic">Belum ada tautan yang dibuat.</p>
            ) : (
              <div className="space-y-2">
                {shareLinks.map((link) => {
                  const isRevoked = Boolean(link.revokedAt);
                  const isExpired = new Date() > new Date(link.expiresAt);

                  return (
                    <div
                      key={link.id}
                      className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between bg-slate-50/50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-600">
                            Token Hash: {link.tokenHash.substring(0, 12)}...
                          </span>
                          {isRevoked ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                              Dicabut
                            </span>
                          ) : isExpired ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                              Kedaluwarsa
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              Aktif
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Kedaluwarsa: {formatDateTime(link.expiresAt)}
                        </div>
                      </div>

                      {!isRevoked && !isExpired && (
                        <button
                          type="button"
                          onClick={() => handleRevoke(link.id)}
                          disabled={isPending}
                          className="px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 rounded border border-red-200 cursor-pointer"
                        >
                          Cabut Akses
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
