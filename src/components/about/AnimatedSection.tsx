"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}

export function AnimatedSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: AnimatedSectionProps) {
  const initial = {
    opacity: 0,
    x: direction === "left" ? -30 : direction === "right" ? 30 : 0,
    y: direction === "up" ? 20 : 0,
  };

  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedOnView({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: AnimatedSectionProps) {
  const initial = {
    opacity: 0,
    x: direction === "left" ? -30 : direction === "right" ? 30 : 0,
    y: direction === "up" ? 30 : 0,
  };

  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedValueProps {
  icon: ReactNode;
  title: string;
  description: string;
  index: number;
}

export function AnimatedValue({
  icon,
  title,
  description,
  index,
}: AnimatedValueProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className="text-center"
    >
      <div className="w-16 h-16 bg-[#FF6B35]/10 flex items-center justify-center mx-auto mb-6">
        {icon}
      </div>
      <h3 className="font-display text-xl text-[#FFF8F0] mb-3">{title}</h3>
      <p className="text-[#B8B0A8]">{description}</p>
    </motion.div>
  );
}

interface AnimatedTeamMemberProps {
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  index: number;
}

export function AnimatedTeamMember({
  name,
  role,
  bio,
  imageUrl,
  index,
}: AnimatedTeamMemberProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
      viewport={{ once: true }}
      className="group"
    >
      <div className="aspect-[3/4] overflow-hidden mb-6">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <h3 className="font-display text-xl text-[#FFF8F0] mb-1">{name}</h3>
      <p className="text-[#FF6B35] text-sm font-medium mb-3">{role}</p>
      <p className="text-[#B8B0A8]">{bio}</p>
    </motion.div>
  );
}

interface AnimatedMilestoneProps {
  year: string;
  event: string;
  icon: ReactNode;
  index: number;
}

export function AnimatedMilestone({
  year,
  event,
  icon,
  index,
}: AnimatedMilestoneProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className="flex items-start gap-6"
    >
      <div className="w-6 h-6 bg-[#FF6B35] flex items-center justify-center flex-shrink-0 relative z-10">
        {icon}
      </div>
      <div className="pt-0.5">
        <span className="font-handwritten text-xl text-[#FF6B35]">{year}</span>
        <p className="text-[#FFF8F0] text-lg">{event}</p>
      </div>
    </motion.div>
  );
}

interface AnimatedCTAProps {
  children: ReactNode;
}

export function AnimatedCTA({ children }: AnimatedCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  );
}
