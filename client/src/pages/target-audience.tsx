import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, Plus, Users, Sparkles, Loader2, Trash2, 
  User, MapPin, Briefcase, GraduationCap, Heart, Target, 
  DollarSign, Quote, Brain, ShoppingBag, FolderOpen, Layers,
  ChevronDown, ChevronRight, Settings, ArrowRightLeft, Move, X, Image, Upload, Hash, Search, Check, Pencil
} from "lucide-react";
import type { UserBrand, TargetAudience, DemographicSegment, DemographicSubSegment } from "@shared/schema";
import { PersonaDetailCard } from "@/components/PersonaDetailCard";
import { CreateSegmentDialog } from "@/components/CreateSegmentDialog";

interface AudienceType {
  id: string;
  categoryId: string;
  name: string;
  nameEn: string | null;
  color: string;
  sortOrder: number;
}

interface AudienceTypeCategory {
  id: string;
  name: string;
  nameEn: string | null;
  color: string;
  sortOrder: number;
  types: AudienceType[];
}

interface GeneratedPersona {
  name: string;
  age: number;
  gender: string;
  occupation: string;
  location: string;
  income: string;
  education: string;
  familyStatus: string;
  lifestyle: string;
  values: string[];
  interests: string[];
  painPoints: string[];
  goals: string[];
  motivations: string[];
  fears: string[];
  buyingBehavior: string;
  mediaConsumption: string[];
  decisionFactors: string[];
  quote: string;
  dayInLife: string;
  brandRelationship: string;
}

interface SegmentWithData extends DemographicSegment {
  subSegments: (DemographicSubSegment & { personas: TargetAudience[] })[];
  personas: TargetAudience[];
}

