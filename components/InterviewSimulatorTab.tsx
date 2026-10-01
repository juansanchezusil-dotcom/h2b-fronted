'use client';

import { useEffect, useState } from 'react';
import { Mic, Loader2, FileText, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface InterviewSimulatorProps {
  userId: string;
  onOpenCvBuilder?: () => void;
}

interface Question {
  question_en: string;
  question_es: string;
  tip_es: string;
}

interface Feedback {
  feedback_es: string;
  model_answer_en: string;
}

interface CandidateProfile {
  targetRole: string;
  industry: string;
  englishLevel: string;
  baseCvText: string;
}

export default function InterviewSimulatorTab({ userId, onOpenCvBuilder }: InterviewSimulatorProps) {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);

  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('target_role, industry, english_level, nivel_ingles, base_cv_text, experiencia_industria')
        .eq('id', userId)
        .maybeSingle();
      setProfile({
        targetRole: data?.target_role || '',
        industry: data?.industry || data?.experiencia_industria || '',
        englishLevel: data?.english_level || data?.nivel_ingles || '',
        baseCvText: data?.base_cv_text || '',
      });
      setLoadingProfile(false);
    })();
  }, [userId]);

  const hasCv = (profile?.baseCvText || '').trim().length >= 30;

  const startPractice = async () => {
    if (!profile) return;
    setLoadingQuestions(true);
    setQuestionsError(null);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'questions',
          targetRole: profile.targetRole || 'general worker',
          industry: profile.industry,
          englishLevel: profile.englishLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron generar las preguntas.');
      setQuestions(data.questions || []);
      setIndex(0);
      setAnswer('');
      setFeedback(null);
    } catch (err: any) {
      setQuestionsError(err.message || 'No se pudieron generar las preguntas. Intenta de nuevo.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const submitAnswer = async () => {
    if (!questions || answer.trim().length < 3) return;
    setLoadingFeedback(true);
    setFeedbackError(null);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'feedback',
          questionEn: questions[index].question_en,
          answer,
          englishLevel: profile?.englishLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo evaluar tu respuesta.');
      setFeedback(data);
    } catch (err: any) {
      setFeedbackError(err.message || 'No se pudo evaluar tu respuesta. Intenta de nuevo.');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const nextQuestion = () => {
    setIndex((i) => i + 1);
    setAnswer('');
    setFeedback(null);
    setFeedbackError(null);
  };

  const restart = () => {
    setQuestions(null);
    setIndex(0);
    setAnswer('');
    setFeedback(null);
  };

  if (loadingProfile) {
    return (
      <div className="max-w-3xl mx-auto p-6 flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando tu perfil...
      </div>
    );
  }

  if (!hasCv) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Completa tu CV primero</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Las preguntas se adaptan a tu puesto e industria reales, que vienen de tu CV. Cuéntanos tu experiencia una
            vez y la usamos aquí también.
          </p>
          <button
            onClick={onOpenCvBuilder}
            className="bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all"
          >
            Completar mi CV
          </button>
        </div>
      </div>
    );
  }

  if (!questions) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Mic className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Simulador de Entrevista</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Practica 6 preguntas típicas que un empleador H-2B te podría hacer, en inglés. Después de cada respuesta
            recibes feedback en español y una respuesta modelo.
          </p>
          {questionsError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">
              {questionsError}
            </p>
          )}
          <button
            onClick={startPractice}
            disabled={loadingQuestions}
            className="w-full flex items-center justify-center gap-2 bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-50 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all"
          >
            {loadingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
            {loadingQuestions ? 'Preparando preguntas...' : 'Comenzar práctica'}
          </button>
        </div>
      </div>
    );
  }

  const finished = index >= questions.length;
  const current = !finished ? questions[index] : null;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Simulador de Entrevista</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {finished ? 'Práctica completa' : `Pregunta ${index + 1} de ${questions.length}`}
            </p>
          </div>
        </div>
        <button
          onClick={restart}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
        </button>
      </div>

      {finished ? (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            ✓ Completaste las {questions.length} preguntas de práctica.
          </p>
          <button
            onClick={restart}
            className="bg-[#0B4079] hover:bg-[#08305c] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
          >
            Practicar de nuevo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
            <p className="text-base font-bold text-slate-900 dark:text-white">{current!.question_en}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">{current!.question_es}</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg px-2.5 py-1.5 mt-2">
              💡 {current!.tip_es}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <label htmlFor="interview-answer" className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Tu respuesta (en inglés, como la dirías de verdad)
            </label>
            <textarea
              id="interview-answer"
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white p-3 text-sm focus:bg-white dark:focus:bg-slate-800 focus:border-[#C89B3C] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/20"
            />
            {feedbackError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">
                {feedbackError}
              </p>
            )}
            {!feedback ? (
              <button
                onClick={submitAnswer}
                disabled={answer.trim().length < 3 || loadingFeedback}
                className="w-full flex items-center justify-center gap-2 bg-[#0B4079] hover:bg-[#08305c] disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                {loadingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loadingFeedback ? 'Evaluando...' : 'Enviar respuesta'}
              </button>
            ) : (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-3 text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
                  {feedback.feedback_es}
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Respuesta modelo</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl p-3 mt-1">
                    {feedback.model_answer_en}
                  </p>
                </div>
                <button
                  onClick={nextQuestion}
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
                >
                  {index + 1 < questions.length ? 'Siguiente pregunta' : 'Terminar práctica'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
