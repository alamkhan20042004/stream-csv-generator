"use client";
import React, { useState, useEffect } from 'react';
import { Save, Copy, Plus, X, ChevronDown, ChevronUp, Clock, Folder, BrainCircuit, MessageSquareText, Zap, CloudUpload, CloudDownload, CheckCircle2, Link2, ListOrdered, Edit3, Trash2 } from 'lucide-react';

interface MasterUrlItem { id: string; name: string; url: string; }
interface OrderedSelectionItem { type: 'master' | 'manual'; id?: string; }
interface RowData { id: string; channelId: string; targetUrls: string; orderedSelections: OrderedSelectionItem[]; manualUrl: string; isManualUrlActive: boolean; targetServer: string; quality: string; duration: string; overrideTime: string; isExpanded: boolean; }

const PREDEFINED_QUALITIES = ['Original (1080p Max)', '1080p', '720p', '480p', '360p'];
const PREDEFINED_SERVERS = ['None', 'Server 1', 'Server 2', 'Server 3'];
const PREDEFINED_DURATIONS = ['1h', '2h', '3h', '4h', '5h', '10h', 'None'];

export default function CSVCreator() {
  const [masterUrls, setMasterUrls] = useState<MasterUrlItem[]>([]);
  const [newUrlName, setNewUrlName] = useState('');
  const [newUrlLink, setNewUrlLink] = useState('');
  const [rows, setRows] = useState<RowData[]>([createEmptyRow('1')]);
  const [masterTime, setMasterTime] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  const [aiInsertIndex, setAiInsertIndex] = useState<number>(1);
  const [syncKey, setSyncKey] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [pastedImages, setPastedImages] = useState<string[]>([]);
  const [customAIInstruction, setCustomAIInstruction] = useState('');

  useEffect(() => {
    const savedMasterUrls = localStorage.getItem('local_master_urls');
    if (savedMasterUrls) setMasterUrls(JSON.parse(savedMasterUrls));
  }, []);

  useEffect(() => {
    if (masterUrls.length > 0 || localStorage.getItem('local_master_urls') !== null) {
      localStorage.setItem('local_master_urls', JSON.stringify(masterUrls));
    }
  }, [masterUrls]);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => { if (reader.result) setPastedImages(prev => [...prev, reader.result as string]); };
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  function createEmptyRow(idStr: string): RowData {
    return { id: idStr, channelId: '', targetUrls: '', orderedSelections: [], manualUrl: '', isManualUrlActive: false, targetServer: 'None', quality: 'Original (1080p Max)', duration: '3h', overrideTime: '', isExpanded: true };
  }

  const compileTargetUrls = (rowOrderedSelections: OrderedSelectionItem[], rowManualUrl: string): string => {
    return rowOrderedSelections.map(item => {
        if (item.type === 'master') return masterUrls.find(m => m.id === item.id)?.url;
        else return rowManualUrl.trim() !== '' ? rowManualUrl.trim() : null;
      }).filter(Boolean).join(' | ');
  };

  const addRow = () => setRows([...rows, createEmptyRow(Date.now().toString())]);
  const removeRow = (id: string) => { setRows(rows.filter(r => r.id !== id)); setSelectedRows(selectedRows.filter(rowId => rowId !== id)); };
  const updateRow = (id: string, field: keyof RowData, value: any) => { setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r)); };

  const applyMasterTime = () => {
    if (!masterTime) return alert("Please select time first!");
    if (selectedRows.length === 0) return alert("Select rows below!");
    setRows(rows.map(r => selectedRows.includes(r.id) ? { ...r, overrideTime: masterTime } : r));
  };
  const handleRowSelect = (id: string) => {
    if (selectedRows.includes(id)) setSelectedRows(selectedRows.filter(rId => rId !== id));
    else setSelectedRows([...selectedRows, id]);
  };
  const toggleSelectAllRows = () => {
    if (selectedRows.length === rows.length) setSelectedRows([]);
    else setSelectedRows(rows.map(r => r.id));
  };

  const addMasterUrl = () => {
    if (!newUrlName || !newUrlLink) return alert("Fill Name and Link!");
    const newItem: MasterUrlItem = { id: Date.now().toString(), name: newUrlName.trim(), url: newUrlLink.trim().startsWith('http') ? newUrlLink.trim() : 'https://' + newUrlLink.trim() };
    setMasterUrls([...masterUrls, newItem]); setNewUrlName(''); setNewUrlLink('');
  };

  // 🌟 NAYA FEATURE: Master URL ko Edit Karna
  const editMasterUrl = (id: string) => {
    const target = masterUrls.find(m => m.id === id);
    if(target) {
        setNewUrlName(target.name);
        setNewUrlLink(target.url);
        removeMasterUrl(id);
    }
  };

  const removeMasterUrl = (id: string) => {
    setMasterUrls(masterUrls.filter(m => m.id !== id));
    setRows(rows.map(r => {
      const filteredSelections = r.orderedSelections.filter(item => !(item.type === 'master' && item.id === id));
      const compiled = compileTargetUrls(filteredSelections, r.manualUrl);
      return { ...r, orderedSelections: filteredSelections, targetUrls: compiled };
    }));
  };

  // 🌟 NAYA FEATURE: Master URLs ko clear karna
  const clearAllMasterUrls = () => {
      if(window.confirm("Are you sure you want to delete ALL Master URLs?")) {
          setMasterUrls([]);
          setRows(rows.map(r => ({ ...r, orderedSelections: r.orderedSelections.filter(sel => sel.type !== 'master'), targetUrls: compileTargetUrls(r.orderedSelections.filter(sel => sel.type !== 'master'), r.manualUrl) })));
      }
  };

  // 🌟 NAYA FEATURE: Saari Rows Clear Karna
  const clearAllRows = () => {
      if(window.confirm("Are you sure you want to completely clear the screen? All unsaved rows will be lost!")) {
          setRows([createEmptyRow(Date.now().toString())]);
          setSelectedRows([]);
      }
  };

  const handleUrlCheckboxChange = (rowId: string, selectionItem: OrderedSelectionItem) => {
    setRows(rows.map(r => {
      if (r.id !== rowId) return r;
      let nextSelections = [...r.orderedSelections];
      const existingIndex = nextSelections.findIndex(item => item.type === selectionItem.type && (item.type === 'manual' || item.id === selectionItem.id));
      if (existingIndex !== -1) { nextSelections.splice(existingIndex, 1); if (selectionItem.type === 'manual') r.isManualUrlActive = false; } 
      else { nextSelections.push(selectionItem); if (selectionItem.type === 'manual') r.isManualUrlActive = true; }
      return { ...r, orderedSelections: nextSelections, targetUrls: compileTargetUrls(nextSelections, r.manualUrl) };
    }));
  };

  const handleManualUrlTextChange = (rowId: string, text: string) => { setRows(rows.map(r => { if (r.id !== rowId) return r; return { ...r, manualUrl: text, targetUrls: compileTargetUrls(r.orderedSelections, text) }; })); };
  const removeImage = (indexToRemove: number) => {setPastedImages(pastedImages.filter((_, idx) => idx !== indexToRemove));};

  const executeAIExtraction = async () => {
    if (pastedImages.length === 0) return alert("Paste image first.");
    setIsProcessingAI(true);
    try {
      const res = await fetch('/api/extract', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imagesBase64: pastedImages, customDate: masterTime, customPrompt: customAIInstruction }) });
      const resData = await res.json();
      if (resData.success && Array.isArray(resData.data)) {
         const newAiRows = resData.data.map((aiRow: any, index: number) => ({ id: Date.now().toString() + index, channelId: aiRow.channelId || '', targetUrls: '', orderedSelections: [], manualUrl: '', isManualUrlActive: false, targetServer: aiRow.targetServer || 'None', quality: aiRow.quality || 'Original (1080p Max)', duration: aiRow.duration || '3h', overrideTime: aiRow.overrideTime || '', isExpanded: true }));
         const updatedRows = [...rows]; const insertPosition = Math.max(0, Math.min(aiInsertIndex - 1, updatedRows.length)); updatedRows.splice(insertPosition, 0, ...newAiRows);
         setRows(updatedRows); setPastedImages([]); setAiInsertIndex(insertPosition + newAiRows.length + 1); alert(`✅ AI Data inserted Row #${insertPosition + 1}!`);
      } else {alert(`❌ AI Error: ${resData.error}`);}
    } catch (err: any) {alert(`❌ System Error: ${err.message}`);} finally {setIsProcessingAI(false);}
  };

  // 🌟 NAYA FEATURE: Cloud Delete Action Add kiya gaya hai
  const syncToCloud = async (action: 'save' | 'load' | 'delete') => {
    if (!syncKey) return alert("Enter Sync Key!");
    
    if(action === 'delete') {
        const confirmDelete = window.confirm(`WARNING! Are you sure you want to PERMANENTLY DELETE all cloud data for the Sync Key "${syncKey}"?`);
        if(!confirmDelete) return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch('/api/cloud', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, syncKey, data: { rows, masterUrls } }) });
      const resData = await res.json();
      if (resData.success) {
        if (action === 'load') {
          if (resData.data && resData.data.rows) { setRows(resData.data.rows); setMasterUrls(resData.data.masterUrls || []); alert("✅ Sync Success!"); } 
          else { alert("⚠️ No data found for this Sync Key on the cloud."); }
        } else if (action === 'save') { alert("✅ Vercel Cloud backup locked!"); }
        else if (action === 'delete') { alert("🗑️ Cloud Data Deleted Successfully!"); }
      } else {alert(`❌ Sync Error: ${resData.error}`);}
    } catch (err: any) {alert(`❌ Network Error: ${err.message}`);} finally {setIsSyncing(false);}
  };

  const formatDateTimeAMPM = (timeStr: string) => {
    if (!timeStr) return ''; const [datePart, timePart] = timeStr.split('T'); if (!timePart) return timeStr;
    let [hours, minutes] = timePart.split(':'); let h = parseInt(hours, 10); const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${datePart} ${h}:${minutes} ${ampm}`;
  };

  const generateCSV = () => {
    const header = "TargetURL,Channel,Quality,Server,StartTime,Duration\n";
    const csvContent = rows.map(r => `${r.targetUrls},${r.channelId},${r.quality},${r.targetServer},${formatDateTimeAMPM(r.overrideTime)},${r.duration}`).join("\n");
    navigator.clipboard.writeText(header + csvContent); alert("✅ CSV Format Copied!");
  };
  const openCalendar = (e: React.MouseEvent<HTMLInputElement>) => {try {if (typeof e.currentTarget.showPicker === 'function') {e.currentTarget.showPicker();}} catch (err) {}};

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-gray-200 p-6 font-sans">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-800 pb-4 gap-4">
        <div><h1 className="text-3xl font-bold text-white flex items-center gap-2">📄 Create CSV Records</h1><p className="text-gray-500 text-sm mt-1">Manual filling, Cloud Sync & AI auto-population</p></div>
        <div className="flex items-center gap-2 bg-[#12121A] p-2 rounded-lg border border-gray-800 shadow-md flex-wrap">
          <input type="text" placeholder="Enter Sync Key..." className="bg-[#0A0A0C] border border-gray-700 rounded-md p-2 text-white outline-none focus:border-[#5842ff] w-36 text-sm font-mono" value={syncKey} onChange={(e) => setSyncKey(e.target.value)} />
          <button onClick={() => syncToCloud('save')} disabled={isSyncing} className="flex items-center gap-1 px-3 py-2 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition text-sm font-semibold"><CloudUpload size={16} /> Save</button>
          <button onClick={() => syncToCloud('load')} disabled={isSyncing} className="flex items-center gap-1 px-3 py-2 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 transition text-sm font-semibold"><CloudDownload size={16} /> Load</button>
          <button onClick={() => syncToCloud('delete')} disabled={isSyncing} className="flex items-center gap-1 px-3 py-2 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition text-sm font-semibold" title="Delete Cloud Profile"><Trash2 size={16} /> Delete</button>
        </div>
      </div>

      <div className="bg-[#12121A] p-5 rounded-xl border border-gray-800 mb-6 shadow-md">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Link2 size={16} className="text-[#5842ff]" /> Master Target URLs Controller</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
          <div><label className="block text-xs text-gray-500 mb-1">Individual Name (Alias)</label><input type="text" placeholder="e.g. Server 1" className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-sm text-white outline-none focus:border-[#5842ff]" value={newUrlName} onChange={(e) => setNewUrlName(e.target.value)} /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Actual URL Link</label><input type="text" placeholder="https://link.pk/..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-sm text-white outline-none focus:border-[#5842ff]" value={newUrlLink} onChange={(e) => setNewUrlLink(e.target.value)} /></div>
          <button onClick={addMasterUrl} className="py-2 px-4 bg-[#5842ff] hover:bg-[#4635d8] text-white font-bold rounded text-sm transition flex items-center justify-center gap-1"><Plus size={16} /> Register URL</button>
        </div>
        <div className="flex flex-wrap gap-3 mt-2 items-center">
          {masterUrls.map((m) => (
            <div key={m.id} className="flex items-center gap-2 bg-[#1A1A24] border border-gray-700 px-3 py-1.5 rounded-lg text-xs group">
              <span className="text-gray-400 font-semibold">{m.name}:</span>
              <span className="text-blue-400 truncate w-32 block">{m.url}</span>
              <div className="flex items-center gap-1 ml-1 opacity-50 group-hover:opacity-100 transition">
                <button onClick={() => editMasterUrl(m.id)} className="text-[#5842ff] hover:text-white transition" title="Edit URL"><Edit3 size={14} /></button>
                <button onClick={() => removeMasterUrl(m.id)} className="text-red-500 hover:text-white transition" title="Delete URL"><X size={14} /></button>
              </div>
            </div>
          ))}
          {masterUrls.length > 0 && <button onClick={clearAllMasterUrls} className="text-xs font-semibold text-red-500/70 hover:text-red-500 hover:underline ml-2 transition">Clear All URLs</button>}
        </div>
      </div>

      <div className="mb-6 p-6 rounded-xl border border-gray-800 bg-[#12121A] relative overflow-hidden shadow-lg">
        {isProcessingAI && (<div className="absolute inset-0 bg-[#0A0A0C]/90 backdrop-blur-md flex flex-col items-center justify-center z-20"><div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-4 border border-gray-700"><div className="h-full bg-gradient-to-r from-blue-500 via-[#5842ff] to-purple-500 animate-[pulse_1s_ease-in-out_infinite] w-full origin-left scale-x-100"></div></div><div className="flex items-center gap-3"><BrainCircuit size={24} className="text-[#5842ff] animate-bounce" /><span className="font-bold text-white tracking-widest uppercase text-sm">Extracting Neural Data...</span></div></div>)}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#5842ff]/40 rounded-xl bg-[#1A1A24]/50 hover:bg-[#1A1A24] transition"><BrainCircuit size={40} className="text-[#5842ff] mb-3" /><h2 className="text-xl font-bold text-white mb-1">Paste Images Here</h2><p className="text-gray-400 text-sm text-center">Press <kbd className="bg-gray-800 px-2 py-1 rounded text-white font-mono">Ctrl + V</kbd></p>{pastedImages.length > 0 && <span className="mt-3 text-xs font-semibold px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full">{pastedImages.length} Image(s) Queued</span>}</div>
          <div className="flex-1 flex flex-col gap-4 justify-center"><div className="flex gap-4"><div className="flex-1"><label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2">Custom AI Instructions</label><input type="text" placeholder="e.g., Only extract semi-finals..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#5842ff] text-sm" value={customAIInstruction} onChange={(e) => setCustomAIInstruction(e.target.value)} /></div><div className="w-1/4"><label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2">Start Row</label><input type="number" min="1" className="w-full bg-[#0A0A0C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#5842ff] text-sm text-center font-bold" value={aiInsertIndex} onChange={(e) => setAiInsertIndex(Number(e.target.value))} /></div></div><button onClick={executeAIExtraction} disabled={pastedImages.length === 0} className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-bold transition shadow-lg ${pastedImages.length > 0 ? 'bg-gradient-to-r from-[#5842ff] to-purple-600 text-white hover:scale-[1.02] cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}><Zap size={18} /> EXTRACT WITH AI</button></div>
        </div>
        {pastedImages.length > 0 && (<div className="mt-6 pt-6 border-t border-gray-800 flex flex-wrap gap-4">{pastedImages.map((imgSrc, idx) => (<div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-700 group"><img src={imgSrc} alt="pasted" className="w-full h-full object-cover opacity-70" /><button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><X size={12} /></button></div>))}</div>)}
      </div>

      <div className="bg-[#12121A] p-5 rounded-xl border border-[#5842ff]/30 mb-6 flex flex-col md:flex-row gap-6 items-start shadow-md">
        <div className="w-full md:w-1/3"><label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2"><Clock size={16} /> Master Time Calendar</label><input type="datetime-local" className="w-full bg-[#0A0A0C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#5842ff] [color-scheme:dark] cursor-pointer" value={masterTime} onChange={(e) => setMasterTime(e.target.value)} onClick={openCalendar} /><p className="text-xs text-gray-500 mt-2">Click anywhere to open calendar.</p></div>
        <div className="w-full md:w-2/3"><div className="flex justify-between items-center mb-3"><label className="text-sm font-semibold text-gray-400 block">Bulk Apply Master Time to rows below:</label><div className="flex gap-2"><button onClick={toggleSelectAllRows} className="bg-[#1A1A24] border border-gray-700 hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold transition">Toggle All</button><button onClick={applyMasterTime} className="bg-[#5842ff] hover:bg-[#4635d8] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-lg">Apply to Selected</button></div></div>
          <div className="flex flex-wrap gap-3">
            {rows.map((row, idx) => {
               const isChecked = selectedRows.includes(row.id);
               return (<label key={row.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition select-none ${isChecked ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-[#0A0A0C] border-gray-700 text-gray-500 hover:border-gray-500'}`}><input type="checkbox" className="hidden" checked={isChecked} onChange={() => handleRowSelect(row.id)} /><div className={`w-3 h-3 rounded flex items-center justify-center border ${isChecked ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>{isChecked && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2"><polyline points="20 6 9 17 4 12"></polyline></svg>}</div>Row #{idx + 1}</label>);
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-24">
        {rows.map((row, index) => {
          const hasTime = row.overrideTime && row.overrideTime.trim() !== '';
          const isCompleted = hasTime && masterTime !== '' && row.overrideTime !== masterTime;
          const isCurrentActive = hasTime && row.overrideTime === masterTime;
          let borderClass = 'border-gray-800'; let bgClass = 'bg-[#161620]';
          if (isCompleted) { borderClass = 'border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]'; bgClass = 'bg-green-500/5'; } else if (isCurrentActive) { borderClass = 'border-[#5842ff]/50'; }

          return (
            <div key={row.id} className={`bg-[#12121A] rounded-xl border ${borderClass} overflow-hidden transition-all shadow-md`}>
              <div className={`flex items-center justify-between p-4 ${bgClass} cursor-pointer`} onClick={() => updateRow(row.id, 'isExpanded', !row.isExpanded)}>
                <div className="flex items-center gap-4 flex-wrap"><span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-bold w-20 text-center">Row #{index + 1}</span>{isCompleted && <span className="flex items-center gap-1 text-green-500 text-xs font-bold"><CheckCircle2 size={14}/> Done</span>}{!row.isExpanded && (<div className="text-sm text-gray-400 flex gap-4 ml-4 items-center"><span className="text-white font-medium">{row.channelId || 'No Channel'}</span><span className="truncate w-48 block text-xs text-gray-500">{row.targetUrls || 'No Links Selected'}</span><span className={`${isCompleted ? 'text-green-500' : 'text-[#5842ff]'} flex items-center gap-1`}><Clock size={14} /> {formatDateTimeAMPM(row.overrideTime) || 'No Time'}</span></div>)}</div>
                <div className="flex items-center gap-3"><button onClick={(e) => { e.stopPropagation(); removeRow(row.id); }} className="p-1.5 text-gray-500 hover:text-red-500 rounded"><X size={18} /></button>{row.isExpanded ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}</div>
              </div>
              {row.isExpanded && (
                <div className="p-5 space-y-5">
                  <div className="bg-[#0A0A0C] p-4 rounded-lg border border-gray-800 shadow-inner">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider"><ListOrdered size={14} className="text-[#5842ff]" /> Build Final Target URL String</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div className="border-r border-gray-800/50 pr-5"><p className="text-[11px] text-gray-600 mb-3 font-semibold">Predefined Master List:</p>{masterUrls.length === 0 ? (<p className="text-xs text-gray-700 italic">Add master URLs globally first.</p>) : (<div className="flex flex-wrap gap-3">{masterUrls.map((urlItem) => {const priorityIndex = row.orderedSelections.findIndex(item => item.type === 'master' && item.id === urlItem.id); const isChecked = priorityIndex !== -1; return (<label key={urlItem.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition select-none ${isChecked ? 'bg-[#5842ff]/10 border-[#5842ff] text-white' : 'bg-[#12121A] border-gray-800 text-gray-400 hover:border-gray-700'}`}><input type="checkbox" className="hidden" checked={isChecked} onChange={() => handleUrlCheckboxChange(row.id, {type: 'master', id: urlItem.id})} />{isChecked && <span className="w-5 h-5 flex items-center justify-center bg-[#5842ff] text-white rounded-full text-[10px] font-black animate-scaleIn">{priorityIndex + 1}</span>}<div className="flex flex-col text-left"><span className="text-xs font-bold">{urlItem.name}</span><span className="text-[10px] text-gray-600 truncate w-28">{urlItem.url}</span></div></label>);})}</div>)}</div><div className="flex flex-col gap-3"><p className="text-[11px] text-gray-600 font-semibold">Row-Specific Manual Link:</p><div className="flex gap-2 items-center"><input type="text" placeholder="https://custom.link/for/this/row" className="flex-1 bg-[#12121A] border border-gray-700 rounded p-2 text-sm text-white outline-none focus:border-[#5842ff] font-mono text-xs" value={row.manualUrl} onChange={(e) => handleManualUrlTextChange(row.id, e.target.value)} />{(() => {const priorityIndexManual = row.orderedSelections.findIndex(item => item.type === 'manual'); const isManualChecked = priorityIndexManual !== -1; return (<label className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition select-none ${isManualChecked ? 'bg-[#5842ff]/10 border-[#5842ff] text-white' : 'bg-[#12121A] border-gray-800 text-gray-500'}`}><input type="checkbox" className="hidden" checked={isManualChecked} onChange={() => handleUrlCheckboxChange(row.id, {type: 'manual'})} disabled={row.manualUrl.trim() === ''}/>{isManualChecked && <span className="w-5 h-5 flex items-center justify-center bg-[#5842ff] text-white rounded-full text-[10px] font-black">{priorityIndexManual + 1}</span>}<span className={`text-xs font-bold ${row.manualUrl.trim() === '' ? 'text-gray-700' : ''}`}>Active?</span></label>);})()}</div>{row.manualUrl.trim() === '' && <p className="text-[10px] text-red-700 italic mt-1">* Type a URL in box first to activate priority selection.</p>}</div></div>
                    {row.targetUrls && (<div className="mt-4 text-[11px] text-gray-500 bg-[#12121A] p-2 rounded border border-gray-800/40 truncate shadow-inner"><strong className="text-[#5842ff]">Final TargetURL Compiled String (Whichever clicked first):</strong> {row.targetUrls}</div>)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-gray-800/50"><div><label className="block text-xs font-semibold text-gray-500 mb-1">Channel ID</label><input type="text" className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.channelId} onChange={(e) => updateRow(row.id, 'channelId', e.target.value)} /></div><div><label className="block text-xs font-semibold text-gray-500 mb-1">Override Time</label><input type="datetime-local" className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] [color-scheme:dark] cursor-pointer" value={row.overrideTime} onChange={(e) => updateRow(row.id, 'overrideTime', e.target.value)} onClick={openCalendar} /></div><div><label className="block text-xs font-semibold text-gray-500 mb-1">Target Server</label><div className="flex gap-2"><select className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] cursor-pointer" value={PREDEFINED_SERVERS.includes(row.targetServer) ? row.targetServer : 'Custom'} onChange={(e) => updateRow(row.id, 'targetServer', e.target.value === 'Custom' ? 'Custom Server' : e.target.value)}>{PREDEFINED_SERVERS.map(s => <option key={s} value={s}>{s}</option>)}<option value="Custom">Custom...</option></select>{!PREDEFINED_SERVERS.includes(row.targetServer) && <input type="text" placeholder="Type..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.targetServer === 'Custom Server' ? '' : row.targetServer} onChange={(e) => updateRow(row.id, 'targetServer', e.target.value)} />}</div></div><div><label className="block text-xs font-semibold text-gray-500 mb-1">Speed / Quality</label><div className="flex gap-2"><select className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] cursor-pointer" value={PREDEFINED_QUALITIES.includes(row.quality) ? row.quality : 'Custom'} onChange={(e) => updateRow(row.id, 'quality', e.target.value === 'Custom' ? 'Custom Quality' : e.target.value)}>{PREDEFINED_QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}<option value="Custom">Custom...</option></select>{!PREDEFINED_QUALITIES.includes(row.quality) && <input type="text" placeholder="Type..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.quality === 'Custom Quality' ? '' : row.quality} onChange={(e) => updateRow(row.id, 'quality', e.target.value)} />}</div></div><div><label className="block text-xs font-semibold text-gray-500 mb-1">Duration</label><div className="flex gap-2"><select className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] cursor-pointer" value={PREDEFINED_DURATIONS.includes(row.duration) ? row.duration : 'Custom'} onChange={(e) => updateRow(row.id, 'duration', e.target.value === 'Custom' ? 'Custom Duration' : e.target.value)}>{PREDEFINED_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}<option value="Custom">Custom...</option></select>{!PREDEFINED_DURATIONS.includes(row.duration) && <input type="text" placeholder="Type..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.duration === 'Custom Duration' ? '' : row.duration} onChange={(e) => updateRow(row.id, 'duration', e.target.value)} />}</div></div></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-[#0A0A0C]/95 backdrop-blur-md border-t border-gray-800 p-4 flex flex-col sm:flex-row justify-between items-center px-6 z-50 gap-4">
        <div className="flex gap-3">
            <button onClick={addRow} className="flex items-center gap-2 px-5 py-2.5 bg-[#12121A] border border-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 transition"><Plus size={18} /> Add Empty Row</button>
            <button onClick={clearAllRows} className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/20 transition"><Trash2 size={18} /> Clear All Rows</button>
        </div>
        <button onClick={generateCSV} className="flex items-center gap-2 px-6 py-2.5 bg-[#5842ff] hover:bg-[#4635d8] text-white font-medium rounded-lg transition shadow-[0_0_15px_rgba(88,66,255,0.4)]"><Copy size={18} /> Generate & Copy CSV</button>
      </div>

    </div>
  );
}












