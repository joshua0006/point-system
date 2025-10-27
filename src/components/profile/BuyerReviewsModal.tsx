import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Calendar, User } from '@/lib/icons';
import { useState } from "react";
import { useBuyerReviews } from '@/hooks/useBuyerReviews';

interface BuyerReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buyerUserId: string;
}

type StarFilter = "all" | "5" | "4" | "3" | "2" | "1";

export function BuyerReviewsModal({ open, onOpenChange, buyerUserId }: BuyerReviewsModalProps) {
  const [starFilter, setStarFilter] = useState<StarFilter>("all");
  const { data: reviews = [] } = useBuyerReviews(buyerUserId);

  const filteredReviews = starFilter === "all" 
    ? reviews 
    : reviews.filter(review => review.rating === parseInt(starFilter));

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(review => review.rating === rating).length / reviews.length) * 100 
      : 0
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Reviews</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {reviews.length > 0 ? (
            <>
              {/* Review Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-5 h-5 ${i < Math.round(averageRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Based on {reviews.length} reviews
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Rating Distribution</h4>
                    <div className="space-y-2">
                      {ratingDistribution.map(({ rating, count, percentage }) => (
                        <div key={rating} className="flex items-center space-x-2">
                          <span className="w-3 text-sm">{rating}</span>
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full transition-all"
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
                <h3 className="text-lg font-semibold">
                  {starFilter === "all" ? `All Reviews (${reviews.length})` : `${starFilter} Star Reviews (${filteredReviews.length})`}
                </h3>
                <Select value={starFilter} onValueChange={(value: StarFilter) => setStarFilter(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {filteredReviews.length > 0 ? (
                  filteredReviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                <User className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h5 className="font-medium text-sm">{review.reviewer_profile?.full_name || 'Anonymous'}</h5>
                              <p className="text-xs text-muted-foreground">Service Review</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3 h-3 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
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
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews found for {starFilter} star rating</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="w-16 h-16 mx-auto mb-6 opacity-30" />
              <h3 className="text-xl font-medium mb-2">No Reviews Yet</h3>
              <p className="text-sm">
                Reviews from completed bookings will appear here
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}