import React, { useCallback, useState } from 'react';
import { UploadCloud, FileAudio, Loader2, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onAnalyze: (base64Audio: string) => void;
  isAnalyzing: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onAnalyze, isAnalyzing }) => {
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const processFile = (file: File) => {
    setError(null);
    if (!file.type.includes('audio') && !file.name.endsWith('.wav')) {
      setError('Please upload a valid audio file (WAV format recommended).');
      return;
    }
    
    // Limit file size ~10MB to be safe for browser base64 handling, though Gemini supports more
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Please upload a file smaller than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      onAnalyze(base64);
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsDataURL(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors ${
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:bg-gray-50'
        } ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept=".wav,audio/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isAnalyzing}
        />
        
        <div className="bg-indigo-100 p-4 rounded-full mb-4">
          {isAnalyzing ? (
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8 text-indigo-600" />
          )}
        </div>
        
        {isAnalyzing ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Analyzing Call...</h3>
            <p className="text-sm text-gray-500 mt-2">Diarizing speakers and generating insights.</p>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Upload Call Recording</h3>
            <p className="text-sm text-gray-500 mt-2">Drag & drop or click to select a .wav file</p>
            <p className="text-xs text-gray-400 mt-1">Speaker Diarization + Sentiment & Intent Analysis</p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUploader;