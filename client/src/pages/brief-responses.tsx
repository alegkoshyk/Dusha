import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Eye, GitCompareArrows, User, Mail, Calendar, Trash2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BriefResponsesPage() {
  const params = useParams<{ briefId: string }>();
  const briefId = params.briefId;
  const { toast } = useToast();
  const [compareMode, setCompareMode] = useState(false);
  const [deletingResponseId, setDeletingResponseId] = useState<string | null>(null);

  const { data: brief, isLoading: briefLoading } = useQuery<any>({
    queryKey: ["/api/briefs", briefId],
    queryFn: async () => {
      const authToken = localStorage.getItem("authToken");
      const res = await fetch(`/api/briefs/${briefId}`, {
        credentials: "include",
        headers: authToken ? { "x-auth-token": authToken } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch brief");
      return res.json();
    },
    enabled: !!briefId,
  });

  const { data: responsesData, isLoading: responsesLoading } = useQuery<{
    responses: any[];
    fieldMap: Record<string, string>;
  }>({
    queryKey: ["/api/briefs", briefId, "responses"],
    queryFn: async () => {
      const authToken = localStorage.getItem("authToken");
      const res = await fetch(`/api/briefs/${briefId}/responses`, {
        credentials: "include",
        headers: authToken ? { "x-auth-token": authToken } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch responses");
      return res.json();
    },
    enabled: !!briefId,
  });

  const deleteResponseMutation = useMutation({
    mutationFn: async (responseId: string) => {
      const res = await apiRequest("DELETE", `/api/brief-responses/${responseId}`);
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast({ title: "Видалено", description: "Відповідь видалено" });
      queryClient.invalidateQueries({ queryKey: ["/api/briefs", briefId, "responses"] });
      setDeletingResponseId(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити відповідь", variant: "destructive" });
    },
  });

  const responses = responsesData?.responses || [];
  const fieldMap = responsesData?.fieldMap || {};
  const fieldIds = Object.keys(fieldMap);
  const isLoading = briefLoading || responsesLoading;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          {brief?.brandId && (
            <Link href={`/briefs/${brief.brandId}`}>
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">
              Відповіді: {brief?.title || "..."}
            </h1>
            <p className="text-sm text-muted-foreground">
              {responses.length} {responses.length === 1 ? "відповідь" : "відповідей"}
            </p>
          </div>
          {responses.length > 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <GitCompareArrows className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="compare" className="text-sm cursor-pointer">
                Порівняння
              </Label>
              <Switch
                id="compare"
                checked={compareMode}
                onCheckedChange={setCompareMode}
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : !responses.length ? (
          <Card className="p-12 text-center">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Поки що немає відповідей</h3>
            <p className="text-muted-foreground">
              Поділіться посиланням на бриф, щоб отримати відповіді
            </p>
          </Card>
        ) : compareMode ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px] sticky left-0 bg-background z-10 font-semibold">
                    Поле
                  </TableHead>
                  {responses.map((r: any, idx: number) => (
                    <TableHead key={r.id || idx} className="min-w-[200px]">
                      <div className="space-y-1">
                        <div className="font-semibold">#{idx + 1}</div>
                        {r.respondentName && (
                          <div className="text-xs font-normal flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {r.respondentName}
                          </div>
                        )}
                        {r.createdAt && (
                          <div className="text-xs font-normal text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString("uk-UA")}
                          </div>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {fieldIds.map((fieldId) => (
                  <TableRow key={fieldId}>
                    <TableCell className="font-medium sticky left-0 bg-background z-10 border-r">
                      {fieldMap[fieldId]}
                    </TableCell>
                    {responses.map((r: any, idx: number) => {
                      const val = r.answers?.[fieldId];
                      return (
                        <TableCell key={r.id || idx} className="align-top">
                          <span className="text-sm">
                            {val == null
                              ? "—"
                              : Array.isArray(val)
                              ? val.join(", ")
                              : String(val)}
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-4">
            {responses.map((response: any, idx: number) => (
              <Card key={response.id || idx}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Badge variant="outline" className="text-sm">#{idx + 1}</Badge>
                    {response.respondentName && (
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {response.respondentName}
                      </div>
                    )}
                    {response.respondentEmail && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {response.respondentEmail}
                      </div>
                    )}
                    {response.createdAt && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                        <Calendar className="h-3 w-3" />
                        {new Date(response.createdAt).toLocaleDateString("uk-UA")}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive ml-1"
                      onClick={() => setDeletingResponseId(response.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {response.answers && (
                    <div className="space-y-3">
                      {Object.entries(response.answers).map(
                        ([key, value]: [string, any]) => (
                          <div key={key}>
                            <div className="text-xs font-medium text-muted-foreground mb-0.5">
                              {fieldMap[key] || key}
                            </div>
                            <div className="text-sm bg-muted/50 rounded-md px-3 py-2">
                              {Array.isArray(value) ? value.join(", ") : String(value)}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deletingResponseId}
        onOpenChange={(open) => !open && setDeletingResponseId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити відповідь?</AlertDialogTitle>
            <AlertDialogDescription>
              Ця дія незворотна. Відповідь буде видалена назавжди.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingResponseId && deleteResponseMutation.mutate(deletingResponseId)}
            >
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
