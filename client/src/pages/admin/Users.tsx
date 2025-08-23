import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Trash2, Plus, Save, User, Shield, Crown } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: Partial<User> }) => {
      return await apiRequest("PUT", `/api/admin/users/${userId}`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Користувача оновлено",
        description: "Зміни успішно збережені",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити користувача",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Користувача видалено",
        description: "Користувача успішно видалено з системи",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити користувача",
        variant: "destructive",
      });
    },
  });

  const handleSaveUser = () => {
    if (!editingUser) return;
    
    updateUserMutation.mutate({
      userId: editingUser.id,
      userData: editingUser,
    });
  };

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-red-100 text-red-800">Адміністратор</Badge>;
      case 'user': return <Badge variant="secondary">Користувач</Badge>;
      default: return <Badge variant="outline">Невідомо</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800">Активний</Badge>
      : <Badge className="bg-gray-100 text-gray-800">Неактивний</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Завантаження користувачів...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Користувачі</h1>
          <p className="text-gray-500 mt-2">Управління користувачами та їх правами доступу</p>
        </div>
        <div className="flex items-center gap-4">
          <Button className="flex items-center gap-2" data-testid="button-create-new-user">
            <Plus className="h-4 w-4" />
            Додати Користувача
          </Button>
          <Link href="/rcadmin">
            <Button variant="outline" className="flex items-center gap-2" data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
          </Link>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {users?.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.isActive)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditingUser(user);
                      setIsDialogOpen(true);
                    }}
                    data-testid={`button-edit-${user.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Редагувати
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        data-testid={`button-delete-${user.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Видалити
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Видалити користувача?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ця дія незворотна. Користувач "{user.firstName} {user.lastName}" буде видалений назавжди разом із усіми даними.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Скасувати</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700"
                          data-testid="button-confirm-delete"
                        >
                          Видалити
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">ID:</span>
                  <p className="font-mono text-xs">{user.id.slice(0, 8)}...</p>
                </div>
                <div>
                  <span className="text-gray-500">Створено:</span>
                  <p>{new Date(user.createdAt).toLocaleDateString('uk-UA')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Оновлено:</span>
                  <p>{new Date(user.updatedAt).toLocaleDateString('uk-UA')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Останній вхід:</span>
                  <p>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('uk-UA') : 'Ніколи'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редагувати користувача</DialogTitle>
            <DialogDescription>
              Внесіть зміни до профілю користувача "{editingUser?.firstName} {editingUser?.lastName}"
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Ім'я</Label>
                  <Input
                    id="firstName"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      firstName: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Прізвище</Label>
                  <Input
                    id="lastName"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      lastName: e.target.value
                    })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    email: e.target.value
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Роль</Label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(value: 'user' | 'admin') => setEditingUser({
                      ...editingUser,
                      role: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Користувач</SelectItem>
                      <SelectItem value="admin">Адміністратор</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={editingUser.isActive}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      isActive: e.target.checked
                    })}
                  />
                  <Label htmlFor="isActive">Активний користувач</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Скасувати
                </Button>
                <Button 
                  onClick={handleSaveUser}
                  disabled={updateUserMutation.isPending}
                  data-testid="button-save-user"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateUserMutation.isPending ? "Збереження..." : "Зберегти"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}