// ===== 1

// "use client";
// import React, { useState, useEffect } from 'react';
// import { Save, Copy, Plus, X, ChevronDown, ChevronUp, Clock, Folder, BrainCircuit, MessageSquareText, Zap, CloudUpload, CloudDownload, CheckCircle2, Link2, ListOrdered } from 'lucide-react';

// interface MasterUrlItem {
//   id: string;
//   name: string;
//   url: string;
// }

// interface OrderedSelectionItem {
//   type: 'master' | 'manual';
//   id?: string; 
// }

// interface RowData {
//   id: string;
//   channelId: string;
//   targetUrls: string; 
//   orderedSelections: OrderedSelectionItem[]; 
//   manualUrl: string; 
//   isManualUrlActive: boolean; 
//   targetServer: string;
//   quality: string;
//   duration: string;
//   overrideTime: string;
//   isExpanded: boolean;
// }

// const PREDEFINED_QUALITIES = ['Original (1080p Max)', '1080p', '720p', '480p', '360p'];
// const PREDEFINED_SERVERS = ['None', 'Server 1', 'Server 2', 'Server 3'];
// const PREDEFINED_DURATIONS = ['1h', '2h', '3h', '4h', '5h', '10h', 'None'];

// export default function CSVCreator() {
//   // 🌟 FIX: Removed hardcoded persistence. Now starts empty, waits for local storage.
//   const [masterUrls, setMasterUrls] = useState<MasterUrlItem[]>([]);
  
