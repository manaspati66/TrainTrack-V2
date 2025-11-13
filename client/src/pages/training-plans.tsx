import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calendar as CalendarIcon, FileText, ChevronRight, Target, Clock } from "lucide-react";

const planSchema = z.object({
  year: z.number().min(2020).max(2050),
  name: z.string().min(3, "Plan name must be at least 3 characters"),
  description: z.string().optional(),
});

const planItemSchema = z.object({
  skillId: z.coerce.number().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  tentativeMonth: z.string().optional(),
  expectedHours: z.coerce.number().optional(),
  type: z.enum(["INTERNAL", "EXTERNAL"]),
});

type PlanFormData = z.infer<typeof planSchema>;
type PlanItemFormData = z.infer<typeof planItemSchema>;

export default function TrainingPlans() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>("all");

  const planForm = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      name: "",
      description: "",
    },
  });

  const itemForm = useForm<PlanItemFormData>({
    resolver: zodResolver(planItemSchema),
    defaultValues: {
      title: "",
      tentativeMonth: "",
      expectedHours: undefined,
      type: "INTERNAL",
      skillId: undefined,
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ["/api/training-plans"],
    retry: false,
  });

  const { data: skills = [] } = useQuery({
    queryKey: ["/api/skills"],
    retry: false,
  });

  const { data: planItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ["/api/training-plans", selectedPlanId, "items"],
    enabled: !!selectedPlanId,
    retry: false,
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      return await apiRequest("POST", "/api/training-plans", data);
    },
    onSuccess: (newPlan: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans"] });
      setIsCreatePlanModalOpen(false);
      planForm.reset();
      setSelectedPlanId(newPlan.id);
      toast({
        title: "Success",
        description: "Training plan created successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: PlanItemFormData) => {
      return await apiRequest("POST", `/api/training-plans/${selectedPlanId}/items`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-plans", selectedPlanId, "items"] });
      setIsAddItemModalOpen(false);
      itemForm.reset();
      toast({
        title: "Success",
        description: "Training item added to plan",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitPlan = (data: PlanFormData) => {
    createPlanMutation.mutate(data);
  };

  const onSubmitItem = (data: PlanItemFormData) => {
    addItemMutation.mutate(data);
  };

  const filteredPlans = (plans as any[]).filter((plan: any) => {
    if (yearFilter && yearFilter !== "all" && plan.year.toString() !== yearFilter) {
      return false;
    }
    return true;
  });

  const selectedPlan = (plans as any[]).find((p: any) => p.id === selectedPlanId);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Training Plans</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Plan and schedule annual training activities</p>
            </div>
            {user?.role === "hr_admin" && (
              <Dialog open={isCreatePlanModalOpen} onOpenChange={setIsCreatePlanModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto" data-testid="button-create-plan">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Training Plan</DialogTitle>
                  </DialogHeader>
                  <Form {...planForm}>
                    <form onSubmit={planForm.handleSubmit(onSubmitPlan)} className="space-y-4">
                      <FormField
                        control={planForm.control}
                        name="year"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                placeholder="2024"
                                data-testid="input-year"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={planForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Plan Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Annual Training Plan 2024" data-testid="input-plan-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={planForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Overview of training objectives for the year" rows={3} data-testid="input-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsCreatePlanModalOpen(false)} data-testid="button-cancel">
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createPlanMutation.isPending} data-testid="button-submit-plan">
                          {createPlanMutation.isPending ? "Creating..." : "Create Plan"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Plans List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Training Plans</CardTitle>
                  <div className="mt-4">
                    <Label>Filter by Year</Label>
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger className="mt-2" data-testid="select-year-filter">
                        <SelectValue placeholder="All Years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" data-testid="option-all-years">All Years</SelectItem>
                        {Array.from(new Set((plans as any[]).map((p: any) => p.year))).sort((a, b) => b - a).map((year: number) => (
                          <SelectItem key={year} value={year.toString()} data-testid={`option-year-${year}`}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingPlans ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loading plans...</p>
                  ) : filteredPlans.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No training plans found</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredPlans.map((plan: any) => (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedPlanId === plan.id
                              ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700"
                              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                          data-testid={`button-plan-${plan.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-sm">{plan.name}</span>
                              </div>
                              <Badge variant="outline" className="mt-1">
                                {plan.year}
                              </Badge>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Plan Details */}
            <div className="lg:col-span-2">
              {!selectedPlan ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Select a training plan to view details</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle data-testid={`text-plan-title-${selectedPlan.id}`}>{selectedPlan.name}</CardTitle>
                        <CardDescription className="mt-2">{selectedPlan.description || "No description"}</CardDescription>
                      </div>
                      {user?.role === "hr_admin" && (
                        <Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" data-testid="button-add-item">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Item
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Add Training Item</DialogTitle>
                            </DialogHeader>
                            <Form {...itemForm}>
                              <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-4">
                                <FormField
                                  control={itemForm.control}
                                  name="title"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Training Title</FormLabel>
                                      <FormControl>
                                        <Input {...field} placeholder="e.g., Safety Training Workshop" data-testid="input-item-title" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={itemForm.control}
                                  name="type"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Training Type</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-item-type">
                                            <SelectValue />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="INTERNAL" data-testid="option-internal">Internal</SelectItem>
                                          <SelectItem value="EXTERNAL" data-testid="option-external">External</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={itemForm.control}
                                    name="skillId"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Related Skill (Optional)</FormLabel>
                                        <Select 
                                          onValueChange={(value) => field.onChange(value ? parseInt(value, 10) : undefined)} 
                                          value={field.value?.toString() || ""}
                                        >
                                          <FormControl>
                                            <SelectTrigger data-testid="select-skill">
                                              <SelectValue placeholder="Select a skill" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {(skills as any[]).map((skill: any) => (
                                              <SelectItem key={skill.id} value={skill.id.toString()} data-testid={`option-skill-${skill.id}`}>
                                                {skill.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={itemForm.control}
                                    name="expectedHours"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Expected Hours (Optional)</FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            type="number"
                                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                            value={field.value || ""}
                                            placeholder="8"
                                            data-testid="input-hours"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                                <FormField
                                  control={itemForm.control}
                                  name="tentativeMonth"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Tentative Month (Optional)</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger data-testid="select-month">
                                            <SelectValue placeholder="Select month" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {months.map((month) => (
                                            <SelectItem key={month} value={month} data-testid={`option-month-${month}`}>
                                              {month}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end gap-2 pt-4">
                                  <Button type="button" variant="outline" onClick={() => setIsAddItemModalOpen(false)} data-testid="button-cancel-item">
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={addItemMutation.isPending} data-testid="button-submit-item">
                                    {addItemMutation.isPending ? "Adding..." : "Add Item"}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h3 className="font-semibold mb-4">Training Items</h3>
                    {isLoadingItems ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">Loading items...</p>
                    ) : (planItems as any[]).length === 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">No training items in this plan</p>
                    ) : (
                      <div className="space-y-3">
                        {(planItems as any[]).map((item: any) => (
                          <Card key={item.id} data-testid={`card-item-${item.id}`} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium" data-testid={`text-item-title-${item.id}`}>{item.title}</h4>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    <Badge variant={item.type === "INTERNAL" ? "default" : "secondary"} data-testid={`badge-type-${item.id}`}>
                                      {item.type}
                                    </Badge>
                                    <Badge variant="outline" data-testid={`badge-status-${item.id}`}>{item.status}</Badge>
                                    {item.tentativeMonth && (
                                      <Badge variant="outline" className="flex items-center gap-1" data-testid={`badge-month-${item.id}`}>
                                        <CalendarIcon className="h-3 w-3" />
                                        {item.tentativeMonth}
                                      </Badge>
                                    )}
                                    {item.expectedHours && (
                                      <Badge variant="outline" className="flex items-center gap-1" data-testid={`badge-hours-${item.id}`}>
                                        <Clock className="h-3 w-3" />
                                        {item.expectedHours}h
                                      </Badge>
                                    )}
                                  </div>
                                  {item.skill && (
                                    <div className="flex items-center gap-1 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                      <Target className="h-3 w-3" />
                                      <span>Skill: {item.skill.name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
