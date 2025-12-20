import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Building2, Briefcase, Users, Rocket, ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";

const INDUSTRIES = [
  "IT та технології",
  "Маркетинг та реклама",
  "Електронна комерція",
  "Освіта",
  "Фінанси та банкінг",
  "Медицина та здоров'я",
  "Виробництво",
  "Нерухомість",
  "Туризм та гостинність",
  "Роздрібна торгівля",
  "Консалтинг",
  "Медіа та розваги",
  "Інше"
];

const EMPLOYEE_COUNTS = [
  { value: "1", label: "Тільки я" },
  { value: "2-10", label: "2-10 співробітників" },
  { value: "11-50", label: "11-50 співробітників" },
  { value: "51-200", label: "51-200 співробітників" },
  { value: "201-500", label: "201-500 співробітників" },
  { value: "500+", label: "Більше 500" }
];

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    position: "",
    industry: "",
    employeeCount: ""
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: typeof formData & { skipped?: boolean }) => {
      const response = await apiRequest("POST", "/api/user/onboarding/complete", data);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Помилка");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      onComplete();
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    }
  });

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      completeOnboardingMutation.mutate({ ...formData, skipped: false });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    completeOnboardingMutation.mutate({ ...formData, skipped: true });
  };

  const progress = (step / totalSteps) * 100;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ласкаво просимо!
          </DialogTitle>
          <DialogDescription>
            Давайте познайомимось ближче. Це допоможе персоналізувати вашу гру.
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="h-2 mb-4" />

        <div className="min-h-[200px]">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Як вас звати?</h3>
                  <p className="text-sm text-muted-foreground">Щоб ми могли звертатися до вас особисто</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Ім'я</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ваше ім'я"
                    data-testid="onboarding-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Прізвище</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ваше прізвище"
                    data-testid="onboarding-last-name"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Company Info */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Ваша компанія</h3>
                  <p className="text-sm text-muted-foreground">Розкажіть про ваш бізнес</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="company">Назва компанії</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Назва вашої компанії"
                    data-testid="onboarding-company"
                  />
                </div>
                <div>
                  <Label htmlFor="position">Ваша посада</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="CEO, Маркетолог, Фаундер..."
                    data-testid="onboarding-position"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Industry & Size */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Деталі бізнесу</h3>
                  <p className="text-sm text-muted-foreground">Допоможе адаптувати рекомендації</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Сфера діяльності</Label>
                  <Select 
                    value={formData.industry} 
                    onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  >
                    <SelectTrigger data-testid="onboarding-industry">
                      <SelectValue placeholder="Оберіть сферу" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Кількість співробітників</Label>
                  <Select 
                    value={formData.employeeCount} 
                    onValueChange={(value) => setFormData({ ...formData, employeeCount: value })}
                  >
                    <SelectTrigger data-testid="onboarding-employee-count">
                      <SelectValue placeholder="Оберіть розмір команди" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_COUNTS.map((ec) => (
                        <SelectItem key={ec.value} value={ec.value}>{ec.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={completeOnboardingMutation.isPending}
            data-testid="button-skip-onboarding"
          >
            Пропустити
          </Button>
          
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
            )}
            <Button 
              onClick={handleNext}
              disabled={completeOnboardingMutation.isPending}
              data-testid="button-next-onboarding"
            >
              {completeOnboardingMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : step === totalSteps ? (
                <Rocket className="h-4 w-4 mr-2" />
              ) : null}
              {step === totalSteps ? "Почати гру" : "Далі"}
              {step < totalSteps && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