//   const [newUrlName, setNewUrlName] = useState('');
//   const [newUrlLink, setNewUrlLink] = useState('');

//   const [rows, setRows] = useState<RowData[]>([createEmptyRow('1')]);
//   const [masterTime, setMasterTime] = useState('');
//   const [selectedRows, setSelectedRows] = useState<string[]>([]);
//   const [savedConfigs, setSavedConfigs] = useState<{name: string, data: RowData[]}[]>([]);
  
//   const [aiInsertIndex, setAiInsertIndex] = useState<number>(1);
//   const [syncKey, setSyncKey] = useState<string>('');
//   const [isSyncing, setIsSyncing] = useState(false);
  
//   const [isProcessingAI, setIsProcessingAI] = useState(false);
//   const [pastedImages, setPastedImages] = useState<string[]>([]);
//   const [customAIInstruction, setCustomAIInstruction] = useState('');

//   // 🌟 MOUNT EFFECT: Load everything from local storage
//   useEffect(() => {
//     // Load rows configs
//     const configs = localStorage.getItem('stream_configs');
//     if (configs) setSavedConfigs(JSON.parse(configs));

//     // Load Master URLs
//     const savedMasterUrls = localStorage.getItem('local_master_urls');
//     if (savedMasterUrls) {
//       setMasterUrls(JSON.parse(savedMasterUrls));
//     } else {
//       // First time visitors default list (Once deleted, won't come back)
//       setMasterUrls([
//         { id: 'm1', name: 'DLHD Main', url: 'https://dlhd.pk/watch.php?id=54' },
//         { id: 'm2', name: 'DLHD Backup', url: 'https://dlhd.pk/watch.php?id=111' },
//         { id: 'm3', name: 'Streamed PK', url: 'https://streamed.pk/watch/admin/3' }
//       ]);
//     }
//   }, []);

//   // 🌟 AUTO-SAVE EFFECT: Save Master URLs whenever they are added or deleted
//   useEffect(() => {
//     if (masterUrls.length > 0 || localStorage.getItem('local_master_urls') !== null) {
//       localStorage.setItem('local_master_urls', JSON.stringify(masterUrls));
//     }
//   }, [masterUrls]);

//   // Image Paste Listener
//   useEffect(() => {
//     const handlePaste = async (e: ClipboardEvent) => {
//       const items = e.clipboardData?.items;
//       if (!items) return;
//       for (const item of items) {
//         if (item.type.indexOf('image') !== -1) {
//           const file = item.getAsFile();
//           if (file) {
//             const reader = new FileReader();
//             reader.readAsDataURL(file);
//             reader.onloadend = () => {
//               if (reader.result) setPastedImages(prev => [...prev, reader.result as string]);
//             };
//           }
//         }
//       }
//     };
//     window.addEventListener('paste', handlePaste);
//     return () => window.removeEventListener('paste', handlePaste);
//   }, []);

//   function createEmptyRow(idStr: string): RowData {
//     return {
//       id: idStr,
//       channelId: '', targetUrls: '', 
//       orderedSelections: [], manualUrl: '', isManualUrlActive: false,
//       targetServer: 'None', quality: 'Original (1080p Max)', duration: '3h', overrideTime: '', isExpanded: true
//     };
//   }

//   const compileTargetUrls = (rowOrderedSelections: OrderedSelectionItem[], rowManualUrl: string): string => {
//     return rowOrderedSelections
//       .map(item => {
//         if (item.type === 'master') {
//           return masterUrls.find(m => m.id === item.id)?.url;
//         } else {
//           return rowManualUrl.trim() !== '' ? rowManualUrl.trim() : null;
//         }
//       })
//       .filter(Boolean) 
//       .join(' | ');
//   };

//   const addRow = () => setRows([...rows, createEmptyRow(Date.now().toString())]);
//   const removeRow = (id: string) => {
//     setRows(rows.filter(r => r.id !== id));
//     setSelectedRows(selectedRows.filter(rowId => rowId !== id));
//   };
//   const updateRow = (id: string, field: keyof RowData, value: any) => {
//     setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
//   };

//   const applyMasterTime = () => {
//     if (!masterTime) return alert("Please select time first!");
//     if (selectedRows.length === 0) return alert("Select rows below!");
//     setRows(rows.map(r => selectedRows.includes(r.id) ? { ...r, overrideTime: masterTime } : r));
//   };
//   const handleRowSelect = (id: string) => {
//     if (selectedRows.includes(id)) setSelectedRows(selectedRows.filter(rId => rId !== id));
//     else setSelectedRows([...selectedRows, id]);
//   };
//   const toggleSelectAllRows = () => {
//     if (selectedRows.length === rows.length) setSelectedRows([]);
//     else setSelectedRows(rows.map(r => r.id));
//   };

//   const addMasterUrl = () => {
//     if (!newUrlName || !newUrlLink) return alert("Fill Name and Link!");
//     const newItem: MasterUrlItem = {
//       id: Date.now().toString(),
//       name: newUrlName.trim(),
//       url: newUrlLink.trim().startsWith('http') ? newUrlLink.trim() : 'https://' + newUrlLink.trim()
//     };
//     setMasterUrls([...masterUrls, newItem]);
//     setNewUrlName('');
//     setNewUrlLink('');
//   };

//   const removeMasterUrl = (id: string) => {
//     setMasterUrls(masterUrls.filter(m => m.id !== id));
//     setRows(rows.map(r => {
//       const filteredSelections = r.orderedSelections.filter(item => !(item.type === 'master' && item.id === id));
//       const compiled = compileTargetUrls(filteredSelections, r.manualUrl);
//       return { ...r, orderedSelections: filteredSelections, targetUrls: compiled };
//     }));
//   };

//   const handleUrlCheckboxChange = (rowId: string, selectionItem: OrderedSelectionItem) => {
//     setRows(rows.map(r => {
//       if (r.id !== rowId) return r;
//       let nextSelections = [...r.orderedSelections];
//       const existingIndex = nextSelections.findIndex(item => 
//         item.type === selectionItem.type && (item.type === 'manual' || item.id === selectionItem.id)
//       );

//       if (existingIndex !== -1) {
//         nextSelections.splice(existingIndex, 1);
//         if (selectionItem.type === 'manual') r.isManualUrlActive = false;
//       } else {
//         nextSelections.push(selectionItem);
//         if (selectionItem.type === 'manual') r.isManualUrlActive = true;
//       }

//       const compiledUrls = compileTargetUrls(nextSelections, r.manualUrl);
//       return { ...r, orderedSelections: nextSelections, targetUrls: compiledUrls };
//     }));
//   };

//   const handleManualUrlTextChange = (rowId: string, text: string) => {
//     setRows(rows.map(r => {
//       if (r.id !== rowId) return r;
//       const compiledUrls = compileTargetUrls(r.orderedSelections, text);
//       return { ...r, manualUrl: text, targetUrls: compiledUrls };
//     }));
//   };

//   const removeImage = (indexToRemove: number) => {setPastedImages(pastedImages.filter((_, idx) => idx !== indexToRemove));};

//   const executeAIExtraction = async () => {
//     if (pastedImages.length === 0) return alert("Paste image first.");
//     setIsProcessingAI(true);
//     try {
//       const res = await fetch('/api/extract', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ imagesBase64: pastedImages, customDate: masterTime, customPrompt: customAIInstruction })
//       });
//       const resData = await res.json();
//       if (resData.success && Array.isArray(resData.data)) {
//          const newAiRows = resData.data.map((aiRow: any, index: number) => ({
//            id: Date.now().toString() + index,
//            channelId: aiRow.channelId || '',
//            targetUrls: '', orderedSelections: [], manualUrl: '', isManualUrlActive: false,
//            targetServer: aiRow.targetServer || 'None', quality: aiRow.quality || 'Original (1080p Max)', duration: aiRow.duration || '3h', overrideTime: aiRow.overrideTime || '', isExpanded: true
//          }));
//          const updatedRows = [...rows];
//          const insertPosition = Math.max(0, Math.min(aiInsertIndex - 1, updatedRows.length));
//          updatedRows.splice(insertPosition, 0, ...newAiRows);
//          setRows(updatedRows);
//          setPastedImages([]); 
//          setAiInsertIndex(insertPosition + newAiRows.length + 1);
//          alert(`✅ AI Data inserted Row #${insertPosition + 1}!`);
//       } else {alert(`❌ AI Error: ${resData.error}`);}
//     } catch (err: any) {alert(`❌ System Error: ${err.message}`);} finally {setIsProcessingAI(false);}
//   };

//   const syncToCloud = async (action: 'save' | 'load') => {
//     if (!syncKey) return alert("Enter Sync Key!");
//     setIsSyncing(true);
//     try {
//       const res = await fetch('/api/cloud', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ action, syncKey, data: { rows, masterUrls } })
//       });
//       const resData = await res.json();
//       if (resData.success) {
//         if (action === 'load') {
//           if (resData.data && resData.data.rows) { setRows(resData.data.rows); setMasterUrls(resData.data.masterUrls || []); }
//           alert("✅ Sync Success!");
//         } else { alert("✅ Vercel Cloud backup locked!"); }
//       } else {alert(`❌ Sync Error: ${resData.error}`);}
//     } catch (err: any) {alert(`❌ Network Error: ${err.message}`);} finally {setIsSyncing(false);}
//   };

//   const formatDateTimeAMPM = (timeStr: string) => {
//     if (!timeStr) return '';
//     const [datePart, timePart] = timeStr.split('T');
//     if (!timePart) return timeStr;
//     let [hours, minutes] = timePart.split(':');
//     let h = parseInt(hours, 10);
//     const ampm = h >= 12 ? 'PM' : 'AM';
//     h = h % 12 || 12; 
//     return `${datePart} ${h}:${minutes} ${ampm}`;
//   };

//   const generateCSV = () => {
//     const header = "TargetURL,Channel,Quality,Server,StartTime,Duration\n";
//     const csvContent = rows.map(r => `${r.targetUrls},${r.channelId},${r.quality},${r.targetServer},${formatDateTimeAMPM(r.overrideTime)},${r.duration}`).join("\n");
//     navigator.clipboard.writeText(header + csvContent);
//     alert("✅ CSV Format Copied!");
//   };
//   const openCalendar = (e: React.MouseEvent<HTMLInputElement>) => {try {if (typeof e.currentTarget.showPicker === 'function') {e.currentTarget.showPicker();}} catch (err) {}};

