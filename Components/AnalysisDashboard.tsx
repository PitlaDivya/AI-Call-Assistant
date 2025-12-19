import React from 'react';
import { AnalysisResult } from '../types';
import { 
  Smile, 
  Frown, 
  Meh, 
  Target, 
  Tag, 
  MessageCircle, 
  ShieldAlert, 
  ShoppingBag,
  Activity,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface AnalysisDashboardProps {
  data: AnalysisResult | null;
  loading: boolean;
  onSelectSuggestion?: (text: string) => void;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ data, loading, onSelectSuggestion }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 animate-pulse">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Processing Audio...</p>
        <div className="text-sm text-gray-400">Analyzing Sentiment • Extracting Intents • Generating Suggestions</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
        <Activity className="w-12 h-12 text-gray-300 mb-2" />
        <p className="text-gray-400 font-medium">No analysis data yet.</p>
        <p className="text-sm text-gray-400">Record audio to see AI insights here.</p>
      </div>
    );
  }

  // Sentiment Helper
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'Negative': return 'text-red-600 bg-red-50 border-red-200';
      case 'Angry': return 'text-red-700 bg-red-100 border-red-300';
      case 'Confused': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return <Smile className="w-6 h-6" />;
      case 'Negative': 
      case 'Angry': return <Frown className="w-6 h-6" />;
      case 'Confused': return <HelpCircle className="w-6 h-6" />;
      default: return <Meh className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sentiment Card */}
        <div className={`p-4 rounded-xl border border-l-4 shadow-sm flex items-center justify-between ${getSentimentColor(data.sentiment).replace('text-', 'border-l-')}`}>
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Sentiment</p>
              <h3 className={`text-2xl font-bold ${getSentimentColor(data.sentiment).split(' ')[0]}`}>{data.sentiment}</h3>
              <p className="text-xs text-gray-400 mt-1">Score: {data.sentimentScore}/100</p>
            </div>
            <div className={`p-3 rounded-full ${getSentimentColor(data.sentiment)}`}>
              {getSentimentIcon(data.sentiment)}
            </div>
        </div>

        {/* Intent Card */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 border-l-4 border-l-blue-500 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Detected Intent</p>
            <h3 className="text-lg font-bold text-gray-800 leading-tight">{data.intent}</h3>
          </div>
          <div className="p-3 rounded-full bg-blue-50 text-blue-600">
            <Target className="w-6 h-6" />
          </div>
        </div>

        {/* Entities Count Card */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 border-l-4 border-l-purple-500 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Entities Found</p>
            <h3 className="text-2xl font-bold text-gray-800">{data.entities.length}</h3>
          </div>
          <div className="p-3 rounded-full bg-purple-50 text-purple-600">
            <Tag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Transcription & Entities */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Transcription */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-gray-500" />
              Latest Customer Transcription
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 italic border border-gray-100">
              "{data.transcription}"
            </div>
          </div>

          {/* AI Suggestions (The "Tips Pop-up") */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden ring-4 ring-indigo-50">
             <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-indigo-600"></div>
             <h4 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
               <span className="bg-indigo-100 p-1 rounded">✨</span> Recommended Replies (Select to Use)
             </h4>
             <ul className="space-y-3">
               {data.suggestedQuestions.map((q, idx) => (
                 <li key={idx}>
                   <button 
                    onClick={() => onSelectSuggestion && onSelectSuggestion(q)}
                    className="w-full text-left flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 hover:shadow-md hover:bg-indigo-100 transition-all duration-200 group"
                   >
                      <span className="flex-shrink-0 w-6 h-6 bg-indigo-200 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">{idx + 1}</span>
                      <div className="flex-grow">
                        <span className="text-indigo-900 font-medium block">{q}</span>
                        <span className="text-xs text-indigo-400 mt-1 hidden group-hover:inline-block">Click to select this response</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity self-center"/>
                   </button>
                 </li>
               ))}
             </ul>
          </div>

           {/* Objection Handling */}
           {data.objectionHandling.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h4 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-orange-500" />
                Objection Handling
              </h4>
              <div className="space-y-2">
                {data.objectionHandling.map((tip, idx) => (
                  <div key={idx} className="p-3 bg-orange-50 text-orange-800 rounded-lg border border-orange-100 text-sm">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Entities & Recommendations */}
        <div className="space-y-6">
          
          {/* Entity Extraction */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-gray-500" />
              Extracted Entities
            </h4>
            {data.entities.length === 0 ? (
               <p className="text-gray-400 text-sm">No entities detected.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.entities.map((entity, idx) => (
                  <div key={idx} className="flex flex-col bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-500 uppercase font-bold">{entity.category}</span>
                    <span className="text-gray-800 font-medium">{entity.name}</span>
                    {entity.value && <span className="text-xs text-gray-600">{entity.value}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Recommendations */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gray-500" />
              Recommendations
            </h4>
            {data.productRecommendations && data.productRecommendations.length > 0 ? (
              <ul className="space-y-2">
                {data.productRecommendations.map((rec, idx) => (
                   <li key={idx} className="flex items-center gap-2 text-gray-700 bg-emerald-50 p-2 rounded border border-emerald-100">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                     <span className="text-sm font-medium">{rec}</span>
                   </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-400 text-sm italic">
                No specific product recommendations.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;