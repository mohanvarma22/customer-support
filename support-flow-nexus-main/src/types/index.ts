
export type UserRole = 'admin' | 'agent' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketStatus = 'open' | 'in-progress' | 'resolved';
export type TicketCategory = 'technical' | 'billing' | 'general' | 'feature-request';
export type ResolutionStage = 'investigation' | 'implementation' | 'verification' | 'completed';

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: TicketCategory;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  tags: string[];
}

export interface Resolution {
  stage: ResolutionStage;
  notes: string;
  startedAt: string;
  completedAt?: string;
  timeSpent?: number; // in minutes
  solutionId?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  comments?: Comment[];
  resolution?: Resolution;
}
