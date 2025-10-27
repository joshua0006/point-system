
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from '@/lib/icons';
import { useConsultantRatingStats } from '@/hooks/useConsultantReviews';

interface ConsultantReviewsSectionProps {
  onReviewsClick: () => void;
  consultantUserId: string;
}

export function ConsultantReviewsSection({ 
  onReviewsClick, 
  consultantUserId 
}: ConsultantReviewsSectionProps) {
  const { data: ratingStats } = useConsultantRatingStats(consultantUserId);
  
  const rating = ratingStats?.averageRating || 0;
  const reviewCount = ratingStats?.totalReviews || 0;
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onReviewsClick}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Reviews & Ratings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="w-8 h-8 text-accent fill-current" />
            <span className="text-3xl font-bold">{rating}</span>
          </div>
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${star <= Math.floor(rating) ? 'text-accent fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Based on {reviewCount} reviews
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
