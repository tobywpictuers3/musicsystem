import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Target, Award } from 'lucide-react';
import { getStudentMedalRecords, getStudentBestAchievements } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { MedalRecord } from '@/lib/types';

interface MedalCollectionProps {
  studentId: string;
}

const MedalCollection = ({ studentId }: MedalCollectionProps) => {
  const [medals, setMedals] = useState<MedalRecord[]>([]);
  const [bestAchievements, setBestAchievements] = useState({
    bestDailyAverage: 0,
    bestDailyMinutes: 0,
    bestStreak: 0,
  });

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = () => {
    const records = getStudentMedalRecords(studentId);
    setMedals(records);
    
    const best = getStudentBestAchievements(studentId);
    setBestAchievements(best);
  };

  const getMedalIcon = (level: string) => {
    switch (level) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      case 'diamond': return '💠';
      case 'streak3': return '🔥';
      case 'streak5': return '⚡';
      case 'streak7': return '👑';
      default: return '🏅';
    }
  };

  const getMedalName = (level: string) => {
    switch (level) {
      case 'bronze': return 'מדליית נחושת';
      case 'silver': return 'מדליית כסף';
      case 'gold': return 'מדליית זהב';
      case 'platinum': return 'מדליית פלטינום';
      case 'diamond': return 'מדליית יהלום';
      case 'streak3': return 'מדליית רצוף';
      case 'streak5': return 'מדליית מרוצף';
      case 'streak7': return 'מדליית מרצפת';
      default: return 'מדליה';
    }
  };

  const getMedalDescription = (medal: MedalRecord) => {
    if (medal.medalType === 'duration') {
      return `${medal.minutes} דקות אימון`;
    } else {
      return `${medal.streakDays} ימים רצופים`;
    }
  };

  const groupedByMonth = medals.reduce((acc, medal) => {
    const month = medal.earnedDate.slice(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(medal);
    return acc;
  }, {} as Record<string, MedalRecord[]>);

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="space-y-6">
      {/* Best Achievements */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-2 border-yellow-400/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <Award className="h-6 w-6" />
            🏆 ההישגים הגבוהים ביותר שלי 🏆
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/60 dark:bg-black/20 rounded-lg border-2 border-blue-300">
              <div className="text-sm text-muted-foreground mb-2">ממוצע יומי מקסימלי</div>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {bestAchievements.bestDailyAverage.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">דקות</div>
            </div>
            <div className="text-center p-4 bg-white/60 dark:bg-black/20 rounded-lg border-2 border-green-300">
              <div className="text-sm text-muted-foreground mb-2">שיא אימון יומי</div>
              <div className="text-3xl font-bold text-green-600 mb-1">
                {bestAchievements.bestDailyMinutes}
              </div>
              <div className="text-sm text-muted-foreground">דקות</div>
            </div>
            <div className="text-center p-4 bg-white/60 dark:bg-black/20 rounded-lg border-2 border-orange-300">
              <div className="text-sm text-muted-foreground mb-2">רצף מקסימלי</div>
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {bestAchievements.bestStreak}
              </div>
              <div className="text-sm text-muted-foreground">ימים</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medal Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            אוסף המדליות שלי
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedByMonth).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedByMonth)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, monthMedals]) => (
                  <div key={month} className="space-y-3">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {formatMonth(month)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {monthMedals.map((medal) => (
                        <div
                          key={medal.id}
                          className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/10 dark:to-orange-950/10 border border-yellow-200 dark:border-yellow-800"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-4xl">{getMedalIcon(medal.level)}</span>
                            <div className="flex-1">
                              <div className="font-semibold">{getMedalName(medal.level)}</div>
                              <div className="text-sm text-muted-foreground">
                                {getMedalDescription(medal)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(medal.earnedDate).toLocaleDateString('he-IL')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              עדיין אין מדליות. המשיכי להתאמן כדי לזכות במדליות!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MedalCollection;
