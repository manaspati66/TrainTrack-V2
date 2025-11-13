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
import { Plus, Search, Building2, Edit } from "lucide-react";

const vendorSchema = z.object({
  name: z.string().min(2, "Vendor name must be at least 2 characters"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  specialization: z.string().optional(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

export default function Vendors() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      specialization: "",
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

  const { data: vendors = [], isLoading: isLoadingVendors } = useQuery({
    queryKey: ["/api/vendors"],
    retry: false,
  });

  const createVendorMutation = useMutation({
    mutationFn: async (data: VendorFormData) => {
      return await apiRequest("POST", "/api/vendors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Vendor created successfully",
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

  const updateVendorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: VendorFormData }) => {
      return await apiRequest("PUT", `/api/vendors/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setEditingVendor(null);
      form.reset();
      toast({
        title: "Success",
        description: "Vendor updated successfully",
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

  const onSubmit = (data: VendorFormData) => {
    if (editingVendor) {
      updateVendorMutation.mutate({ id: editingVendor.id, data });
    } else {
      createVendorMutation.mutate(data);
    }
  };

  const filteredVendors = (vendors as any[]).filter((vendor: any) => {
    const matchesSearch = vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Vendor Management</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage training vendors and providers</p>
            </div>
            {user?.role === "hr_admin" && (
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto" data-testid="button-create-vendor">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vendor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Vendor</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vendor Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., ACME Training Solutions" data-testid="input-vendor-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contactPerson"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Person (Optional)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="John Doe" data-testid="input-contact-person" />
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
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="contact@vendor.com" data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address (Optional)</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="123 Main St, City, Country" rows={2} data-testid="input-address" />
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
                              <Input {...field} placeholder="e.g., Safety Training, Technical Skills" data-testid="input-specialization" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} data-testid="button-cancel">
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createVendorMutation.isPending} data-testid="button-submit-vendor">
                          {createVendorMutation.isPending ? "Creating..." : "Create Vendor"}
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
                placeholder="Search vendors by name, contact, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>

          {isLoadingVendors ? (
            <p className="text-center text-gray-600 dark:text-gray-400">Loading vendors...</p>
          ) : filteredVendors.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No vendors found</p>
                {user?.role === "hr_admin" ? (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Click "Add Vendor" to create your first vendor
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {filteredVendors.map((vendor: any) => (
                <Card key={vendor.id} data-testid={`card-vendor-${vendor.id}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2" data-testid={`text-vendor-name-${vendor.id}`}>
                          <Building2 className="h-5 w-5 text-blue-600" />
                          {vendor.name}
                        </CardTitle>
                        {vendor.specialization && (
                          <Badge variant="outline" className="mt-2" data-testid={`badge-specialization-${vendor.id}`}>
                            {vendor.specialization}
                          </Badge>
                        )}
                      </div>
                      {user?.role === "hr_admin" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingVendor(vendor);
                            form.reset({
                              name: vendor.name || "",
                              contactPerson: vendor.contactPerson || "",
                              email: vendor.email || "",
                              phone: vendor.phone || "",
                              address: vendor.address || "",
                              specialization: vendor.specialization || "",
                            });
                          }}
                          data-testid={`button-edit-${vendor.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {vendor.contactPerson && (
                      <div className="text-sm">
                        <Label className="text-gray-600 dark:text-gray-400">Contact:</Label>
                        <p className="text-gray-900 dark:text-white">{vendor.contactPerson}</p>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="text-sm">
                        <Label className="text-gray-600 dark:text-gray-400">Email:</Label>
                        <p className="text-gray-900 dark:text-white">{vendor.email}</p>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="text-sm">
                        <Label className="text-gray-600 dark:text-gray-400">Phone:</Label>
                        <p className="text-gray-900 dark:text-white">{vendor.phone}</p>
                      </div>
                    )}
                    {vendor.address && (
                      <div className="text-sm">
                        <Label className="text-gray-600 dark:text-gray-400">Address:</Label>
                        <p className="text-gray-900 dark:text-white">{vendor.address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={!!editingVendor} onOpenChange={(open) => !open && setEditingVendor(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Vendor</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., ACME Training Solutions" data-testid="input-edit-vendor-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="John Doe" data-testid="input-edit-contact-person" />
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="contact@vendor.com" data-testid="input-edit-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="123 Main St, City, Country" rows={2} data-testid="input-edit-address" />
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
                          <Input {...field} placeholder="e.g., Safety Training, Technical Skills" data-testid="input-edit-specialization" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setEditingVendor(null)} data-testid="button-cancel-edit">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateVendorMutation.isPending} data-testid="button-update-vendor">
                      {updateVendorMutation.isPending ? "Updating..." : "Update Vendor"}
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
