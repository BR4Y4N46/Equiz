"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuestionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ texto: '', opcion0: '', opcion1: '', opcion2: '', opcion3: '', respuestaCorrecta: '0', dificultad: 'medium', categoria: 'general' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && (!user || user?.role !== 'ADMIN')) router.replace('/');
  }, [user, loading, router]);

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/questions');
      const data = await res?.json?.();
      setQuestions(data?.questions ?? []);
    } catch {}
  };

  const resetForm = () => {
    setForm({ texto: '', opcion0: '', opcion1: '', opcion2: '', opcion3: '', respuestaCorrecta: '0', dificultad: 'medium', categoria: 'general' });
    setEditId(null);
    setError('');
  };

  const openEdit = (q: any) => {
    const ops = q?.opciones ?? [];
    setForm({
      texto: q?.texto ?? '',
      opcion0: ops?.[0] ?? '',
      opcion1: ops?.[1] ?? '',
      opcion2: ops?.[2] ?? '',
      opcion3: ops?.[3] ?? '',
      respuestaCorrecta: String(q?.respuestaCorrecta ?? 0),
      dificultad: q?.dificultad ?? 'medium',
      categoria: q?.categoria ?? 'general',
    });
    setEditId(q?.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setSaving(true);
    setError('');
    const body = {
      texto: form?.texto,
      opciones: [form?.opcion0, form?.opcion1, form?.opcion2, form?.opcion3],
      respuestaCorrecta: Number(form?.respuestaCorrecta),
      dificultad: form?.dificultad,
      categoria: form?.categoria,
    };
    try {
      const url = editId ? `/api/questions/${editId}` : '/api/questions';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res?.json?.();
      if (res?.ok) {
        setShowForm(false);
        resetForm();
        fetchQuestions();
      } else {
        setError(data?.error ?? 'Error');
      }
    } catch { setError('Error de conexión'); }
    setSaving(false);
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    try {
      await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      fetchQuestions();
    } catch {}
  };

  const diffColor = (d: string) => {
    const m: Record<string, string> = { easy: 'bg-green-500/10 text-green-500', medium: 'bg-yellow-500/10 text-yellow-500', hard: 'bg-red-500/10 text-red-500' };
    return m?.[d] ?? '';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/admin')} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">Preguntas</h1>
              <p className="text-muted-foreground text-sm">{questions?.length ?? 0} preguntas en total</p>
            </div>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Agregar
          </button>
  <button onClick={() => { resetForm(); setShowForm(true); }} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-1">
            <Plus className="w-4 h-4" /> AgregarMasivo
          </button>

        </div>

        <div className="grid gap-3">
          {(questions ?? []).map((q: any, idx: number) => (
            <motion.div key={q?.id ?? idx} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
              className="p-4 rounded-xl bg-card shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{q?.texto ?? ''}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${diffColor(q?.dificultad)}`}>{q?.dificultad ?? ''}</span>
                    <span className="text-xs text-muted-foreground capitalize">{q?.categoria ?? ''}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {((q?.opciones ?? []) as string[]).map((o: string, i: number) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded ${i === q?.respuestaCorrecta ? 'bg-green-500/10 text-green-500 font-medium' : 'bg-muted text-muted-foreground'}`}>
                        {String.fromCharCode(65 + i)}: {o}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(q)} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteQuestion(q?.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card p-6 rounded-xl shadow-xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-display font-bold">{editId ? 'Editar pregunta' : 'Nueva pregunta'}</h2>
              {error && <div className="p-2 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Pregunta</label>
                  <textarea value={form?.texto ?? ''} onChange={(e) => setForm({ ...form, texto: e?.target?.value ?? '' })} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm min-h-[60px]" required />
                </div>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="space-y-1">
                    <label className="text-xs font-medium flex items-center gap-1">
                      Opción {String.fromCharCode(65 + i)}
                      {Number(form?.respuestaCorrecta) === i && <CheckCircle className="w-3 h-3 text-green-500" />}
                    </label>
                    <input
                      type="text"
                      value={(form as any)?.[`opcion${i}`] ?? ''}
                      onChange={(e) => setForm({ ...form, [`opcion${i}`]: e?.target?.value ?? '' })}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                      required
                    />
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Correcta</label>
                    <select value={form?.respuestaCorrecta ?? '0'} onChange={(e) => setForm({ ...form, respuestaCorrecta: e?.target?.value ?? '0' })} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm">
                      <option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Dificultad</label>
                    <select value={form?.dificultad ?? 'medium'} onChange={(e) => setForm({ ...form, dificultad: e?.target?.value ?? 'medium' })} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm">
                      <option value="easy">Fácil</option><option value="medium">Media</option><option value="hard">Difícil</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Categoría</label>
                    <input type="text" value={form?.categoria ?? ''} onChange={(e) => setForm({ ...form, categoria: e?.target?.value ?? '' })} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">{editId ? 'Guardar' : 'Crear'}</button>
                  <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 py-2 rounded-lg border border-border text-sm hover:bg-accent">Cancelar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
