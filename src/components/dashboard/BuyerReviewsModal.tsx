
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Star, MessageCircle, Calendar, User } from '@/lib/icons';
import { useState } from "react";
import { useConsultantReviews } from '@/hooks/useConsultantReviews';
import { useBuyerReviews } from '@/hooks/useBuyerReviews';

interface BuyerReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  mode: "seller" | "buyer";
}

type SortFilter = "newest" | "oldest" | "rating_high" | "rating_low";

export function BuyerReviewsModal({ open, onOpenChange, userId, mode }: BuyerReviewsModalProps) {
  const [sortFilter, setSortFilter] = useState<SortFilter>("newest");
  
  // Get real review data based on mode
  const { data: consultantReviews = [] } = useConsultantReviews(userId);
  const { data: buyerReviews = [] } = useBuyerReviews(userId);
  
  const reviews = mode === "seller" ? consultantReviews : buyerReviews;

  
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortFilter) {
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "oldest":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "rating_high":
        return b.rating - a.rating;
      case "rating_low":
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(review => review.rating === rating).length / reviews.length) * 100 : 0
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>{mode === "seller" ? "Consultant" : "Buyer"} Reviews</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Review Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Review Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < Math.round(averageRating) ? 'text-accent fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on {reviews.length} reviews
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rating Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ratingDistribution.map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <span className="w-3 text-sm">{rating}</span>
                      <Star className="w-3 h-3 text-accent fill-current" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-accent h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Reviews ({reviews.length})</h3>
            <Select value={sortFilter} onValueChange={(value: SortFilter) => setSortFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="rating_high">Highest Rating</SelectItem>
                <SelectItem value="rating_low">Lowest Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {sortedReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h5 className="font-medium text-sm">{review.reviewer_profile?.full_name || 'Anonymous'}</h5>
                        <p className="text-xs text-muted-foreground">Service Review</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < review.rating ? 'text-accent fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-foreground mb-3">{review.comment || 'No comment provided'}</p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Verified Purchase
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
