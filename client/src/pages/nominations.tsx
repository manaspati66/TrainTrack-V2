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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  UserPlus, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  Hourglass,
  AlertCircle 
} from "lucide-react";
import { format } from "date-fns";

export default function Nominations() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [rejectingNomination, setRejectingNomination] = useState<any>(null);
  const [waitlistingNomination, setWaitlistingNomination] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [waitlistReason, setWaitlistReason] = useState("");

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

  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/training-sessions"],
    retry: false,
  });

  const { data: myNominations = [] } = useQuery({
    queryKey: ["/api/nominations", user?.id, user?.role],
    select: (data: any[]) => {
      if (user?.role === "manager" || user?.role === "hr_admin") {
        return data;
      }
      return data.filter((n: any) => n.employeeId === user?.id);
    },
    enabled: !!user,
    retry: false,
  });

  const nominateMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      return await apiRequest("POST", "/api/nominations", {
        sessionId,
        source: "SELF",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nominations"] });
      setSelectedSession(null);
      toast({
        title: "Success",
        description: "You have been nominated for this training session",
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
    mutationFn: async (nominationId: number) => {
      return await apiRequest("PATCH", `/api/nominations/${nominationId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nominations"] });
      toast({
        title: "Success",
        description: "Nomination approved",
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
    mutationFn: async ({ nominationId, reason }: { nominationId: number; reason: string }) => {
      return await apiRequest("PATCH", `/api/nominations/${nominationId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nominations"] });
      setRejectingNomination(null);
      setRejectReason("");
      toast({
        title: "Success",
        description: "Nomination rejected",
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

  const waitlistMutation = useMutation({
    mutationFn: async ({ nominationId, reason }: { nominationId: number; reason: string }) => {
      return await apiRequest("PATCH", `/api/nominations/${nominationId}/waitlist`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nominations"] });
      setWaitlistingNomination(null);
      setWaitlistReason("");
      toast({
        title: "Success",
        description: "Nomination moved to waitlist",
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

  const availableSessions = (sessions as any[]).filter((session: any) => {
    if (session.status !== "SCHEDULED") return false;
    
    const existingNomination = (myNominations as any[]).find(
      (n: any) => n.sessionId === session.id && n.employeeId === user?.id
    );
    return !existingNomination;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: "outline" as const, icon: Hourglass, color: "text-yellow-600" },
      APPROVED: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      REJECTED: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      WAITLIST: { variant: "secondary" as const, icon: AlertCircle, color: "text-orange-600" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

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
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Training Nominations</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {user?.role === "manager" || user?.role === "hr_admin" 
                ? "Manage training nominations and approvals" 
                : "Nominate yourself for upcoming training sessions"}
            </p>
          </div>

          <Tabs defaultValue={user?.role === "manager" || user?.role === "hr_admin" ? "nominations" : "available"}>
            <TabsList className="mb-6">
              <TabsTrigger value="available" data-testid="tab-available">Available Sessions</TabsTrigger>
              <TabsTrigger value="nominations" data-testid="tab-nominations">
                {user?.role === "manager" || user?.role === "hr_admin" ? "All Nominations" : "My Nominations"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available">
              {availableSessions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No available training sessions for nomination</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  {availableSessions.map((session: any) => (
                    <Card key={session.id} data-testid={`card-session-${session.id}`} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg" data-testid={`text-session-title-${session.id}`}>
                          {session.trainingCatalog?.title || "Training Session"}
                        </CardTitle>
                        <CardDescription>{session.trainingCatalog?.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-600" />
                            <span data-testid={`text-session-date-${session.id}`}>
                              {format(new Date(session.sessionDate), "PPP")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-600" />
                            <span>{session.duration} hours</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-gray-600" />
                            <span>
                              {session.enrolledCount || 0} / {session.maxAttendees} enrolled
                            </span>
                          </div>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => setSelectedSession(session)}
                          data-testid={`button-nominate-${session.id}`}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Nominate Myself
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="nominations">
              {(myNominations as any[]).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No nominations found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {(myNominations as any[]).map((nomination: any) => (
                    <Card key={nomination.id} data-testid={`card-nomination-${nomination.id}`}>
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg" data-testid={`text-nomination-title-${nomination.id}`}>
                                  {nomination.session?.trainingCatalog?.title || "Training Session"}
                                </h3>
                                {nomination.employee && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Employee: {nomination.employee.firstName} {nomination.employee.lastName}
                                  </p>
                                )}
                              </div>
                              <div data-testid={`badge-status-${nomination.id}`}>
                                {getStatusBadge(nomination.status)}
                              </div>
                            </div>
                            
                            <div className="space-y-1 text-sm">
                              {nomination.session?.sessionDate && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3 text-gray-600" />
                                  <span>{format(new Date(nomination.session.sessionDate), "PPP")}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{nomination.source}</Badge>
                              </div>
                              {nomination.reason && (
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                                  <strong>Reason:</strong> {nomination.reason}
                                </div>
                              )}
                            </div>
                          </div>

                          {user?.role === "hr_admin" && nomination.status === "PENDING" && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => approveMutation.mutate(nomination.id)}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${nomination.id}`}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setWaitlistingNomination(nomination)}
                                data-testid={`button-waitlist-${nomination.id}`}
                              >
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Waitlist
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => setRejectingNomination(nomination)}
                                data-testid={`button-reject-${nomination.id}`}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Nomination Confirmation Dialog */}
          <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Nomination</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Are you sure you want to nominate yourself for:</p>
                <p className="font-semibold mt-2">
                  {selectedSession?.trainingCatalog?.title}
                </p>
                {selectedSession?.sessionDate && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {format(new Date(selectedSession.sessionDate), "PPP")}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedSession(null)} data-testid="button-cancel-nominate">
                  Cancel
                </Button>
                <Button 
                  onClick={() => selectedSession && nominateMutation.mutate(selectedSession.id)}
                  disabled={nominateMutation.isPending}
                  data-testid="button-confirm-nominate"
                >
                  {nominateMutation.isPending ? "Nominating..." : "Confirm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reject Dialog */}
          <Dialog open={!!rejectingNomination} onOpenChange={(open) => !open && setRejectingNomination(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Nomination</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Reason for Rejection</Label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this nomination"
                    rows={3}
                    data-testid="input-reject-reason"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectingNomination(null)} data-testid="button-cancel-reject">
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => rejectingNomination && rejectMutation.mutate({ 
                    nominationId: rejectingNomination.id, 
                    reason: rejectReason 
                  })}
                  disabled={rejectMutation.isPending}
                  data-testid="button-confirm-reject"
                >
                  {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Waitlist Dialog */}
          <Dialog open={!!waitlistingNomination} onOpenChange={(open) => !open && setWaitlistingNomination(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Move to Waitlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Reason for Waitlisting (Optional)</Label>
                  <Textarea
                    value={waitlistReason}
                    onChange={(e) => setWaitlistReason(e.target.value)}
                    placeholder="e.g., Training is full, will consider if slots become available"
                    rows={3}
                    data-testid="input-waitlist-reason"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setWaitlistingNomination(null)} data-testid="button-cancel-waitlist">
                  Cancel
                </Button>
                <Button 
                  onClick={() => waitlistingNomination && waitlistMutation.mutate({ 
                    nominationId: waitlistingNomination.id, 
                    reason: waitlistReason 
                  })}
                  disabled={waitlistMutation.isPending}
                  data-testid="button-confirm-waitlist"
                >
                  {waitlistMutation.isPending ? "Moving..." : "Move to Waitlist"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
