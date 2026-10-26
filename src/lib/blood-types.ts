export type Donor = {
  id: string;
  name: string;
  phone: string;
  bloodGroup: string;
  district: string;
  area: string | null;
  lastDonation: string | null;
  available: boolean;
  createdAt: string;
};

export type BloodRequest = {
  id: string;
  patientName: string;
  bloodGroup: string;
  district: string;
  hospital: string;
  urgency: "URGENT" | "WITHIN_24H" | "NORMAL";
  units: number;
  contactName: string;
  phone: string;
  note: string | null;
  neededBy: string | null;
  status: "OPEN" | "FULFILLED";
  createdAt: string;
};

export type DonorNotification = {
  id: string;
  donorId: string;
  requestId: string;
  title: string;
  body: string;
  channel: "IN_APP" | "SMS";
  smsStatus: "SIMULATED" | "SENT" | "FAILED";
  read: boolean;
  createdAt: string;
  donor?: { name: string; phone: string; district: string; bloodGroup: string };
};

export type ContactMessage = {
  id: string;
  name: string;
  phone: string;
  subject: string | null;
  content: string;
  createdAt: string;
};

export type SiteStats = {
  donors: number;
  availableDonors: number;
  openRequests: number;
  fulfilledRequests: number;
  notificationsSent: number;
  messages: number;
  groupDistribution: { group: string; count: number }[];
  districtsCovered: number;
};

export type ViewKey =
  | "home"
  | "donors"
  | "requests"
  | "register"
  | "inbox"
  | "contact"
  | "admin";