//   return (
//     <div className="min-h-screen bg-[#0A0A0C] text-gray-200 p-6 font-sans">
      
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-800 pb-4 gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-white flex items-center gap-2">📄 Create CSV Records</h1>
//           <p className="text-gray-500 text-sm mt-1">Manual filling, Cloud Sync & AI auto-population</p>
//         </div>
//         <div className="flex items-center gap-3 bg-[#12121A] p-2 rounded-lg border border-gray-800 shadow-md">
//           <input type="text" placeholder="Enter Sync Key..." className="bg-[#0A0A0C] border border-gray-700 rounded-md p-2 text-white outline-none focus:border-[#5842ff] w-44 text-sm font-mono" value={syncKey} onChange={(e) => setSyncKey(e.target.value)} />
//           <button onClick={() => syncToCloud('save')} disabled={isSyncing} className="flex items-center gap-1 px-3 py-2 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition text-sm font-semibold"><CloudUpload size={16} /> Save Data</button>
//           <button onClick={() => syncToCloud('load')} disabled={isSyncing} className="flex items-center gap-1 px-3 py-2 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 transition text-sm font-semibold"><CloudDownload size={16} /> Load Data</button>
//         </div>
//       </div>

//       <div className="bg-[#12121A] p-5 rounded-xl border border-gray-800 mb-6 shadow-md">
//         <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Link2 size={16} className="text-[#5842ff]" /> Master Target URLs Controller</h3>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
//           <div>
//             <label className="block text-xs text-gray-500 mb-1">Individual Name (Alias)</label>
//             <input type="text" placeholder="e.g. Server 1" className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-sm text-white outline-none focus:border-[#5842ff]" value={newUrlName} onChange={(e) => setNewUrlName(e.target.value)} />
//           </div>
//           <div>
//             <label className="block text-xs text-gray-500 mb-1">Actual URL Link</label>
//             <input type="text" placeholder="https://link.pk/..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-sm text-white outline-none focus:border-[#5842ff]" value={newUrlLink} onChange={(e) => setNewUrlLink(e.target.value)} />
//           </div>
//           <button onClick={addMasterUrl} className="py-2 px-4 bg-[#5842ff] hover:bg-[#4635d8] text-white font-bold rounded text-sm transition flex items-center justify-center gap-1"><Plus size={16} /> Register URL</button>
//         </div>
//         <div className="flex flex-wrap gap-3 mt-2">
//           {masterUrls.map((m) => (
//             <div key={m.id} className="flex items-center gap-2 bg-[#1A1A24] border border-gray-700 px-3 py-1.5 rounded-lg text-xs">
//               <span className="text-gray-400 font-semibold">{m.name}:</span>
//               <span className="text-blue-400 truncate w-40 block">{m.url}</span>
//               <button onClick={() => removeMasterUrl(m.id)} className="text-gray-500 hover:text-red-500 transition ml-1"><X size={14} /></button>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="mb-6 p-6 rounded-xl border border-gray-800 bg-[#12121A] relative overflow-hidden shadow-lg">
//         {isProcessingAI && (<div className="absolute inset-0 bg-[#0A0A0C]/90 backdrop-blur-md flex flex-col items-center justify-center z-20"><div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-4 border border-gray-700"><div className="h-full bg-gradient-to-r from-blue-500 via-[#5842ff] to-purple-500 animate-[pulse_1s_ease-in-out_infinite] w-full origin-left scale-x-100"></div></div><div className="flex items-center gap-3"><BrainCircuit size={24} className="text-[#5842ff] animate-bounce" /><span className="font-bold text-white tracking-widest uppercase text-sm">Extracting Neural Data...</span></div></div>)}
//         <div className="flex flex-col md:flex-row gap-6">
//           <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#5842ff]/40 rounded-xl bg-[#1A1A24]/50 hover:bg-[#1A1A24] transition">
//             <BrainCircuit size={40} className="text-[#5842ff] mb-3" /><h2 className="text-xl font-bold text-white mb-1">Paste Images Here</h2><p className="text-gray-400 text-sm text-center">Press <kbd className="bg-gray-800 px-2 py-1 rounded text-white font-mono">Ctrl + V</kbd></p>
//             {pastedImages.length > 0 && <span className="mt-3 text-xs font-semibold px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full">{pastedImages.length} Image(s) Queued</span>}
//           </div>
//           <div className="flex-1 flex flex-col gap-4 justify-center">
//             <div className="flex gap-4"><div className="flex-1"><label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2">Custom AI Instructions</label><input type="text" placeholder="e.g., Only extract semi-finals..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#5842ff] text-sm" value={customAIInstruction} onChange={(e) => setCustomAIInstruction(e.target.value)} /></div><div className="w-1/4"><label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2">Start Row</label><input type="number" min="1" className="w-full bg-[#0A0A0C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#5842ff] text-sm text-center font-bold" value={aiInsertIndex} onChange={(e) => setAiInsertIndex(Number(e.target.value))} /></div></div>
//             <button onClick={executeAIExtraction} disabled={pastedImages.length === 0} className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-bold transition shadow-lg ${pastedImages.length > 0 ? 'bg-gradient-to-r from-[#5842ff] to-purple-600 text-white hover:scale-[1.02] cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}><Zap size={18} /> EXTRACT WITH AI</button>
//           </div>
//         </div>
//         {pastedImages.length > 0 && (<div className="mt-6 pt-6 border-t border-gray-800 flex flex-wrap gap-4">{pastedImages.map((imgSrc, idx) => (<div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-700 group"><img src={imgSrc} alt="pasted" className="w-full h-full object-cover opacity-70" /><button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><X size={12} /></button></div>))}</div>)}
//       </div>

//       <div className="bg-[#12121A] p-5 rounded-xl border border-[#5842ff]/30 mb-6 flex flex-col md:flex-row gap-6 items-start shadow-md">
//         <div className="w-full md:w-1/3">
//           <label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2"><Clock size={16} /> Master Time Calendar</label>
//           <input type="datetime-local" className="w-full bg-[#0A0A0C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#5842ff] [color-scheme:dark] cursor-pointer" value={masterTime} onChange={(e) => setMasterTime(e.target.value)} onClick={openCalendar} />
//           <p className="text-xs text-gray-500 mt-2">Click anywhere to open calendar.</p>
//         </div>
//         <div className="w-full md:w-2/3">
//           <div className="flex justify-between items-center mb-3">
//             <label className="text-sm font-semibold text-gray-400 block">Bulk Apply Master Time to rows below:</label>
//             <div className="flex gap-2"><button onClick={toggleSelectAllRows} className="bg-[#1A1A24] border border-gray-700 hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold transition">Toggle All</button><button onClick={applyMasterTime} className="bg-[#5842ff] hover:bg-[#4635d8] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-lg">Apply to Selected</button></div>
//           </div>
//           <div className="flex flex-wrap gap-3">
//             {rows.map((row, idx) => {
//                const isChecked = selectedRows.includes(row.id);
//                return (<label key={row.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition select-none ${isChecked ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-[#0A0A0C] border-gray-700 text-gray-500 hover:border-gray-500'}`}><input type="checkbox" className="hidden" checked={isChecked} onChange={() => handleRowSelect(row.id)} /><div className={`w-3 h-3 rounded flex items-center justify-center border ${isChecked ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>{isChecked && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2"><polyline points="20 6 9 17 4 12"></polyline></svg>}</div>Row #{idx + 1}</label>);
//             })}
//           </div>
//         </div>
//       </div>

//       <div className="space-y-4 mb-20">
//         {rows.map((row, index) => {
//           const hasTime = row.overrideTime && row.overrideTime.trim() !== '';
//           const isCompleted = hasTime && masterTime !== '' && row.overrideTime !== masterTime;
//           const isCurrentActive = hasTime && row.overrideTime === masterTime;
//           let borderClass = 'border-gray-800';
//           let bgClass = 'bg-[#161620]';
//           if (isCompleted) { borderClass = 'border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]'; bgClass = 'bg-green-500/5';
//           } else if (isCurrentActive) { borderClass = 'border-[#5842ff]/50'; }

//           return (
//             <div key={row.id} className={`bg-[#12121A] rounded-xl border ${borderClass} overflow-hidden transition-all shadow-md`}>
//               <div className={`flex items-center justify-between p-4 ${bgClass} cursor-pointer`} onClick={() => updateRow(row.id, 'isExpanded', !row.isExpanded)}>
//                 <div className="flex items-center gap-4 flex-wrap">
//                   <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-bold w-20 text-center">Row #{index + 1}</span>
//                   {isCompleted && <span className="flex items-center gap-1 text-green-500 text-xs font-bold"><CheckCircle2 size={14}/> Done</span>}
//                   {!row.isExpanded && (<div className="text-sm text-gray-400 flex gap-4 ml-4 items-center"><span className="text-white font-medium">{row.channelId || 'No Channel'}</span><span className="truncate w-48 block text-xs text-gray-500">{row.targetUrls || 'No Links Selected'}</span><span className={`${isCompleted ? 'text-green-500' : 'text-[#5842ff]'} flex items-center gap-1`}><Clock size={14} /> {formatDateTimeAMPM(row.overrideTime) || 'No Time'}</span></div>)}
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <button onClick={(e) => { e.stopPropagation(); removeRow(row.id); }} className="p-1.5 text-gray-500 hover:text-red-500 rounded"><X size={18} /></button>
//                   {row.isExpanded ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
//                 </div>
//               </div>
//               {row.isExpanded && (
//                 <div className="p-5 space-y-5">
//                   <div className="bg-[#0A0A0C] p-4 rounded-lg border border-gray-800 shadow-inner">
//                     <label className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">
//                       <ListOrdered size={14} className="text-[#5842ff]" /> Build Final Target URL String (Priority Click Matrix)
//                     </label>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//                       <div className="border-r border-gray-800/50 pr-5">
//                         <p className="text-[11px] text-gray-600 mb-3 font-semibold">Predefined Master List:</p>
//                         {masterUrls.length === 0 ? (<p className="text-xs text-gray-700 italic">Add master URLs globally first.</p>) : (
//                           <div className="flex flex-wrap gap-3">
//                             {masterUrls.map((urlItem) => {
//                               const priorityIndex = row.orderedSelections.findIndex(item => item.type === 'master' && item.id === urlItem.id);
//                               const isChecked = priorityIndex !== -1;
//                               return (
//                                 <label key={urlItem.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition select-none ${isChecked ? 'bg-[#5842ff]/10 border-[#5842ff] text-white' : 'bg-[#12121A] border-gray-800 text-gray-400 hover:border-gray-700'}`}>
//                                   <input type="checkbox" className="hidden" checked={isChecked} onChange={() => handleUrlCheckboxChange(row.id, {type: 'master', id: urlItem.id})} />
//                                   {isChecked && <span className="w-5 h-5 flex items-center justify-center bg-[#5842ff] text-white rounded-full text-[10px] font-black animate-scaleIn">{priorityIndex + 1}</span>}
//                                   <div className="flex flex-col text-left"><span className="text-xs font-bold">{urlItem.name}</span><span className="text-[10px] text-gray-600 truncate w-28">{urlItem.url}</span></div>
//                                 </label>
//                               );
//                             })}
//                           </div>
//                         )}
//                       </div>
//                       <div className="flex flex-col gap-3">
//                         <p className="text-[11px] text-gray-600 font-semibold">Row-Specific Manual Link:</p>
//                         <div className="flex gap-2 items-center">
//                           <input type="text" placeholder="https://custom.link/for/this/row" className="flex-1 bg-[#12121A] border border-gray-700 rounded p-2 text-sm text-white outline-none focus:border-[#5842ff] font-mono text-xs" value={row.manualUrl} onChange={(e) => handleManualUrlTextChange(row.id, e.target.value)} />
//                           {(() => {
//                             const priorityIndexManual = row.orderedSelections.findIndex(item => item.type === 'manual');
//                             const isManualChecked = priorityIndexManual !== -1;
//                             return (
//                               <label className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition select-none ${isManualChecked ? 'bg-[#5842ff]/10 border-[#5842ff] text-white' : 'bg-[#12121A] border-gray-800 text-gray-500'}`}>
//                                 <input type="checkbox" className="hidden" checked={isManualChecked} onChange={() => handleUrlCheckboxChange(row.id, {type: 'manual'})} disabled={row.manualUrl.trim() === ''}/>
//                                 {isManualChecked && <span className="w-5 h-5 flex items-center justify-center bg-[#5842ff] text-white rounded-full text-[10px] font-black">{priorityIndexManual + 1}</span>}
//                                 <span className={`text-xs font-bold ${row.manualUrl.trim() === '' ? 'text-gray-700' : ''}`}>Active?</span>
//                               </label>
//                             );
//                           })()}
//                         </div>
//                         {row.manualUrl.trim() === '' && <p className="text-[10px] text-red-700 italic mt-1">* Type a URL in box first to activate priority selection.</p>}
//                       </div>
//                     </div>
//                     {row.targetUrls && (<div className="mt-4 text-[11px] text-gray-500 bg-[#12121A] p-2 rounded border border-gray-800/40 truncate shadow-inner"><strong className="text-[#5842ff]">Final TargetURL Compiled String (Whichever clicked first):</strong> {row.targetUrls}</div>)}
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-gray-800/50">
//                     <div><label className="block text-xs font-semibold text-gray-500 mb-1">Channel ID</label><input type="text" className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.channelId} onChange={(e) => updateRow(row.id, 'channelId', e.target.value)} /></div>
//                     <div><label className="block text-xs font-semibold text-gray-500 mb-1">Override Time</label><input type="datetime-local" className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] [color-scheme:dark] cursor-pointer" value={row.overrideTime} onChange={(e) => updateRow(row.id, 'overrideTime', e.target.value)} onClick={openCalendar} /></div>
//                     <div><label className="block text-xs font-semibold text-gray-500 mb-1">Target Server</label><div className="flex gap-2"><select className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] cursor-pointer" value={PREDEFINED_SERVERS.includes(row.targetServer) ? row.targetServer : 'Custom'} onChange={(e) => updateRow(row.id, 'targetServer', e.target.value === 'Custom' ? 'Custom Server' : e.target.value)}>{PREDEFINED_SERVERS.map(s => <option key={s} value={s}>{s}</option>)}<option value="Custom">Custom...</option></select>{!PREDEFINED_SERVERS.includes(row.targetServer) && <input type="text" placeholder="Type..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.targetServer === 'Custom Server' ? '' : row.targetServer} onChange={(e) => updateRow(row.id, 'targetServer', e.target.value)} />}</div></div>
//                     <div><label className="block text-xs font-semibold text-gray-500 mb-1">Speed / Quality</label><div className="flex gap-2"><select className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] cursor-pointer" value={PREDEFINED_QUALITIES.includes(row.quality) ? row.quality : 'Custom'} onChange={(e) => updateRow(row.id, 'quality', e.target.value === 'Custom' ? 'Custom Quality' : e.target.value)}>{PREDEFINED_QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}<option value="Custom">Custom...</option></select>{!PREDEFINED_QUALITIES.includes(row.quality) && <input type="text" placeholder="Type..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.quality === 'Custom Quality' ? '' : row.quality} onChange={(e) => updateRow(row.id, 'quality', e.target.value)} />}</div></div>
//                     <div><label className="block text-xs font-semibold text-gray-500 mb-1">Duration</label><div className="flex gap-2"><select className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] cursor-pointer" value={PREDEFINED_DURATIONS.includes(row.duration) ? row.duration : 'Custom'} onChange={(e) => updateRow(row.id, 'duration', e.target.value === 'Custom' ? 'Custom Duration' : e.target.value)}>{PREDEFINED_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}<option value="Custom">Custom...</option></select>{!PREDEFINED_DURATIONS.includes(row.duration) && <input type="text" placeholder="Type..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.duration === 'Custom Duration' ? '' : row.duration} onChange={(e) => updateRow(row.id, 'duration', e.target.value)} />}</div></div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>

