import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, RefreshCw } from 'lucide-react';

interface RecorderProps {
  onAnalyze: (audioBase64: string) => void;
  isAnalyzing: boolean;
}

const Recorder: React.FC<RecorderProps> = ({ onAnalyze, isAnalyzing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // Timer Effect
  useEffect(() => {
    if (isRecording) {
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Visualizer function
  const visualize = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = '#f8fafc'; // Match bg
    ctx.fillRect(0, 0, width, height);

    const barWidth = (width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      barHeight = dataArray[i] / 2;

      // Gradient bars
      const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
      gradient.addColorStop(0, '#6366f1'); // Indigo 500
      gradient.addColorStop(1, '#818cf8'); // Indigo 400

      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }

    animationRef.current = requestAnimationFrame(visualize);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Visualizer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // Use generic webm, converts to WAV logic later
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        
        // Convert to Base64 for API
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          onAnalyze(base64String);
        };
        
        // Cleanup visualizer
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioURL(null);
      visualize();

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone permission is required.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center space-y-6">
      
      {/* Visualizer Canvas */}
      <div className="w-full h-24 bg-slate-50 rounded-lg overflow-hidden relative border border-gray-100">
        <canvas ref={canvasRef} width="600" height="100" className="w-full h-full" />
        {!isRecording && !isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm pointer-events-none">
                {audioURL ? 'Processing Complete' : 'Waiting for audio...'}
            </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2">
        <h3 className="text-lg font-medium text-gray-700">
            {isRecording ? "Listening to Customer..." : "Ready to Record"}
        </h3>
        <p className="text-sm text-gray-400 font-mono h-5">
            {isRecording ? formatTime(elapsed) : ""}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all transform active:scale-95 shadow-lg ${
                isAnalyzing 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
            }`}
          >
            {isAnalyzing ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Analyzing...
                </>
            ) : (
                <>
                    <Mic className="w-5 h-5" /> Start Recording
                </>
            )}
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-8 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-full font-semibold transition-all transform active:scale-95 shadow-lg shadow-gray-300"
          >
            <Square className="w-5 h-5 fill-current" /> Stop & Analyze
          </button>
        )}
      </div>
      
      {isAnalyzing && (
          <p className="text-xs text-indigo-500 animate-pulse font-medium">
              Sending audio to NLP Pipeline...
          </p>
      )}
    </div>
  );
};

export default Recorder;