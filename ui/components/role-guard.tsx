'use client'
import { useEffect, useRef } from "react";
import { ROLES } from "@/lib/types";
import { useStore } from "@/lib/store";

const RoleGuard = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useStore();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Function to check all elements with data-roles.
    const checkRoles = () => {
      const elements = container.querySelectorAll<HTMLElement>("[data-roles]");
      elements.forEach((el) => {
        const allowed = el.dataset.roles?.split(",") ?? [];
        if (!allowed.includes(user?.role as ROLES)) {
          el.style.display = "none";
        } else {
          el.style.removeProperty("display");
        }
      });
    };

    // Run once when the effect mounts or user.role changes.
    checkRoles();

    // Set up a MutationObserver to detect DOM changes.
    const observer = new MutationObserver(() => {
      checkRoles();
    });

    observer.observe(container, { childList: true, subtree: true });

    // Clean up the observer on unmount.
    return () => {
      observer.disconnect();
    };
  }, [user?.role]);

  return <div ref={containerRef}>{children}</div>;
};

export default RoleGuard;
