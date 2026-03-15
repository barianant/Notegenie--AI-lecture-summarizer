
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Mic, 
  Upload, 
  FileText, 
  History as HistoryIcon, 
  Brain, 
  Download, 
  Settings, 
  Moon, 
  Sun, 
  Play, 
  Square,
  Trash2,
  Share2,
  ChevronRight,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { analyzeLecture } from './geminiService';
import { NoteSession, AnalysisResult, DetailLevel } from './types';
import MindMapComponent from './components/MindMap';
import jsPDF from 'jspdf';

const App: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailLevel, setDetailLevel] = useState<DetailLevel>(DetailLevel.STANDARD);
  const [currentSession, setCurrentSession] = useState<NoteSession | null>(null);
  const [history, setHistory] = useState<NoteSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(prev => prev + finalTranscript);
      };
    }
  }, []);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('note_genie_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('note_genie_history', JSON.stringify(history.slice(0, 5)));
  }, [history]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    // In a real scenario, we might use a transcription service or send directly to Gemini
    // For this demo, we'll read the file and let the user know we're processing
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      try {
        const result = await analyzeLecture(transcript, detailLevel, {
          data: base64,
          mimeType: file.type
        });
        const newSession: NoteSession = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          title: file.name.replace(/\.[^/.]+$/, ""),
          transcript: transcript || `Transcript processed from ${file.name}`,
          result
        };
        setHistory(prev => [newSession, ...prev]);
        setCurrentSession(newSession);
      } catch (err) {
        console.error(err);
        alert("Failed to analyze audio file. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      alert("Please provide a transcript or record some audio first.");
      return;
    }
    setLoading(true);
    try {
      const result = await analyzeLecture(transcript, detailLevel);
      const newSession: NoteSession = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        title: `Lecture - ${new Date().toLocaleDateString()}`,
        transcript,
        result
      };
      setHistory(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Check your API connection.");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    if (!currentSession?.result) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(currentSession.title, 20, 20);
    doc.setFontSize(12);
    doc.text("Executive Summary:", 20, 35);
    const splitSummary = doc.splitTextToSize(currentSession.result.executiveSummary, 170);
    doc.text(splitSummary, 20, 45);
    
    doc.save(`${currentSession.title}.pdf`);
  };

  const exportMarkdown = () => {
    if (!currentSession?.result) return;
    const { executiveSummary, hierarchy, keyConcepts } = currentSession.result;
    let md = `# ${currentSession.title}\n\n`;
    md += `## Executive Summary\n${executiveSummary}\n\n`;
    md += `## Key Topics\n`;
    hierarchy.forEach(h => {
      md += `### ${h.topic}\n`;
      h.subtopics.forEach(s => md += `- ${s}\n`);
      md += `\n`;
    });
    md += `## Key Concepts\n`;
    keyConcepts.forEach(k => {
      md += `**${k.term}**: ${k.definition}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSession.title}.md`;
    a.click();
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            NoteGenie
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            title="History"
          >
            <HistoryIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input & Controls */}
        <section className="lg:col-span-5 space-y-6">
          <div className="glass rounded-2xl p-6 shadow-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Mic className="w-5 h-5 text-indigo-400" />
                Capture Lecture
              </h2>
              <div className="flex gap-2">
                <label className="cursor-pointer p-2 rounded-full hover:bg-white/10 transition-colors" title="Upload Audio">
                  <Upload className="w-5 h-5 text-cyan-400" />
                  <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                </label>
              </div>
            </div>

            <div className="relative group">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Transcribing live audio or type notes here..."
                className="w-full h-64 bg-slate-800/50 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none text-slate-200"
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={toggleRecording}
                  className={`p-3 rounded-full shadow-lg transition-all ${
                    isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isRecording ? <Square className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Analysis Detail</span>
                <span className="font-medium text-indigo-400 capitalize">{detailLevel}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="1" 
                value={detailLevel === DetailLevel.CONCISE ? 0 : detailLevel === DetailLevel.STANDARD ? 1 : 2}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setDetailLevel(val === 0 ? DetailLevel.CONCISE : val === 1 ? DetailLevel.STANDARD : DetailLevel.COMPREHENSIVE);
                }}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <button
                onClick={handleAnalyze}
                disabled={loading || !transcript}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                Generate Smart Notes
              </button>
            </div>
          </div>

          {/* History Sidebar/List */}
          {showHistory && (
            <div className="glass rounded-2xl p-6 shadow-xl border border-white/5">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-indigo-400" />
                Recent Sessions
              </h3>
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No recent notes</p>
                ) : (
                  history.map(session => (
                    <button
                      key={session.id}
                      onClick={() => {
                        setCurrentSession(session);
                        setTranscript(session.transcript);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        currentSession?.id === session.id 
                        ? 'bg-indigo-500/10 border-indigo-500/50' 
                        : 'bg-slate-800/30 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <p className="font-medium truncate">{session.title}</p>
                      <p className="text-xs text-slate-500">{new Date(session.timestamp).toLocaleString()}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Visualization & Summary */}
        <section className="lg:col-span-7 space-y-6">
          {currentSession?.result ? (
            <div className="space-y-6">
              {/* Tabs / Segmented Controls */}
              <div className="glass p-1 rounded-xl flex gap-1">
                <button className="flex-1 py-2 px-4 rounded-lg bg-indigo-600 text-white font-medium shadow-sm">Notes</button>
                <button className="flex-1 py-2 px-4 rounded-lg hover:bg-white/5 text-slate-400 font-medium transition-colors">Visualization</button>
              </div>

              {/* Summary Card */}
              <div className="glass rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 px-6 py-4 flex items-center justify-between border-b border-slate-700">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    Lecture Summary
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={exportPDF} className="p-2 rounded-lg hover:bg-white/10" title="PDF">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={exportMarkdown} className="p-2 rounded-lg hover:bg-white/10" title="Markdown">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 leading-relaxed italic border-l-4 border-indigo-500 pl-4 py-1">
                      {currentSession.result.executiveSummary}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-indigo-400 flex items-center gap-2">
                      <ChevronDown className="w-4 h-4" />
                      Topic Hierarchy
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentSession.result.hierarchy.map((h, i) => (
                        <div key={i} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                          <p className="font-bold text-indigo-200 mb-2">{h.topic}</p>
                          <ul className="space-y-1">
                            {h.subtopics.map((s, si) => (
                              <li key={si} className="text-sm text-slate-400 flex items-start gap-2">
                                <ChevronRight className="w-3 h-3 mt-1 text-slate-600" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-cyan-400 flex items-center gap-2">
                      <ChevronDown className="w-4 h-4" />
                      Key Concepts
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {currentSession.result.keyConcepts.map((k, i) => (
                        <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                          <span className="font-bold text-cyan-200 whitespace-nowrap">{k.term}</span>
                          <span className="text-sm text-slate-400">{k.definition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mind Map Section */}
              <div className="glass rounded-2xl h-[500px] overflow-hidden shadow-2xl border border-white/5 relative">
                <div className="absolute top-4 left-4 z-10">
                  <h3 className="font-bold text-slate-100 flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    Mind Map
                  </h3>
                </div>
                <MindMapComponent data={currentSession.result.mindMap} />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 glass rounded-2xl border-dashed border-2 border-slate-700 opacity-60">
              <Brain className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-400">No Analysis Yet</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                Record a lecture or upload an audio file to generate smart notes and interactive visualizations.
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="py-8 text-center text-slate-500 text-sm">
        <p>© 2024 NoteGenie AI • Intelligent Academic Assistant</p>
      </footer>
    </div>
  );
};

export default App;
