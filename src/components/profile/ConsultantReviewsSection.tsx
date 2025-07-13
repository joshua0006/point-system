
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface ConsultantReviewsSectionProps {
  onReviewsClick: () => void;
  rating?: number;
  reviewCount?: number;
}

export function ConsultantReviewsSection({ 
  onReviewsClick, 
  rating = 4.8, 
  reviewCount = 15 
}: ConsultantReviewsSectionProps) {
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
            <Star className="w-8 h-8 text-yellow-500 fill-current" />
            <span className="text-3xl font-bold">{rating}</span>
          </div>
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={`w-4 h-4 ${star <= Math.floor(rating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
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
