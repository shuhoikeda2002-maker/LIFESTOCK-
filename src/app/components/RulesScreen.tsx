import { Button } from './ui/button';
import { X, TrendingUp, Users, Target, Coins, RefreshCw } from 'lucide-react';

interface RulesScreenProps {
  onClose: () => void;
}

export function RulesScreen({ onClose }: RulesScreenProps) {
  return (
    <div className="h-full w-full bg-white text-slate-900 overflow-hidden relative p-4 flex flex-col">
      {/* 背景装飾 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-50 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-50 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 w-1 h-6 rounded-full"></div>
            <h2 className="text-xl font-black tracking-tight text-slate-900">
              遊び方ガイド
            </h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:bg-slate-50 h-8 w-8"
          >
            <X className="size-5" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Main Flow (Scrollable) */}
          <div className="flex-[1.5] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            
            {/* 1. 目的と基本ルール */}
            <section className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
              <h3 className="text-sm font-black text-blue-700 mb-2 flex items-center gap-2">
                <Target className="size-4" /> 1. ゲームの目的
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-bold">
                投資の駆け引きを通じて、他プレイヤーの<span className="text-blue-600">価値観や人生観</span>を読み解きます。
                全ラウンド終了時に、<span className="bg-blue-600 text-white px-1 rounded">所持ポイントが最も多い人</span>が優勝です！
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded-xl border border-blue-100 flex items-center gap-2">
                  <Coins className="size-4 text-amber-500" />
                  <div className="text-[10px] font-black">初期：<span className="text-blue-600">10,000 pt</span></div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-blue-100 flex items-center gap-2">
                  <Users className="size-4 text-indigo-500" />
                  <div className="text-[10px] font-black">役割：<span className="text-blue-600">カンパニー 1名 + 投資家</span></div>
                </div>
              </div>
            </section>

            {/* 2. ゲームの流れ */}
            <section className="space-y-3">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">ゲームの流れ</h3>
              
              <div className="grid grid-cols-1 gap-2">
                {[
                  { num: "①", title: "お題決定", text: "人生の「幸福度」や「モテ度」などのお題を決定します。" },
                  { num: "②", title: "グラフ作成（カンパニーのみ）", text: "年齢×スコア(0-100)のグラフを作成。投資家には非公開です。" },
                  { num: "③", title: "質問タイム", text: "投資家はカンパニーに自由に3分間、自由に質問して情報を引き出します。" },
                  { num: "④", title: "投資判断（投資家）", text: "グラフを見ないまま「投資ポイント」「買い年齢」「売り年齢」を入力します。" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-blue-600 font-black text-xs">{item.num}</span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900">{item.title}</h4>
                      <p className="text-slate-500 text-[10px] leading-tight mt-0.5">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Core Mechanics */}
          <div className="flex-1 space-y-3 overflow-hidden flex flex-col">
            
            {/* ポイント計算と空売り */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-4 shadow-xl flex-1 flex flex-col justify-center">
              <div>
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <TrendingUp className="size-3" /> ポイント計算
                </h4>
                <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                  <div className="text-[9px] font-bold text-white/80 leading-relaxed">
                    投資pt × 買いから売りの増加率
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[8px] text-blue-300 font-bold italic">
                    例：1000pt投資、買い40pt、売り80ptの場合<br/>
                    1,000 × 2 = 2,000pt獲得！
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <RefreshCw className="size-3" /> 特殊ルール
                </h4>
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-600 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                    空売り可能
                  </div>
                  <p className="text-[9px] text-white/60 font-medium leading-tight">
                    買い年齢が高齢で、売り年齢が若くてもOK。<span className="text-indigo-300">「下がると予想」</span>した時に有効です。
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm h-12 rounded-xl shadow-lg transition-all active:scale-95 flex-shrink-0"
            >
              ルールを理解した！
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
