import React from 'react';
import { CallAnalysisResult, ConversationTurn } from '../types';
import { User, Headphones, Activity, Target, MessageSquare, Shield, Star } from 'lucide-react';

interface CallAnalysisViewProps {
  data: CallAnalysisResult | null;
}

const CallAnalysisView: React.FC<CallAnalysisViewProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Summary (Could be expanded later) */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
         <h3 className="text-lg font-semibold text-gray-800">Conversation Transcript & Insights</h3>
         <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {data.conversation.length} Turns
         </span>
      </div>

      <div className="space-y-6">
        {data.conversation.map((turn, idx) => (
          <TurnRow key={idx} turn={turn} />
        ))}
      </div>
    </div>
  );
};

const TurnRow: React.FC<{ turn: ConversationTurn }> = ({ turn }) => {
  const isCustomer = turn.speaker === 'Customer';

  return (
    <div className={`flex gap-4 ${isCustomer ? '' : 'flex-row-reverse'}`}>
      
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm z-10 ${
        isCustomer ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'
      }`}>
        {isCustomer ? <User className="w-5 h-5" /> : <Headphones className="w-5 h-5" />}
      </div>

      {/* Message Bubble + Analysis Container */}
      <div className={`flex flex-col max-w-[85%] ${isCustomer ? 'items-start' : 'items-end'}`}>
        
        {/* Name Label */}
        <span className="text-xs text-gray-400 font-medium mb-1 px-1">
          {turn.speaker}
        </span>

        {/* Text Bubble */}
        <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
          isCustomer 
            ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-none' 
            : 'bg-indigo-600 text-white rounded-tr-none'
        }`}>
          {turn.text}
        </div>

        {/* Analysis Panel (Only for Customer Turns) */}
        {isCustomer && (turn.sentiment || turn.intent || turn.suggestions) && (
          <div className="mt-3 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative overflow-hidden">
             {/* Decorative side accent */}
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-indigo-500"></div>
             
             {/* Metadata Row */}
             <div className="flex flex-wrap gap-2 mb-2">
                {turn.sentiment && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${
                    turn.sentiment === 'Negative' || turn.sentiment === 'Angry' ? 'bg-red-50 text-red-700 border-red-200' :
                    turn.sentiment === 'Positive' ? 'bg-green-50 text-green-700 border-green-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    <Activity className="w-3 h-3" /> {turn.sentiment}
                  </span>
                )}
                {turn.intent && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <Target className="w-3 h-3" /> {turn.intent}
                  </span>
                )}
             </div>
             
             {/* Entities */}
             {turn.entities && turn.entities.length > 0 && (
                 <div className="flex flex-wrap gap-1">
                    {turn.entities.map((ent, i) => (
                        <span key={i} className="text-xs text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded">
                            {ent.name} <span className="opacity-50">({ent.category})</span>
                        </span>
                    ))}
                 </div>
             )}

             {/* AI Suggestions for Rep (The "Pop-up" content) */}
             {turn.suggestions && (
               <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Suggested Questions */}
                  <div>
                    <h5 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Suggested Questions
                    </h5>
                    <ul className="space-y-1">
                        {turn.suggestions.questions?.map((q, i) => (
                            <li key={i} className="text-xs text-indigo-900 bg-indigo-50/50 p-1.5 rounded border border-indigo-100/50">
                                • {q}
                            </li>
                        ))}
                    </ul>
                  </div>

                  {/* Objection/Recommendation */}
                  <div className="space-y-3">
                     {turn.suggestions.objectionHandler && (
                        <div>
                            <h5 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Shield className="w-3 h-3" /> Objection Handling
                            </h5>
                            <p className="text-xs text-gray-700 bg-white p-2 rounded border border-gray-100">
                                {turn.suggestions.objectionHandler}
                            </p>
                        </div>
                     )}
                     {turn.suggestions.recommendation && (
                         <div>
                            <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Star className="w-3 h-3" /> Recommendation
                            </h5>
                            <p className="text-xs text-gray-700 bg-white p-2 rounded border border-gray-100">
                                {turn.suggestions.recommendation}
                            </p>
                        </div>
                     )}
                  </div>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CallAnalysisView;