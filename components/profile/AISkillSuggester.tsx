'use client';

import * as React from 'react';
import { Sparkles, Loader2, Check, Plus } from 'lucide-react';

interface Suggestion {
  skill: string;
  reason: string;
}

interface AISkillSuggesterProps {
  bio: string;
  name: string;
  currentSkills: string[];
  onAddSkill: (skill: string) => void;
}

export function AISkillSuggester({ bio, name, currentSkills, onAddSkill }: AISkillSuggesterProps) {
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const [addedSkills, setAddedSkills] = React.useState<string[]>([]);

  const fetchSuggestions = async () => {
    if (!bio || bio.trim().length < 5) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/suggest-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, name }),
      });
      const result = await res.json();
      if (result.success && result.data?.suggestions) {
        // Filter out skills user already has
        const filtered = result.data.suggestions.filter(
          (s: Suggestion) => !currentSkills.includes(s.skill)
        );
        setSuggestions(filtered);
      }
    } catch (e) {
      console.error('Skill suggestion failed:', e);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  };

  const handleAdd = (skill: string) => {
    onAddSkill(skill);
    setAddedSkills((prev) => [...prev, skill]);
  };

  if (!bio || bio.trim().length < 5) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)',
      border: '1px solid #C7D2FE',
      borderRadius: 12,
      padding: '16px',
      marginTop: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles style={{ width: 14, height: 14, color: '#7C3AED' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#4C1D95', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            AI Skill Suggestions
          </span>
        </div>
        {!hasLoaded && !isLoading && (
          <button
            type="button"
            onClick={fetchSuggestions}
            style={{
              fontSize: 12, fontWeight: 600, color: '#7C3AED',
              background: 'white', border: '1px solid #C4B5FD',
              borderRadius: 20, padding: '4px 12px', cursor: 'pointer',
            }}
          >
            Suggest from bio →
          </button>
        )}
      </div>

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7C3AED', fontSize: 13 }}>
          <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
          <span>AI analysing your bio...</span>
        </div>
      )}

      {hasLoaded && suggestions.length === 0 && !isLoading && (
        <p style={{ fontSize: 13, color: '#6B7280' }}>No new suggestions — you've already covered the relevant skills!</p>
      )}

      {suggestions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {suggestions.map((s) => {
            const isAdded = addedSkills.includes(s.skill);
            return (
              <div
                key={s.skill}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'white', borderRadius: 8, padding: '10px 12px',
                  border: '1px solid #E0E7FF',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1E1B4B', margin: 0 }}>{s.skill}</p>
                  <p style={{ fontSize: 12, color: '#6B7280', margin: 0, marginTop: 2, lineHeight: 1.4 }}>{s.reason}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdd(s.skill)}
                  disabled={isAdded}
                  style={{
                    marginLeft: 12, width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: isAdded ? '#D1FAE5' : '#7C3AED',
                    color: isAdded ? '#065F46' : 'white',
                    border: 'none', cursor: isAdded ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {isAdded ? <Check style={{ width: 14, height: 14 }} /> : <Plus style={{ width: 14, height: 14 }} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
