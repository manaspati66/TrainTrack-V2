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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Search, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

const trainingNeedSchema = z.object({
  skillId: z.number().min(1, "Skill is required"),
  justification: z.string().min(10, "Justification must be at least 10 characters"),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  targetCompletionDate: z.string().optional(),
  estimatedCost: z.string().optional(),
});

type TrainingNeedFormData = z.infer<typeof trainingNeedSchema>;

export default function TrainingNeeds() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("my-needs");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const form = useForm<TrainingNeedFormData>({
    resolver: zodResolver(trainingNeedSchema),
    defaultValues: {
      skillId: 0,
      justification: "",
      urgency: "MEDIUM",
      targetCompletionDate: "",
      estimatedCost: "",
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

  const { data: skills = [] } = useQuery({
    queryKey: ["/api/skills"],
    retry: false,
  });

  const { data: myNeeds = [], isLoading: isLoadingMyNeeds } = useQuery({
    queryKey: ["/api/training-needs", { employeeId: user?.id }],
    enabled: !!user?.id && activeTab === "my-needs",
    retry: false,
  });

  const { data: allNeeds = [], isLoading: isLoadingAllNeeds } = useQuery({
    queryKey: ["/api/training-needs"],
    enabled: activeTab === "all-needs" && (user?.role === "manager" || user?.role === "hr_admin"),
    retry: false,
  });

  const { data: pendingApprovals = [], isLoading: isLoadingPendingApprovals } = useQuery({
    queryKey: ["/api/training-needs", { status: user?.role === "manager" ? "SUBMITTED" : user?.role === "hr_admin" ? "MGR_APPROVED,SUBMITTED" : "SUBMITTED" }],
    enabled: user?.role === "manager" || user?.role === "hr_admin",
    retry: false,
  });

  const createNeedMutation = useMutation({
    mutationFn: async (data: TrainingNeedFormData) => {
      return await apiRequest("POST", "/api/training-needs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-needs"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Training need submitted successfully",
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

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("PATCH", `/api/training-needs/${id}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-needs"] });
      toast({
        title: "Success",
        description: "Training need approved successfully",
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

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return await apiRequest("PATCH", `/api/training-needs/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-needs"] });
      setSelectedNeed(null);
      toast({
        title: "Success",
        description: "Training need rejected",
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

  const onSubmit = (data: TrainingNeedFormData) => {
    createNeedMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SUBMITTED: { variant: "secondary" as const, icon: <Clock className="h-3 w-3 mr-1" />, label: "Submitted" },
      MGR_APPROVED: { variant: "outline" as const, icon: <CheckCircle className="h-3 w-3 mr-1" />, label: "Manager Approved" },
      HR_APPROVED: { variant: "default" as const, icon: <CheckCircle className="h-3 w-3 mr-1" />, label: "HR Approved" },
      REJECTED: { variant: "destructive" as const, icon: <XCircle className="h-3 w-3 mr-1" />, label: "Rejected" },
      PLANNED: { variant: "outline" as const, icon: <FileText className="h-3 w-3 mr-1" />, label: "Planned" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.SUBMITTED;
    return (
      <Badge variant={config.variant} className="flex items-center w-fit" data-testid={`badge-status-${status.toLowerCase()}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      LOW: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      MEDIUM: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      HIGH: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
      CRITICAL: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    };
    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.MEDIUM;
    return (
      <Badge className={config.color} data-testid={`badge-urgency-${urgency.toLowerCase()}`}>
        {urgency === "CRITICAL" && <AlertCircle className="h-3 w-3 mr-1" />}
        {urgency}
      </Badge>
    );
  };

  const filteredNeeds = (activeTab === "my-needs" ? myNeeds : activeTab === "approvals" ? pendingApprovals : allNeeds).filter((need: any) => {
    const matchesSearch = need.justification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         need.skill?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || need.status === statusFilter;
    return matchesSearch && matchesStatus;
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Training Needs</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Submit and manage training requests</p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto" data-testid="button-create-need">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Training Need
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit Training Need</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="skillId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skill Required</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-skill">
                                <SelectValue placeholder="Select a skill" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {skills.map((skill: any) => (
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
                      control={form.control}
                      name="justification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Justification</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Explain why this training is needed..." 
                              rows={4}
                              data-testid="input-justification"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="urgency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Urgency</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-urgency">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="LOW" data-testid="option-urgency-low">Low</SelectItem>
                              <SelectItem value="MEDIUM" data-testid="option-urgency-medium">Medium</SelectItem>
                              <SelectItem value="HIGH" data-testid="option-urgency-high">High</SelectItem>
                              <SelectItem value="CRITICAL" data-testid="option-urgency-critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="targetCompletionDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Completion Date (Optional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-target-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="estimatedCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Cost (Optional)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0.00" {...field} data-testid="input-estimated-cost" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} data-testid="button-cancel">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createNeedMutation.isPending} data-testid="button-submit-need">
                        {createNeedMutation.isPending ? "Submitting..." : "Submit"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              <Button
                variant={activeTab === "my-needs" ? "default" : "ghost"}
                onClick={() => setActiveTab("my-needs")}
                className="whitespace-nowrap"
                data-testid="tab-my-needs"
              >
                My Needs
              </Button>
              {(user?.role === "manager" || user?.role === "hr_admin") && (
                <>
                  <Button
                    variant={activeTab === "approvals" ? "default" : "ghost"}
                    onClick={() => setActiveTab("approvals")}
                    className="whitespace-nowrap"
                    data-testid="tab-approvals"
                  >
                    Pending Approvals
                    {pendingApprovals.length > 0 && (
                      <Badge variant="destructive" className="ml-2" data-testid="badge-pending-count">
                        {pendingApprovals.length}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant={activeTab === "all-needs" ? "default" : "ghost"}
                    onClick={() => setActiveTab("all-needs")}
                    className="whitespace-nowrap"
                    data-testid="tab-all-needs"
                  >
                    All Needs
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by skill or justification..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" data-testid="option-all-statuses">All Statuses</SelectItem>
                <SelectItem value="SUBMITTED" data-testid="option-submitted">Submitted</SelectItem>
                <SelectItem value="MGR_APPROVED" data-testid="option-mgr-approved">Manager Approved</SelectItem>
                <SelectItem value="HR_APPROVED" data-testid="option-hr-approved">HR Approved</SelectItem>
                <SelectItem value="REJECTED" data-testid="option-rejected">Rejected</SelectItem>
                <SelectItem value="PLANNED" data-testid="option-planned">Planned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(activeTab === "my-needs" && isLoadingMyNeeds) || 
           (activeTab === "approvals" && isLoadingPendingApprovals) || 
           (activeTab === "all-needs" && isLoadingAllNeeds) ? (
            <p className="text-center text-gray-600 dark:text-gray-400">Loading...</p>
          ) : filteredNeeds.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No training needs found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredNeeds.map((need: any) => (
                <Card key={need.id} data-testid={`card-need-${need.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg" data-testid={`text-skill-${need.id}`}>
                          {need.skill?.name || "Unknown Skill"}
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Requested by: {need.requestedBy?.name || "Unknown"} on {new Date(need.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {getStatusBadge(need.status)}
                        {getUrgencyBadge(need.urgency)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Justification:</Label>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1" data-testid={`text-justification-${need.id}`}>
                          {need.justification}
                        </p>
                      </div>
                      {need.targetCompletionDate && (
                        <div>
                          <Label className="text-sm font-medium">Target Completion:</Label>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {new Date(need.targetCompletionDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {need.estimatedCost && (
                        <div>
                          <Label className="text-sm font-medium">Estimated Cost:</Label>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            ${parseFloat(need.estimatedCost).toFixed(2)}
                          </p>
                        </div>
                      )}
                      {need.status === "REJECTED" && need.rejectionReason && (
                        <div>
                          <Label className="text-sm font-medium text-red-600 dark:text-red-400">Rejection Reason:</Label>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            {need.rejectionReason}
                          </p>
                        </div>
                      )}
                      {activeTab === "approvals" && (() => {
                        // Manager-initiated needs: Only HR can approve
                        if (need.submissionSource === 'MANAGER') {
                          return user?.role === "hr_admin" && need.status === "SUBMITTED";
                        }
                        // Employee-initiated needs: Two-stage approval
                        return need.status === "SUBMITTED" || (need.status === "MGR_APPROVED" && user?.role === "hr_admin");
                      })() && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(need.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${need.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {need.status === "MGR_APPROVED" ? "HR Approve" : need.submissionSource === 'MANAGER' ? "HR Approve" : "Approve"}
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedNeed(need);
                                  setRejectionReason("");
                                }}
                                data-testid={`button-reject-${need.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Training Need</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Rejection Reason</Label>
                                  <Textarea
                                    placeholder="Explain why this training need is being rejected..."
                                    rows={4}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    data-testid="input-rejection-reason"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => {
                                      setSelectedNeed(null);
                                      setRejectionReason("");
                                    }} 
                                    data-testid="button-cancel-reject"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => {
                                      if (rejectionReason.trim()) {
                                        rejectMutation.mutate({ id: need.id, reason: rejectionReason });
                                        setRejectionReason("");
                                      }
                                    }}
                                    disabled={rejectMutation.isPending || !rejectionReason.trim()}
                                    data-testid="button-confirm-reject"
                                  >
                                    {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
