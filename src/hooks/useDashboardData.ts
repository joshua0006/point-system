import { useState } from "react";

export interface Transaction {
  id: string;
  type: "spent" | "earned";
  service: string;
  consultant?: string;
  points: number;
  date: string;
  status: string;
}

export interface BookedService {
  id: string;
  service: string;
  consultant: string;
  date: string;
  time?: string;
  duration?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  points: number;
}

export interface UpcomingSession {
  id: string;
  service: string;
  consultant: string;
  date: string;
  time: string;
  duration: string;
  bookingUrl: string;
  status: 'confirmed' | 'pending';
}

export interface UserStats {
  totalPoints: number;
  pointsSpent: number;
  pointsEarned: number;
  servicesBooked: number;
  completedSessions: number;
}

export function useDashboardData() {
  // Modal states
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [spentModalOpen, setSpentModalOpen] = useState(false);
  const [servicesModalOpen, setServicesModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [upcomingModalOpen, setUpcomingModalOpen] = useState(false);

  // Mock data
  const userStats: UserStats = {
    totalPoints: 2450,
    pointsSpent: 1200,
    pointsEarned: 3650,
    servicesBooked: 8,
    completedSessions: 6,
  };

  const allTransactions: Transaction[] = [
    {
      id: "1",
      type: "spent",
      service: "Strategic Business Consultation",
      consultant: "Sarah Chen",
      points: 500,
      date: "2024-01-15",
      status: "completed"
    },
    {
      id: "2", 
      type: "earned",
      service: "Monthly Bonus",
      points: 200,
      date: "2024-01-01",
      status: "completed"
    },
    {
      id: "3",
      type: "spent",
      service: "Technical Architecture Review",
      consultant: "Marcus Rodriguez", 
      points: 350,
      date: "2024-01-10",
      status: "completed"
    },
    {
      id: "4",
      type: "earned",
      service: "Welcome Bonus",
      points: 1000,
      date: "2023-12-15",
      status: "completed"
    },
    {
      id: "5",
      type: "spent",
      service: "Marketing Strategy Session",
      consultant: "Emily Johnson",
      points: 300,
      date: "2024-01-05",
      status: "completed"
    },
  ];

  const spentTransactions = allTransactions.filter(t => t.type === 'spent').map(t => ({
    ...t,
    duration: t.points > 400 ? "1 hour" : "30 mins"
  }));

  const bookedServices: BookedService[] = [
    {
      id: "1",
      service: "Strategic Business Consultation",
      consultant: "Sarah Chen",
      date: "2024-01-15",
      time: "2:00 PM",
      duration: "1 hour",
      status: "completed",
      points: 500
    },
    {
      id: "2",
      service: "Technical Architecture Review",
      consultant: "Marcus Rodriguez",
      date: "2024-01-10",
      time: "10:00 AM",
      duration: "45 mins",
      status: "completed",
      points: 350
    },
    {
      id: "3",
      service: "Marketing Strategy Session",
      consultant: "Emily Johnson",
      date: "2024-01-05",
      time: "3:00 PM",
      duration: "30 mins",
      status: "completed",
      points: 300
    },
    {
      id: "4",
      service: "Financial Planning",
      consultant: "David Kim",
      date: "2024-01-02",
      time: "11:00 AM",
      duration: "1 hour",
      status: "completed",
      points: 400
    },
    {
      id: "5",
      service: "Legal Consultation",
      consultant: "Jennifer Liu",
      date: "2023-12-28",
      time: "4:00 PM",
      duration: "30 mins",
      status: "completed",
      points: 250
    },
    {
      id: "6",
      service: "Product Strategy",
      consultant: "Alex Turner",
      date: "2023-12-25",
      time: "1:00 PM",
      duration: "45 mins",
      status: "completed",
      points: 375
    },
    {
      id: "7",
      service: "HR Consultation",
      consultant: "Maria Garcia",
      date: "2024-01-22",
      time: "9:00 AM",
      duration: "30 mins",
      status: "pending",
      points: 275
    },
    {
      id: "8",
      service: "Technology Audit",
      consultant: "Robert Chen",
      date: "2024-01-18",
      time: "2:30 PM",
      duration: "1.5 hours",
      status: "confirmed",
      points: 600
    },
  ];

  const upcomingBookings: UpcomingSession[] = [
    {
      id: "1",
      service: "Marketing Campaign Analysis",
      consultant: "Emily Johnson",
      date: "2024-01-20",
      time: "2:00 PM",
      duration: "30 mins",
      bookingUrl: "https://calendly.com/emily-johnson/marketing",
      status: "confirmed"
    },
    {
      id: "2",
      service: "Financial Planning & Budgeting", 
      consultant: "David Kim",
      date: "2024-01-25",
      time: "10:00 AM",
      duration: "1 hour",
      bookingUrl: "https://calendly.com/david-kim/finance",
      status: "pending"
    },
    {
      id: "3",
      service: "Product Roadmap Review",
      consultant: "Alex Turner",
      date: "2024-01-28",
      time: "3:00 PM",
      duration: "45 mins",
      bookingUrl: "https://calendly.com/alex-turner/product",
      status: "confirmed"
    },
  ];

  const recentTransactions = allTransactions.slice(0, 3);

  return {
    // Modal states
    balanceModalOpen,
    setBalanceModalOpen,
    spentModalOpen,
    setSpentModalOpen,
    servicesModalOpen,
    setServicesModalOpen,
    completionModalOpen,
    setCompletionModalOpen,
    upcomingModalOpen,
    setUpcomingModalOpen,
    
    // Data
    userStats,
    allTransactions,
    spentTransactions,
    bookedServices,
    upcomingBookings,
    recentTransactions,
  };
}