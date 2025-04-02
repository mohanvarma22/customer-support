import React, { createContext, useContext, useState } from 'react';
import { Ticket, TicketStatus, TicketPriority, TicketCategory, Comment, User, Resolution, ResolutionStage, KnowledgeItem } from '@/types';
import { useAuth } from './AuthContext';

interface TicketContextType {
  tickets: Ticket[];
  knowledgeBase: KnowledgeItem[];
  getTicketById: (id: string) => Ticket | undefined;
  createTicket: (
    title: string,
    description: string,
    category: TicketCategory,
    priority: TicketPriority
  ) => Promise<Ticket>;
  updateTicketStatus: (id: string, status: TicketStatus) => Promise<Ticket>;
  assignTicket: (id: string, agentId: string, agentName: string) => Promise<Ticket>;
  addComment: (ticketId: string, content: string) => Promise<Comment>;
  filterTickets: (
    status?: TicketStatus[],
    priority?: TicketPriority[],
    search?: string
  ) => Ticket[];
  getAgents: () => User[];
  updateResolution: (
    ticketId: string, 
    stage: ResolutionStage, 
    notes: string
  ) => Promise<Ticket>;
  addSolutionToKnowledgeBase: (
    title: string,
    content: string,
    category: TicketCategory,
    tags: string[]
  ) => Promise<KnowledgeItem>;
  searchKnowledgeBase: (search: string, category?: TicketCategory) => KnowledgeItem[];
  linkSolutionToTicket: (ticketId: string, solutionId: string) => Promise<Ticket>;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

// Mock data for demonstration
const MOCK_TICKETS: Ticket[] = [
  {
    id: '1',
    title: 'Cannot access my account',
    description: 'I am unable to log into my account after the recent update. I keep getting an error message saying "Invalid credentials".',
    category: 'technical',
    priority: 'high',
    status: 'open',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: {
      id: '3',
      name: 'Customer',
    },
    comments: [
      {
        id: '1',
        userId: '3',
        userName: 'Customer',
        userAvatar: 'https://i.pravatar.cc/150?u=customer',
        content: 'I tried clearing my cache but still having the same issue.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ]
  },
  {
    id: '2',
    title: 'Billing discrepancy on my last invoice',
    description: 'I was charged $59.99 but my plan should be $49.99 per month. Please check and adjust my bill.',
    category: 'billing',
    priority: 'medium',
    status: 'in-progress',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: {
      id: '3',
      name: 'Customer',
    },
    assignedTo: {
      id: '2',
      name: 'Support Agent',
    },
    comments: [
      {
        id: '2',
        userId: '2',
        userName: 'Support Agent',
        userAvatar: 'https://i.pravatar.cc/150?u=agent',
        content: 'I\'m looking into this issue for you. I\'ll check your billing records and get back to you shortly.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ]
  },
  {
    id: '3',
    title: 'Feature request: Dark mode',
    description: 'It would be great if you could add a dark mode option to reduce eye strain when using the app at night.',
    category: 'feature-request',
    priority: 'low',
    status: 'open',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: {
      id: '3',
      name: 'Customer',
    }
  },
  {
    id: '4',
    title: 'Need help with integration',
    description: 'I\'m trying to integrate your API with my application but getting CORS errors. Please advise.',
    category: 'technical',
    priority: 'medium',
    status: 'resolved',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: {
      id: '3',
      name: 'Customer',
    },
    assignedTo: {
      id: '2',
      name: 'Support Agent',
    },
    comments: [
      {
        id: '3',
        userId: '2',
        userName: 'Support Agent',
        userAvatar: 'https://i.pravatar.cc/150?u=agent',
        content: 'You need to add your domain to the whitelist in your API settings. Let me know if you need further assistance.',
        createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        userId: '3',
        userName: 'Customer',
        userAvatar: 'https://i.pravatar.cc/150?u=customer',
        content: 'That worked! Thank you so much for your help.',
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ]
  }
];

// Mock agents for demonstration
const MOCK_AGENTS: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'https://i.pravatar.cc/150?u=admin',
  },
  {
    id: '2',
    name: 'Support Agent',
    email: 'agent@example.com',
    role: 'agent',
    avatar: 'https://i.pravatar.cc/150?u=agent',
  },
  {
    id: '5',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'agent',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
  },
];

// Mock knowledge base for demonstration
const MOCK_KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: '1',
    title: 'How to reset your password',
    content: 'To reset your password, visit the login page and click on "Forgot Password". Follow the instructions sent to your email address.',
    category: 'technical',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: {
      id: '2',
      name: 'Support Agent',
    },
    tags: ['password', 'login', 'account']
  },
  {
    id: '2',
    title: 'Understanding your monthly invoice',
    content: 'Your monthly invoice includes your base subscription fee and any additional services you may have used during the billing period. Taxes are calculated based on your location.',
    category: 'billing',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: {
      id: '2',
      name: 'Support Agent',
    },
    tags: ['billing', 'invoice', 'subscription']
  },
  {
    id: '3',
    title: 'Troubleshooting API integration issues',
    content: 'Common API integration issues include incorrect authentication, CORS errors, and rate limiting. Make sure your API key is valid, your domain is whitelisted, and you are not exceeding the rate limits.',
    category: 'technical',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: {
      id: '5',
      name: 'Sarah Johnson',
    },
    tags: ['api', 'integration', 'cors', 'troubleshooting']
  }
];

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>(MOCK_KNOWLEDGE_BASE);
  const { user } = useAuth();

  const getTicketById = (id: string) => {
    return tickets.find(ticket => ticket.id === id);
  };

  const createTicket = async (
    title: string,
    description: string,
    category: TicketCategory,
    priority: TicketPriority
  ): Promise<Ticket> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!user) {
      throw new Error('User must be logged in to create a ticket');
    }

