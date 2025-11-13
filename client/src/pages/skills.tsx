import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, Award, Edit } from "lucide-react";

const skillSchema = z.object({
  name: z.string().min(2, "Skill name must be at least 2 characters"),
  description: z.string().optional(),
  category: z.string().optional(),
});

type SkillFormData = z.infer<typeof skillSchema>;

export default function Skills() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any>(null);

  const form = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
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

  const { data: skills = [], isLoading: isLoadingSkills } = useQuery({
    queryKey: ["/api/skills"],
    retry: false,
  });

  const createSkillMutation = useMutation({
    mutationFn: async (data: SkillFormData) => {
      return await apiRequest("POST", "/api/skills", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Skill created successfully",
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

  const updateSkillMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SkillFormData }) => {
      return await apiRequest("PUT", `/api/skills/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setEditingSkill(null);
      form.reset();
      toast({
        title: "Success",
        description: "Skill updated successfully",
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

  const onSubmit = (data: SkillFormData) => {
    if (editingSkill) {
      updateSkillMutation.mutate({ id: editingSkill.id, data });
    } else {
      createSkillMutation.mutate(data);
    }
  };

  const filteredSkills = (skills as any[]).filter((skill: any) => {
    const matchesSearch = skill.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Skills Master Data</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage available skills for training needs</p>
            </div>
            {user?.role === "hr_admin" && (
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto" data-testid="button-create-skill">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skill
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Skill</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Skill Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., Lean Manufacturing, Six Sigma" 
                                data-testid="input-skill-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., Technical, Safety, Quality" 
                                data-testid="input-skill-category"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Describe the skill and its applications..." 
                                rows={3}
                                data-testid="input-skill-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateModalOpen(false)} 
                          data-testid="button-cancel"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createSkillMutation.isPending} 
                          data-testid="button-submit-skill"
                        >
                          {createSkillMutation.isPending ? "Creating..." : "Create Skill"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search skills by name, category, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>

          {isLoadingSkills ? (
            <p className="text-center text-gray-600 dark:text-gray-400">Loading skills...</p>
          ) : filteredSkills.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No skills found</p>
                {user?.role === "hr_admin" ? (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Click "Add Skill" to create your first skill
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredSkills.map((skill: any) => (
                <Card key={skill.id} data-testid={`card-skill-${skill.id}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex items-center gap-2" data-testid={`text-skill-name-${skill.id}`}>
                        <Award className="h-5 w-5 text-blue-600" />
                        {skill.name}
                      </CardTitle>
                      {user?.role === "hr_admin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingSkill(skill);
                            form.reset({
                              name: skill.name || "",
                              description: skill.description || "",
                              category: skill.category || "",
                            });
                          }}
                          data-testid={`button-edit-${skill.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {skill.category && (
                      <Badge variant="outline" className="w-fit mt-2" data-testid={`badge-category-${skill.id}`}>
                        {skill.category}
                      </Badge>
                    )}
                  </CardHeader>
                  {skill.description && (
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400" data-testid={`text-description-${skill.id}`}>
                        {skill.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={!!editingSkill} onOpenChange={(open) => !open && setEditingSkill(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Skill</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., Lean Manufacturing, Six Sigma" 
                            data-testid="input-edit-skill-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., Technical, Safety, Quality" 
                            data-testid="input-edit-skill-category"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Describe the skill and its applications..." 
                            rows={3}
                            data-testid="input-edit-skill-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditingSkill(null)} 
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateSkillMutation.isPending} 
                      data-testid="button-update-skill"
                    >
                      {updateSkillMutation.isPending ? "Updating..." : "Update Skill"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
