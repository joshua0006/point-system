
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Calendar, User } from "lucide-react";
import { useState } from "react";

interface Review {
  id: string;
  buyerName: string;
  service: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultantName: string;
}

type StarFilter = "all" | "5" | "4" | "3" | "2" | "1";

export function ReviewsModal({ open, onOpenChange, consultantName }: ReviewsModalProps) {
  const [starFilter, setStarFilter] = useState<StarFilter>("all");

  // Mock reviews data - in a real app, this would come from the database
  const allReviews: Review[] = [
    {
      id: "1",
      buyerName: "Sarah J.",
      service: "Strategic Business Consultation",
      rating: 5,
      comment: "Exceptional service! The consultant provided deep insights that transformed our business strategy. Highly professional and knowledgeable.",
      date: "2024-01-20"
    },
    {
      id: "2",
      buyerName: "Michael R.",
      service: "Growth Strategy Workshop",
      rating: 5,
      comment: "Outstanding workshop! The strategies provided were immediately actionable and helped us increase our revenue by 40% in just 3 months.",
      date: "2024-01-18"
    },
    {
      id: "3",
      buyerName: "Emily K.",
      service: "Market Analysis Report",
      rating: 4,
      comment: "Very thorough analysis with great insights. Would have liked a bit more detail on competitive positioning, but overall excellent work.",
      date: "2024-01-15"
    },
    {
      id: "4",
      buyerName: "David L.",
      service: "Strategic Business Consultation",
      rating: 5,
      comment: "Incredible value! The consultant's expertise helped us identify new market opportunities we hadn't considered.",
      date: "2024-01-12"
    },
    {
      id: "5",
      buyerName: "Jennifer M.",
      service: "Growth Strategy Workshop",
      rating: 4,
      comment: "Great workshop with practical advice. The follow-up materials were particularly helpful for implementation.",
      date: "2024-01-10"
    },
    {
      id: "6",
      buyerName: "Robert S.",
      service: "Market Analysis Report",
      rating: 5,
      comment: "Comprehensive and insightful report. The data analysis was spot-on and the recommendations were actionable.",
      date: "2024-01-08"
    }
  ];

  const filteredReviews = starFilter === "all" 
    ? allReviews 
    : allReviews.filter(review => review.rating === parseInt(starFilter));

  const averageRating = allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length;
  
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: allReviews.filter(review => review.rating === rating).length,
    percentage: (allReviews.filter(review => review.rating === rating).length / allReviews.length) * 100
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Reviews for {consultantName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                    Based on {allReviews.length} reviews
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
              {starFilter === "all" ? `All Reviews (${allReviews.length})` : `${starFilter} Star Reviews (${filteredReviews.length})`}
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
                          <h5 className="font-medium text-sm">{review.buyerName}</h5>
                          <p className="text-xs text-muted-foreground">{review.service}</p>
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
                    
                    <p className="text-sm text-foreground mb-3">{review.comment}</p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(review.date).toLocaleDateString()}</span>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