//       <div className="fixed bottom-0 left-0 w-full bg-[#0A0A0C]/90 backdrop-blur-sm border-t border-gray-800 p-4 flex justify-between items-center px-6 z-50">
//         <button onClick={addRow} className="flex items-center gap-2 px-5 py-2.5 bg-transparent border border-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 transition"><Plus size={18} /> Add Empty Row</button>
//         <button onClick={generateCSV} className="flex items-center gap-2 px-6 py-2.5 bg-[#5842ff] hover:bg-[#4635d8] text-white font-medium rounded-lg transition shadow-[0_0_15px_rgba(88,66,255,0.4)]"><Copy size={18} /> Generate & Copy CSV</button>
//       </div>

//     </div>
//   );
// }



































































// ============== DOne 1 file only ===============================


// "use client";
// import React, { useState, useEffect } from 'react';
// import { Save, Copy, Plus, X, ChevronDown, ChevronUp, Clock, Folder, BrainCircuit, MessageSquareText, Zap, CloudUpload, CloudDownload, CheckCircle2, Link2, ListOrdered, Edit3 } from 'lucide-react';

// interface MasterUrlItem {
//   id: string;
//   name: string;
//   url: string;
// }

// // 🌟 New Structure for selections to track order across Master and Manual types
// interface OrderedSelectionItem {
//   type: 'master' | 'manual';
//   id?: string; // only needed for master type
// }

// interface RowData {
//   id: string;
//   channelId: string;
//   targetUrls: string; // The final compiled string: "url1 | url2"
  
//   // 🌟 NEW FIELDS FOR ROW-SPECIFIC PRIORITY
//   orderedSelections: OrderedSelectionItem[]; // Tracks the exact click priority order
//   manualUrl: string; // Text input for manual URL specifically for this row
//   isManualUrlActive: boolean; // Tracks if manual URL is checked in priority list

//   targetServer: string;
//   quality: string;
//   duration: string;
//   overrideTime: string;
//   isExpanded: boolean;
// }

// const PREDEFINED_QUALITIES = ['Original (1080p Max)', '1080p', '720p', '480p', '360p'];
// const PREDEFINED_SERVERS = ['None', 'Server 1', 'Server 2', 'Server 3'];
// const PREDEFINED_DURATIONS = ['1h', '2h', '3h', '4h', '5h', '10h', 'None'];

// export default function CSVCreator() {
//   const [masterUrls, setMasterUrls] = useState<MasterUrlItem[]>([
//     { id: 'm1', name: 'DLHD Main', url: 'https://dlhd.pk/watch.php?id=54' },
//     { id: 'm2', name: 'DLHD Backup', url: 'https://dlhd.pk/watch.php?id=111' },
//     { id: 'm3', name: 'Streamed PK', url: 'https://streamed.pk/watch/admin/3' }
//   ]);
  
//   const [newUrlName, setNewUrlName] = useState('');
//   const [newUrlLink, setNewUrlLink] = useState('');

//   const [rows, setRows] = useState<RowData[]>([createEmptyRow('1')]);
//   const [masterTime, setMasterTime] = useState('');
//   const [selectedRows, setSelectedRows] = useState<string[]>([]);
//   const [savedConfigs, setSavedConfigs] = useState<{name: string, data: RowData[]}[]>([]);
  
//   const [aiInsertIndex, setAiInsertIndex] = useState<number>(1);
//   const [syncKey, setSyncKey] = useState<string>('');
//   const [isSyncing, setIsSyncing] = useState(false);
  
//   const [isProcessingAI, setIsProcessingAI] = useState(false);
//   const [pastedImages, setPastedImages] = useState<string[]>([]);
//   const [customAIInstruction, setCustomAIInstruction] = useState('');

//   useEffect(() => {
//     const configs = localStorage.getItem('stream_configs');
//     if (configs) setSavedConfigs(JSON.parse(configs));
//   }, []);

//   useEffect(() => {
//     const handlePaste = async (e: ClipboardEvent) => {
//       const items = e.clipboardData?.items;
//       if (!items) return;
//       for (const item of items) {
//         if (item.type.indexOf('image') !== -1) {
//           const file = item.getAsFile();
//           if (file) {
//             const reader = new FileReader();
//             reader.readAsDataURL(file);
//             reader.onloadend = () => {
//               if (reader.result) setPastedImages(prev => [...prev, reader.result as string]);
//             };
//           }
//         }
//       }
//     };
//     window.addEventListener('paste', handlePaste);
//     return () => window.removeEventListener('paste', handlePaste);
//   }, []);

//   function createEmptyRow(idStr: string): RowData {
//     return {
//       id: idStr,
//       channelId: '', targetUrls: '', 
//       // 🌟 Initialize new fields
//       orderedSelections: [], manualUrl: '', isManualUrlActive: false,
//       targetServer: 'None', quality: 'Original (1080p Max)', duration: '3h', overrideTime: '', isExpanded: true
//     };
//   }

//   // 🌟 HELPER: Compile the priority list into final pipe string
//   const compileTargetUrls = (rowOrderedSelections: OrderedSelectionItem[], rowManualUrl: string): string => {
//     return rowOrderedSelections
//       .map(item => {
//         if (item.type === 'master') {
//           return masterUrls.find(m => m.id === item.id)?.url;
//         } else {
//           // Add manually typed URL only if it has text
//           return rowManualUrl.trim() !== '' ? rowManualUrl.trim() : null;
//         }
//       })
//       .filter(Boolean) // Remove nulls/undefined
//       .join(' | ');
//   };

//   const addRow = () => setRows([...rows, createEmptyRow(Date.now().toString())]);
//   const removeRow = (id: string) => {
//     setRows(rows.filter(r => r.id !== id));
//     setSelectedRows(selectedRows.filter(rowId => rowId !== id));
//   };
//   const updateRow = (id: string, field: keyof RowData, value: any) => {
//     setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
//   };

//   const applyMasterTime = () => {
//     if (!masterTime) return alert("Please select time first!");
//     if (selectedRows.length === 0) return alert("Select rows below!");
//     setRows(rows.map(r => selectedRows.includes(r.id) ? { ...r, overrideTime: masterTime } : r));
//   };
//   const handleRowSelect = (id: string) => {
//     if (selectedRows.includes(id)) setSelectedRows(selectedRows.filter(rId => rId !== id));
//     else setSelectedRows([...selectedRows, id]);
//   };
//   const toggleSelectAllRows = () => {
//     if (selectedRows.length === rows.length) setSelectedRows([]);
//     else setSelectedRows(rows.map(r => r.id));
//   };

//   const addMasterUrl = () => {
//     if (!newUrlName || !newUrlLink) return alert("Fill Name and Link!");
//     const newItem: MasterUrlItem = {
//       id: Date.now().toString(),
//       name: newUrlName.trim(),
//       url: newUrlLink.trim().startsWith('http') ? newUrlLink.trim() : 'https://' + newUrlLink.trim()
//     };
//     setMasterUrls([...masterUrls, newItem]);
//     setNewUrlName('');
//     setNewUrlLink('');
//   };

//   const removeMasterUrl = (id: string) => {
//     setMasterUrls(masterUrls.filter(m => m.id !== id));
//     setRows(rows.map(r => {
//       // Remove from priority list
//       const filteredSelections = r.orderedSelections.filter(item => !(item.type === 'master' && item.id === id));
//       const compiled = compileTargetUrls(filteredSelections, r.manualUrl);
//       return { ...r, orderedSelections: filteredSelections, targetUrls: compiled };
//     }));
//   };

//   // 🌟 CROSS-TYPE PRIORITY SELECTION LOGIC
//   const handleUrlCheckboxChange = (rowId: string, selectionItem: OrderedSelectionItem) => {
//     setRows(rows.map(r => {
//       if (r.id !== rowId) return r;
//       let nextSelections = [...r.orderedSelections];
//       const existingIndex = nextSelections.findIndex(item => 
//         item.type === selectionItem.type && (item.type === 'manual' || item.id === selectionItem.id)
//       );

//       if (existingIndex !== -1) {
//         // Uncheck: remove from priority list
//         nextSelections.splice(existingIndex, 1);
//         if (selectionItem.type === 'manual') r.isManualUrlActive = false;
//       } else {
//         // Check: add to END of priority list
//         nextSelections.push(selectionItem);
//         if (selectionItem.type === 'manual') r.isManualUrlActive = true;
//       }

//       const compiledUrls = compileTargetUrls(nextSelections, r.manualUrl);
//       return { ...r, orderedSelections: nextSelections, targetUrls: compiledUrls };
//     }));
//   };

//   // 🌟 Handle Manual Text Change specifically
//   const handleManualUrlTextChange = (rowId: string, text: string) => {
//     setRows(rows.map(r => {
//       if (r.id !== rowId) return r;
//       // We update text directly. The compile logic will use the LATEST text value.
//       const compiledUrls = compileTargetUrls(r.orderedSelections, text);
//       return { ...r, manualUrl: text, targetUrls: compiledUrls };
//     }));
//   };

//   const removeImage = (indexToRemove: number) => {setPastedImages(pastedImages.filter((_, idx) => idx !== indexToRemove));};

//   const executeAIExtraction = async () => {
//     if (pastedImages.length === 0) return alert("Paste image first.");
//     setIsProcessingAI(true);
//     try {
//       const res = await fetch('/api/extract', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ imagesBase64: pastedImages, customDate: masterTime, customPrompt: customAIInstruction })
//       });
//       const resData = await res.json();
//       if (resData.success && Array.isArray(resData.data)) {
//          const newAiRows = resData.data.map((aiRow: any, index: number) => ({
//            id: Date.now().toString() + index,
//            channelId: aiRow.channelId || '',
//            targetUrls: '', orderedSelections: [], manualUrl: '', isManualUrlActive: false,
//            targetServer: aiRow.targetServer || 'None', quality: aiRow.quality || 'Original (1080p Max)', duration: aiRow.duration || '3h', overrideTime: aiRow.overrideTime || '', isExpanded: true
//          }));
//          const updatedRows = [...rows];
//          const insertPosition = Math.max(0, Math.min(aiInsertIndex - 1, updatedRows.length));
//          updatedRows.splice(insertPosition, 0, ...newAiRows);
//          setRows(updatedRows);
//          setPastedImages([]); 
//          setAiInsertIndex(insertPosition + newAiRows.length + 1);
//          alert(`✅ AI Data inserted Row #${insertPosition + 1}!`);
//       } else {alert(`❌ AI Error: ${resData.error}`);}
//     } catch (err: any) {alert(`❌ System Error: ${err.message}`);} finally {setIsProcessingAI(false);}
//   };