    const newTicket: Ticket = {
      id: `${tickets.length + 1}`,
      title,
      description,
      category,
      priority,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: {
        id: user.id,
        name: user.name,
      },
      comments: []
    };

    setTickets(prev => [...prev, newTicket]);
    return newTicket;
  };

  const updateTicketStatus = async (id: string, status: TicketStatus): Promise<Ticket> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const ticket = tickets.find(t => t.id === id);
    if (!ticket) {
      throw new Error(`Ticket with ID ${id} not found`);
    }

    const updatedTicket = {
      ...ticket,
      status,
      updatedAt: new Date().toISOString()
    };

    setTickets(prev => prev.map(t => t.id === id ? updatedTicket : t));
    return updatedTicket;
  };

  const assignTicket = async (id: string, agentId: string, agentName: string): Promise<Ticket> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const ticket = tickets.find(t => t.id === id);
    if (!ticket) {
      throw new Error(`Ticket with ID ${id} not found`);
    }

    const updatedTicket = {
      ...ticket,
      assignedTo: {
        id: agentId,
        name: agentName
      },
      status: ticket.status === 'open' ? 'in-progress' as TicketStatus : ticket.status,
      updatedAt: new Date().toISOString()
    };

    setTickets(prev => prev.map(t => t.id === id ? updatedTicket : t));
    return updatedTicket;
  };

  const addComment = async (ticketId: string, content: string): Promise<Comment> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!user) {
      throw new Error('User must be logged in to add a comment');
    }

    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    const newComment: Comment = {
      id: `${new Date().getTime()}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      content,
      createdAt: new Date().toISOString()
    };

    const updatedTicket = {
      ...ticket,
      comments: [...(ticket.comments || []), newComment],
      updatedAt: new Date().toISOString()
    };

    setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
    return newComment;
  };

  const filterTickets = (
    status?: TicketStatus[],
    priority?: TicketPriority[],
    search?: string
  ): Ticket[] => {
    return tickets.filter(ticket => {
      // Filter by status if provided
      if (status && status.length > 0 && !status.includes(ticket.status)) {
        return false;
      }
      
      // Filter by priority if provided
      if (priority && priority.length > 0 && !priority.includes(ticket.priority)) {
        return false;
      }
      
      // Filter by search term if provided
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          ticket.title.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  };

  const getAgents = (): User[] => {
    return MOCK_AGENTS.filter(agent => agent.role === 'admin' || agent.role === 'agent');
  };

  const updateResolution = async (
    ticketId: string, 
    stage: ResolutionStage, 
    notes: string
  ): Promise<Ticket> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    const now = new Date().toISOString();
    
    let timeSpent: number | undefined = undefined;
    if (ticket.resolution && ticket.resolution.startedAt) {
      // Calculate time spent in minutes if moving to a new stage
      if (stage !== ticket.resolution.stage) {
        const startDate = new Date(ticket.resolution.startedAt);
        const endDate = new Date();
        timeSpent = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
      } else {
        // Keep existing time spent if staying on the same stage
        timeSpent = ticket.resolution.timeSpent;
      }
    }

    const updatedResolution: Resolution = {
      stage,
      notes,
      startedAt: ticket.resolution?.startedAt || now,
      timeSpent,
      ...(stage === 'completed' ? { completedAt: now } : {}),
      ...(ticket.resolution?.solutionId ? { solutionId: ticket.resolution.solutionId } : {})
    };

    // If resolution is completed, also update ticket status to resolved
    const newStatus = stage === 'completed' ? 'resolved' as TicketStatus : ticket.status;

    const updatedTicket = {
      ...ticket,
      status: newStatus,
      resolution: updatedResolution,
      updatedAt: now
    };

    setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
    return updatedTicket;
  };

  const addSolutionToKnowledgeBase = async (
    title: string,
    content: string,
    category: TicketCategory,
    tags: string[]
  ): Promise<KnowledgeItem> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!user) {
      throw new Error('User must be logged in to add a solution');
    }

    const newSolution: KnowledgeItem = {
      id: `kb-${knowledgeBase.length + 1}`,
      title,
      content,
      category,
      createdAt: new Date().toISOString(),
      createdBy: {
        id: user.id,
        name: user.name,
      },
      tags
    };

    setKnowledgeBase(prev => [...prev, newSolution]);
    return newSolution;
  };

  const searchKnowledgeBase = (search: string, category?: TicketCategory): KnowledgeItem[] => {
    return knowledgeBase.filter(item => {
      // Filter by category if provided
      if (category && item.category !== category) {
        return false;
      }
      
      // Search in title, content, and tags
      const searchLower = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.content.toLowerCase().includes(searchLower) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    });
  };

  const linkSolutionToTicket = async (ticketId: string, solutionId: string): Promise<Ticket> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    const solution = knowledgeBase.find(s => s.id === solutionId);
    if (!solution) {
      throw new Error(`Solution with ID ${solutionId} not found`);
    }

    const updatedResolution: Resolution = {
      ...(ticket.resolution || { 
        stage: 'investigation',
        notes: 'Investigation started',
        startedAt: new Date().toISOString()
      }),
      solutionId
    };

    const updatedTicket = {
      ...ticket,
      resolution: updatedResolution,
      updatedAt: new Date().toISOString()
    };

    setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
    return updatedTicket;
  };

  return (
    <TicketContext.Provider value={{
      tickets,
      knowledgeBase,
      getTicketById,
      createTicket,
      updateTicketStatus,
      assignTicket,
      addComment,
      filterTickets,
      getAgents,
      updateResolution,
      addSolutionToKnowledgeBase,
      searchKnowledgeBase,
      linkSolutionToTicket
    }}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
};
