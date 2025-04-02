import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTickets } from '@/contexts/TicketContext';
import { useAuth } from '@/contexts/AuthContext';
import { TicketStatus, ResolutionStage, KnowledgeItem } from '@/types';
import { formatDistanceToNow, format, differenceInMinutes } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, AlertTriangle, Clock, CheckCircle, UserPlus, Users, BookOpen, Search, FileText } from 'lucide-react';
import TicketComments from '@/components/tickets/TicketComments';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TicketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    getTicketById, 
    updateTicketStatus, 
    assignTicket, 
    getAgents,
    updateResolution,
    searchKnowledgeBase,
    addSolutionToKnowledgeBase,
    linkSolutionToTicket,
    knowledgeBase
  } = useTickets();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const ticket = getTicketById(id || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [knowledgeDialogOpen, setKnowledgeDialogOpen] = useState(false);
  const [addSolutionDialogOpen, setAddSolutionDialogOpen] = useState(false);
  
  const [resolutionStage, setResolutionStage] = useState<ResolutionStage>(
    ticket?.resolution?.stage || 'investigation'
  );
  const [resolutionNotes, setResolutionNotes] = useState(
    ticket?.resolution?.notes || ''
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeItem[]>([]);
  
  const [newSolution, setNewSolution] = useState({
    title: '',
    content: '',
    tags: ''
  });
  
  const agents = getAgents();
  
  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Ticket Not Found</h1>
        <p className="text-muted-foreground mb-6">The ticket you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/tickets">Back to Tickets</Link>
        </Button>
      </div>
    );
  }
  
  const handleStatusChange = async (status: TicketStatus) => {
    if (status === ticket.status) return;
    
    setIsUpdating(true);
    try {
      await updateTicketStatus(ticket.id, status);
      toast({
        title: 'Status Updated',
        description: `Ticket status changed to ${status.replace('-', ' ')}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleAssignToMe = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      await assignTicket(ticket.id, user.id, user.name);
      toast({
        title: 'Ticket Assigned',
        description: 'Ticket has been assigned to you',
      });
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign ticket',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignToAgent = async (agentId: string, agentName: string) => {
    setIsUpdating(true);
    try {
      await assignTicket(ticket.id, agentId, agentName);
      toast({
        title: 'Ticket Assigned',
        description: `Ticket has been assigned to ${agentName}`,
      });
      setAgentDialogOpen(false);
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign ticket',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleUpdateResolution = async () => {
    setIsUpdating(true);
    try {
      await updateResolution(ticket.id, resolutionStage, resolutionNotes);
      toast({
        title: 'Resolution Updated',
        description: `Resolution stage updated to ${resolutionStage.replace('-', ' ')}`,
      });
      setResolutionDialogOpen(false);
    } catch (error) {
      console.error('Error updating resolution:', error);
      toast({
        title: 'Error',
        description: 'Failed to update resolution',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleSearchKnowledgeBase = () => {
    if (!searchQuery) return;
    
    const results = searchKnowledgeBase(searchQuery, ticket.category);
    setSearchResults(results);
  };
  
  const handleLinkSolution = async (solutionId: string) => {
    setIsUpdating(true);
    try {
      await linkSolutionToTicket(ticket.id, solutionId);
      toast({
        title: 'Solution Linked',
        description: 'Knowledge base solution linked to this ticket',
      });
      setKnowledgeDialogOpen(false);
    } catch (error) {
      console.error('Error linking solution:', error);
      toast({
        title: 'Error',
        description: 'Failed to link solution',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleAddSolution = async () => {
    if (!newSolution.title || !newSolution.content) return;
    
    setIsUpdating(true);
    try {
      const solution = await addSolutionToKnowledgeBase(
        newSolution.title,
        newSolution.content,
        ticket.category,
        newSolution.tags.split(',').map(tag => tag.trim())
      );
      
      await linkSolutionToTicket(ticket.id, solution.id);
      
      toast({
        title: 'Solution Added',
        description: 'New solution added to knowledge base and linked to this ticket',
      });
      
      setNewSolution({
        title: '',
        content: '',
        tags: ''
      });
      
      setAddSolutionDialogOpen(false);
    } catch (error) {
      console.error('Error adding solution:', error);
      toast({
        title: 'Error',
        description: 'Failed to add solution',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPpp');
  };
  
  const getResolutionStageLabel = (stage: ResolutionStage) => {
    switch (stage) {
      case 'investigation':
        return 'Investigation';
      case 'implementation':
        return 'Implementation';
      case 'verification':
        return 'Verification';
      case 'completed':
        return 'Completed';
    }
  };
  
  const formatMinutes = (minutes?: number) => {
    if (!minutes) return 'N/A';
    
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }
    
    return `${hours} hr ${remainingMinutes} min`;
  };
  
  const isAgent = user?.role === 'agent' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  
  const linkedSolution = ticket.resolution?.solutionId 
    ? knowledgeBase.find(item => item.id === ticket.resolution?.solutionId)
    : undefined;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link to="/tickets">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight truncate">Ticket #{ticket.id}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {isAgent && ticket.status !== 'resolved' && !ticket.assignedTo && (
            <Button onClick={handleAssignToMe} disabled={isUpdating}>
              Assign to Me
            </Button>
          )}

          {isAdmin && ticket.status !== 'resolved' && (
            <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isUpdating}>
                  <Users className="h-4 w-4 mr-2" />
                  Assign Agent
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Ticket to Agent</DialogTitle>
                  <DialogDescription>
                    Select an agent to assign this ticket to.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {user && (
                    <Button
                      variant={ticket.assignedTo?.id === user.id ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => handleAssignToAgent(user.id, user.name)}
                      disabled={isUpdating}
                    >
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{user.name} (Me)</span>
                      <Badge variant="outline" className="ml-auto">
                        {user.role}
                      </Badge>
                    </Button>
                  )}
                  
                  {agents
                    .filter(agent => agent.id !== user?.id)
                    .map((agent) => (
                      <Button
                        key={agent.id}
                        variant={ticket.assignedTo?.id === agent.id ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handleAssignToAgent(agent.id, agent.name)}
                        disabled={isUpdating}
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={agent.avatar} />
                          <AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{agent.name}</span>
                        <Badge variant="outline" className="ml-auto">
                          {agent.role}
                        </Badge>
                      </Button>
                    ))
                  }
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          {(isAgent || user?.id === ticket.createdBy.id) && (
            <Select 
              defaultValue={ticket.status} 
              onValueChange={(value) => handleStatusChange(value as TicketStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Update Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{ticket.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`ticket-priority-${ticket.priority}`}>
                    {ticket.priority}
                  </Badge>
                  <Badge className={`ticket-status-${ticket.status}`}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(ticket.status)}
                      <span>{ticket.status.replace('-', ' ')}</span>
                    </span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line mb-6">{ticket.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="outline">Category: {ticket.category.replace('-', ' ')}</Badge>
                {ticket.assignedTo && (
                  <Badge variant="outline">
                    Assigned to: {ticket.assignedTo.name}
                  </Badge>
                )}
              </div>
              
              <Tabs defaultValue="comments">
                <TabsList>
                  <TabsTrigger value="comments">
                    Comments ({ticket.comments?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="resolution">
                    Resolution Status
                  </TabsTrigger>
                  <TabsTrigger value="attachments">
                    Attachments ({ticket.attachments?.length || 0})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="comments" className="mt-4">
                  <TicketComments ticket={ticket} />
                </TabsContent>
                <TabsContent value="resolution" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Resolution Workflow</h3>
                      {isAgent && ticket.status !== 'resolved' && (
                        <Button 
                          onClick={() => {
                            setResolutionStage(ticket.resolution?.stage || 'investigation');
                            setResolutionNotes(ticket.resolution?.notes || '');
                            setResolutionDialogOpen(true);
                          }}
                        >
                          Update Resolution
                        </Button>
                      )}
                    </div>
                    
                    {ticket.resolution ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Current Stage</p>
                            <Badge variant="outline" className="text-green-600 bg-green-50">
                              {getResolutionStageLabel(ticket.resolution.stage)}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Time Spent</p>
                            <p>{formatMinutes(ticket.resolution.timeSpent)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Started At</p>
                            <p>{format(new Date(ticket.resolution.startedAt), 'PPpp')}</p>
                          </div>
                          {ticket.resolution.completedAt && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Completed At</p>
                              <p>{format(new Date(ticket.resolution.completedAt), 'PPpp')}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Resolution Notes</p>
                          <div className="p-3 bg-muted rounded-md">
                            <p className="whitespace-pre-line">{ticket.resolution.notes}</p>
                          </div>
                        </div>
                        
                        {linkedSolution && (
                          <div className="border rounded-md p-4 mt-4">
                            <h4 className="font-medium flex items-center gap-2 mb-2">
                              <BookOpen className="h-4 w-4" />
                              Linked Knowledge Base Solution
                            </h4>
                            <h5 className="font-semibold text-lg">{linkedSolution.title}</h5>
                            <div className="mt-2 text-sm">
                              <p>{linkedSolution.content}</p>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-3">
                              {linkedSolution.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {isAgent && !linkedSolution && ticket.status !== 'resolved' && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            <Button
                              variant="outline"
                              onClick={() => setKnowledgeDialogOpen(true)}
                              size="sm"
                            >
                              <Search className="h-4 w-4 mr-2" />
                              Find Solution
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setAddSolutionDialogOpen(true)}
                              size="sm"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Add New Solution
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No resolution process started yet</p>
                        {isAgent && (
                          <Button 
                            onClick={() => {
                              setResolutionStage('investigation');
                              setResolutionNotes('');
                              setResolutionDialogOpen(true);
                            }}
                          >
                            Start Resolution Process
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="attachments" className="mt-4">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No attachments available</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Submitted By</h3>
                <div className="flex items-center mt-2">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${ticket.createdBy.id}`} />
                    <AvatarFallback>{ticket.createdBy.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{ticket.createdBy.name}</span>
                </div>
              </div>
              
              {ticket.assignedTo && (
                <div>
                  <h3 className="text-sm font-medium">Assigned To</h3>
                  <div className="flex items-center mt-2">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${ticket.assignedTo.id}`} />
                      <AvatarFallback>{ticket.assignedTo.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{ticket.assignedTo.name}</span>
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium">Created At</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {formatDate(ticket.createdAt)}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Last Updated</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {formatDate(ticket.updatedAt)}
                </p>
              </div>
              
              {isAgent && ticket.status !== 'resolved' && (
                <div className="pt-4">
                  <Button 
                    className="w-full"
                    variant="destructive"
                    onClick={() => handleStatusChange('resolved')}
                    disabled={isUpdating}
                  >
                    Mark as Resolved
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Resolution Stage Dialog */}
      <Dialog open={resolutionDialogOpen} onOpenChange={setResolutionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Resolution Stage</DialogTitle>
            <DialogDescription>
              Update the current resolution stage and add notes
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resolution-stage">Resolution Stage</Label>
              <Select
                value={resolutionStage}
                onValueChange={(value) => setResolutionStage(value as ResolutionStage)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="investigation">Investigation</SelectItem>
                  <SelectItem value="implementation">Implementation</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolution-notes">Resolution Notes</Label>
              <Textarea
                id="resolution-notes"
                placeholder="Add notes about the current resolution stage"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setResolutionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateResolution} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Resolution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Knowledge Base Search Dialog */}
      <Dialog open={knowledgeDialogOpen} onOpenChange={setKnowledgeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Knowledge Base</DialogTitle>
            <DialogDescription>
              Find a solution in the knowledge base to link to this ticket
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="search-knowledge">Search</Label>
                <Input
                  id="search-knowledge"
                  placeholder="Search knowledge base..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchKnowledgeBase()}
                />
              </div>
              <Button 
                onClick={handleSearchKnowledgeBase} 
                className="mt-8"
                disabled={!searchQuery}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            
            <div className="border rounded-md h-80 overflow-auto">
              {searchResults.length > 0 ? (
                <div className="divide-y">
                  {searchResults.map((solution) => (
                    <div key={solution.id} className="p-4 hover:bg-muted">
                      <div className="flex justify-between">
                        <h4 className="font-semibold">{solution.title}</h4>
                        <Button 
                          size="sm" 
                          onClick={() => handleLinkSolution(solution.id)}
                          disabled={isUpdating}
                        >
                          Link
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {solution.content}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {solution.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-muted-foreground">No results found</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    Enter a search term to find solutions
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add New Solution Dialog */}
      <Dialog open={addSolutionDialogOpen} onOpenChange={setAddSolutionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Solution to Knowledge Base</DialogTitle>
            <DialogDescription>
              Create a new solution to add to the knowledge base
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="solution-title">Solution Title</Label>
              <Input
                id="solution-title"
                placeholder="Enter a descriptive title"
                value={newSolution.title}
                onChange={(e) => setNewSolution(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="solution-content">Solution Content</Label>
              <Textarea
                id="solution-content"
                placeholder="Describe the solution in detail"
                value={newSolution.content}
                onChange={(e) => setNewSolution(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="solution-tags">
                Tags (comma separated)
              </Label>
              <Input
                id="solution-tags"
                placeholder="e.g., login, password, reset"
                value={newSolution.tags}
                onChange={(e) => setNewSolution(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setAddSolutionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddSolution} 
              disabled={isUpdating || !newSolution.title || !newSolution.content}
            >
              {isUpdating ? 'Adding...' : 'Add Solution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketDetails;
