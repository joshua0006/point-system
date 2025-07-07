import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProfileStatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}

export function ProfileStatCard({ title, value, description, icon, children }: ProfileStatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          {title}
          {icon}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {value}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {children}
      </CardContent>
    </Card>
  );
}