export default function TargetAudiencePage() {
  const params = useParams<{ brandId: string }>();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<TargetAudience | null>(null);
  const [audienceType, setAudienceType] = useState<"primary" | "secondary" | "niche">("primary");
  const [newAudienceName, setNewAudienceName] = useState("");
  
  // Segment state
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());
  const [isSegmentDialogOpen, setIsSegmentDialogOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<DemographicSegment | null>(null);
  const [editingSubSegment, setEditingSubSegment] = useState<DemographicSubSegment | null>(null);
  const [movingSubSegment, setMovingSubSegment] = useState<{ id: string; currentSegmentId: string } | null>(null);
  const [generatingAvatarId, setGeneratingAvatarId] = useState<string | null>(null);
  const [editingAudience, setEditingAudience] = useState<TargetAudience | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [assigningPersona, setAssigningPersona] = useState<TargetAudience | null>(null);
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<Set<string>>(new Set());
  const [selectedSubSegmentIds, setSelectedSubSegmentIds] = useState<Set<string>>(new Set());
  const [selectedAudienceTypeIds, setSelectedAudienceTypeIds] = useState<Set<string>>(new Set());
  const [typeSearchQuery, setTypeSearchQuery] = useState("");
  
  // Type management state
  const [isTypeManageOpen, setIsTypeManageOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AudienceTypeCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6b7280");
  const [editingType, setEditingType] = useState<{ type: AudienceType; categoryId: string } | null>(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("#6b7280");
  const [addingTypeToCategoryId, setAddingTypeToCategoryId] = useState<string | null>(null);
  
  // Base categories (demographic segments) management state
  const [isBaseCategoriesOpen, setIsBaseCategoriesOpen] = useState(false);
  const [editingSegmentInManage, setEditingSegmentInManage] = useState<DemographicSegment | null>(null);
  const [newBaseCategoryName, setNewBaseCategoryName] = useState("");
  const [newBaseCategoryColor, setNewBaseCategoryColor] = useState("#6b7280");
  
  // Persona categories (Primary/Secondary/Niche) management state
  const [isPersonaCategoriesOpen, setIsPersonaCategoriesOpen] = useState(false);
  const [editingPersonaCategory, setEditingPersonaCategory] = useState<{ id: string; name: string; nameEn: string | null; color: string | null } | null>(null);
  const [newPersonaCategoryName, setNewPersonaCategoryName] = useState("");
  const [newPersonaCategoryNameEn, setNewPersonaCategoryNameEn] = useState("");
  const [newPersonaCategoryColor, setNewPersonaCategoryColor] = useState("#6b7280");

  const { data: brand, isLoading: brandLoading } = useQuery<UserBrand>({
    queryKey: ["/api/user/brands", params.brandId],
    queryFn: async () => {
      const response = await fetch(`/api/user/brands/${params.brandId}`, { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch brand");
      return response.json();
    },
    enabled: !!params.brandId,
  });

  const { data: audiences = [], isLoading: audiencesLoading } = useQuery<TargetAudience[]>({
    queryKey: ["/api/brands", params.brandId, "target-audiences"],
    queryFn: async () => {
      const response = await fetch(`/api/brands/${params.brandId}/target-audiences`, { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch audiences");
      return response.json();
    },
    enabled: !!params.brandId,
  });

  const { data: segments = [], isLoading: segmentsLoading, error: segmentsError } = useQuery<SegmentWithData[]>({
    queryKey: ["/api/brands", params.brandId, "demographic-segments"],
    queryFn: async () => {
      console.log("Fetching segments for brand:", params.brandId);
      const response = await fetch(`/api/brands/${params.brandId}/demographic-segments`, { credentials: 'include' });
      console.log("Segments response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Segments fetch error:", errorText);
        throw new Error("Failed to fetch segments: " + errorText);
      }
      const data = await response.json();
      console.log("Segments data received:", data.length, "segments");
      return data;
    },
    enabled: !!params.brandId,
    staleTime: 0,
    refetchOnMount: true,
  });
  
  // Log segments error in useEffect
  useEffect(() => {
    if (segmentsError) {
      console.error("Segments query error:", segmentsError);
    }
  }, [segmentsError]);

  const { data: audienceTypeCategories = [] } = useQuery<AudienceTypeCategory[]>({
    queryKey: ['/api/audience-types'],
  });

  // Persona categories (Primary/Secondary/Niche)
  interface PersonaCategory {
    id: string;
    name: string;
    nameEn: string | null;
    color: string | null;
    sortOrder: number;
  }
  
  const { data: personaCategories = [] } = useQuery<PersonaCategory[]>({
    queryKey: ['/api/persona-categories'],
  });

  const filteredCategories = typeSearchQuery.trim()
    ? audienceTypeCategories.map(cat => ({
        ...cat,
        types: cat.types.filter(t => 
          t.name.toLowerCase().includes(typeSearchQuery.toLowerCase()) ||
          (t.nameEn && t.nameEn.toLowerCase().includes(typeSearchQuery.toLowerCase()))
        )
      })).filter(cat => cat.types.length > 0)
    : audienceTypeCategories;

  // Get all persona IDs that are assigned to segments
  const assignedPersonaIds = new Set<string>();
  segments.forEach(seg => {
    seg.personas.forEach(p => assignedPersonaIds.add(p.id));
    seg.subSegments.forEach(sub => {
      sub.personas.forEach(p => assignedPersonaIds.add(p.id));
    });
  });

  const getUnassignedPersonas = () => audiences.filter(a => !assignedPersonaIds.has(a.id));

  // Helper to get all assignments for a persona from segments data
  const getPersonaAssignments = (personaId: string) => {
    const assignments: { segmentName: string; subSegmentName?: string; segmentId: string; subSegmentId?: string; color?: string }[] = [];
    segments.forEach(seg => {
      seg.personas.forEach(p => {
        if (p?.id === personaId) {
          assignments.push({ segmentName: seg.name, segmentId: seg.id, color: seg.color || '#f59e0b' });
        }
      });
      seg.subSegments.forEach(sub => {
        sub.personas.forEach(p => {
          if (p?.id === personaId) {
            assignments.push({ segmentName: seg.name, subSegmentName: sub.name, segmentId: seg.id, subSegmentId: sub.id, color: sub.color || '#60a5fa' });
          }
        });
      });
    });
    return assignments;
  };

  const generatePersonaMutation = useMutation({
    mutationFn: async ({ type, customPrompt, personaName, segmentIds, subSegmentIds }: { 
      type: "primary" | "secondary" | "niche"; 
      customPrompt?: string;
      personaName?: string;
      segmentIds?: string[];
      subSegmentIds?: string[];
    }) => {
      const response = await apiRequest("POST", `/api/brands/${params.brandId}/generate-persona`, { 
        audienceType: type,
        customPrompt,
        personaName: personaName?.trim() || undefined,
        segmentIds,
        subSegmentIds
      });
      if (!response.ok) throw new Error("Failed to generate persona");
      return response.json() as Promise<GeneratedPersona>;
    },
    onSuccess: (persona) => {
      setNewAudienceName(persona.name);
      toast({ title: "Персона згенерована", description: `Портрет "${persona.name}" створено` });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося згенерувати персону", variant: "destructive" });
    },
  });

  const createAudienceMutation = useMutation({
    mutationFn: async (data: Partial<TargetAudience> & { segmentIds?: string[]; subSegmentIds?: string[]; audienceTypeIds?: string[] }) => {
      const { audienceTypeIds, ...audienceData } = data;
      const response = await apiRequest("POST", `/api/brands/${params.brandId}/target-audiences`, audienceData);
      if (!response.ok) throw new Error("Failed to create audience");
      const newAudience = await response.json();
      
      // Assign audience types if any selected
      if (audienceTypeIds && audienceTypeIds.length > 0) {
        await Promise.all(
          audienceTypeIds.map(typeId =>
            apiRequest("POST", `/api/target-audiences/${newAudience.id}/audience-types`, { audienceTypeId: typeId })
          )
        );
      }
      
      return newAudience;
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Цільову аудиторію створено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setIsCreateOpen(false);
      setNewAudienceName("");
      setSelectedSegmentIds(new Set());
      setSelectedSubSegmentIds(new Set());
      setSelectedAudienceTypeIds(new Set());
      setTypeSearchQuery("");
      setCustomPrompt("");
      generatePersonaMutation.reset();
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити аудиторію", variant: "destructive" });
    },
  });

  const deleteAudienceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/target-audiences/${id}`);
      if (!response.ok) throw new Error("Failed to delete audience");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Цільову аудиторію видалено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setSelectedAudience(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити аудиторію", variant: "destructive" });
    },
  });

  const updateAudienceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TargetAudience> }) => {
      const response = await apiRequest("PATCH", `/api/target-audiences/${id}`, data);
      if (!response.ok) throw new Error("Failed to update audience");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Персону оновлено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setEditingAudience(null);
      setSelectedAudience(null);
      setIsEditMode(false);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити персону", variant: "destructive" });
    },
  });

  // Category CRUD mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const response = await apiRequest("POST", "/api/audience-type-categories", data);
      if (!response.ok) throw new Error("Failed to create category");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Категорію створено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/audience-types"] });
      await queryClient.refetchQueries({ queryKey: ["/api/audience-types"] });
      setNewCategoryName("");
      setNewCategoryColor("#6b7280");
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити категорію", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; color?: string } }) => {
      const response = await apiRequest("PATCH", `/api/audience-type-categories/${id}`, data);
      if (!response.ok) throw new Error("Failed to update category");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Категорію оновлено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/audience-types"] });
      await queryClient.refetchQueries({ queryKey: ["/api/audience-types"] });
      setEditingCategory(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити категорію", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/audience-type-categories/${id}`);
      if (!response.ok) throw new Error("Failed to delete category");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Категорію видалено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/audience-types"] });
      await queryClient.refetchQueries({ queryKey: ["/api/audience-types"] });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити категорію", variant: "destructive" });
    },
  });

  // Type CRUD mutations
  const createTypeMutation = useMutation({
    mutationFn: async (data: { categoryId: string; name: string; color: string }) => {
      const response = await apiRequest("POST", "/api/audience-types", data);
      if (!response.ok) throw new Error("Failed to create type");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Тип створено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/audience-types"] });
      await queryClient.refetchQueries({ queryKey: ["/api/audience-types"] });
      setNewTypeName("");
      setNewTypeColor("#6b7280");
      setAddingTypeToCategoryId(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити тип", variant: "destructive" });
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; color?: string } }) => {
      const response = await apiRequest("PATCH", `/api/audience-types/${id}`, data);
      if (!response.ok) throw new Error("Failed to update type");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Тип оновлено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/audience-types"] });
      await queryClient.refetchQueries({ queryKey: ["/api/audience-types"] });
      setEditingType(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити тип", variant: "destructive" });
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/audience-types/${id}`);
      if (!response.ok) throw new Error("Failed to delete type");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Тип видалено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/audience-types"] });
      await queryClient.refetchQueries({ queryKey: ["/api/audience-types"] });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити тип", variant: "destructive" });
    },
  });

  // Segment assignment mutations
  interface SegmentAssignment {
    id: string;
    personaId: string;
    segmentId: string | null;
    subSegmentId: string | null;
  }

  const { data: personaAssignments = [], isLoading: assignmentsLoading } = useQuery<SegmentAssignment[]>({
    queryKey: ["/api/target-audiences", assigningPersona?.id, "segment-assignments"],
    queryFn: async () => {
      const response = await fetch(`/api/target-audiences/${assigningPersona!.id}/segment-assignments`, { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch assignments");
      return response.json();
    },
    enabled: !!assigningPersona,
  });

  const addAssignmentMutation = useMutation({
    mutationFn: async ({ personaId, segmentId, subSegmentId }: { personaId: string; segmentId?: string; subSegmentId?: string }) => {
      const response = await apiRequest("POST", `/api/target-audiences/${personaId}/segment-assignments`, { segmentId, subSegmentId });
      if (!response.ok) throw new Error("Failed to add assignment");
      return response.json();
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/target-audiences", variables.personaId, "segment-assignments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/target-audiences", variables.personaId, "segment-assignments"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося призначити персону", variant: "destructive" });
    },
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async ({ personaId, assignmentId }: { personaId: string; assignmentId: string }) => {
      const response = await apiRequest("DELETE", `/api/target-audiences/${personaId}/segment-assignments/${assignmentId}`);
      if (!response.ok) throw new Error("Failed to remove assignment");
      return response.json();
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/target-audiences", variables.personaId, "segment-assignments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/target-audiences", variables.personaId, "segment-assignments"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити призначення", variant: "destructive" });
    },
  });
  
  const isAssignmentMutating = addAssignmentMutation.isPending || removeAssignmentMutation.isPending;

  // Segment mutations
  const updateSegmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DemographicSegment> }) => {
      const response = await apiRequest("PATCH", `/api/demographic-segments/${id}`, data);
      if (!response.ok) throw new Error("Failed to update segment");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Сегмент оновлено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setEditingSegment(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити сегмент", variant: "destructive" });
    },
  });

  const deleteSegmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/demographic-segments/${id}`);
      if (!response.ok) throw new Error("Failed to delete segment");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Сегмент видалено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити сегмент", variant: "destructive" });
    },
  });

  const createSubSegmentMutation = useMutation({
    mutationFn: async ({ segmentId, name }: { segmentId: string; name: string }) => {
      const response = await apiRequest("POST", `/api/demographic-segments/${segmentId}/sub-segments`, { name });
      if (!response.ok) throw new Error("Failed to create sub-segment");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Підсегмент створено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити підсегмент", variant: "destructive" });
    },
  });

  const updateSubSegmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DemographicSubSegment> }) => {
      const response = await apiRequest("PATCH", `/api/demographic-sub-segments/${id}`, data);
      if (!response.ok) throw new Error("Failed to update sub-segment");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Підсегмент оновлено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setEditingSubSegment(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити підсегмент", variant: "destructive" });
    },
  });

  const moveSubSegmentMutation = useMutation({
    mutationFn: async ({ id, newSegmentId }: { id: string; newSegmentId: string }) => {
      const response = await apiRequest("PATCH", `/api/demographic-sub-segments/${id}`, { segmentId: newSegmentId });
      if (!response.ok) throw new Error("Failed to move sub-segment");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Підсегмент переміщено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setMovingSubSegment(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося перемістити підсегмент", variant: "destructive" });
    },
  });

  const deleteSubSegmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/demographic-sub-segments/${id}`);
      if (!response.ok) throw new Error("Failed to delete sub-segment");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Підсегмент видалено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити підсегмент", variant: "destructive" });
    },
  });

  const addToSegmentMutation = useMutation({
    mutationFn: async ({ personaId, segmentId, subSegmentId }: { personaId: string; segmentId: string; subSegmentId: string | null }) => {
      const response = await apiRequest("POST", `/api/target-audiences/${personaId}/segment-assignments`, { segmentId, subSegmentId });
      if (!response.ok) throw new Error("Failed to add to segment");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Персону додано до сегменту" });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося додати персону до сегменту", variant: "destructive" });
    },
  });

  const generateAvatarMutation = useMutation({
    mutationFn: async (audienceId: string) => {
      setGeneratingAvatarId(audienceId);
      const response = await apiRequest("POST", `/api/target-audiences/${audienceId}/generate-avatar`);
      if (!response.ok) throw new Error("Failed to generate avatar");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Аватар згенеровано" });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setGeneratingAvatarId(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося згенерувати аватар", variant: "destructive" });
      setGeneratingAvatarId(null);
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async ({ audienceId, base64Data }: { audienceId: string; base64Data: string }) => {
      const response = await apiRequest("POST", `/api/target-audiences/${audienceId}/upload-avatar`, { base64Data });
      if (!response.ok) throw new Error("Failed to upload avatar");
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Успішно", description: "Фото завантажено" });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося завантажити фото", variant: "destructive" });
    },
  });

  const handleAvatarUpload = (audienceId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        uploadAvatarMutation.mutate({ audienceId, base64Data });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleGeneratePersona = () => {
    generatePersonaMutation.mutate({ 
      type: audienceType, 
      customPrompt: customPrompt.trim() || undefined,
      personaName: newAudienceName.trim() || undefined,
      segmentIds: selectedSegmentIds.size > 0 ? Array.from(selectedSegmentIds) : undefined,
      subSegmentIds: selectedSubSegmentIds.size > 0 ? Array.from(selectedSubSegmentIds) : undefined
    });
  };

  const handleCreateFromPersona = () => {
    const persona = generatePersonaMutation.data;
    if (!persona) return;

    createAudienceMutation.mutate({
      brandId: params.brandId!,
      name: newAudienceName.trim() || persona.name,
      description: `${persona.occupation}, ${persona.age} років`,
      isPrimary: audienceType === "primary",
      ageRange: `${persona.age - 5}-${persona.age + 5}`,
      gender: persona.gender,
      location: persona.location,
      income: persona.income,
      education: persona.education,
      occupation: persona.occupation,
      values: persona.values,
      interests: persona.interests,
      painPoints: persona.painPoints,
      goals: persona.goals,
      motivations: persona.motivations,
      fears: persona.fears,
      buyingBehavior: persona.buyingBehavior,
      mediaConsumption: persona.mediaConsumption,
      decisionFactors: persona.decisionFactors,
      aiPortrait: `${persona.lifestyle}\n\n${persona.dayInLife}\n\n${persona.brandRelationship}`,
      segmentIds: selectedSegmentIds.size > 0 ? Array.from(selectedSegmentIds) : undefined,
      subSegmentIds: selectedSubSegmentIds.size > 0 ? Array.from(selectedSubSegmentIds) : undefined,
      audienceTypeIds: selectedAudienceTypeIds.size > 0 ? Array.from(selectedAudienceTypeIds) : undefined,
    });
  };

  const isLoading = brandLoading || audiencesLoading || segmentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Бренд не знайдено</p>
        <Link href="/brands">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            До брендів
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href={`/brand/${params.brandId}?tab=audience`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <span className="truncate">Цільова аудиторія</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{brand.name}</p>
            </div>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setCustomPrompt("");
              setNewAudienceName("");
              setSelectedSegmentIds(new Set());
              setSelectedSubSegmentIds(new Set());
              generatePersonaMutation.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex-shrink-0 text-xs sm:text-sm">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Додати ЦА</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Створити цільову аудиторію</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Категорія</Label>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsPersonaCategoriesOpen(true)}>
                      <Settings className="h-3 w-3 mr-1" />
                      Налаштувати
                    </Button>
                  </div>
                  <Select value={audienceType} onValueChange={(v) => setAudienceType(v as "primary" | "secondary" | "niche")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {personaCategories.length > 0 ? (
                        personaCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name.toLowerCase()}>
                            {cat.name}{cat.nameEn ? ` (${cat.nameEn})` : ''}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="primary">Основна (Primary)</SelectItem>
                          <SelectItem value="secondary">Вторинна (Secondary)</SelectItem>
                          <SelectItem value="niche">Нішева (Niche)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-medium">AI-генерація персони</span>
                    </div>
                    <Button 
                      onClick={handleGeneratePersona} 
                      disabled={generatePersonaMutation.isPending}
                      size="sm"
                    >
                      {generatePersonaMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Генерація...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Згенерувати
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI проаналізує ваш бренд (цінності, місію, опис) та створить детальний портрет ідеального клієнта
                  </p>
                  <div className="space-y-2">
                    <Label className="text-sm">Додатковий напрямок (опціонально)</Label>
                    <Textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Опишіть особливості персони, яку хочете згенерувати. Наприклад: 'Молода мама з великого міста, яка цікавиться здоровим харчуванням' або 'IT-спеціаліст, який шукає преміальні продукти'"
                      rows={3}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ваші вказівки будуть враховані як пріоритетний напрямок для створення персони
                    </p>
                  </div>
                </div>

                {generatePersonaMutation.data && (
                  <PersonaPreview persona={generatePersonaMutation.data} />
                )}

                <div className="space-y-2">
                  <Label>Ім'я персони</Label>
                  <Input 
                    value={newAudienceName}
                    onChange={(e) => setNewAudienceName(e.target.value)}
                    placeholder="Введіть ім'я або залиште порожнім для AI-генерації"
                  />
                  <p className="text-xs text-muted-foreground">
                    Якщо залишити порожнім, AI підбере типове ім'я
                  </p>
                </div>

                {segments.length > 0 && (
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-blue-500" />
                      Додати до сегментів (опціонально)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Обрані сегменти будуть враховані при генерації портрету персони
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                      {segments.map((segment) => (
                        <div key={segment.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`seg-${segment.id}`}
                              checked={selectedSegmentIds.has(segment.id)}
                              onCheckedChange={(checked) => {
                                const newSet = new Set(selectedSegmentIds);
                                if (checked) newSet.add(segment.id);
                                else newSet.delete(segment.id);
                                setSelectedSegmentIds(newSet);
                              }}
                            />
                            <label 
                              htmlFor={`seg-${segment.id}`} 
                              className="text-sm font-medium cursor-pointer flex items-center gap-2"
                            >
                              <FolderOpen className="h-4 w-4" style={{ color: segment.color || '#f59e0b' }} />
                              {segment.name}
                            </label>
                          </div>
                          {segment.subSegments.length > 0 && (
                            <div className="ml-6 space-y-1">
                              {segment.subSegments.map((subSeg) => (
                                <div key={subSeg.id} className="flex items-center gap-2">
                                  <Checkbox
                                    id={`subseg-${subSeg.id}`}
                                    checked={selectedSubSegmentIds.has(subSeg.id)}
                                    onCheckedChange={(checked) => {
                                      const newSet = new Set(selectedSubSegmentIds);
                                      if (checked) newSet.add(subSeg.id);
                                      else newSet.delete(subSeg.id);
                                      setSelectedSubSegmentIds(newSet);
                                    }}
                                  />
                                  <label 
                                    htmlFor={`subseg-${subSeg.id}`} 
                                    className="text-xs cursor-pointer flex items-center gap-1.5"
                                  >
                                    <Layers className="h-3 w-3" style={{ color: subSeg.color || '#60a5fa' }} />
                                    {subSeg.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audience Types Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-purple-500" />
                      Типи аудиторії (опціонально)
                    </Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-xs"
                      onClick={() => setIsTypeManageOpen(true)}
                    >
                      <Settings className="h-3.5 w-3.5 mr-1" />
                      Налаштувати
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Оберіть теги для класифікації персони
                  </p>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Пошук типів..."
                      value={typeSearchQuery}
                      onChange={(e) => setTypeSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <div className="space-y-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {filteredCategories.map((category) => (
                      <div key={category.id}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-xs font-medium text-muted-foreground">
                            {category.name}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {category.types.map((type) => {
                            const isSelected = selectedAudienceTypeIds.has(type.id);
                            return (
                              <button
                                key={type.id}
                                type="button"
                                onClick={() => {
                                  const newSet = new Set(selectedAudienceTypeIds);
                                  if (isSelected) newSet.delete(type.id);
                                  else newSet.add(type.id);
                                  setSelectedAudienceTypeIds(newSet);
                                }}
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all hover:scale-105 ${
                                  isSelected 
                                    ? 'ring-2 ring-offset-1' 
                                    : 'opacity-70 hover:opacity-100'
                                }`}
                                style={{ 
                                  backgroundColor: `${type.color}20`,
                                  color: type.color,
                                }}
                              >
                                <Hash className="h-3 w-3 mr-0.5" />
                                {type.name}
                                {isSelected && <X className="h-3 w-3 ml-1" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {filteredCategories.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        {typeSearchQuery ? "Нічого не знайдено" : "Завантаження..."}
                      </p>
                    )}
                  </div>
                  {selectedAudienceTypeIds.size > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Обрано: {selectedAudienceTypeIds.size}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 px-1.5 text-xs"
                        onClick={() => setSelectedAudienceTypeIds(new Set())}
                      >
                        Очистити
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Скасувати
                  </Button>
                  <Button 
                    onClick={handleCreateFromPersona}
                    disabled={!generatePersonaMutation.data || createAudienceMutation.isPending}
                  >
                    {createAudienceMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Зберегти
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column: Segments */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Segments Section */}
            <Card className="overflow-hidden">
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                    <CardTitle className="text-base sm:text-lg truncate">Сегменти аудиторії</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-shrink-0 text-xs sm:text-sm"
                    onClick={() => setIsSegmentDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Сегмент</span>
                  </Button>
                  <CreateSegmentDialog
                    open={isSegmentDialogOpen || !!editingSegment}
                    onOpenChange={(open) => {
                      if (!open) {
                        setIsSegmentDialogOpen(false);
                        setEditingSegment(null);
                      }
                    }}
                    brandId={params.brandId!}
                    segment={editingSegment}
                  />
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 overflow-x-hidden">
                {segments.length === 0 ? (
                  <div className="p-4 sm:p-6 border border-dashed rounded-lg text-center">
                    <FolderOpen className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground/50 mb-2 sm:mb-3" />
                    <p className="font-medium text-muted-foreground mb-1 text-sm sm:text-base">Немає сегментів</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Створіть сегменти для групування персон</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {segments.map((segment) => (
                      <Collapsible
                        key={segment.id}
                        open={expandedSegments.has(segment.id)}
                        onOpenChange={(open) => {
                          const newSet = new Set(expandedSegments);
                          if (open) newSet.add(segment.id);
                          else newSet.delete(segment.id);
                          setExpandedSegments(newSet);
                        }}
                      >
                        <div className="border rounded-lg group">
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-2 sm:p-4 hover:bg-muted/50 transition-colors gap-1 sm:gap-2">
                              <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
                                {expandedSegments.has(segment.id) ? (
                                  <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                )}
                                <FolderOpen className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" style={{ color: segment.color || '#f59e0b' }} />
                                <span className="font-medium truncate text-sm sm:text-base">{segment.name}</span>
                                <Badge variant="secondary" className="whitespace-nowrap flex-shrink-0 text-[10px] sm:text-xs px-1.5 sm:px-2">
                                  {segment.personas.length + segment.subSegments.reduce((acc, s) => acc + s.personas.length, 0)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSegment(segment);
                                  }}
                                  title="Налаштування сегменту"
                                >
                                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const name = prompt("Назва підсегменту:");
                                    if (name) createSubSegmentMutation.mutate({ segmentId: segment.id, name });
                                  }}
                                  title="Додати підсегмент"
                                >
                                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Видалити сегмент?")) deleteSegmentMutation.mutate(segment.id);
                                  }}
                                  title="Видалити"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-2 sm:px-4 pb-3 sm:pb-4 space-y-2 sm:space-y-3">
                              {/* Personas directly in segment */}
                              {segment.personas.map((persona) => (
                                <PersonaInline 
                                  key={persona.id}
                                  persona={persona}
                                  onSelect={() => setSelectedAudience(persona)}
                                  onGenerateAvatar={() => generateAvatarMutation.mutate(persona.id)}
                                  isGeneratingAvatar={generatingAvatarId === persona.id}
                                  onAssign={() => setAssigningPersona(persona)}
                                  className="ml-4 sm:ml-8"
                                />
                              ))}
                              
                              {/* Sub-segments */}
                              {segment.subSegments.map((subSegment) => (
                                <div key={subSegment.id} className="ml-4 sm:ml-8 border-l-2 pl-2 sm:pl-4 space-y-2" style={{ borderColor: subSegment.color || '#60a5fa' }}>
                                  <div className="flex items-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 group">
                                    <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" style={{ color: subSegment.color || '#60a5fa' }} />
                                    <span className="text-xs sm:text-sm font-medium flex-1 truncate">{subSegment.name}</span>
                                    <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 flex-shrink-0">{subSegment.personas.length}</Badge>
                                    <div className="flex sm:hidden sm:group-hover:flex items-center gap-0.5">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                        onClick={() => setEditingSubSegment(subSegment)}
                                        title="Налаштування"
                                      >
                                        <Settings className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-destructive hover:text-destructive"
                                        onClick={() => {
                                          if (confirm("Видалити підсегмент?")) {
                                            deleteSubSegmentMutation.mutate(subSegment.id);
                                          }
                                        }}
                                        title="Видалити"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  {subSegment.personas.map((persona) => (
                                    <PersonaInline 
                                      key={persona.id}
                                      persona={persona}
                                      onSelect={() => setSelectedAudience(persona)}
                                      onGenerateAvatar={() => generateAvatarMutation.mutate(persona.id)}
                                      isGeneratingAvatar={generatingAvatarId === persona.id}
                                      onAssign={() => setAssigningPersona(persona)}
                                      small
                                    />
                                  ))}
                                </div>
                              ))}
                              
                              {segment.personas.length === 0 && segment.subSegments.length === 0 && (
                                <p className="text-xs sm:text-sm text-muted-foreground ml-4 sm:ml-8 py-2">Немає персон</p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Personas */}
            <Card className="overflow-hidden">
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                  <CardTitle className="text-base sm:text-lg">Персони</CardTitle>
                  {audiences.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{audiences.length}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 overflow-x-hidden">
                {audiences.length === 0 ? (
                  <div className="p-4 sm:p-6 border border-dashed rounded-lg text-center">
                    <Users className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground/50 mb-2 sm:mb-3" />
                    <p className="font-medium text-muted-foreground mb-1 text-sm sm:text-base">Ще немає персон</p>
                    <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)} className="mt-2 text-xs sm:text-sm">
                      <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                      Створити персону
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {audiences.map((audience) => {
                      const assignments = getPersonaAssignments(audience.id);
                      return (
                        <div 
                          key={audience.id} 
                          className="p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => setSelectedAudience(audience)}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            {audience.aiPortraitImageUrl ? (
                              <img src={audience.aiPortraitImageUrl} alt="" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                <span className="font-medium text-sm truncate max-w-[120px] sm:max-w-none">{audience.name}</span>
                                {audience.isPrimary ? (
                                  <Badge variant="default" className="text-[10px] px-1.5 flex-shrink-0">Основна</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-1.5 flex-shrink-0">Вторинна</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {audience.occupation ? `${audience.occupation}` : ''}{audience.ageRange ? `, ${audience.ageRange}` : ''}
                              </p>
                              {assignments.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {assignments.map((a, idx) => (
                                    <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0 h-5" style={{ borderColor: a.color, color: a.color }}>
                                      <FolderOpen className="h-2.5 w-2.5 mr-0.5" />
                                      {a.subSegmentName ? `${a.segmentName} → ${a.subSegmentName}` : a.segmentName}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAssigningPersona(audience);
                                }}
                                title="Призначити до сегментів"
                              >
                                <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              </Button>
                              {!audience.aiPortraitImageUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateAvatarMutation.mutate(audience.id);
                                  }}
                                  disabled={generatingAvatarId === audience.id}
                                  title="Згенерувати аватар"
                                >
                                  {generatingAvatarId === audience.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Image className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Quick Stats */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                <CardTitle className="text-base sm:text-lg">Статистика</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Всього персон</span>
                  <Badge variant="secondary" className="text-xs">{audiences.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Сегментів</span>
                  <Badge variant="secondary" className="text-xs">{segments.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Без сегменту</span>
                  <Badge variant="outline" className="text-xs">{getUnassignedPersonas().length}</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <span className="text-xs sm:text-sm font-medium">Типи аудиторій</span>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Основна</span>
                    <span>{audiences.filter(a => a.isPrimary).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Вторинна</span>
                    <span>{audiences.filter(a => !a.isPrimary).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
                <CardTitle className="text-base sm:text-lg">Швидкі дії</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 sm:px-6">
                <Button variant="outline" className="w-full justify-start" onClick={() => setIsCreateOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Згенерувати персону
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setIsSegmentDialogOpen(true)}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Створити сегмент
                </Button>
                <Separator className="my-2" />
                <Button variant="outline" className="w-full justify-start" onClick={() => setIsTypeManageOpen(true)}>
                  <Hash className="h-4 w-4 mr-2" />
                  Типи аудиторії
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setIsBaseCategoriesOpen(true)}>
                  <Layers className="h-4 w-4 mr-2" />
                  Сегменти
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setIsPersonaCategoriesOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Категорії
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Selected Audience Dialog */}
        {selectedAudience && (
          <PersonaDetailCard
            persona={selectedAudience}
            assignments={getPersonaAssignments(selectedAudience.id)}
            segments={segments}
            onClose={() => { setSelectedAudience(null); setIsEditMode(false); setEditingAudience(null); }}
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
              queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
            }}
            onManageTypes={() => setIsTypeManageOpen(true)}
          />
        )}


        {/* Edit Sub-Segment Dialog */}
        {editingSubSegment && (
          <Dialog open={!!editingSubSegment} onOpenChange={() => setEditingSubSegment(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Налаштування підсегменту</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Назва</Label>
                  <Input
                    value={editingSubSegment.name}
                    onChange={(e) => setEditingSubSegment({ ...editingSubSegment, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Колір</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingSubSegment.color || '#60a5fa'}
                      onChange={(e) => setEditingSubSegment({ ...editingSubSegment, color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={editingSubSegment.color || '#60a5fa'}
                      onChange={(e) => setEditingSubSegment({ ...editingSubSegment, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Опис контексту</Label>
                  <Textarea
                    value={editingSubSegment.contextDescription || ""}
                    onChange={(e) => setEditingSubSegment({ ...editingSubSegment, contextDescription: e.target.value })}
                    placeholder="Опишіть контекст цього підсегменту..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Специфічні потреби</Label>
                  <Textarea
                    value={editingSubSegment.specificNeeds || ""}
                    onChange={(e) => setEditingSubSegment({ ...editingSubSegment, specificNeeds: e.target.value })}
                    placeholder="Які специфічні потреби у цього підсегменту..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Відмінності</Label>
                  <Textarea
                    value={editingSubSegment.differentiators || ""}
                    onChange={(e) => setEditingSubSegment({ ...editingSubSegment, differentiators: e.target.value })}
                    placeholder="Чим відрізняється від інших..."
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setEditingSubSegment(null)}>
                    Скасувати
                  </Button>
                  <Button
                    onClick={() => updateSubSegmentMutation.mutate({ 
                      id: editingSubSegment.id, 
                      data: {
                        name: editingSubSegment.name,
                        color: editingSubSegment.color,
                        contextDescription: editingSubSegment.contextDescription,
                        specificNeeds: editingSubSegment.specificNeeds,
                        differentiators: editingSubSegment.differentiators,
                      }
                    })}
                    disabled={!editingSubSegment.name.trim() || updateSubSegmentMutation.isPending}
                  >
                    {updateSubSegmentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Зберегти
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Move Sub-Segment Dialog */}
        {movingSubSegment && (
          <Dialog open={!!movingSubSegment} onOpenChange={() => setMovingSubSegment(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Перемістити підсегмент</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Оберіть новий сегмент для переміщення підсегменту:
                </p>
                <Select
                  onValueChange={(value) => moveSubSegmentMutation.mutate({ id: movingSubSegment.id, newSegmentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть сегмент..." />
                  </SelectTrigger>
                  <SelectContent>
                    {segments
                      .filter(s => s.id !== movingSubSegment.currentSegmentId)
                      .map((seg) => (
                        <SelectItem key={seg.id} value={seg.id}>
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" style={{ color: seg.color || '#f59e0b' }} />
                            {seg.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Segment Assignment Dialog */}
        <Dialog open={!!assigningPersona} onOpenChange={(open) => !open && setAssigningPersona(null)}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Призначити до сегментів</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {assigningPersona?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 py-2">
              {assignmentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : segments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Спочатку створіть сегменти
                </p>
              ) : (
                segments.map((segment) => {
                  const segmentAssignment = personaAssignments.find(a => a.segmentId === segment.id && !a.subSegmentId);
                  const isAssignedToSegment = !!segmentAssignment;
                  
                  return (
                    <div key={segment.id} className="space-y-2">
                      <div 
                        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer ${isAssignmentMutating ? 'opacity-60 pointer-events-none' : ''}`}
                        onClick={() => {
                          if (!assigningPersona || isAssignmentMutating) return;
                          if (isAssignedToSegment) {
                            removeAssignmentMutation.mutate({ personaId: assigningPersona.id, assignmentId: segmentAssignment.id });
                          } else {
                            addAssignmentMutation.mutate({ personaId: assigningPersona.id, segmentId: segment.id });
                          }
                        }}
                      >
                        <Checkbox 
                          checked={isAssignedToSegment} 
                          className="flex-shrink-0"
                          disabled={isAssignmentMutating}
                        />
                        <FolderOpen className="h-4 w-4 flex-shrink-0" style={{ color: segment.color || '#f59e0b' }} />
                        <span className="font-medium text-sm truncate">{segment.name}</span>
                      </div>
                      
                      {segment.subSegments.length > 0 && (
                        <div className="ml-6 space-y-1 border-l-2 pl-3" style={{ borderColor: segment.color || '#f59e0b' }}>
                          {segment.subSegments.map((subSegment) => {
                            const subAssignment = personaAssignments.find(a => a.subSegmentId === subSegment.id);
                            const isAssignedToSub = !!subAssignment;
                            
                            return (
                              <div 
                                key={subSegment.id}
                                className={`flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer ${isAssignmentMutating ? 'opacity-60 pointer-events-none' : ''}`}
                                onClick={() => {
                                  if (!assigningPersona || isAssignmentMutating) return;
                                  if (isAssignedToSub) {
                                    removeAssignmentMutation.mutate({ personaId: assigningPersona.id, assignmentId: subAssignment.id });
                                  } else {
                                    addAssignmentMutation.mutate({ personaId: assigningPersona.id, segmentId: segment.id, subSegmentId: subSegment.id });
                                  }
                                }}
                              >
                                <Checkbox 
                                  checked={isAssignedToSub}
                                  className="flex-shrink-0"
                                  disabled={isAssignmentMutating}
                                />
                                <Layers className="h-3.5 w-3.5 flex-shrink-0" style={{ color: subSegment.color || '#60a5fa' }} />
                                <span className="text-sm truncate">{subSegment.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssigningPersona(null)}>
                Закрити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Type Management Dialog */}
        <Dialog open={isTypeManageOpen} onOpenChange={setIsTypeManageOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Налаштування типів аудиторії</DialogTitle>
              <DialogDescription>
                Додавайте та редагуйте категорії та типи для класифікації персон
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Add new category */}
              <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <Label className="font-medium">Нова категорія</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Назва категорії..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-14 h-9 p-1 cursor-pointer"
                  />
                  <Button 
                    size="sm"
                    onClick={() => createCategoryMutation.mutate({ name: newCategoryName, color: newCategoryColor })}
                    disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                  >
                    {createCategoryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Existing categories */}
              <div className="space-y-4">
                {audienceTypeCategories.map((category) => (
                  <div key={category.id} className="border rounded-lg overflow-hidden">
                    {/* Category header */}
                    <div className="p-3 bg-muted/50 flex items-center justify-between">
                      {editingCategory?.id === category.id ? (
                        <div className="flex gap-2 flex-1">
                          <Input
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="flex-1 h-8"
                          />
                          <Input
                            type="color"
                            value={editingCategory.color}
                            onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                            className="w-10 h-8 p-0.5 cursor-pointer"
                          />
                          <Button 
                            size="sm" 
                            className="h-8"
                            onClick={() => updateCategoryMutation.mutate({ id: category.id, data: { name: editingCategory.name, color: editingCategory.color } })}
                            disabled={updateCategoryMutation.isPending}
                          >
                            Зберегти
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingCategory(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                            <span className="font-medium">{category.name}</span>
                            <Badge variant="outline" className="text-xs">{category.types.length} типів</Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7"
                              onClick={() => setEditingCategory(category)}
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 text-destructive"
                              onClick={() => {
                                if (confirm(`Видалити категорію "${category.name}" та всі її типи?`)) {
                                  deleteCategoryMutation.mutate(category.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Types list */}
                    <div className="p-3 space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {category.types.map((type) => (
                          editingType?.type.id === type.id ? (
                            <div key={type.id} className="flex gap-1 items-center p-1 border rounded-lg bg-background">
                              <Input
                                value={editingType.type.name}
                                onChange={(e) => setEditingType({ ...editingType, type: { ...editingType.type, name: e.target.value } })}
                                className="h-6 text-xs w-24"
                              />
                              <Input
                                type="color"
                                value={editingType.type.color}
                                onChange={(e) => setEditingType({ ...editingType, type: { ...editingType.type, color: e.target.value } })}
                                className="w-6 h-6 p-0 cursor-pointer"
                              />
                              <Button 
                                size="sm" 
                                className="h-6 px-2 text-xs"
                                onClick={() => updateTypeMutation.mutate({ id: type.id, data: { name: editingType.type.name, color: editingType.type.color } })}
                              >
                                OK
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => setEditingType(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              key={type.id}
                              className="group inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium hover:ring-2 ring-offset-1 transition-all"
                              style={{ backgroundColor: `${type.color}20`, color: type.color }}
                              onClick={() => setEditingType({ type, categoryId: category.id })}
                            >
                              <Hash className="h-3 w-3 mr-0.5" />
                              {type.name}
                              <X 
                                className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Видалити тип "${type.name}"?`)) {
                                    deleteTypeMutation.mutate(type.id);
                                  }
                                }}
                              />
                            </button>
                          )
                        ))}
                      </div>

                      {/* Add type form */}
                      {addingTypeToCategoryId === category.id ? (
                        <div className="flex gap-1.5 items-center mt-2">
                          <Input
                            placeholder="Новий тип..."
                            value={newTypeName}
                            onChange={(e) => setNewTypeName(e.target.value)}
                            className="h-7 text-xs flex-1"
                            autoFocus
                          />
                          <Input
                            type="color"
                            value={newTypeColor}
                            onChange={(e) => setNewTypeColor(e.target.value)}
                            className="w-7 h-7 p-0 cursor-pointer"
                          />
                          <Button 
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => createTypeMutation.mutate({ categoryId: category.id, name: newTypeName, color: newTypeColor })}
                            disabled={!newTypeName.trim() || createTypeMutation.isPending}
                          >
                            Додати
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-1"
                            onClick={() => {
                              setAddingTypeToCategoryId(null);
                              setNewTypeName("");
                              setNewTypeColor(category.color);
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs mt-1"
                          onClick={() => {
                            setAddingTypeToCategoryId(category.id);
                            setNewTypeColor(category.color);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Додати тип
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTypeManageOpen(false)}>
                Закрити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Base Categories (Demographic Segments) Management Dialog */}
        <Dialog open={isBaseCategoriesOpen} onOpenChange={setIsBaseCategoriesOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Налаштування базових категорій</DialogTitle>
              <DialogDescription>
                Додавайте та редагуйте базові категорії сегментації (наприклад: Вік, Стать, Дохід)
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Add new segment */}
              <div className="flex gap-2">
                <Input
                  placeholder="Назва нової категорії..."
                  value={newBaseCategoryName}
                  onChange={(e) => setNewBaseCategoryName(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="color"
                  value={newBaseCategoryColor}
                  onChange={(e) => setNewBaseCategoryColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Button 
                  onClick={async () => {
                    if (!newBaseCategoryName.trim()) return;
                    try {
                      await apiRequest("POST", `/api/brands/${params.brandId}/demographic-segments`, { 
                        name: newBaseCategoryName.trim(),
                        color: newBaseCategoryColor,
                        priority: segments.length
                      });
                      await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
                      await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
                      setNewBaseCategoryName("");
                      setNewBaseCategoryColor("#6b7280");
                      toast({ title: "Успішно", description: "Категорію створено" });
                    } catch (error) {
                      toast({ title: "Помилка", description: "Не вдалося створити категорію", variant: "destructive" });
                    }
                  }}
                  disabled={!newBaseCategoryName.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Додати
                </Button>
              </div>

              {/* List of segments */}
              <div className="space-y-2">
                {segments.map((segment) => (
                  <div key={segment.id} className="border rounded-lg p-3">
                    {editingSegmentInManage?.id === segment.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingSegmentInManage.name}
                          onChange={(e) => setEditingSegmentInManage({ ...editingSegmentInManage, name: e.target.value })}
                          className="flex-1"
                        />
                        <Input
                          type="color"
                          value={editingSegmentInManage.color || "#6b7280"}
                          onChange={(e) => setEditingSegmentInManage({ ...editingSegmentInManage, color: e.target.value })}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Button 
                          size="sm"
                          onClick={async () => {
                            try {
                              await apiRequest("PATCH", `/api/demographic-segments/${segment.id}`, { 
                                name: editingSegmentInManage.name,
                                color: editingSegmentInManage.color
                              });
                              await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
                              await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
                              setEditingSegmentInManage(null);
                              toast({ title: "Успішно", description: "Категорію оновлено" });
                            } catch (error) {
                              toast({ title: "Помилка", description: "Не вдалося оновити категорію", variant: "destructive" });
                            }
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setEditingSegmentInManage(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: segment.color || "#6b7280" }}
                          />
                          <span className="font-medium">{segment.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {segment.subSegments?.length || 0} підкатегорій
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setEditingSegmentInManage(segment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={async () => {
                              if (confirm(`Видалити категорію "${segment.name}" та всі її підкатегорії?`)) {
                                try {
                                  await apiRequest("DELETE", `/api/demographic-segments/${segment.id}`);
                                  await queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
                                  await queryClient.refetchQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
                                  toast({ title: "Успішно", description: "Категорію видалено" });
                                } catch (error) {
                                  toast({ title: "Помилка", description: "Не вдалося видалити категорію", variant: "destructive" });
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {segments.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Немає базових категорій. Додайте першу категорію вище.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBaseCategoriesOpen(false)}>
                Закрити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Persona Categories (Primary/Secondary/Niche) Management Dialog */}
        <Dialog open={isPersonaCategoriesOpen} onOpenChange={setIsPersonaCategoriesOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Налаштування категорій</DialogTitle>
              <DialogDescription>
                Додавайте та редагуйте категорії персон (наприклад: Основна, Вторинна, Нішева)
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Add new persona category */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Назва українською..."
                    value={newPersonaCategoryName}
                    onChange={(e) => setNewPersonaCategoryName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="English name..."
                    value={newPersonaCategoryNameEn}
                    onChange={(e) => setNewPersonaCategoryNameEn(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={newPersonaCategoryColor}
                    onChange={(e) => setNewPersonaCategoryColor(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Button 
                    className="flex-1"
                    onClick={async () => {
                      if (!newPersonaCategoryName.trim()) return;
                      try {
                        await apiRequest("POST", "/api/persona-categories", { 
                          name: newPersonaCategoryName.trim(),
                          nameEn: newPersonaCategoryNameEn.trim() || null,
                          color: newPersonaCategoryColor,
                          sortOrder: personaCategories.length
                        });
                        await queryClient.invalidateQueries({ queryKey: ["/api/persona-categories"] });
                        await queryClient.refetchQueries({ queryKey: ["/api/persona-categories"] });
                        setNewPersonaCategoryName("");
                        setNewPersonaCategoryNameEn("");
                        setNewPersonaCategoryColor("#6b7280");
                        toast({ title: "Успішно", description: "Категорію створено" });
                      } catch (error) {
                        toast({ title: "Помилка", description: "Не вдалося створити категорію", variant: "destructive" });
                      }
                    }}
                    disabled={!newPersonaCategoryName.trim()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Додати
                  </Button>
                </div>
              </div>

              {/* List of persona categories */}
              <div className="space-y-2">
                {personaCategories.map((cat) => (
                  <div key={cat.id} className="border rounded-lg p-3">
                    {editingPersonaCategory?.id === cat.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingPersonaCategory.name}
                            onChange={(e) => setEditingPersonaCategory({ ...editingPersonaCategory, name: e.target.value })}
                            placeholder="Назва українською"
                            className="flex-1"
                          />
                          <Input
                            value={editingPersonaCategory.nameEn || ""}
                            onChange={(e) => setEditingPersonaCategory({ ...editingPersonaCategory, nameEn: e.target.value })}
                            placeholder="English name"
                            className="flex-1"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={editingPersonaCategory.color || "#6b7280"}
                            onChange={(e) => setEditingPersonaCategory({ ...editingPersonaCategory, color: e.target.value })}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Button 
                            size="sm"
                            onClick={async () => {
                              try {
                                await apiRequest("PATCH", `/api/persona-categories/${cat.id}`, { 
                                  name: editingPersonaCategory.name,
                                  nameEn: editingPersonaCategory.nameEn,
                                  color: editingPersonaCategory.color
                                });
                                await queryClient.invalidateQueries({ queryKey: ["/api/persona-categories"] });
                                await queryClient.refetchQueries({ queryKey: ["/api/persona-categories"] });
                                setEditingPersonaCategory(null);
                                toast({ title: "Успішно", description: "Категорію оновлено" });
                              } catch (error) {
                                toast({ title: "Помилка", description: "Не вдалося оновити категорію", variant: "destructive" });
                              }
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setEditingPersonaCategory(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: cat.color || "#6b7280" }}
                          />
                          <span className="font-medium">{cat.name}</span>
                          {cat.nameEn && (
                            <span className="text-muted-foreground text-sm">({cat.nameEn})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => setEditingPersonaCategory(cat)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={async () => {
                              if (confirm(`Видалити категорію "${cat.name}"?`)) {
                                try {
                                  await apiRequest("DELETE", `/api/persona-categories/${cat.id}`);
                                  await queryClient.invalidateQueries({ queryKey: ["/api/persona-categories"] });
                                  await queryClient.refetchQueries({ queryKey: ["/api/persona-categories"] });
                                  toast({ title: "Успішно", description: "Категорію видалено" });
                                } catch (error) {
                                  toast({ title: "Помилка", description: "Не вдалося видалити категорію", variant: "destructive" });
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {personaCategories.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Немає категорій. Додайте першу категорію вище.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPersonaCategoriesOpen(false)}>
                Закрити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function PersonaInline({ 
  persona, 
  onSelect,
  onDelete,
  onGenerateAvatar,
  isGeneratingAvatar,
  onAssign,
  small,
  className
}: { 
  persona: TargetAudience;
  onSelect: () => void;
  onDelete?: () => void;
  onGenerateAvatar?: () => void;
  isGeneratingAvatar?: boolean;
  onAssign?: () => void;
  small?: boolean;
  className?: string;
}) {
  const values = (persona.values || []) as string[];
  
  return (
    <div 
      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group ${className || ''}`}
      onClick={onSelect}
    >
      {persona.aiPortraitImageUrl ? (
        <img 
          src={persona.aiPortraitImageUrl} 
          alt="" 
          className={`rounded-full object-cover flex-shrink-0 ${small ? 'h-8 w-8' : 'h-9 w-9 sm:h-10 sm:w-10'}`} 
        />
      ) : (
        <div className={`rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0 ${small ? 'h-8 w-8' : 'h-9 w-9 sm:h-10 sm:w-10'}`}>
          <User className={small ? 'h-4 w-4 text-primary' : 'h-4 w-4 sm:h-5 sm:w-5 text-primary'} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          <span className={`font-medium truncate max-w-[120px] sm:max-w-none ${small ? 'text-sm' : 'text-sm sm:text-base'}`}>{persona.name}</span>
          {persona.isPrimary && (
            <Badge variant="default" className="text-[10px] sm:text-xs px-1.5 sm:px-2">Основна</Badge>
          )}
          {!persona.isPrimary && (
            <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2">Вторинна</Badge>
          )}
        </div>
        {persona.description && !small && (
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{persona.description}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-1">
          {persona.gender && <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5">{persona.gender}</Badge>}
          {persona.ageRange && <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5">{persona.ageRange}</Badge>}
          {values.length > 0 && <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5">+{values.length} цін.</Badge>}
        </div>
      </div>
      <div className="flex sm:hidden sm:group-hover:flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
        {onAssign && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 sm:h-7 sm:w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onAssign();
            }}
            title="Призначити до сегментів"
          >
            <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        )}
        {!persona.aiPortraitImageUrl && onGenerateAvatar && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 sm:h-7 sm:w-7 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateAvatar();
            }}
            disabled={isGeneratingAvatar}
            title="Згенерувати аватар"
          >
            {isGeneratingAvatar ? (
              <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin" />
            ) : (
              <Image className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            )}
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Видалити"
          >
            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function PersonaPreview({ persona }: { persona: GeneratedPersona }) {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-background">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{persona.name}</h3>
          <p className="text-muted-foreground">{persona.occupation}, {persona.age} років</p>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="outline">{persona.gender}</Badge>
            <Badge variant="outline">{persona.location}</Badge>
            <Badge variant="outline">{persona.familyStatus}</Badge>
          </div>
        </div>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg italic text-sm">
        <Quote className="h-4 w-4 inline mr-2 text-muted-foreground" />
        "{persona.quote}"
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="flex items-center gap-2 font-medium mb-1">
            <Heart className="h-4 w-4 text-red-500" />
            Цінності
          </div>
          <div className="flex flex-wrap gap-1">
            {persona.values.slice(0, 3).map((v, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 font-medium mb-1">
            <Target className="h-4 w-4 text-green-500" />
            Цілі
          </div>
          <div className="flex flex-wrap gap-1">
            {persona.goals.slice(0, 2).map((g, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{g}</Badge>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{persona.lifestyle}</p>
    </div>
  );
}

function AudienceDetails({ audience }: { audience: TargetAudience }) {
  const values = (audience.values || []) as string[];
  const interests = (audience.interests || []) as string[];
  const painPoints = (audience.painPoints || []) as string[];
  const goals = (audience.goals || []) as string[];
  const motivations = (audience.motivations || []) as string[];
  const fears = (audience.fears || []) as string[];
  const mediaConsumption = (audience.mediaConsumption || []) as string[];
  const decisionFactors = (audience.decisionFactors || []) as string[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Демографія
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {audience.gender && <p><strong>Стать:</strong> {audience.gender}</p>}
            {audience.ageRange && <p><strong>Вік:</strong> {audience.ageRange}</p>}
            {audience.location && <p><strong>Локація:</strong> {audience.location}</p>}
            {audience.income && <p><strong>Дохід:</strong> {audience.income}</p>}
            {audience.education && <p><strong>Освіта:</strong> {audience.education}</p>}
            {audience.occupation && <p><strong>Професія:</strong> {audience.occupation}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Психографіка
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {values.length > 0 && (
              <div>
                <strong>Цінності:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {values.map((v, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
                  ))}
                </div>
              </div>
            )}
            {interests.length > 0 && (
              <div>
                <strong>Інтереси:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {interests.slice(0, 4).map((v, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {painPoints.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Болі та цілі
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="text-destructive">Болі:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {painPoints.map((p, i) => (
                  <li key={i} className="text-muted-foreground">{p}</li>
                ))}
              </ul>
            </div>
            {goals.length > 0 && (
              <div>
                <strong className="text-green-600">Цілі:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {goals.map((g, i) => (
                    <li key={i} className="text-muted-foreground">{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {motivations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Мотивації та страхи
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="text-blue-600">Мотивації:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {motivations.map((m, i) => (
                  <li key={i} className="text-muted-foreground">{m}</li>
                ))}
              </ul>
            </div>
            {fears.length > 0 && (
              <div>
                <strong className="text-orange-600">Страхи:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {fears.map((f, i) => (
                    <li key={i} className="text-muted-foreground">{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {audience.buyingBehavior && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Поведінка
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>Поведінка при покупках:</strong> {audience.buyingBehavior}</p>
            {decisionFactors.length > 0 && (
              <div>
                <strong>Фактори рішень:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {decisionFactors.map((f, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                  ))}
                </div>
              </div>
            )}
            {mediaConsumption.length > 0 && (
              <div>
                <strong>Канали медіа:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {mediaConsumption.map((m, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {audience.aiPortrait && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Портрет
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-line">
            {audience.aiPortrait}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AudienceEditForm({ 
  audience, 
  onChange, 
  onSave, 
  onCancel, 
  isSaving 
}: { 
  audience: TargetAudience;
  onChange: (audience: TargetAudience) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const updateArrayField = (field: keyof TargetAudience, value: string) => {
    const items = value.split('\n').filter(item => item.trim());
    onChange({ ...audience, [field]: items });
  };

  const getArrayValue = (arr: unknown): string => {
    if (Array.isArray(arr)) {
      return arr.join('\n');
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ім'я</Label>
          <Input
            value={audience.name}
            onChange={(e) => onChange({ ...audience, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Категорія</Label>
          <Select
            value={audience.isPrimary ? "primary" : "secondary"}
            onValueChange={(v) => onChange({ ...audience, isPrimary: v === "primary" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Основна</SelectItem>
              <SelectItem value="secondary">Вторинна</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Опис</Label>
        <Textarea
          value={audience.description || ""}
          onChange={(e) => onChange({ ...audience, description: e.target.value })}
          rows={2}
        />
      </div>

      <Separator />

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Стать</Label>
          <Input
            value={audience.gender || ""}
            onChange={(e) => onChange({ ...audience, gender: e.target.value })}
            placeholder="Жінка, Чоловік..."
          />
        </div>
        <div className="space-y-2">
          <Label>Вік</Label>
          <Input
            value={audience.ageRange || ""}
            onChange={(e) => onChange({ ...audience, ageRange: e.target.value })}
            placeholder="25-35"
          />
        </div>
        <div className="space-y-2">
          <Label>Локація</Label>
          <Input
            value={audience.location || ""}
            onChange={(e) => onChange({ ...audience, location: e.target.value })}
            placeholder="Київ, Україна"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Дохід</Label>
          <Input
            value={audience.income || ""}
            onChange={(e) => onChange({ ...audience, income: e.target.value })}
            placeholder="Середній"
          />
        </div>
        <div className="space-y-2">
          <Label>Освіта</Label>
          <Input
            value={audience.education || ""}
            onChange={(e) => onChange({ ...audience, education: e.target.value })}
            placeholder="Вища"
          />
        </div>
        <div className="space-y-2">
          <Label>Професія</Label>
          <Input
            value={audience.occupation || ""}
            onChange={(e) => onChange({ ...audience, occupation: e.target.value })}
            placeholder="Маркетолог"
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Цінності (по одній на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.values)}
            onChange={(e) => updateArrayField('values', e.target.value)}
            rows={4}
            placeholder="Якість&#10;Інновації&#10;Сталість"
          />
        </div>
        <div className="space-y-2">
          <Label>Інтереси (по одному на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.interests)}
            onChange={(e) => updateArrayField('interests', e.target.value)}
            rows={4}
            placeholder="Технології&#10;Подорожі&#10;Спорт"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Болі (по одному на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.painPoints)}
            onChange={(e) => updateArrayField('painPoints', e.target.value)}
            rows={4}
            placeholder="Нестача часу&#10;Високі ціни"
          />
        </div>
        <div className="space-y-2">
          <Label>Цілі (по одній на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.goals)}
            onChange={(e) => updateArrayField('goals', e.target.value)}
            rows={4}
            placeholder="Збільшити дохід&#10;Розвиток кар'єри"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Мотивації (по одній на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.motivations)}
            onChange={(e) => updateArrayField('motivations', e.target.value)}
            rows={3}
            placeholder="Успіх&#10;Визнання"
          />
        </div>
        <div className="space-y-2">
          <Label>Страхи (по одному на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.fears)}
            onChange={(e) => updateArrayField('fears', e.target.value)}
            rows={3}
            placeholder="Невдача&#10;Втрата роботи"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Поведінка при покупках</Label>
        <Textarea
          value={audience.buyingBehavior || ""}
          onChange={(e) => onChange({ ...audience, buyingBehavior: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Канали медіа (по одному на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.mediaConsumption)}
            onChange={(e) => updateArrayField('mediaConsumption', e.target.value)}
            rows={3}
            placeholder="Instagram&#10;YouTube&#10;Podcasts"
          />
        </div>
        <div className="space-y-2">
          <Label>Фактори рішень (по одному на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.decisionFactors)}
            onChange={(e) => updateArrayField('decisionFactors', e.target.value)}
            rows={3}
            placeholder="Ціна&#10;Якість&#10;Відгуки"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>AI Портрет / Додаткова інформація</Label>
        <Textarea
          value={audience.aiPortrait || ""}
          onChange={(e) => onChange({ ...audience, aiPortrait: e.target.value })}
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
        <Button onClick={onSave} disabled={!audience.name.trim() || isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Зберегти
        </Button>
      </div>
    </div>
  );
}