//   const syncToCloud = async (action: 'save' | 'load') => {
//     if (!syncKey) return alert("Enter Sync Key!");
//     setIsSyncing(true);
//     try {
//       const res = await fetch('/api/cloud', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ action, syncKey, data: { rows, masterUrls } })
//       });
//       const resData = await res.json();
//       if (resData.success) {
//         if (action === 'load') {
//           if (resData.data && resData.data.rows) { setRows(resData.data.rows); setMasterUrls(resData.data.masterUrls || []); }
//           alert("✅ Sync Success!");
//         } else { alert("✅ Vercel Cloud backup locked!"); }
//       } else {alert(`❌ Sync Error: ${resData.error}`);}
//     } catch (err: any) {alert(`❌ Network Error: ${err.message}`);} finally {setIsSyncing(false);}
//   };

//   const formatDateTimeAMPM = (timeStr: string) => {
//     if (!timeStr) return '';
//     const [datePart, timePart] = timeStr.split('T');
//     if (!timePart) return timeStr;
//     let [hours, minutes] = timePart.split(':');
//     let h = parseInt(hours, 10);
//     const ampm = h >= 12 ? 'PM' : 'AM';
//     h = h % 12 || 12; 
//     return `${datePart} ${h}:${minutes} ${ampm}`;
//   };

//   const generateCSV = () => {
//     const header = "TargetURL,Channel,Quality,Server,StartTime,Duration\n";
//     const csvContent = rows.map(r => `${r.targetUrls},${r.channelId},${r.quality},${r.targetServer},${formatDateTimeAMPM(r.overrideTime)},${r.duration}`).join("\n");
//     navigator.clipboard.writeText(header + csvContent);
//     alert("✅ CSV Format Copied!");
//   };
//   const openCalendar = (e: React.MouseEvent<HTMLInputElement>) => {try {if (typeof e.currentTarget.showPicker === 'function') {e.currentTarget.showPicker();}} catch (err) {}};

//   return (
//     <div className="min-h-screen bg-[#0A0A0C] text-gray-200 p-6 font-sans">
      
//       {/* HEADER SECTION */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-800 pb-4 gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-white flex items-center gap-2">📄 Create CSV Records</h1>
//           <p className="text-gray-500 text-sm mt-1">Manual filling, Cloud Sync & AI auto-population</p>
//         </div>
//         <div className="flex items-center gap-3 bg-[#12121A] p-2 rounded-lg border border-gray-800 shadow-md">
//           <input type="text" placeholder="Enter Sync Key..." className="bg-[#0A0A0C] border border-gray-700 rounded-md p-2 text-white outline-none focus:border-[#5842ff] w-44 text-sm font-mono" value={syncKey} onChange={(e) => setSyncKey(e.target.value)} />
//           <button onClick={() => syncToCloud('save')} disabled={isSyncing} className="flex items-center gap-1 px-3 py-2 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition text-sm font-semibold"><CloudUpload size={16} /> Save Data</button>
//           <button onClick={() => syncToCloud('load')} disabled={isSyncing} className="flex items-center gap-1 px-3 py-2 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 transition text-sm font-semibold"><CloudDownload size={16} /> Load Data</button>
//         </div>
//       </div>

//       {/* MASTER TARGET URLs */}
//       <div className="bg-[#12121A] p-5 rounded-xl border border-gray-800 mb-6 shadow-md">
//         <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4"><Link2 size={16} className="text-[#5842ff]" /> Master Target URLs Controller</h3>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
//           <div>
//             <label className="block text-xs text-gray-500 mb-1">Individual Name (Alias)</label>
//             <input type="text" placeholder="e.g. DLHD Server 1" className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-sm text-white outline-none focus:border-[#5842ff]" value={newUrlName} onChange={(e) => setNewUrlName(e.target.value)} />
//           </div>
//           <div>
//             <label className="block text-xs text-gray-500 mb-1">Actual URL Link</label>
//             <input type="text" placeholder="https://dlhd.pk/..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-sm text-white outline-none focus:border-[#5842ff]" value={newUrlLink} onChange={(e) => setNewUrlLink(e.target.value)} />
//           </div>
//           <button onClick={addMasterUrl} className="py-2 px-4 bg-[#5842ff] hover:bg-[#4635d8] text-white font-bold rounded text-sm transition flex items-center justify-center gap-1"><Plus size={16} /> Register URL</button>
//         </div>
//         <div className="flex flex-wrap gap-3 mt-2">
//           {masterUrls.map((m) => (
//             <div key={m.id} className="flex items-center gap-2 bg-[#1A1A24] border border-gray-700 px-3 py-1.5 rounded-lg text-xs">
//               <span className="text-gray-400 font-semibold">{m.name}:</span>
//               <span className="text-blue-400 truncate w-40 block">{m.url}</span>
//               <button onClick={() => removeMasterUrl(m.id)} className="text-gray-500 hover:text-red-500 transition ml-1"><X size={14} /></button>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* AI INJECTOR */}
//       <div className="mb-6 p-6 rounded-xl border border-gray-800 bg-[#12121A] relative overflow-hidden shadow-lg">
//         {isProcessingAI && (<div className="absolute inset-0 bg-[#0A0A0C]/90 backdrop-blur-md flex flex-col items-center justify-center z-20"><div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-4 border border-gray-700"><div className="h-full bg-gradient-to-r from-blue-500 via-[#5842ff] to-purple-500 animate-[pulse_1s_ease-in-out_infinite] w-full origin-left scale-x-100"></div></div><div className="flex items-center gap-3"><BrainCircuit size={24} className="text-[#5842ff] animate-bounce" /><span className="font-bold text-white tracking-widest uppercase text-sm">Extracting Neural Data...</span></div></div>)}
//         <div className="flex flex-col md:flex-row gap-6">
//           <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#5842ff]/40 rounded-xl bg-[#1A1A24]/50 hover:bg-[#1A1A24] transition">
//             <BrainCircuit size={40} className="text-[#5842ff] mb-3" /><h2 className="text-xl font-bold text-white mb-1">Paste Images Here</h2><p className="text-gray-400 text-sm text-center">Press <kbd className="bg-gray-800 px-2 py-1 rounded text-white font-mono">Ctrl + V</kbd></p>
//             {pastedImages.length > 0 && <span className="mt-3 text-xs font-semibold px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full">{pastedImages.length} Image(s) Queued</span>}
//           </div>
//           <div className="flex-1 flex flex-col gap-4 justify-center">
//             <div className="flex gap-4"><div className="flex-1"><label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2">Custom AI Instructions</label><input type="text" placeholder="e.g., Only extract semi-finals..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#5842ff] text-sm" value={customAIInstruction} onChange={(e) => setCustomAIInstruction(e.target.value)} /></div><div className="w-1/4"><label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2">Start Row</label><input type="number" min="1" className="w-full bg-[#0A0A0C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#5842ff] text-sm text-center font-bold" value={aiInsertIndex} onChange={(e) => setAiInsertIndex(Number(e.target.value))} /></div></div>
//             <button onClick={executeAIExtraction} disabled={pastedImages.length === 0} className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-bold transition shadow-lg ${pastedImages.length > 0 ? 'bg-gradient-to-r from-[#5842ff] to-purple-600 text-white hover:scale-[1.02] cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}><Zap size={18} /> EXTRACT WITH AI</button>
//           </div>
//         </div>
//         {pastedImages.length > 0 && (<div className="mt-6 pt-6 border-t border-gray-800 flex flex-wrap gap-4">{pastedImages.map((imgSrc, idx) => (<div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-700 group"><img src={imgSrc} alt="pasted" className="w-full h-full object-cover opacity-70" /><button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><X size={12} /></button></div>))}</div>)}
//       </div>

//       {/* MASTER TIME CONTROLLER */}
//       <div className="bg-[#12121A] p-5 rounded-xl border border-[#5842ff]/30 mb-6 flex flex-col md:flex-row gap-6 items-start shadow-md">
//         <div className="w-full md:w-1/3">
//           <label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2"><Clock size={16} /> Master Time Calendar</label>
//           <input type="datetime-local" className="w-full bg-[#0A0A0C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#5842ff] [color-scheme:dark] cursor-pointer" value={masterTime} onChange={(e) => setMasterTime(e.target.value)} onClick={openCalendar} />
//           <p className="text-xs text-gray-500 mt-2">Click anywhere to open calendar.</p>
//         </div>
//         <div className="w-full md:w-2/3">
//           <div className="flex justify-between items-center mb-3">
//             <label className="text-sm font-semibold text-gray-400 block">Bulk Apply Master Time to rows below:</label>
//             <div className="flex gap-2"><button onClick={toggleSelectAllRows} className="bg-[#1A1A24] border border-gray-700 hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold transition">Toggle All</button><button onClick={applyMasterTime} className="bg-[#5842ff] hover:bg-[#4635d8] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-lg">Apply to Selected</button></div>
//           </div>
//           <div className="flex flex-wrap gap-3">
//             {rows.map((row, idx) => {
//                const isChecked = selectedRows.includes(row.id);
//                return (<label key={row.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition select-none ${isChecked ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-[#0A0A0C] border-gray-700 text-gray-500 hover:border-gray-500'}`}><input type="checkbox" className="hidden" checked={isChecked} onChange={() => handleRowSelect(row.id)} /><div className={`w-3 h-3 rounded flex items-center justify-center border ${isChecked ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>{isChecked && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2"><polyline points="20 6 9 17 4 12"></polyline></svg>}</div>Row #{idx + 1}</label>);
//             })}
//           </div>
//         </div>
//       </div>

//       {/* ROWS LOGIC PIPELINE */}
//       <div className="space-y-4 mb-20">
//         {rows.map((row, index) => {
//           const hasTime = row.overrideTime && row.overrideTime.trim() !== '';
//           const isCompleted = hasTime && masterTime !== '' && row.overrideTime !== masterTime;
//           const isCurrentActive = hasTime && row.overrideTime === masterTime;
//           let borderClass = 'border-gray-800';
//           let bgClass = 'bg-[#161620]';
//           if (isCompleted) { borderClass = 'border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]'; bgClass = 'bg-green-500/5';
//           } else if (isCurrentActive) { borderClass = 'border-[#5842ff]/50'; }

//           return (
//             <div key={row.id} className={`bg-[#12121A] rounded-xl border ${borderClass} overflow-hidden transition-all shadow-md`}>
//               <div className={`flex items-center justify-between p-4 ${bgClass} cursor-pointer`} onClick={() => updateRow(row.id, 'isExpanded', !row.isExpanded)}>
//                 <div className="flex items-center gap-4 flex-wrap">
//                   <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-bold w-20 text-center">Row #{index + 1}</span>
//                   {isCompleted && <span className="flex items-center gap-1 text-green-500 text-xs font-bold"><CheckCircle2 size={14}/> Done</span>}
//                   {!row.isExpanded && (<div className="text-sm text-gray-400 flex gap-4 ml-4 items-center"><span className="text-white font-medium">{row.channelId || 'No Channel'}</span><span className="truncate w-48 block text-xs text-gray-500">{row.targetUrls || 'No Links Selected'}</span><span className={`${isCompleted ? 'text-green-500' : 'text-[#5842ff]'} flex items-center gap-1`}><Clock size={14} /> {formatDateTimeAMPM(row.overrideTime) || 'No Time'}</span></div>)}
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <button onClick={(e) => { e.stopPropagation(); removeRow(row.id); }} className="p-1.5 text-gray-500 hover:text-red-500 rounded"><X size={18} /></button>
//                   {row.isExpanded ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
//                 </div>
//               </div>
//               {row.isExpanded && (
//                 <div className="p-5 space-y-5">
                  
