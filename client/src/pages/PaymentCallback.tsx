import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Clock, ArrowRight, ArrowLeft } from "lucide-react";

export default function PaymentCallback() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const id = params.get('invoiceId');
    if (id) {
      setInvoiceId(id);
    }
  }, [search]);

  const { data: paymentStatus, isLoading, refetch } = useQuery<{ status: string; planId: number }>({
    queryKey: ['/api/payments', invoiceId, 'status'],
    enabled: !!invoiceId,
    refetchInterval: (data) => {
      if (data?.state?.data?.status === 'pending' || data?.state?.data?.status === 'processing') {
        return 2000;
      }
      return false;
    },
  });

  useEffect(() => {
    if (paymentStatus?.status === 'pending' || paymentStatus?.status === 'processing') {
      if (pollCount < 30) {
        const timer = setTimeout(() => {
          setPollCount(prev => prev + 1);
          refetch();
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [paymentStatus, pollCount, refetch]);

  const getStatusDisplay = () => {
    if (isLoading || !paymentStatus) {
      return {
        icon: <Loader2 className="h-16 w-16 animate-spin text-primary" />,
        title: "Перевірка статусу...",
        description: "Зачекайте, поки ми перевіряємо ваш платіж",
        color: "text-primary",
      };
    }

    switch (paymentStatus.status) {
      case 'success':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          title: "Оплата успішна!",
          description: "Ваша підписка активована. Дякуємо за покупку!",
          color: "text-green-500",
        };
      case 'failure':
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          title: "Оплата не вдалася",
          description: "На жаль, платіж не пройшов. Спробуйте ще раз.",
          color: "text-red-500",
        };
      case 'expired':
        return {
          icon: <Clock className="h-16 w-16 text-yellow-500" />,
          title: "Термін платежу закінчився",
          description: "Час для оплати вийшов. Будь ласка, створіть новий платіж.",
          color: "text-yellow-500",
        };
      case 'reversed':
        return {
          icon: <XCircle className="h-16 w-16 text-orange-500" />,
          title: "Платіж скасовано",
          description: "Оплату було повернуто.",
          color: "text-orange-500",
        };
      case 'pending':
      case 'processing':
        return {
          icon: <Loader2 className="h-16 w-16 animate-spin text-blue-500" />,
          title: "Обробка платежу...",
          description: "Ваш платіж обробляється. Це може зайняти кілька хвилин.",
          color: "text-blue-500",
        };
      default:
        return {
          icon: <Clock className="h-16 w-16 text-gray-500" />,
          title: "Статус невідомий",
          description: `Статус: ${paymentStatus.status}`,
          color: "text-gray-500",
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  if (!invoiceId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle>Некоректне посилання</CardTitle>
            <CardDescription>
              Ідентифікатор платежу не знайдено в URL
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => setLocation('/pricing')} data-testid="button-back-pricing">
              <ArrowLeft className="h-4 w-4 mr-2" />
              До тарифів
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {statusDisplay.icon}
          </div>
          <CardTitle className={statusDisplay.color}>{statusDisplay.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {statusDisplay.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentStatus?.status === 'success' && (
            <Button 
              className="w-full" 
              onClick={() => setLocation('/dashboard')}
              data-testid="button-go-dashboard"
            >
              Перейти до дашборду
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          
          {(paymentStatus?.status === 'failure' || paymentStatus?.status === 'expired') && (
            <Button 
              className="w-full" 
              onClick={() => setLocation('/pricing')}
              data-testid="button-retry-payment"
            >
              Спробувати ще раз
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setLocation('/dashboard')}
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            До дашборду
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
