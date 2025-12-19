import React, { useState, useRef, useEffect } from 'react';
import { Phone, History, UploadCloud, Mic2, BarChart2, Layers } from 'lucide-react';
import { AppTab, AnalysisResult, CallAnalysisResult, ConversationTurn } from './types';
import Recorder from './components/Recorder';
import AnalysisDashboard from './components/AnalysisDashboard';
import FileUploader from './components/FileUploader';
import CallAnalysisView from './components/CallAnalysisView';
import { analyzeAudio, analyzeCallRecording } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.LIVE_ASSISTANT);
  
  // State for Live Tab
  const [liveData, setLiveData] = useState<AnalysisResult | null>(null);
  const [isLiveAnalyzing, setIsLiveAnalyzing] = useState(false);
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // State for Upload Tab
  const [uploadData, setUploadData] = useState<CallAnalysisResult | null>(null);
  const [isUploadAnalyzing, setIsUploadAnalyzing] = useState(false);

  // Auto-scroll history
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleLiveAnalysis = async (audioBase64: string) => {
    setIsLiveAnalyzing(true);
    // Don't clear liveData immediately to prevent flash, only clear if we want to reset view
    try {
      // Pass existing history to Gemini for context
      const result = await analyzeAudio(audioBase64, conversation);
      
      setLiveData(result);
      
      // Append the new Customer turn to history
      const newTurn: ConversationTurn = {
        speaker: 'Customer',
        text: result.transcription,
        sentiment: result.sentiment,
        intent: result.intent,
        entities: result.entities,
        suggestions: {
           questions: result.suggestedQuestions,
           objectionHandler: result.objectionHandling?.[0],
           recommendation: result.productRecommendations?.[0]
        }
      };
      
      setConversation(prev => [...prev, newTurn]);

    } catch (error) {
      console.error(error);
      alert("Failed to analyze audio. Please check your API key.");
    } finally {
      setIsLiveAnalyzing(false);
    }
  };

  const handleRepResponse = (text: string) => {
    // Add Sales Rep turn to history
    const newTurn: ConversationTurn = {
        speaker: 'Sales Rep',
        text: text
    };
    setConversation(prev => [...prev, newTurn]);
    
    // Optionally we could clear liveData here if we want to hide the dashboard,
    // but keeping it visible acts as a reference until the next customer speech.
    // However, scrolling to bottom will show the Rep's response.
  };

  const handleUploadAnalysis = async (audioBase64: string) => {
    setIsUploadAnalyzing(true);
    setUploadData(null);
    try {
      const result = await analyzeCallRecording(audioBase64);
      setUploadData(result);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze recording. Please check file format and API key.");
    } finally {
      setIsUploadAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f6] text-gray-800 font-sans">
      
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">AI Call Assistant</h1>
            </div>
            
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                AG
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tab Selector */}
        <div className="flex space-x-8 border-b border-gray-300 mb-8">
          <button
            onClick={() => setActiveTab(AppTab.LIVE_ASSISTANT)}
            className={`pb-4 px-1 flex items-center gap-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
              activeTab === AppTab.LIVE_ASSISTANT
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Mic2 className="w-4 h-4" />
            Live Assistant
          </button>
          <button
            onClick={() => setActiveTab(AppTab.UPLOAD_ANALYSIS)}
            className={`pb-4 px-1 flex items-center gap-2 text-sm font-medium transition-colors duration-200 border-b-2 ${
              activeTab === AppTab.UPLOAD_ANALYSIS
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload & Analyze
          </button>
        </div>

        {/* Content Area */}
        {activeTab === AppTab.LIVE_ASSISTANT ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar / Left Panel - Recorder & Status */}
            <div className="lg:col-span-1 space-y-6">
              <div className="sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Control</h2>
                <Recorder onAnalyze={handleLiveAnalysis} isAnalyzing={isLiveAnalyzing} />
                
                {/* Pipeline Visualization */}
                <div className="mt-8 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Pipeline Status</h3>
                    <div className="space-y-4 relative">
                        <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-100"></div>
                        <div className="relative flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${isLiveAnalyzing ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                                <Mic2 className="w-3 h-3" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Audio Capture</span>
                        </div>
                        <div className="relative flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${isLiveAnalyzing ? 'bg-indigo-500 animate-pulse' : 'bg-gray-100'}`}>
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                            <span className={`text-sm font-medium ${isLiveAnalyzing ? 'text-indigo-600' : 'text-gray-400'}`}>Processing</span>
                        </div>
                    </div>
                </div>
                
                {conversation.length > 0 && (
                   <button 
                    onClick={() => {
                        setConversation([]);
                        setLiveData(null);
                    }}
                    className="w-full py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                   >
                    Reset Conversation
                   </button>
                )}
              </div>
            </div>

            {/* Main Content - History & Analysis Dashboard */}
            <div className="lg:col-span-3 flex flex-col gap-6">
               
               {/* Conversation History */}
               {conversation.length > 0 && (
                 <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Conversation History</h3>
                    <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 custom-scrollbar" ref={scrollRef}>
                        <CallAnalysisView data={{ conversation }} />
                    </div>
                 </div>
               )}

               {/* Active Analysis Dashboard (Only show if we have data) */}
               <div>
                   <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Real-Time Insights</h2>
                      {liveData && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Analysis Complete</span>
                      )}
                   </div>
                   <AnalysisDashboard 
                        data={liveData} 
                        loading={isLiveAnalyzing} 
                        onSelectSuggestion={handleRepResponse} 
                   />
               </div>
            </div>

          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
               <h2 className="text-2xl font-bold text-gray-900 mb-2">Post-Call Analysis</h2>
               <p className="text-gray-500">Upload a recording to identify speakers, analyze sentiment, and review AI suggestions for the rep.</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
               <FileUploader onAnalyze={handleUploadAnalysis} isAnalyzing={isUploadAnalyzing} />
            </div>

            {uploadData && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <CallAnalysisView data={uploadData} />
              </div>
            )}
            
            {!uploadData && !isUploadAnalyzing && (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                 <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                 <p className="text-gray-400 font-medium">No analysis data yet.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;