//                   {/* 🌟 NEW UPDATED LOGIC: ENTERPRISE PRIORITY URL MATRIX ZONE */}
//                   <div className="bg-[#0A0A0C] p-4 rounded-lg border border-gray-800 shadow-inner">
//                     <label className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">
//                       <ListOrdered size={14} className="text-[#5842ff]" /> Build Final Target URL String (Priority Click Matrix)
//                     </label>
                    
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//                       {/* Master List Selections */}
//                       <div className="border-r border-gray-800/50 pr-5">
//                         <p className="text-[11px] text-gray-600 mb-3 font-semibold">Predefined Master List:</p>
//                         {masterUrls.length === 0 ? (<p className="text-xs text-gray-700 italic">Add master URLs globally first.</p>) : (
//                           <div className="flex flex-wrap gap-3">
//                             {masterUrls.map((urlItem) => {
//                               const priorityIndex = row.orderedSelections.findIndex(item => item.type === 'master' && item.id === urlItem.id);
//                               const isChecked = priorityIndex !== -1;
//                               return (
//                                 <label key={urlItem.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition select-none ${isChecked ? 'bg-[#5842ff]/10 border-[#5842ff] text-white' : 'bg-[#12121A] border-gray-800 text-gray-400 hover:border-gray-700'}`}>
//                                   <input type="checkbox" className="hidden" checked={isChecked} onChange={() => handleUrlCheckboxChange(row.id, {type: 'master', id: urlItem.id})} />
//                                   {isChecked && <span className="w-5 h-5 flex items-center justify-center bg-[#5842ff] text-white rounded-full text-[10px] font-black animate-scaleIn">{priorityIndex + 1}</span>}
//                                   <div className="flex flex-col text-left"><span className="text-xs font-bold">{urlItem.name}</span><span className="text-[10px] text-gray-600 truncate w-28">{urlItem.url}</span></div>
//                                 </label>
//                               );
//                             })}
//                           </div>
//                         )}
//                       </div>

//                       {/* 🌟 NEW: Manual Row-Specific URL Input & Selector */}
//                       <div className="flex flex-col gap-3">
//                         <p className="text-[11px] text-gray-600 font-semibold">Row-Specific Manual Link:</p>
//                         <div className="flex gap-2 items-center">
//                           <input 
//                             type="text" placeholder="https://custom.link/for/this/row" 
//                             className="flex-1 bg-[#12121A] border border-gray-700 rounded p-2 text-sm text-white outline-none focus:border-[#5842ff] font-mono text-xs"
//                             value={row.manualUrl} 
//                             onChange={(e) => handleManualUrlTextChange(row.id, e.target.value)} 
//                           />
                          
//                           {/* Manual URL Checkbox with Priority badge */}
//                           {(() => {
//                             const priorityIndexManual = row.orderedSelections.findIndex(item => item.type === 'manual');
//                             const isManualChecked = priorityIndexManual !== -1;
//                             return (
//                               <label className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition select-none ${isManualChecked ? 'bg-[#5842ff]/10 border-[#5842ff] text-white' : 'bg-[#12121A] border-gray-800 text-gray-500'}`}>
//                                 <input type="checkbox" className="hidden" checked={isManualChecked} onChange={() => handleUrlCheckboxChange(row.id, {type: 'manual'})} disabled={row.manualUrl.trim() === ''}/>
//                                 {isManualChecked && <span className="w-5 h-5 flex items-center justify-center bg-[#5842ff] text-white rounded-full text-[10px] font-black">{priorityIndexManual + 1}</span>}
//                                 <span className={`text-xs font-bold ${row.manualUrl.trim() === '' ? 'text-gray-700' : ''}`}>Active?</span>
//                               </label>
//                             );
//                           })()}
//                         </div>
//                         {row.manualUrl.trim() === '' && <p className="text-[10px] text-red-700 italic mt-1">* Type a URL in box first to activate priority selection.</p>}
//                       </div>
//                     </div>

//                     {/* Compiled Output Preview */}
//                     {row.targetUrls && (<div className="mt-4 text-[11px] text-gray-500 bg-[#12121A] p-2 rounded border border-gray-800/40 truncate shadow-inner"><strong className="text-[#5842ff]">Final TargetURL Compiled String (Whichever clicked first):</strong> {row.targetUrls}</div>)}
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-gray-800/50">
//                     <div><label className="block text-xs font-semibold text-gray-500 mb-1">Channel ID</label><input type="text" className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.channelId} onChange={(e) => updateRow(row.id, 'channelId', e.target.value)} /></div>
//                     <div><label className="block text-xs font-semibold text-gray-500 mb-1">Override Time</label><input type="datetime-local" className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] [color-scheme:dark] cursor-pointer" value={row.overrideTime} onChange={(e) => updateRow(row.id, 'overrideTime', e.target.value)} onClick={openCalendar} /></div>
//                     <div><label className="block text-xs font-semibold text-gray-500 mb-1">Target Server</label><div className="flex gap-2"><select className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] cursor-pointer" value={PREDEFINED_SERVERS.includes(row.targetServer) ? row.targetServer : 'Custom'} onChange={(e) => updateRow(row.id, 'targetServer', e.target.value === 'Custom' ? 'Custom Server' : e.target.value)}>{PREDEFINED_SERVERS.map(s => <option key={s} value={s}>{s}</option>)}<option value="Custom">Custom...</option></select>{!PREDEFINED_SERVERS.includes(row.targetServer) && <input type="text" placeholder="Type..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.targetServer === 'Custom Server' ? '' : row.targetServer} onChange={(e) => updateRow(row.id, 'targetServer', e.target.value)} />}</div></div>
//                     <div><label className="block text-xs font-semibold text-gray-500 mb-1">Speed / Quality</label><div className="flex gap-2"><select className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] cursor-pointer" value={PREDEFINED_QUALITIES.includes(row.quality) ? row.quality : 'Custom'} onChange={(e) => updateRow(row.id, 'quality', e.target.value === 'Custom' ? 'Custom Quality' : e.target.value)}>{PREDEFINED_QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}<option value="Custom">Custom...</option></select>{!PREDEFINED_QUALITIES.includes(row.quality) && <input type="text" placeholder="Type..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.quality === 'Custom Quality' ? '' : row.quality} onChange={(e) => updateRow(row.id, 'quality', e.target.value)} />}</div></div>
//                     <div><label className="block text-xs font-semibold text-gray-500 mb-1">Duration</label><div className="flex gap-2"><select className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] cursor-pointer" value={PREDEFINED_DURATIONS.includes(row.duration) ? row.duration : 'Custom'} onChange={(e) => updateRow(row.id, 'duration', e.target.value === 'Custom' ? 'Custom Duration' : e.target.value)}>{PREDEFINED_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}<option value="Custom">Custom...</option></select>{!PREDEFINED_DURATIONS.includes(row.duration) && <input type="text" placeholder="Type..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.duration === 'Custom Duration' ? '' : row.duration} onChange={(e) => updateRow(row.id, 'duration', e.target.value)} />}</div></div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>

//       <div className="fixed bottom-0 left-0 w-full bg-[#0A0A0C]/90 backdrop-blur-sm border-t border-gray-800 p-4 flex justify-between items-center px-6 z-50">
//         <button onClick={addRow} className="flex items-center gap-2 px-5 py-2.5 bg-transparent border border-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 transition"><Plus size={18} /> Add Empty Row</button>
//         <button onClick={generateCSV} className="flex items-center gap-2 px-6 py-2.5 bg-[#5842ff] hover:bg-[#4635d8] text-white font-medium rounded-lg transition shadow-[0_0_15px_rgba(88,66,255,0.4)]"><Copy size={18} /> Generate & Copy CSV</button>
//       </div>

//     </div>
//   );
// }




















// =========================================



// "use client";
// import React, { useState, useEffect } from 'react';
// import { Save, Copy, Plus, X, ChevronDown, ChevronUp, Clock, Folder, BrainCircuit, MessageSquareText, Zap, CloudUpload, CloudDownload, CheckCircle2 } from 'lucide-react';

// interface RowData {
//   id: string;
//   channelId: string;
//   targetUrls: string;
//   targetServer: string;
//   quality: string;
//   duration: string;
//   overrideTime: string;
//   isExpanded: boolean;
// }

// const PREDEFINED_QUALITIES = ['Original (1080p Max)', '1080p', '720p', '480p', '360p'];
// const PREDEFINED_SERVERS = ['None', 'Server 1', 'Server 2', 'Server 3'];
// const PREDEFINED_DURATIONS = ['1h', '2h', '3h', '4h', '5h', '10h', 'None'];

// export default function CSVCreator() {
//   const [rows, setRows] = useState<RowData[]>([createEmptyRow('1')]);
//   const [masterTime, setMasterTime] = useState('');
  
//   // 🌟 New Features States
//   const [aiInsertIndex, setAiInsertIndex] = useState<number>(1);
//   const [syncKey, setSyncKey] = useState<string>('');
//   const [isSyncing, setIsSyncing] = useState(false);
  
//   const [isProcessingAI, setIsProcessingAI] = useState(false);
//   const [pastedImages, setPastedImages] = useState<string[]>([]);
//   const [customAIInstruction, setCustomAIInstruction] = useState('');

//   // 🌟 COLLECT IMAGES FOR AI
//   useEffect(() => {
//     const handlePaste = async (e: ClipboardEvent) => {
//       const items = e.clipboardData?.items;
//       if (!items) return;
//       for (const item of items) {
//         if (item.type.indexOf('image') !== -1) {
//           const file = item.getAsFile();
//           if (file) {
//             const reader = new FileReader();
//             reader.readAsDataURL(file);
//             reader.onloadend = () => {
//               if (reader.result) setPastedImages(prev => [...prev, reader.result as string]);
//             };
//           }
//         }
//       }
//     };
//     window.addEventListener('paste', handlePaste);
//     return () => window.removeEventListener('paste', handlePaste);
//   }, []);

//   function createEmptyRow(idStr: string): RowData {
//     return {
//       id: idStr,
//       channelId: '', targetUrls: '', targetServer: 'None', 
//       quality: 'Original (1080p Max)', duration: '3h', overrideTime: '', isExpanded: true
//     };
//   }

//   const removeImage = (indexToRemove: number) => {
//     setPastedImages(pastedImages.filter((_, idx) => idx !== indexToRemove));
//   };

//   // 🌟 AI EXTRACTION WITH INDEX INJECTION
//   const executeAIExtraction = async () => {
//     if (pastedImages.length === 0) return alert("Please paste an image first.");
//     setIsProcessingAI(true);
    
//     try {
//       const res = await fetch('/api/extract', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ 
//           imagesBase64: pastedImages, 
//           customDate: masterTime,
//           customPrompt: customAIInstruction 
//         })
//       });
      
//       const resData = await res.json();
      
//       if (resData.success && Array.isArray(resData.data)) {
//          const newAiRows = resData.data.map((aiRow: any, index: number) => ({
//            id: Date.now().toString() + index,
//            channelId: aiRow.channelId || '',
//            targetUrls: '', targetServer: aiRow.targetServer || 'None',
//            quality: aiRow.quality || 'Original (1080p Max)',
//            duration: aiRow.duration || '3h',
//            overrideTime: aiRow.overrideTime || '',
//            isExpanded: true
//          }));

//          // Insert at user-defined index
//          const updatedRows = [...rows];
//          const insertPosition = Math.max(0, Math.min(aiInsertIndex - 1, updatedRows.length));
//          updatedRows.splice(insertPosition, 0, ...newAiRows);
         
//          setRows(updatedRows);
//          setPastedImages([]); 
//          setAiInsertIndex(insertPosition + newAiRows.length + 1); // Auto-advance index
//          alert(`✅ Extracted data injected at Row #${insertPosition + 1}!`);
//       } else {
//          alert(`❌ AI Error: ${resData.error}`);
//       }
//     } catch (err: any) {
//       alert(`❌ System Error: ${err.message}`);
//     } finally {
//       setIsProcessingAI(false);
//     }
//   };

//   const addRow = () => setRows([...rows, createEmptyRow(Date.now().toString())]);
//   const removeRow = (id: string) => setRows(rows.filter(r => r.id !== id));
//   const updateRow = (id: string, field: keyof RowData, value: any) => {
//     setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
//   };
//   const handleUrlBlur = (id: string, val: string) => {
//     const formatted = val.split(/[\s,]+/).filter(u => u.trim() !== '').join(' | ');
//     updateRow(id, 'targetUrls', formatted);
//   };

//   // 🌟 CROSS-DEVICE CLOUD SYNC
//   const syncToCloud = async (action: 'save' | 'load') => {
//     if (!syncKey) return alert("Please enter a Sync Key (Password) first!");
//     setIsSyncing(true);
//     try {
//       const res = await fetch('/api/cloud', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ action, syncKey, data: rows })
//       });
//       const resData = await res.json();
//       if (resData.success) {
//         if (action === 'load') {
//           setRows(resData.data.length > 0 ? resData.data : [createEmptyRow('1')]);
//           alert("✅ Data loaded from Cloud!");
//         } else {
//           alert("✅ Data saved to Cloud! You can access it on any device using this Sync Key.");
//         }
//       } else {
//         alert(`❌ Sync Error: ${resData.error}`);
//       }
//     } catch (err: any) {
//       alert(`❌ Network Error: ${err.message}`);
//     } finally {
//       setIsSyncing(false);
//     }
//   };

//   const formatDateTimeAMPM = (timeStr: string) => {
//     if (!timeStr) return '';
//     const [datePart, timePart] = timeStr.split('T');
//     if (!timePart) return timeStr;
//     let [hours, minutes] = timePart.split(':');
//     let h = parseInt(hours, 10);
//     const ampm = h >= 12 ? 'PM' : 'AM';
//     h = h % 12 || 12; 
//     return `${datePart} ${h}:${minutes} ${ampm}`;
//   };

