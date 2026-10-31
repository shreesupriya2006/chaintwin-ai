// Page 7: Knowledge Base & RAG Retrieval Studio (ChainTwin AI)
import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Upload,
  Search,
  FileText,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Layers,
  Shield,
  Loader2,
} from 'lucide-react';

interface KnowledgeDoc {
  id: string;
  name: string;
  category: string;
  chunksCount: number;
  content: string;
}

export const KnowledgeBase: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);

  // Load sample documents on mount
  useEffect(() => {
    loadSampleDocs();
  }, []);

  const loadSampleDocs = async () => {
    setIsLoadingSamples(true);
    const sampleFiles = [
      { name: 'supplier_contracts.md', category: 'Supplier Contracts' },
      { name: 'sla_penalty_policy.md', category: 'Customer SLA Framework' },
      { name: 'disruption_playbook.md', category: 'Emergency Response Playbook' },
      { name: 'incident_report_yarn_shortage.md', category: 'Historical Post-Mortem' },
      { name: 'blend_yarn_approval_rules.md', category: 'Material Substitution' },
    ];

    try {
      const loaded: KnowledgeDoc[] = [];
      for (const f of sampleFiles) {
        const res = await fetch(`/sample/knowledge/${f.name}`);
        if (res.ok) {
          const text = await res.text();
          loaded.push({
            id: f.name,
            name: f.name.replace(/_/g, ' ').replace('.md', '').toUpperCase(),
            category: f.category,
            chunksCount: Math.max(1, Math.ceil(text.length / 400)),
            content: text,
          });
        }
      }
      setDocs(loaded);
      if (loaded.length > 0) setSelectedDoc(loaded[0]);
    } catch (err) {
      console.warn('Failed to load sample docs:', err);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const chunks = docs.map((d) => ({
        id: d.id,
        title: d.name,
        source: d.id,
        content: d.content,
      }));

      const res = await fetch('/api/rag/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, chunks }),
      });

      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.warn('Local search fallback:', err);
      // Fallback local search
      const q = searchQuery.toLowerCase();
      const results = docs
        .filter((d) => d.content.toLowerCase().includes(q))
        .map((d) => ({
          title: d.name,
          source: d.id,
          content: d.content.slice(0, 300) + '...',
          score: 1,
        }));
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950 p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Knowledge Base & RAG Semantic Grounding
          </h2>
          <p className="text-xs text-slate-400">
            Enterprise policy documents, buyer approval guidelines, and past post-mortems cited by the autonomous agent.
          </p>
        </div>

        <button
          onClick={loadSampleDocs}
          disabled={isLoadingSamples}
          className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          {isLoadingSamples ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-teal-400" />}
          <span>Reload Sample Policies (5 Docs)</span>
        </button>
      </div>

      {/* RAG Similarity Search Playground Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search contracts and playbooks (e.g. 'late penalty rates', 'substitute approval rules', 'force majeure')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Semantic Retrieval</span>
          </button>
        </form>

        {/* Search Results Preview */}
        {searchResults.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Top Retrieved Chunks (RAG Grounding)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {searchResults.map((res, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-blue-500">
                    <span>{res.title}</span>
                    <span className="font-mono text-slate-400">{res.source}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                    {res.content || res.snippet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Split: Documents List vs Viewer */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0">
        {/* Left 1 Col: Documents List */}
        <div className="flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Corporate Documents ({docs.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {docs.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500/40 ring-1 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {doc.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{doc.category}</p>
                      <span className="inline-block mt-2 font-mono text-[10px] text-teal-500 font-semibold">
                        {doc.chunksCount} Vector Chunks (500 tokens)
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Markdown Document Viewer */}
        <div className="lg:col-span-2 flex flex-col h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                {selectedDoc?.name || 'Document Content'}
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Source: {selectedDoc?.id}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {selectedDoc ? selectedDoc.content : 'Select a document to read.'}
          </div>
        </div>
      </div>
    </div>
  );
};
