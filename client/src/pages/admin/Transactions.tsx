import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft, 
  Loader2, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

interface PaymentHistory {
  id: string;
  userId: string;
  subscriptionId: string | null;
  planId: number | null;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  description: string | null;
  billingPeriod: string | null;
  monoInvoiceId: string | null;
  monoPaymentId: string | null;
  monoPageUrl: string | null;
  monoReference: string | null;
  monoFailureReason: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export default function TransactionsPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, refetch } = useQuery<{ payments: PaymentHistory[]; total: number }>({
    queryKey: ['/api/admin/payments', { limit, offset: page * limit }],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Успішно</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Очікує</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Обробка</Badge>;
      case 'failure':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Помилка</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30"><Clock className="h-3 w-3 mr-1" />Прострочено</Badge>;
      case 'reversed':
        return <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30"><RefreshCw className="h-3 w-3 mr-1" />Повернуто</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const filteredPayments = data?.payments.filter(payment => 
    payment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.monoReference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.monoInvoiceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.userId.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalPages = Math.ceil((data?.total || 0) / limit);

  const stats = {
    total: data?.total || 0,
    successful: data?.payments.filter(p => p.status === 'success').length || 0,
    pending: data?.payments.filter(p => p.status === 'pending' || p.status === 'processing').length || 0,
    failed: data?.payments.filter(p => p.status === 'failure' || p.status === 'expired').length || 0,
    totalAmount: data?.payments.filter(p => p.status === 'success').reduce((sum, p) => sum + p.amount, 0) || 0,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white"
          onClick={() => setLocation('/rcadmin')}
          data-testid="button-back-admin"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-green-500" />
              Транзакції
            </h1>
            <p className="text-gray-400 mt-1">Управління платежами та транзакціями</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Оновити
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Всього транзакцій</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Успішних</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.successful}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Очікують</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">Сума успішних</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {formatAmount(stats.totalAmount, 'UAH')}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Історія транзакцій</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Пошук..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700"
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Транзакцій не знайдено</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-gray-800/50">
                        <TableHead className="text-gray-400">Дата</TableHead>
                        <TableHead className="text-gray-400">Опис</TableHead>
                        <TableHead className="text-gray-400">Сума</TableHead>
                        <TableHead className="text-gray-400">Статус</TableHead>
                        <TableHead className="text-gray-400">Метод</TableHead>
                        <TableHead className="text-gray-400">Референс</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow 
                          key={payment.id} 
                          className="border-gray-800 hover:bg-gray-800/50"
                          data-testid={`row-payment-${payment.id}`}
                        >
                          <TableCell className="text-gray-300">
                            {format(new Date(payment.createdAt), 'dd MMM yyyy HH:mm', { locale: uk })}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">
                              {payment.description || '-'}
                            </div>
                            {payment.monoFailureReason && (
                              <div className="text-xs text-red-400 mt-1">
                                {payment.monoFailureReason}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-mono font-medium">
                            {formatAmount(payment.amount, payment.currency)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.status)}
                          </TableCell>
                          <TableCell className="text-gray-400 capitalize">
                            {payment.paymentMethod}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 font-mono">
                            {payment.monoReference?.slice(0, 20) || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                    <div className="text-sm text-gray-400">
                      Сторінка {page + 1} з {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        data-testid="button-prev-page"
                      >
                        Попередня
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        data-testid="button-next-page"
                      >
                        Наступна
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
