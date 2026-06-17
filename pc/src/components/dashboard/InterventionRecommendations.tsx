import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Wind, Brain, Footprints, Heart } from 'lucide-react';
import { db } from '../../db';
import { getRecommendations, type Recommendation } from '../../services/emotion/InterventionRecommendationService';
import type { HealthProfile } from '../../db/models';

const typeIcons: Record<string, typeof Wind> = {
  breathing: Wind,
  mindfulness: Brain,
  thoughtRecord: Heart,
  activity: Footprints,
};

export default function InterventionRecommendations() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    const load = async () => {
      const profile = await db.healthProfiles.orderBy('date').last();
      const recs = getRecommendations(profile || null);
      setRecommendations(recs);
    };
    load();
  }, []);

  if (recommendations.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-teal-500" />
        为你推荐
      </h3>
      <div className="space-y-2">
        {recommendations.map((rec) => {
          const Icon = typeIcons[rec.type] || Sparkles;
          return (
            <button
              key={rec.id}
              onClick={() => navigate(rec.route)}
              className="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-sm text-text-primary">{rec.title}</span>
                    <span className="text-xs text-text-muted">{rec.estimatedTime}</span>
                  </div>
                  <p className="text-xs text-text-secondary truncate">{rec.reason}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
