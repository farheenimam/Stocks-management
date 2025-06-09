import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TradingCompetition {
  competition_id: number;
  competition_name: string;
  description: string;
  start_date: string;
  end_date: string;
  entry_fee: string;
  prize_pool: string;
  max_participants: number;
  competition_type: string;
  rules: string;
  status: string;
  created_at: string;
}

interface CompetitionParticipant {
  participant_id: number;
  competition_id: number;
  user_id: number;
  entry_date: string;
  current_portfolio_value: string;
  rank: number;
  is_active: boolean;
  username: string;
  competition_name: string;
}

export default function Competitions() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null);

  const { data: competitions, isLoading: competitionsLoading } = useQuery<TradingCompetition[]>({
    queryKey: ['/api/competitions'],
    enabled: !!user
  });

  const { data: myParticipations } = useQuery<CompetitionParticipant[]>({
    queryKey: ['/api/competitions/my-participations'],
    enabled: !!user
  });

  const { data: leaderboard } = useQuery<CompetitionParticipant[]>({
    queryKey: ['/api/competitions/leaderboard', selectedCompetition],
    enabled: !!selectedCompetition
  });

  const joinCompetitionMutation = useMutation({
   mutationFn: async (competitionId: number) => {
      return await apiRequest('POST', `/api/competitions/${competitionId}/join`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully joined the competition!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/competitions/my-participations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join competition",
        variant: "destructive",
      });
    }
  });

  const isParticipating = (competitionId: number) => {
    return myParticipations?.some(p => p.competition_id === competitionId) || false;
  };

  if (competitionsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Trading Competitions</h1>
        <p className="text-muted-foreground">
          Compete with other traders and win prizes
        </p>
      </div>

      {/* My Participations */}
      {myParticipations && myParticipations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">My Competitions</h2>
          <div className="grid gap-4">
            {myParticipations.map((participation) => (
              <div key={participation.participant_id} className="trading-card p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{participation.competition_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Joined: {formatDate(participation.entry_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      Rank #{participation.rank}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(participation.current_portfolio_value)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded text-xs ${
                    participation.is_active 
                      ? 'bg-success-green/20 text-success-green' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {participation.is_active ? 'Active' : 'Completed'}
                  </span>
                  <button
                    onClick={() => setSelectedCompetition(participation.competition_id)}
                    className="text-primary hover:underline text-sm"
                  >
                    View Leaderboard
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Competitions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Available Competitions</h2>
        {competitions && competitions.length > 0 ? (
          <div className="grid gap-6">
            {competitions.map((competition) => (
              <div key={competition.competition_id} className="trading-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {competition.competition_name}
                    </h3>
                    <p className="text-muted-foreground mb-3">{competition.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Start Date</p>
                        <p className="font-medium">{formatDate(competition.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">End Date</p>
                        <p className="font-medium">{formatDate(competition.end_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Entry Fee</p>
                        <p className="font-medium">{formatCurrency(competition.entry_fee)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Prize Pool</p>
                        <p className="font-medium text-success-green">
                          {formatCurrency(competition.prize_pool)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground mb-1">Rules:</p>
                      <p className="text-sm text-muted-foreground">{competition.rules}</p>
                    </div>
                  </div>
                  
                  <div className="ml-6 text-right">
                    <span className={`px-3 py-1 rounded text-sm mb-3 inline-block ${
                      competition.status === 'ACTIVE' 
                        ? 'bg-success-green/20 text-success-green' 
                        : competition.status === 'UPCOMING'
                        ? 'bg-sky-blue/20 text-sky-blue'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {competition.status}
                    </span>
                    
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="font-medium">{competition.competition_type}</p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground">Max Participants</p>
                      <p className="font-medium">{competition.max_participants}</p>
                    </div>

                    {isAuthenticated && competition.status === 'ACTIVE' && !isParticipating(competition.competition_id) && (
                      <button
                        onClick={() => joinCompetitionMutation.mutate(competition.competition_id)}
                        disabled={joinCompetitionMutation.isPending}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
                      >
                        {joinCompetitionMutation.isPending ? 'Joining...' : 'Join Competition'}
                      </button>
                    )}
                    
                    {isParticipating(competition.competition_id) && (
                      <span className="text-success-green text-sm">✓ Participating</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="trading-card p-8 text-center">
            <p className="text-muted-foreground">No competitions available at the moment</p>
          </div>
        )}
      </div>

      {/* Leaderboard Modal */}
      {selectedCompetition && leaderboard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Competition Leaderboard</h3>
              <button
                onClick={() => setSelectedCompetition(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {leaderboard.map((participant, index) => (
                <div key={participant.participant_id} className="flex items-center justify-between p-3 trading-card">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-accent-gold text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {participant.rank}
                    </span>
                    <span className="font-medium">{participant.username}</span>
                  </div>
                  <span className="font-bold text-foreground">
                    {formatCurrency(participant.current_portfolio_value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}