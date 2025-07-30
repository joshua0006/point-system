import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  FileText, 
  TrendingUp, 
  Shield, 
  Target, 
  BarChart3, 
  Calculator, 
  Users 
} from "lucide-react";

export interface TaskCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  examples: string[];
  popular?: boolean;
}

const taskCategories: TaskCategory[] = [
  {
    id: 'client-communication',
    title: 'Client Communication',
    description: 'Professional client interactions and correspondence',
    icon: <MessageSquare className="h-6 w-6" />,
    examples: ['Proposal generation', 'Follow-up emails', 'Meeting agendas', 'Client onboarding'],
    popular: true
  },
  {
    id: 'content-creation',
    title: 'Financial Content',
    description: 'Educational and marketing content creation',
    icon: <FileText className="h-6 w-6" />,
    examples: ['Market commentary', 'Blog articles', 'Educational handouts', 'Newsletter content'],
    popular: true
  },
  {
    id: 'lead-generation',
    title: 'Lead Generation',
    description: 'Marketing campaigns and lead acquisition',
    icon: <Target className="h-6 w-6" />,
    examples: ['Campaign copy', 'Social media posts', 'Advertisement copy', 'Webinar scripts']
  },
  {
    id: 'compliance',
    title: 'Compliance & Documentation',
    description: 'Regulatory compliance and documentation',
    icon: <Shield className="h-6 w-6" />,
    examples: ['Disclosure statements', 'Compliance checklists', 'Documentation templates', 'Regulatory guidance']
  },
  {
    id: 'business-strategy',
    title: 'Business Strategy',
    description: 'Practice management and business planning',
    icon: <TrendingUp className="h-6 w-6" />,
    examples: ['Business plans', 'Market analysis', 'Pricing strategies', 'Practice optimization']
  },
  {
    id: 'analysis',
    title: 'Financial Analysis',
    description: 'Investment research and financial analysis',
    icon: <BarChart3 className="h-6 w-6" />,
    examples: ['Investment research', 'Risk assessments', 'Product comparisons', 'Performance reports']
  },
  {
    id: 'tax-estate',
    title: 'Tax & Estate Planning',
    description: 'Tax optimization and estate planning strategies',
    icon: <Calculator className="h-6 w-6" />,
    examples: ['Tax planning', 'Estate documentation', 'CPF optimization', 'Insurance analysis']
  },
  {
    id: 'crm',
    title: 'Client Relationship Management',
    description: 'Client retention and relationship strategies',
    icon: <Users className="h-6 w-6" />,
    examples: ['Client segmentation', 'Retention strategies', 'Referral programs', 'Relationship building']
  }
];

interface TaskSelectorProps {
  onSelectTask: (category: TaskCategory) => void;
  selectedTask?: string;
}

export default function TaskSelector({ onSelectTask, selectedTask }: TaskSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {taskCategories.map((category) => (
        <Card 
          key={category.id}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
            selectedTask === category.id 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => onSelectTask(category)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${
                  selectedTask === category.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {category.icon}
                </div>
                {category.popular && (
                  <Badge variant="secondary" className="text-xs">Popular</Badge>
                )}
              </div>
            </div>
            <CardTitle className="text-lg">{category.title}</CardTitle>
            <CardDescription className="text-sm">
              {category.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Examples:</p>
              <div className="flex flex-wrap gap-1">
                {category.examples.slice(0, 2).map((example, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {example}
                  </Badge>
                ))}
                {category.examples.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{category.examples.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}