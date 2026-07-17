import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, Check, ChevronDown, AlertCircle, Volume2, Calculator } from 'lucide-react';
import { useVoiceInput, VOICE_LANGUAGES, VoiceLanguage } from '../hooks/useVoiceInput';

interface ModularVoiceInputProps {
  onAddItem: (item: { name: string; width: number; height: number; depth?: number; rate: number }) => void;
  onClose: () => void;
  presetRates: number[];
  currentRate: number;
  onRateChange: (rate: number) => void;
}

const ModularVoiceInput: React.FC<ModularVoiceInputProps> = ({
  onAddItem,
  onClose,
  presetRates,
  currentRate,
  onRateChange,
}) => {
  const [editName, setEditName] = useState('');
  const [editWidth, setEditWidth] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editDepth, setEditDepth] = useState('');
  const [selectedRate, setSelectedRate] = useState(currentRate || 0);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const voice = useVoiceInput();

  useEffect(() => {
    if (!voice.isListening && voice.transcript.trim()) {
      parseModularVoice(voice.transcript);
    }
  }, [voice.isListening, voice.transcript]);

  const parseModularVoice = (transcript: string) => {
    const lower = transcript.toLowerCase();
    const numbers = (lower.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    if (numbers.length >= 2) {
      setEditWidth(String(numbers[0]));
      setEditHeight(String(numbers[1]));
      if (numbers.length >= 3) setEditDepth(String(numbers[2]));
    }
    const byMatch = lower.match(/(?:by|times|x)\s*(\w+)/);
    if (byMatch) {
      const wordNum: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
      const w = wordNum[byMatch[1]];
      if (w) setEditWidth(String(w));
    }
    const nameMatch = transcript.match(/(?:add|for|like)\s+(?:a\s+|an\s+)?([a-zA-Z\s]+?)(?:\s+|\s+\d)/i);
    if (nameMatch) setEditName(nameMatch[1].trim());
    for (const r of presetRates) {
      if (lower.includes(String(r))) {
        setSelectedRate(r);
        onRateChange(r);
        break;
      }
    }
  };

  const measurement = (() => {
    const w = parseFloat(editWidth) || 0;
    const h = parseFloat(editHeight) || 0;
    const d = parseFloat(editDepth) || 0;
    if (w <= 0 || h <= 0) return 0;
    return d > 0 ? w * h * d : w * h;
  })();

  const totalAmount = measurement * selectedRate;

  const handleAdd = () => {
    const name = editName.trim() || 'Modular Item';
    const w = parseFloat(editWidth) || 0;
    const h = parseFloat(editHeight) || 0;
    const d = parseFloat(editDepth) || 0;
    if (w <= 0 || h <= 0 || selectedRate <= 0) return;
    onAddItem({ name, width: w, height: h, depth: d > 0 ? d : undefined, rate: selectedRate });
    setAddedFeedback(true);
    setTimeout(() => {
      setAddedFeedback(false);
      setEditName(''); setEditWidth(''); setEditHeight(''); setEditDepth('');
      voice.clearTranscript();
    }, 900);
  };

  const handleReset = () => {
    voice.clearTranscript();
    voice.clearError();
    setEditName(''); setEditWidth(''); setEditHeight(''); setEditDepth('');
  };

  const currentLangLabel = VOICE_LANGUAGES.find(l => l.code === voice.language)?.label ?? 'English';

  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">Add Modular Item by Voice</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors" title="Close">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {!voice.isSupported && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Voice input requires Chrome or Edge browser.</span>
        </div>
      )}

      {voice.error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{voice.error}</span>
          <button onClick={voice.clearError} className="ml-auto flex-shrink-0 text-red-500 hover:text-red-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={voice.isListening ? voice.stopListening : voice.startListening}
          disabled={!voice.isSupported}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            voice.isListening ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200' : 'bg-primary-500 hover:bg-primary-600 shadow-md'
          }`}
          title={voice.isListening ? 'Stop listening' : 'Start listening'}
        >
          {voice.isListening && <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-60" />}
          {voice.isListening ? <MicOff className="w-6 h-6 relative" /> : <Mic className="w-6 h-6 relative" />}
        </button>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">
            {voice.isListening ? 'Listening... speak clearly' : voice.transcript ? 'Transcript captured' : 'Say e.g. "Kitchen 12 by 8" or "Wardrobe 8 by 6 by 2"'}
          </p>
          <div className="relative inline-block">
            <button onClick={() => setShowLangMenu(v => !v)} className="flex items-center gap-1.5 text-xs px-2.5 py-1 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
              <span className="text-gray-700">{currentLangLabel}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showLangMenu && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[140px]">
                {VOICE_LANGUAGES.map(lang => (
                  <button key={lang.code} onClick={() => { voice.changeLanguage(lang.code as VoiceLanguage); setShowLangMenu(false); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${voice.language === lang.code ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {voice.transcript && (
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 italic border border-gray-200">"{voice.transcript}"</div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Item Name</label>
          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="e.g. Kitchen, Wardrobe" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Width (ft)</label>
            <input type="number" value={editWidth} onChange={e => setEditWidth(e.target.value)} placeholder="12" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Height (ft)</label>
            <input type="number" value={editHeight} onChange={e => setEditHeight(e.target.value)} placeholder="8" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Depth (ft)</label>
            <input type="number" value={editDepth} onChange={e => setEditDepth(e.target.value)} placeholder="optional" min="0" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Rate per sq.ft (₹)</label>
          <div className="flex flex-wrap gap-2">
            {presetRates.map(rate => (
              <button key={rate} onClick={() => { setSelectedRate(rate); onRateChange(rate); }} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${selectedRate === rate ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                ₹{rate}
              </button>
            ))}
          </div>
        </div>

        {measurement > 0 && selectedRate > 0 && (
          <div className="bg-primary-50 rounded-lg p-3 flex items-center gap-3">
            <Calculator className="w-5 h-5 text-primary-600" />
            <div className="text-sm">
              <span className="text-gray-600">{editWidth} × {editHeight}{editDepth ? ` × ${editDepth}` : ''} = </span>
              <span className="font-semibold text-gray-900">{measurement.toFixed(2)} sq.ft</span>
              <span className="text-gray-600"> × ₹{selectedRate} = </span>
              <span className="font-bold text-primary-700">₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={handleReset} className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">Try Again</button>
          <button onClick={handleAdd} disabled={(!parseFloat(editWidth) || !parseFloat(editHeight) || !selectedRate) && !addedFeedback} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${addedFeedback ? 'bg-green-500 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'}`}>
            {addedFeedback ? <><Check className="w-4 h-4" /> Added!</> : 'Add Item'}
          </button>
        </div>
      </div>

      {!voice.transcript && voice.isSupported && (
        <p className="text-xs text-gray-400 text-center pb-1">Example: "Kitchen 12 by 8 at 1800" or "Wardrobe 8 by 6 by 2"</p>
      )}
    </div>
  );
};

export default ModularVoiceInput;
