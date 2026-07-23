const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/DashboardClient.tsx', 'utf8');

const correctImports = `"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { logout } from "../auth/actions";
import { hasFeatureAccess } from "@/utils/featureGate";
import { getEntitlements, type PlanTier } from "@/utils/entitlements";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  updateListingAction,
  addListingMediaAction,
  deleteListingMediaAction,
  replyToReviewAction,
  answerQuestionAction,
  updateProfileAction,
  markLeadStatusAction,
  sendReferralAction,
  updateBookingStatusAction,
  replyToLeadMessageAction,
  generateAIDescriptionAction,
  generateAIReviewReplyAction,
} from "./actions";
import VisitorDashboard from "./VisitorDashboard";
import {
  LayoutDashboard,
  Edit,
  Inbox,
  Star,
  MessageSquare,
  Settings,
  LogOut,
  Building2,
  Plus,
  Trash,
  CheckCircle,
  ShieldAlert,
  ExternalLink,
  Volume2,
  VolumeX,
  CreditCard,
  Gift,
  Calendar,
  Sparkles,
  ArrowLeft,
  ChevronDown
} from "lucide-react";
`;

const interfaceIndex = code.indexOf('interface DashboardClientProps');
if (interfaceIndex > -1) {
  code = correctImports + '\n' + code.substring(interfaceIndex);
  fs.writeFileSync('src/app/dashboard/DashboardClient.tsx', code);
}
