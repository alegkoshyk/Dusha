import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, Lock, AlertCircle } from "lucide-react";

interface BriefField {
  id: string;
  type: "short_text" | "long_text" | "multiple_choice" | "dropdown";
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
  allowCustomOption?: boolean;
  sortOrder: number;
}

interface BriefData {
  id: string;
  title: string;
  description?: string;
  hasPassword: boolean;
  respondentNameRequired: boolean;
  respondentEmailRequired: boolean;
  fields: BriefField[];
}

export default function BriefPublic() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<BriefData | null>(null);

  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [customOptions, setCustomOptions] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/public/brief/${slug}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("not_found");
        return res.json();
      })
      .then((data: BriefData) => {
        setBrief(data);
        if (data.hasPassword) {
          setPasswordRequired(true);
        }
        const initialAnswers: Record<string, any> = {};
        data.fields.forEach((f) => {
          if (f.type === "multiple_choice") {
            initialAnswers[f.id] = [];
          } else {
            initialAnswers[f.id] = "";
          }
        });
        setAnswers(initialAnswers);
        setLoading(false);
      })
      .catch(() => {
        setError("Бриф не знайдено");
        setLoading(false);
      });
  }, [slug]);

  const handleVerifyPassword = async () => {
    setVerifying(true);
    setPasswordError("");
    try {
      const res = await fetch(`/api/public/brief/${slug}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setPasswordVerified(true);
        setPasswordRequired(false);
      } else {
        setPasswordError("Невірний пароль");
      }
    } catch {
      setPasswordError("Невірний пароль");
    }
    setVerifying(false);
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[fieldId]) ? [...prev[fieldId]] : [];
      if (checked) {
        return { ...prev, [fieldId]: [...current, option] };
      } else {
        return { ...prev, [fieldId]: current.filter((v: string) => v !== option) };
      }
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const finalAnswers = { ...answers };
      if (brief) {
        brief.fields.forEach((f) => {
          if (f.type === "multiple_choice" && f.allowCustomOption && customOptions[f.id]) {
            const current = Array.isArray(finalAnswers[f.id]) ? finalAnswers[f.id] : [];
            finalAnswers[f.id] = [...current, customOptions[f.id]];
          }
        });
      }

      const body: any = { answers: finalAnswers };
      if (password && passwordVerified) body.password = password;
      if (respondentName) body.respondentName = respondentName;
      if (respondentEmail) body.respondentEmail = respondentEmail;

      const res = await fetch(`/api/public/brief/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-lg font-medium">{error || "Бриф не знайдено"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <p className="text-xl font-medium">Дякуємо! Вашу відповідь отримано.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (passwordRequired && !passwordVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <CardTitle>{brief.title}</CardTitle>
            <CardDescription>Цей бриф захищений паролем</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Введіть пароль</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                placeholder="Пароль"
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleVerifyPassword}
              disabled={verifying || !password}
            >
              {verifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Підтвердити
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{brief.title}</CardTitle>
            {brief.description && (
              <CardDescription className="text-base">{brief.description}</CardDescription>
            )}
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {brief.respondentNameRequired && (
              <div className="space-y-2">
                <Label>
                  Ваше ім'я <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="Введіть ваше ім'я"
                />
              </div>
            )}

            {brief.respondentEmailRequired && (
              <div className="space-y-2">
                <Label>
                  Ваш email <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  placeholder="Введіть ваш email"
                />
              </div>
            )}

            {brief.fields
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {field.description && (
                    <p className="text-sm text-muted-foreground">{field.description}</p>
                  )}

                  {field.type === "short_text" && (
                    <Input
                      value={answers[field.id] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                    />
                  )}

                  {field.type === "long_text" && (
                    <Textarea
                      value={answers[field.id] || ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                      rows={4}
                    />
                  )}

                  {field.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {(field.options || []).map((option) => (
                        <div key={option} className="flex items-center gap-2">
                          <Checkbox
                            checked={(answers[field.id] || []).includes(option)}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange(field.id, option, !!checked)
                            }
                          />
                          <span className="text-sm">{option}</span>
                        </div>
                      ))}
                      {field.allowCustomOption && (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={!!customOptions[field.id]}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                setCustomOptions((prev) => {
                                  const next = { ...prev };
                                  delete next[field.id];
                                  return next;
                                });
                              } else {
                                setCustomOptions((prev) => ({ ...prev, [field.id]: "" }));
                              }
                            }}
                          />
                          <span className="text-sm">Свій варіант</span>
                          {customOptions[field.id] !== undefined && (
                            <Input
                              className="flex-1 h-8"
                              value={customOptions[field.id]}
                              onChange={(e) =>
                                setCustomOptions((prev) => ({
                                  ...prev,
                                  [field.id]: e.target.value,
                                }))
                              }
                              placeholder="Введіть свій варіант"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {field.type === "dropdown" && (
                    <Select
                      value={answers[field.id] || ""}
                      onValueChange={(value) =>
                        setAnswers((prev) => ({ ...prev, [field.id]: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Оберіть варіант" />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options || []).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Надіслати відповідь
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}