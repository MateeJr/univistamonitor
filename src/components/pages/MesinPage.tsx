'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ENDPOINTS } from '@/components/config/server';
import { Eye, Trash2 } from 'lucide-react';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal';
import DetailFormViewer, { LaporanDetail } from '@/components/modals/DetailFormViewer';

type SelectOption = { label: string; value: 'harian' | 'kerusakan'; description?: string };

export default function MesinPage() {
  const [jenisOpen, setJenisOpen] = useState(false);
  const [jenisLaporan, setJenisLaporan] = useState<SelectOption | null>(null);
  const [namaMesin, setNamaMesin] = useState('');
  const [jenisMesin, setJenisMesin] = useState('');
  const [alasan, setAlasan] = useState('');
  const [tanggalLaporan, setTanggalLaporan] = useState<string>('');
  const [fotos, setFotos] = useState<Array<{ name: string; url: string; file: File }>>([]);
  const jenisRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  type HistoryItem = {
    id: string;
    jenis: 'harian' | 'kerusakan';
    namaMesin: string;
    jenisMesin: string;
    alasan: string;
    tanggalLaporan: string;
    createdAt: string | null;
    imagesCount: number;
  };

  const [submitting, setSubmitting] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<LaporanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ jenis: 'harian' | 'kerusakan'; id: string } | null>(null);
  const [mobileTab, setMobileTab] = useState<'buat' | 'history'>('buat');
  const [historyDate, setHistoryDate] = useState<string>('');
  const [historyDateInput, setHistoryDateInput] = useState<string>('');

  const jenisOptions: SelectOption[] = [
    { label: 'Laporan Harian', value: 'harian', description: 'Laporan rutin harian mesin' },
    { label: 'Laporan Kerusakan', value: 'kerusakan', description: 'Melaporkan kerusakan dan insiden' },
  ];

  const MAX_IMAGES = 5;

  const handleFiles = (list: FileList | File[] | null) => {
    if (!list) return;
    const files = Array.from(list).filter((f) => f.type.startsWith('image/'));
    const remaining = Math.max(0, MAX_IMAGES - fotos.length);
    if (remaining <= 0) return;
    const toAdd = files.slice(0, remaining).map((f) => ({ name: f.name, url: URL.createObjectURL(f), file: f }));
    setFotos((prev) => [...prev, ...toAdd]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFoto = (idx: number) => {
    setFotos((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(idx, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return copy;
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!jenisRef.current) return;
      if (!jenisRef.current.contains(e.target as Node)) {
        setJenisOpen(false);
      }
    }
    if (jenisOpen) {
      document.addEventListener('mousedown', onDocClick);
    }
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [jenisOpen]);

  // Submit laporan to server
  async function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const fetchHistory = async (d?: string) => {
    try {
      setHistoryLoading(true);
      const date = (d ?? historyDate) || '';
      const url = date ? `${ENDPOINTS.laporanList}?date=${encodeURIComponent(date)}` : ENDPOINTS.laporanList;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.ok) setHistoryItems(json.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (!historyDate) return;
    fetchHistory(historyDate);
    const id = setInterval(() => fetchHistory(historyDate), 15000);
    return () => clearInterval(id);
  }, [historyDate]);

  // Format date helper: DD/MMM/YYYY (e.g., 13/Aug/2025)
  const monthShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ] as const;
  function formatDDMMMYYYYFromISO(iso?: string | null) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mmm = monthShort[d.getMonth()];
    const yyyy = d.getFullYear();
    return `${dd}/${mmm}/${yyyy}`;
  }

  // On page load, set default tanggalLaporan using server time (not local)
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch(ENDPOINTS.time);
        const json = await res.json();
        if (!canceled && res.ok && json && json.ok && typeof json.date === 'string') {
          // Only set if user hasn't typed anything yet
          setTanggalLaporan((prev) => prev || json.date);
          setHistoryDate((prev) => prev || json.date);
          setHistoryDateInput((prev) => prev || json.date);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { canceled = true; };
  }, []);

  const handleSubmit = async () => {
    if (!jenisLaporan || !namaMesin.trim() || !jenisMesin.trim() || !tanggalLaporan) {
      alert('Lengkapi form terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    try {
      const images = await Promise.all(
        fotos.map(async (f) => ({ name: f.name, dataUrl: await fileToDataURL(f.file) }))
      );
      const payload = {
        jenis: jenisLaporan.value,
        namaMesin,
        jenisMesin,
        alasan,
        tanggalLaporan,
        images,
      };
      const res = await fetch(ENDPOINTS.laporanSubmit, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal submit');
      // Reset form
      setNamaMesin('');
      setJenisMesin('');
      setAlasan('');
      setTanggalLaporan('');
      setJenisLaporan(null);
      fotos.forEach((f) => URL.revokeObjectURL(f.url));
      setFotos([]);
      await fetchHistory();
    } catch (e) {
      console.error(e);
      alert('Gagal mengirim laporan');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (jenis: 'harian' | 'kerusakan', id: string) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      const res = await fetch(`${ENDPOINTS.laporanDetailBase}/${jenis}/${id}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal memuat detail');
      setDetailData(json.data as LaporanDetail);
    } catch (e) {
      console.error(e);
      alert('Gagal memuat detail');
      setDetailOpen(false);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = (jenis: 'harian' | 'kerusakan', id: string) => {
    setDeleteTarget({ jenis, id });
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${ENDPOINTS.laporanDeleteBase}/${deleteTarget.jenis}/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal menghapus laporan');
      await fetchHistory();
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus laporan');
    } finally {
      setDeleteTarget(null);
    }
  };

  // (URLs are revoked when each image is removed)
  return (
    <section className="w-full box-border flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0">
        {/* Mobile: tabbed pages */}
        <div className="lg:hidden flex flex-col flex-1 min-h-0">
          <div className="px-1 pb-2">
            <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-0.5">
              <button
                type="button"
                onClick={() => setMobileTab('buat')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition ${
                  mobileTab === 'buat' ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                Buat Laporan
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('history')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition ${
                  mobileTab === 'history' ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                History
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {mobileTab === 'buat' ? (
              <div className="min-h-0 h-full flex flex-col">
                <div className="border border-white/20 rounded-xl min-h-0 h-full flex flex-col overflow-hidden">
                  <div className="border-b border-white/10 px-4 py-3 text-white/70 font-semibold text-center">BUAT LAPORAN</div>
                  <div className="flex-1 min-h-0 overflow-auto uv-scrollbar p-4">
                    <form className="space-y-4">
                      {/* Jenis Laporan (dropdown) */}
                      <div className="space-y-1.5" ref={jenisRef}>
                        <label className="text-xs text-white/60">Jenis laporan</label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setJenisOpen((v) => !v)}
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-left text-white/80 hover:bg-white/10 focus:outline-none focus:border-white/30 transition text-sm flex items-center justify-between"
                          >
                            <span className={jenisLaporan ? 'text-white/90' : 'text-white/40'}>
                              {jenisLaporan?.label || 'Pilih jenis laporan'}
                            </span>
                            <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {jenisOpen && (
                            <div className="absolute left-0 right-0 z-10 mt-1 rounded-xl border border-white/10 bg-[#0b0b0b] shadow-[0_12px_32px_rgba(0,0,0,0.4)] overflow-hidden">
                              <ul className="max-h-48 overflow-auto uv-scrollbar py-1">
                                {jenisOptions.map((opt) => {
                                  const active = jenisLaporan?.value === opt.value;
                                  return (
                                    <li key={opt.value}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setJenisLaporan(opt);
                                          setJenisOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition ${
                                          active
                                            ? 'bg-white/10 text-white'
                                            : 'text-white/80 hover:bg-white/5'
                                        }`}
                                      >
                                        <span className="truncate">{opt.label}</span>
                                        {active && (
                                          <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                        )}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Nama Mesin */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/60">Nama Mesin</label>
                        <input
                          type="text"
                          value={namaMesin}
                          onChange={(e) => setNamaMesin(e.target.value)}
                          placeholder="Nama mesin"
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
                        />
                      </div>

                      {/* Jenis Mesin */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/60">Jenis Mesin</label>
                        <input
                          type="text"
                          value={jenisMesin}
                          onChange={(e) => setJenisMesin(e.target.value)}
                          placeholder="Jenis mesin"
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
                        />
                      </div>

                      {/* Upload Foto (opsional) */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/60">Upload Foto (opsional)</label>
                        <input
                          ref={fileInputRef}
                          id="upload-foto"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFiles(e.target.files)}
                        />
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleFiles(e.dataTransfer.files);
                          }}
                          className="group cursor-pointer rounded-xl border border-dashed border-white/15 bg-white/5 hover:bg-white/10 transition p-4 text-center"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <svg className="w-8 h-8 text-white/40 group-hover:text-white/60 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M5 7l2-3h10l2 3m-4 6a4 4 0 11-8 0 4 4 0 018 0zm-9 7h10a4 4 0 004-4V7H5v9a4 4 0 004 4z"/></svg>
                            <div className="text-sm text-white/70">Klik untuk pilih atau seret file ke sini</div>
                            <div className="text-xs text-white/40">PNG/JPG hingga 5MB • Maks {MAX_IMAGES} foto</div>
                            {fotos.length > 0 && (
                              <div className="text-xs text-white/50 mt-1">{fotos.length}/{MAX_IMAGES} foto dipilih</div>
                            )}
                          </div>
                        </div>
                        {fotos.length > 0 && (
                          <div className="mt-3 flex gap-2 overflow-x-auto uv-scrollbar pb-1">
                            {fotos.map((f, idx) => (
                              <div key={idx} className="group relative h-16 w-16 flex-none rounded-lg border border-white/10 overflow-hidden bg-black/30">
                                <img src={f.url} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                                <button
                                  type="button"
                                  aria-label="Hapus foto"
                                  onClick={() => removeFoto(idx)}
                                  className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-black/80 border border-white/30 text-white opacity-100 transition z-10 pointer-events-auto"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Alasan */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/60">Alasan</label>
                        <textarea
                          rows={4}
                          value={alasan}
                          onChange={(e) => setAlasan(e.target.value)}
                          placeholder="Alasan laporan"
                          className="w-full px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
                        />
                      </div>

                      {/* Tanggal Laporan */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/60">Tanggal Laporan</label>
                        <input
                          type="date"
                          value={tanggalLaporan}
                          onChange={(e) => setTanggalLaporan(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
                        />
                      </div>

                      {/* Submit */}
                      <div className="pt-2">
                        <button
                          type="button"
                          className="w-full inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-semibold transition"
                          onClick={handleSubmit}
                          disabled={submitting}
                        >
                          {submitting ? 'Mengirim...' : 'Submit'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-0 h-full flex flex-col">
                <div className="border border-white/20 rounded-xl min-h-0 h-full flex flex-col overflow-hidden">
                  <div className="border-b border-white/10 px-4 py-3 text-center text-white/70 font-semibold">HISTORY</div>
          <div className="flex-1 min-h-0 overflow-auto uv-scrollbar p-3">
            <div className="mb-3 flex items-center gap-2">
              <input
                type="date"
                value={historyDateInput}
                onChange={(e) => setHistoryDateInput(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
              />
              <button
                type="button"
                onClick={() => { setHistoryDate(historyDateInput); fetchHistory(historyDateInput); }}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 text-white px-3 py-2 text-sm"
              >
                Load
              </button>
            </div>
                    {historyLoading && (
                      <div className="text-center text-white/50 text-sm py-6">Memuat...</div>
                    )}
                    {!historyLoading && historyItems.length === 0 && (
                      <div className="text-center text-white/50 text-sm py-6">Belum ada laporan</div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {historyItems.map((it) => (
                        <div key={`${it.jenis}-${it.id}`} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white/90 truncate">{it.namaMesin || '-'}</div>
                            <div className="text-xs text-white/60 truncate">{it.jenis === 'harian' ? 'Laporan Harian' : 'Laporan Kerusakan'} • {it.jenisMesin || '-'} • {it.imagesCount} foto</div>
                            <div className="text-[11px] text-white/40 mt-0.5 truncate">{formatDDMMMYYYYFromISO(it.createdAt)}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => openDetail(it.jenis, it.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs text-white"
                            >
                              <Eye className="w-4 h-4" /> Detail
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(it.jenis, it.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-900/50 bg-rose-900/30 hover:bg-rose-900/40 px-3 py-1.5 text-xs text-white"
                            >
                              <Trash2 className="w-4 h-4" /> Hapus
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: two-panel layout (unchanged) */}
        <div className="hidden lg:grid lg:grid-cols-[30%_1fr] gap-4 flex-1 min-h-0 h-full">
          <div className="border border-white/20 rounded-xl min-h-0 h-full flex flex-col overflow-hidden">
            <div className="border-b border-white/10 px-4 py-3 text-white/70 font-semibold text-center">BUAT LAPORAN</div>
            <div className="flex-1 min-h-0 overflow-auto uv-scrollbar p-4">
              <form className="space-y-4">
                {/* Jenis Laporan (dropdown) */}
                <div className="space-y-1.5" ref={jenisRef}>
                  <label className="text-xs text-white/60">Jenis laporan</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setJenisOpen((v) => !v)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-left text-white/80 hover:bg-white/10 focus:outline-none focus:border-white/30 transition text-sm flex items-center justify-between"
                    >
                      <span className={jenisLaporan ? 'text-white/90' : 'text-white/40'}>
                        {jenisLaporan?.label || 'Pilih jenis laporan'}
                      </span>
                      <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {jenisOpen && (
                      <div className="absolute left-0 right-0 z-10 mt-1 rounded-xl border border-white/10 bg-[#0b0b0b] shadow-[0_12px_32px_rgba(0,0,0,0.4)] overflow-hidden">
                        <ul className="max-h-48 overflow-auto uv-scrollbar py-1">
                          {jenisOptions.map((opt) => {
                            const active = jenisLaporan?.value === opt.value;
                            return (
                              <li key={opt.value}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setJenisLaporan(opt);
                                    setJenisOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition ${
                                    active
                                      ? 'bg-white/10 text-white'
                                      : 'text-white/80 hover:bg-white/5'
                                  }`}
                                >
                                  <span className="truncate">{opt.label}</span>
                                  {active && (
                                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nama Mesin */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Nama Mesin</label>
                  <input
                    type="text"
                    value={namaMesin}
                    onChange={(e) => setNamaMesin(e.target.value)}
                    placeholder="Nama mesin"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
                  />
                </div>

                {/* Jenis Mesin */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Jenis Mesin</label>
                  <input
                    type="text"
                    value={jenisMesin}
                    onChange={(e) => setJenisMesin(e.target.value)}
                    placeholder="Jenis mesin"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
                  />
                </div>

                {/* Upload Foto (opsional) */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Upload Foto (opsional)</label>
                  <input
                    ref={fileInputRef}
                    id="upload-foto"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFiles(e.dataTransfer.files);
                    }}
                    className="group cursor-pointer rounded-xl border border-dashed border-white/15 bg-white/5 hover:bg-white/10 transition p-4 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-white/40 group-hover:text-white/60 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M5 7l2-3h10l2 3m-4 6a4 4 0 11-8 0 4 4 0 018 0zm-9 7h10a4 4 0 004-4V7H5v9a4 4 0 004 4z"/></svg>
                      <div className="text-sm text-white/70">Klik untuk pilih atau seret file ke sini</div>
                      <div className="text-xs text-white/40">PNG/JPG hingga 5MB • Maks {MAX_IMAGES} foto</div>
                      {fotos.length > 0 && (
                        <div className="text-xs text-white/50 mt-1">{fotos.length}/{MAX_IMAGES} foto dipilih</div>
                      )}
                    </div>
                  </div>
                  {fotos.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto uv-scrollbar pb-1">
                      {fotos.map((f, idx) => (
                        <div key={idx} className="group relative h-16 w-16 flex-none rounded-lg border border-white/10 overflow-hidden bg-black/30">
                          <img src={f.url} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                          <button
                            type="button"
                            aria-label="Hapus foto"
                            onClick={() => removeFoto(idx)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-black/80 border border-white/30 text-white opacity-100 transition z-10 pointer-events-auto"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alasan */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Alasan</label>
                  <textarea
                    rows={4}
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    placeholder="Alasan laporan"
                    className="w-full px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
                  />
                </div>

                {/* Tanggal Laporan */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60">Tanggal Laporan</label>
                  <input
                    type="date"
                    value={tanggalLaporan}
                    onChange={(e) => setTanggalLaporan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
                  />
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-semibold transition"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Mengirim...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="border border-white/20 rounded-xl min-h-0 h-full flex flex-col overflow-hidden">
            <div className="border-b border-white/10 px-4 py-3 text-center text-white/70 font-semibold">HISTORY</div>
            <div className="flex-1 min-h-0 overflow-auto uv-scrollbar p-3">
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="date"
                  value={historyDateInput}
                  onChange={(e) => setHistoryDateInput(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => { setHistoryDate(historyDateInput); fetchHistory(historyDateInput); }}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 text-white px-3 py-2 text-sm"
                >
                  Load
                </button>
              </div>
              {historyLoading && (
                <div className="text-center text-white/50 text-sm py-6">Memuat...</div>
              )}
              {!historyLoading && historyItems.length === 0 && (
                <div className="text-center text-white/50 text-sm py-6">Belum ada laporan</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {historyItems.map((it) => (
                  <div key={`${it.jenis}-${it.id}`} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white/90 truncate">{it.namaMesin || '-'}</div>
                      <div className="text-xs text-white/60 truncate">{it.jenis === 'harian' ? 'Laporan Harian' : 'Laporan Kerusakan'} • {it.jenisMesin || '-'} • {it.imagesCount} foto</div>
                      <div className="text-[11px] text-white/40 mt-0.5 truncate">{formatDDMMMYYYYFromISO(it.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openDetail(it.jenis, it.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs text-white"
                      >
                        <Eye className="w-4 h-4" /> Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(it.jenis, it.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-900/50 bg-rose-900/30 hover:bg-rose-900/40 px-3 py-1.5 text-xs text-white"
                      >
                        <Trash2 className="w-4 h-4" /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modals */}
      <DetailFormViewer
        visible={detailOpen}
        data={detailData}
        filesBase={ENDPOINTS.filesBase}
        onClose={() => {
          setDetailOpen(false);
          setDetailData(null);
        }}
      />
      <ConfirmDeleteModal
        visible={!!deleteTarget}
        title="Hapus Laporan?"
        description="Tindakan ini akan menghapus laporan beserta fotonya dari server. Tidak dapat dibatalkan."
        onConfirm={doDelete}
        onClose={() => setDeleteTarget(null)}
        confirmLabel="Hapus Laporan"
      />
    </section>
  );
}

