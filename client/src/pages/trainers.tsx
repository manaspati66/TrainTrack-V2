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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, User, Edit } from "lucide-react";

const trainerSchema = z.object({
  name: z.string().min(2, "Trainer name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  type: z.enum(["INTERNAL", "EXTERNAL"]),
  vendorId: z.number().optional(),
});

type TrainerFormData = z.infer<typeof trainerSchema>;

export default function Trainers() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<any>(null);

  const form = useForm<TrainerFormData>({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      qualification: "",
      specialization: "",
      type: "INTERNAL",
      vendorId: undefined,
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

  const { data: trainers = [], isLoading: isLoadingTrainers } = useQuery({
    queryKey: ["/api/trainers"],
    retry: false,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["/api/vendors"],
    retry: false,
  });

  const createTrainerMutation = useMutation({
    mutationFn: async (data: TrainerFormData) => {
      return await apiRequest("POST", "/api/trainers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainers"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Trainer created successfully",
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

  const updateTrainerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TrainerFormData }) => {
      return await apiRequest("PUT", `/api/trainers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainers"] });
      setEditingTrainer(null);
      form.reset();
      toast({
        title: "Success",
        description: "Trainer updated successfully",
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

  const onSubmit = (data: TrainerFormData) => {
    if (editingTrainer) {
      updateTrainerMutation.mutate({ id: editingTrainer.id, data });
    } else {
      createTrainerMutation.mutate(data);
    }
  };

  const filteredTrainers = (trainers as any[]).filter((trainer: any) => {
    const matchesSearch = trainer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trainer.qualification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trainer.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Trainer Management</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage internal and external trainers</p>
            </div>
            {user?.role === "hr_admin" && (
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto" data-testid="button-create-trainer">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Trainer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Trainer</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trainer Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Dr. Jane Smith" data-testid="input-trainer-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trainer Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-trainer-type">
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
                      {form.watch("type") === "EXTERNAL" && vendors.length > 0 && (
                        <FormField
                          control={form.control}
                          name="vendorId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Associated Vendor (Optional)</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-vendor">
                                    <SelectValue placeholder="Select a vendor" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {(vendors as any[]).map((vendor: any) => (
                                    <SelectItem key={vendor.id} value={vendor.id.toString()} data-testid={`option-vendor-${vendor.id}`}>
                                      {vendor.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="trainer@example.com" data-testid="input-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="+1234567890" data-testid="input-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="qualification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qualifications (Optional)</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="e.g., PhD in Engineering, 10 years experience" rows={2} data-testid="input-qualification" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="specialization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specialization (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Lean Manufacturing, Six Sigma" data-testid="input-specialization" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} data-testid="button-cancel">
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createTrainerMutation.isPending} data-testid="button-submit-trainer">
                          {createTrainerMutation.isPending ? "Creating..." : "Create Trainer"}
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
                placeholder="Search trainers by name, qualification, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>

          {isLoadingTrainers ? (
            <p className="text-center text-gray-600 dark:text-gray-400">Loading trainers...</p>
          ) : filteredTrainers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No trainers found</p>
                {user?.role === "hr_admin" ? (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Click "Add Trainer" to create your first trainer
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {filteredTrainers.map((trainer: any) => (
                <Card key={trainer.id} data-testid={`card-trainer-${trainer.id}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2" data-testid={`text-trainer-name-${trainer.id}`}>
                          <User className="h-5 w-5 text-blue-600" />
                          {trainer.name}
                        </CardTitle>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant={trainer.type === "INTERNAL" ? "default" : "secondary"} data-testid={`badge-type-${trainer.id}`}>
                            {trainer.type}
                          </Badge>
                          {trainer.specialization && (
                            <Badge variant="outline" data-testid={`badge-specialization-${trainer.id}`}>
                              {trainer.specialization}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {user?.role === "hr_admin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingTrainer(trainer);
                            form.reset({
                              name: trainer.name || "",
                              email: trainer.email || "",
                              phone: trainer.phone || "",
                              qualification: trainer.qualification || "",
                              specialization: trainer.specialization || "",
                              type: trainer.type || "INTERNAL",
                              vendorId: trainer.vendorId || undefined,
                            });
                          }}
                          data-testid={`button-edit-${trainer.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {trainer.qualification && (
                      <div className="text-sm">
                        <Label className="text-gray-600 dark:text-gray-400">Qualifications:</Label>
                        <p className="text-gray-900 dark:text-white">{trainer.qualification}</p>
                      </div>
                    )}
                    {trainer.email && (
                      <div className="text-sm">
                        <Label className="text-gray-600 dark:text-gray-400">Email:</Label>
                        <p className="text-gray-900 dark:text-white">{trainer.email}</p>
                      </div>
                    )}
                    {trainer.phone && (
                      <div className="text-sm">
                        <Label className="text-gray-600 dark:text-gray-400">Phone:</Label>
                        <p className="text-gray-900 dark:text-white">{trainer.phone}</p>
                      </div>
                    )}
                    {trainer.vendor && (
                      <div className="text-sm">
                        <Label className="text-gray-600 dark:text-gray-400">Vendor:</Label>
                        <p className="text-gray-900 dark:text-white">{trainer.vendor.name}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={!!editingTrainer} onOpenChange={(open) => !open && setEditingTrainer(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Trainer</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trainer Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Dr. Jane Smith" data-testid="input-edit-trainer-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trainer Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-trainer-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INTERNAL" data-testid="option-edit-internal">Internal</SelectItem>
                            <SelectItem value="EXTERNAL" data-testid="option-edit-external">External</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {form.watch("type") === "EXTERNAL" && vendors.length > 0 && (
                    <FormField
                      control={form.control}
                      name="vendorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Associated Vendor (Optional)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger data-testid="select-edit-vendor">
                                <SelectValue placeholder="Select a vendor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(vendors as any[]).map((vendor: any) => (
                                <SelectItem key={vendor.id} value={vendor.id.toString()} data-testid={`option-edit-vendor-${vendor.id}`}>
                                  {vendor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="trainer@example.com" data-testid="input-edit-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+1234567890" data-testid="input-edit-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="qualification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualifications (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="e.g., PhD in Engineering, 10 years experience" rows={2} data-testid="input-edit-qualification" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialization (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Lean Manufacturing, Six Sigma" data-testid="input-edit-specialization" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setEditingTrainer(null)} data-testid="button-cancel-edit">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateTrainerMutation.isPending} data-testid="button-update-trainer">
                      {updateTrainerMutation.isPending ? "Updating..." : "Update Trainer"}
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
