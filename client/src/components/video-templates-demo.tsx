import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Users, TrendingUp, Sparkles } from "lucide-react";

export function VideoTemplatesDemo() {
  const templates = [
    {
      id: 'professional',
      name: 'Professional',
      description: 'Clean, corporate style perfect for B2B businesses and professional services',
      icon: Users,
      gradient: 'bg-[#E8F4EC]',
      iconColor: 'text-blue-600',
      industries: ['Consulting', 'Finance', 'Tech']
    },
    {
      id: 'dynamic',
      name: 'Dynamic',
      description: 'Energetic and engaging style great for startups and innovative businesses',
      icon: TrendingUp,
      gradient: 'bg-[#FFF4E0]',
      iconColor: 'text-[#B45309]',
      industries: ['Startups', 'Retail', 'Creative']
    },
    {
      id: 'casual',
      name: 'Casual',
      description: 'Friendly and approachable style perfect for local businesses and services',
      icon: Sparkles,
      gradient: 'bg-[#E6F6F1]',
      iconColor: 'text-green-600',
      industries: ['Local', 'Food', 'Lifestyle']
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {templates.map((template) => {
        const IconComponent = template.icon;
        return (
          <Card key={template.id} className="cursor-pointer transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">60s</Badge>
                </div>
                
                <div className={`w-full h-32 ${template.gradient} rounded-lg flex items-center justify-center`}>
                  <IconComponent className={`h-10 w-10 ${template.iconColor}`} />
                </div>
                
                <p className="text-sm text-muted-foreground">{template.description}</p>
                
                <div className="flex flex-wrap gap-1">
                  {template.industries.map((industry) => (
                    <Badge key={industry} variant="outline" className="text-xs">
                      {industry}
                    </Badge>
                  ))}
                </div>
                
                <Button size="sm" className="w-full">
                  <Play className="h-4 w-4 me-2" />
                  Preview Style
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}