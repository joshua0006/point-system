
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

interface ConsultantReviewsSectionProps {
  onReviewsClick: () => void;
}

export function ConsultantReviewsSection({ onReviewsClick }: ConsultantReviewsSectionProps) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onReviewsClick}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Reviews & Ratings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="mb-2">No reviews yet</p>
          <p className="text-sm">
            Click to view reviews when available
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