//   const generateCSV = () => {
//     const header = "TargetURL,Channel,Quality,Server,StartTime,Duration\n";
//     const csvContent = rows.map(r => `${r.targetUrls},${r.channelId},${r.quality},${r.targetServer},${formatDateTimeAMPM(r.overrideTime)},${r.duration}`).join("\n");
//     navigator.clipboard.writeText(header + csvContent);
//     alert("✅ EXACT FORMAT CSV Generated and Copied to Clipboard!");
//   };

//   return (
//     <div className="min-h-screen bg-[#0A0A0C] text-gray-200 p-6 font-sans">
//       {/* HEADER WITH CLOUD SYNC */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-800 pb-4 gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-white flex items-center gap-2">📄 Create CSV Records</h1>
//           <p className="text-gray-500 text-sm mt-1">Manual filling, Cloud Sync & AI auto-population</p>
//         </div>
        
//         <div className="flex items-center gap-3 bg-[#12121A] p-2 rounded-lg border border-gray-800">
//           <input 
//             type="text" 
//             placeholder="Enter Sync Key..." 
//             className="bg-[#0A0A0C] border border-gray-700 rounded-md p-2 text-white outline-none focus:border-[#5842ff] w-36 text-sm"
//             value={syncKey}
//             onChange={(e) => setSyncKey(e.target.value)}
//           />
//           <button onClick={() => syncToCloud('save')} disabled={isSyncing} className="flex items-center gap-1 px-3 py-2 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition text-sm font-semibold">
//             <CloudUpload size={16} /> Save
//           </button>
//           <button onClick={() => syncToCloud('load')} disabled={isSyncing} className="flex items-center gap-1 px-3 py-2 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 transition text-sm font-semibold">
//             <CloudDownload size={16} /> Load
//           </button>
//         </div>
//       </div>

//       {/* AI MASTER INJECTOR ZONE */}
//       <div className="mb-8 p-6 rounded-xl border border-gray-800 bg-[#12121A] relative overflow-hidden shadow-lg">
//         {isProcessingAI && (
//            <div className="absolute inset-0 bg-[#0A0A0C]/90 backdrop-blur-md flex flex-col items-center justify-center z-20">
//              <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mb-4 border border-gray-700">
//                <div className="h-full bg-gradient-to-r from-blue-500 via-[#5842ff] to-purple-500 animate-[pulse_1s_ease-in-out_infinite] w-full origin-left scale-x-100"></div>
//              </div>
//              <div className="flex items-center gap-3">
//                <BrainCircuit size={24} className="text-[#5842ff] animate-bounce" />
//                <span className="font-bold text-white tracking-widest uppercase text-sm">Extracting Neural Data...</span>
//              </div>
//            </div>
//         )}

//         <div className="flex flex-col md:flex-row gap-6">
//           <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#5842ff]/40 rounded-xl bg-[#1A1A24]/50 hover:bg-[#1A1A24] transition">
//             <BrainCircuit size={40} className="text-[#5842ff] mb-3" />
//             <h2 className="text-xl font-bold text-white mb-1">Paste Images Here</h2>
//             <p className="text-gray-400 text-sm text-center">Press <kbd className="bg-gray-800 px-2 py-1 rounded text-white font-mono">Ctrl + V</kbd> to add multiple screenshots.</p>
//             {pastedImages.length > 0 && (
//               <span className="mt-3 text-xs font-semibold px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full">
//                 {pastedImages.length} Image(s) Queued
//               </span>
//             )}
//           </div>

//           <div className="flex-1 flex flex-col gap-4 justify-center">
//             <div className="flex gap-4">
//               <div className="flex-1">
//                 <label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2">
//                   <MessageSquareText size={16} /> Custom AI Instructions
//                 </label>
//                 <input 
//                   type="text" placeholder="e.g., Only extract semi-finals..." 
//                   className="w-full bg-[#0A0A0C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#5842ff] text-sm"
//                   value={customAIInstruction} onChange={(e) => setCustomAIInstruction(e.target.value)}
//                 />
//               </div>
//               <div className="w-1/4">
//                 <label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2">Insert At Row</label>
//                 <input 
//                   type="number" min="1"
//                   className="w-full bg-[#0A0A0C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#5842ff] text-sm text-center font-bold"
//                   value={aiInsertIndex} onChange={(e) => setAiInsertIndex(Number(e.target.value))}
//                 />
//               </div>
//             </div>
//             <button 
//               onClick={executeAIExtraction} disabled={pastedImages.length === 0}
//               className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-bold transition shadow-lg ${pastedImages.length > 0 ? 'bg-gradient-to-r from-[#5842ff] to-purple-600 text-white hover:scale-[1.02] cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
//             >
//               <Zap size={18} /> EXTRACT WITH AI
//             </button>
//           </div>
//         </div>

//         {pastedImages.length > 0 && (
//           <div className="mt-6 pt-6 border-t border-gray-800 flex flex-wrap gap-4">
//             {pastedImages.map((imgSrc, idx) => (
//               <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-700 group">
//                 <img src={imgSrc} alt="pasted" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" />
//                 <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><X size={12} /></button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* MASTER TIME CONTROLLER */}
//       <div className="bg-[#12121A] p-5 rounded-xl border border-[#5842ff]/30 mb-8 flex flex-col md:flex-row gap-6 items-center">
//         <div className="w-full md:w-1/3">
//           <label className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2"><Clock size={16} /> Master Time Calendar</label>
//           <input 
//             type="datetime-local" 
//             className="w-full bg-[#0A0A0C] border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-[#5842ff]" 
//             value={masterTime} 
//             onChange={(e) => setMasterTime(e.target.value)} 
//           />
//         </div>
//         <div className="w-full md:w-2/3">
//           <p className="text-sm text-gray-400">
//             Set a time above. Then click the <strong className="text-[#5842ff]">Apply Time</strong> button on any row below to instantly set its time. <br/>
//             Rows matching an older time will automatically turn <strong className="text-green-500">Green (Completed)</strong> when you change the Master Calendar.
//           </p>
//         </div>
//       </div>

//       <div className="space-y-4 mb-20">
//         {rows.map((row, index) => {
//           // 🌟 Dynamic Status Coloring Logic
//           const hasTime = row.overrideTime && row.overrideTime.trim() !== '';
//           const isCompleted = hasTime && masterTime !== '' && row.overrideTime !== masterTime;
//           const isCurrentActive = hasTime && row.overrideTime === masterTime;

//           let borderClass = 'border-gray-800';
//           let bgClass = 'bg-[#161620]';
//           if (isCompleted) {
//             borderClass = 'border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]';
//             bgClass = 'bg-green-500/5';
//           } else if (isCurrentActive) {
//             borderClass = 'border-[#5842ff]/50';
//           }

//           return (
//             <div key={row.id} className={`bg-[#12121A] rounded-xl border ${borderClass} overflow-hidden transition-all`}>
//               <div className={`flex items-center justify-between p-4 ${bgClass} cursor-pointer`} onClick={() => updateRow(row.id, 'isExpanded', !row.isExpanded)}>
//                 <div className="flex items-center gap-4">
//                   <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-bold w-20 text-center">Row #{index + 1}</span>
                  
//                   {/* 🌟 Apply Time Button */}
//                   <button 
//                     onClick={(e) => { e.stopPropagation(); if(masterTime) updateRow(row.id, 'overrideTime', masterTime); else alert("Select a time in Master Calendar first!"); }}
//                     className="flex items-center gap-1 px-3 py-1 bg-[#5842ff]/20 text-[#5842ff] hover:bg-[#5842ff]/40 rounded-lg text-xs font-bold transition"
//                   >
//                     <Clock size={12} /> Apply Time
//                   </button>
                  
//                   {isCompleted && <span className="flex items-center gap-1 text-green-500 text-xs font-bold"><CheckCircle2 size={14}/> Done</span>}

//                   {!row.isExpanded && (
//                     <div className="text-sm text-gray-400 flex gap-4 ml-4">
//                       <span className="text-white font-medium">{row.channelId || 'No Channel'}</span>
//                       <span className="truncate w-64 block">{row.targetUrls || 'No URLs'}</span>
//                       <span className={`${isCompleted ? 'text-green-500' : 'text-[#5842ff]'} flex items-center gap-1`}><Clock size={14} /> {formatDateTimeAMPM(row.overrideTime) || 'No Time'}</span>
//                     </div>
//                   )}
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <button onClick={(e) => { e.stopPropagation(); removeRow(row.id); }} className="p-1.5 text-gray-500 hover:text-red-500 rounded"><X size={18} /></button>
//                   {row.isExpanded ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
//                 </div>
//               </div>

//               {row.isExpanded && (
//                 <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
//                   <div>
//                     <label className="block text-xs font-semibold text-gray-500 mb-1">Channel ID</label>
//                     <input type="text" className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.channelId} onChange={(e) => updateRow(row.id, 'channelId', e.target.value)} />
//                   </div>
                  
//                   <div className="md:col-span-2">
//                     <label className="block text-xs font-semibold text-gray-500 mb-1">Target URLs <span className="font-normal text-gray-600">(Paste links, auto-formats with | )</span></label>
//                     <input type="text" className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.targetUrls} onChange={(e) => updateRow(row.id, 'targetUrls', e.target.value)} onBlur={(e) => handleUrlBlur(row.id, e.target.value)} />
//                   </div>
                  
//                   <div>
//                     <label className="block text-xs font-semibold text-gray-500 mb-1">Override Time</label>
//                     <input type="datetime-local" className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.overrideTime} onChange={(e) => updateRow(row.id, 'overrideTime', e.target.value)} />
//                   </div>
                  
//                   <div>
//                     <label className="block text-xs font-semibold text-gray-500 mb-1">Target Server</label>
//                     <div className="flex gap-2">
//                       <select className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] cursor-pointer" value={PREDEFINED_SERVERS.includes(row.targetServer) ? row.targetServer : 'Custom'} onChange={(e) => updateRow(row.id, 'targetServer', e.target.value === 'Custom' ? 'Custom Server' : e.target.value)}>
//                         {PREDEFINED_SERVERS.map(s => <option key={s} value={s}>{s}</option>)}
//                         <option value="Custom">Custom...</option>
//                       </select>
//                       {!PREDEFINED_SERVERS.includes(row.targetServer) && <input type="text" placeholder="Type..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.targetServer === 'Custom Server' ? '' : row.targetServer} onChange={(e) => updateRow(row.id, 'targetServer', e.target.value)} />}
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-semibold text-gray-500 mb-1">Speed / Quality</label>
//                     <div className="flex gap-2">
//                       <select className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] cursor-pointer" value={PREDEFINED_QUALITIES.includes(row.quality) ? row.quality : 'Custom'} onChange={(e) => updateRow(row.id, 'quality', e.target.value === 'Custom' ? 'Custom Quality' : e.target.value)}>
//                         {PREDEFINED_QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
//                         <option value="Custom">Custom...</option>
//                       </select>
//                       {!PREDEFINED_QUALITIES.includes(row.quality) && <input type="text" placeholder="Type..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.quality === 'Custom Quality' ? '' : row.quality} onChange={(e) => updateRow(row.id, 'quality', e.target.value)} />}
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-semibold text-gray-500 mb-1">Duration</label>
//                     <div className="flex gap-2">
//                       <select className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff] cursor-pointer" value={PREDEFINED_DURATIONS.includes(row.duration) ? row.duration : 'Custom'} onChange={(e) => updateRow(row.id, 'duration', e.target.value === 'Custom' ? 'Custom Duration' : e.target.value)}>
//                         {PREDEFINED_DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
//                         <option value="Custom">Custom...</option>
//                       </select>
//                       {!PREDEFINED_DURATIONS.includes(row.duration) && <input type="text" placeholder="Type..." className="w-full bg-[#0A0A0C] border border-gray-700 rounded p-2 text-white outline-none focus:border-[#5842ff]" value={row.duration === 'Custom Duration' ? '' : row.duration} onChange={(e) => updateRow(row.id, 'duration', e.target.value)} />}
//                     </div>
//                   </div>

//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>

//       <div className="fixed bottom-0 left-0 w-full bg-[#0A0A0C]/90 backdrop-blur-sm border-t border-gray-800 p-4 flex justify-between items-center px-6 z-50">
//         <button onClick={addRow} className="flex items-center gap-2 px-5 py-2.5 bg-transparent border border-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 transition">
//           <Plus size={18} /> Add Empty Row
//         </button>
//         <button onClick={generateCSV} className="flex items-center gap-2 px-6 py-2.5 bg-[#5842ff] hover:bg-[#4635d8] text-white font-medium rounded-lg transition shadow-[0_0_15px_rgba(88,66,255,0.4)]">
//           <Copy size={18} /> Generate & Copy CSV
//         </button>
//       </div>
//     </div>
//   );
// }
