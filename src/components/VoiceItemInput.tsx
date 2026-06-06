import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, Check, ChevronDown, AlertCircle, Volume2 } from 'lucide-react';
import { useVoiceInput, VOICE_LANGUAGES, VoiceLanguage } from '../hooks/useVoiceInput';
import { parseVoiceItemCommand, ParsedVoiceItem } from '../utils/parseVoiceItemCommand';
import { fuzzyMaterialMatch, FuzzyMaterial, FuzzyMatch } from '../utils/fuzzyMaterialMatch';

export interface VoiceAddedItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  width?: number;
  height?: number;
  materialId?: string;
}

interface VoiceItemInputProps {
  materials: FuzzyMaterial[];
  onAddItem: (item: VoiceAddedItem) => void;
  onClose: () => void;
  accentColor?: 'primary' | 'teal';
}

const VoiceItemInput: React.FC<VoiceItemInputProps> = ({
  materials,
  onAddItem,
  onClose,
  accentColor = 'primary',
}) => {
  const accent = accentColor === 'teal'
    ? { btn: 'bg-teal-600 hover:bg-teal-700 text-white', ring: 'focus:ring-teal-500', mic: 'bg-teal-600', border: 'border-teal-500' }
    : { btn: 'bg-primary-500 hover:bg-primary-600 text-white', ring: 'focus:ring-primary-500', mic: 'bg-primary-500', border: 'border-primary-500' };

  const [parsed, setParsed] = useState<ParsedVoiceItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editWidth, setEditWidth] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [fuzzyMatches, setFuzzyMatches] = useState<FuzzyMatch[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | undefined>();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const voice = useVoiceInput();

  // Parse transcript whenever it changes and recording has stopped
  useEffect(() => {
    if (!voice.isListening && voice.transcript.trim()) {
      const result = parseVoiceItemCommand(voice.transcript);
      setParsed(result);
      setEditName(result.name || '');
      setEditQty(result.quantity !== null ? String(result.quantity) : '');
      setEditUnit(result.unit || 'sq.ft');
      setEditPrice(result.unitPrice !== null ? String(result.unitPrice) : '');
      setEditWidth(result.width !== null ? String(result.width) : '');
      setEditHeight(result.height !== null ? String(result.height) : '');
      setSelectedMaterialId(undefined);
    }
  }, [voice.isListening, voice.transcript]);

  // Run fuzzy match whenever the name being edited changes
  useEffect(() => {
    if (!editName.trim() || editName.length < 2) {
      setFuzzyMatches([]);
      return;
    }
    const matches = fuzzyMaterialMatch(editName, materials);
    setFuzzyMatches(matches);
  }, [editName, materials]);

  const handleSelectFuzzyMatch = (match: FuzzyMatch) => {
    const m = match.material;
    const price = m.is_discounted && m.discount_price ? m.discount_price : m.base_price;
    setEditName(m.name);
    setEditUnit(m.unit);
    setEditPrice(String(price));
    setSelectedMaterialId(m.id);
    setFuzzyMatches([]);
  };

  const handleAdd = () => {
    const name = editName.trim();
    const quantity = parseFloat(editQty) || 1;
    const unit = editUnit.trim() || 'sq.ft';
    const unitPrice = parseFloat(editPrice) || 0;
    const width = parseFloat(editWidth) || undefined;
    const height = parseFloat(editHeight) || undefined;

    if (!name) return;

    onAddItem({ name, quantity, unit, unitPrice, width, height, materialId: selectedMaterialId });

    setAddedFeedback(true);
    setTimeout(() => {
      setAddedFeedback(false);
      // Reset for next item
      setParsed(null);
      voice.clearTranscript();
      setEditName(''); setEditQty(''); setEditUnit('sq.ft'); setEditPrice('');
      setEditWidth(''); setEditHeight(''); setSelectedMaterialId(undefined);
    }, 900);
  };

  const handleReset = () => {
    voice.clearTranscript();
    voice.clearError();
    setParsed(null);
    setEditName(''); setEditQty(''); setEditUnit('sq.ft'); setEditPrice('');
    setEditWidth(''); setEditHeight(''); setSelectedMaterialId(undefined);
    setFuzzyMatches([]);
  };

  const currentLangLabel = VOICE_LANGUAGES.find(l => l.code === voice.language)?.label ?? 'English';

  return (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">Add Item by Voice</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors" title="Close">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {!voice.isSupported && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Voice input requires Chrome or Edge browser. Please switch browsers to use this feature.</span>
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

      {/* Mic + Language selector row */}
      <div className="flex items-center gap-3">
        {/* Microphone button */}
        <button
          onClick={voice.isListening ? voice.stopListening : voice.startListening}
          disabled={!voice.isSupported}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            voice.isListening
              ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200'
              : `${accent.mic} shadow-md`
          }`}
          title={voice.isListening ? 'Stop listening' : 'Start listening'}
        >
          {voice.isListening && (
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-60" />
          )}
          {voice.isListening
            ? <MicOff className="w-6 h-6 relative" />
            : <Mic className="w-6 h-6 relative" />
          }
        </button>

        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">
            {voice.isListening
              ? 'Listening... speak clearly'
              : voice.transcript
              ? 'Transcript captured'
              : 'Press mic and say e.g. "Add 10 sq ft vitrified tiles at 80 rupees"'
            }
          </p>

          {/* Language selector */}
          <div className="relative inline-block">
            <button
              onClick={() => setShowLangMenu(v => !v)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-700">{currentLangLabel}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            {showLangMenu && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[140px]">
                {VOICE_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { voice.changeLanguage(lang.code as VoiceLanguage); setShowLangMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      voice.language === lang.code ? 'font-semibold text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live transcript display */}
      {voice.transcript && (
        <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700 italic border border-gray-200">
          "{voice.transcript}"
        </div>
      )}

      {/* Parsed preview + editable fields */}
      {(parsed || editName) && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <div className={`h-0.5 flex-1 ${parsed?.confidence === 'full' ? 'bg-green-400' : parsed?.confidence === 'partial' ? 'bg-yellow-400' : 'bg-gray-200'}`} />
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              parsed?.confidence === 'full'
                ? 'bg-green-100 text-green-700'
                : parsed?.confidence === 'partial'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {parsed?.confidence === 'full' ? 'All fields detected' : parsed?.confidence === 'partial' ? 'Partial — please complete' : 'Name only — fill details'}
            </span>
            <div className={`h-0.5 flex-1 ${parsed?.confidence === 'full' ? 'bg-green-400' : parsed?.confidence === 'partial' ? 'bg-yellow-400' : 'bg-gray-200'}`} />
          </div>

          {/* Name field + fuzzy suggestions */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Item Name</label>
            <input
              type="text"
              value={editName}
              onChange={e => { setEditName(e.target.value); setSelectedMaterialId(undefined); }}
              placeholder="Material name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300 outline-none"
            />

            {/* Fuzzy match suggestions */}
            {fuzzyMatches.length > 0 && !selectedMaterialId && (
              <div className="mt-1 border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                <div className="px-3 py-1.5 bg-blue-50 border-b border-gray-200">
                  <span className="text-xs text-blue-700 font-medium">Did you mean?</span>
                </div>
                {fuzzyMatches.map((match, i) => {
                  const price = match.material.is_discounted && match.material.discount_price
                    ? match.material.discount_price
                    : match.material.base_price;
                  return (
                    <button
                      key={match.material.id}
                      onClick={() => handleSelectFuzzyMatch(match)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between text-sm border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <span className="font-medium text-gray-800">{match.material.name}</span>
                        <span className="ml-2 text-xs text-gray-400">{match.material.category}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-500">{match.material.unit}</span>
                        <span className="text-xs font-semibold text-gray-700">₹{price}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${i === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {Math.round(match.score * 100)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
                <button
                  onClick={() => setFuzzyMatches([])}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Keep "{editName}" as custom item
                </button>
              </div>
            )}

            {selectedMaterialId && (
              <div className="mt-1 flex items-center gap-1 text-xs text-green-700">
                <Check className="w-3.5 h-3.5" />
                <span>Matched to catalog material</span>
                <button onClick={() => setSelectedMaterialId(undefined)} className="ml-1 text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Other fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
              <input
                type="number"
                value={editQty}
                onChange={e => setEditQty(e.target.value)}
                placeholder="e.g. 10"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
              <input
                type="text"
                value={editUnit}
                onChange={e => setEditUnit(e.target.value)}
                placeholder="sq.ft"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                placeholder="e.g. 80"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                <input
                  type="number"
                  value={editWidth}
                  onChange={e => setEditWidth(e.target.value)}
                  placeholder="—"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                <input
                  type="number"
                  value={editHeight}
                  onChange={e => setEditHeight(e.target.value)}
                  placeholder="—"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Amount preview */}
          {editQty && editPrice && (
            <div className="flex justify-end">
              <div className="text-sm text-gray-600">
                Amount: <span className="font-semibold text-gray-900">
                  ₹{(parseFloat(editQty) * parseFloat(editPrice) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleReset}
              className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleAdd}
              disabled={!editName.trim() || addedFeedback}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                addedFeedback ? 'bg-green-500 text-white' : `${accent.btn}`
              }`}
            >
              {addedFeedback ? (
                <><Check className="w-4 h-4" /> Added!</>
              ) : (
                'Add Item'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Hint when no transcript yet */}
      {!voice.transcript && !parsed && voice.isSupported && (
        <p className="text-xs text-gray-400 text-center pb-1">
          Example: "Add 20 sq ft Italian marble at 250 rupees" or "10 bags cement 350 each"
        </p>
      )}
    </div>
  );
};

export default VoiceItemInput;
