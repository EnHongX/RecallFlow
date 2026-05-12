"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  getCurrentUser,
  getStudents,
  logout,
  type User,
  type Student,
  type ApiError,
} from "@/lib/api";

interface AppContextType {
  user: User | null;
  students: Student[];
  currentStudent: Student | null;
  loading: boolean;
  error: string;
  setError: (error: string) => void;
  refreshData: () => Promise<void>;
  handleLogout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const protectedPaths = [
  "/dashboard", 
  "/students", 
  "/questions", 
  "/course-materials",
  "/learning-tasks",
  "/task-results",
  "/home", 
  "/cards", 
  "/practice-records", 
  "/wrong-cards"
];

export function AppProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const pathnameRef = useRef(pathname);
  const routerRef = useRef(router);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      const studentsData = await getStudents();
      setStudents(studentsData);
      const current = studentsData.find((s) => s.is_current) || null;
      setCurrentStudent(current);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "获取信息失败");
      if (protectedPaths.some((path) => pathnameRef.current?.startsWith(path))) {
        routerRef.current.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDataRef = useRef(fetchData);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    fetchDataRef.current();
  }, [pathname]);

  const refreshData = async () => {
    setLoading(true);
    await fetchData();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setUser(null);
      setStudents([]);
      setCurrentStudent(null);
      router.push("/login");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "退出登录失败");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        students,
        currentStudent,
        loading,
        error,
        setError,
        refreshData,
        handleLogout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
