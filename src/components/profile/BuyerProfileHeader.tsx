
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ExperienceBadge } from './ExperienceBadge';
import { 
  User, 
  Calendar, 
  Edit,
  Target
} from 'lucide-react';
import { ExperienceLevelInfo } from '@/utils/profileUtils';

interface BuyerProfileHeaderProps {
  profile: {
    avatar_url?: string | null;
    full_name?: string | null;
    email: string;
    bio?: string | null;
    created_at: string;
  };
  profileStats?: {
    experienceLevel?: ExperienceLevelInfo;
    consultationCategories?: Array<{ name: string; count: number }>;
  };
  isOwnProfile: boolean;
  onEditClick: () => void;
}

export function BuyerProfileHeader({ 
  profile, 
  profileStats, 
  isOwnProfile, 
  onEditClick 
}: BuyerProfileHeaderProps) {
  return (
    <div className="mb-10">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/30 relative">
        <CardContent className="p-8">
          {/* Edit Button - Fixed positioning */}
          {isOwnProfile && (
            <div className="absolute top-6 right-6 z-20">
              <Button
                variant="outline"
                size="sm"
                className="bg-background/80 backdrop-blur-sm hover:bg-background shadow-sm border-2 hover:border-primary/20 transition-all duration-200"
                onClick={onEditClick}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row items-start gap-8 relative z-10">
            <div className="flex flex-col items-center lg:items-start">
              <Avatar className="w-32 h-32 ring-4 ring-background shadow-xl">
                <AvatarImage src={profile.avatar_url || ''} className="object-cover" />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                  {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Member since info moved under avatar */}
              <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-6">
              {/* Name and badges section */}
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <h1 className="text-4xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    {profile.full_name || 'Anonymous Buyer'}
                  </h1>
                  <div className="flex items-center gap-3">
                    {profileStats?.experienceLevel && (
                      <ExperienceBadge experienceLevel={profileStats.experienceLevel} />
                    )}
                    <Badge variant="secondary" className="px-3 py-1">
                      <User className="w-3 h-3 mr-2" />
                      Buyer
                    </Badge>
                  </div>
                </div>
                
                {/* Profile Description */}
                {profile.bio ? (
                  <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary/30">
                    <p className="text-muted-foreground leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                ) : (
                  <div className="bg-muted/20 rounded-lg p-4 border border-dashed border-muted-foreground/20">
                    <p className="text-muted-foreground/60 italic text-center">
                      No bio added yet
                    </p>
                  </div>
                )}
              </div>
              
              {/* Consultation Areas */}
              {profileStats?.consultationCategories && profileStats.consultationCategories.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-semibold text-foreground">Consultation Areas</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {profileStats.consultationCategories.map((category, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="px-4 py-2 text-sm bg-background/50 hover:bg-background transition-colors"
                      >
                        {category.name}
                        <span className="ml-2 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                          {category.count}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
