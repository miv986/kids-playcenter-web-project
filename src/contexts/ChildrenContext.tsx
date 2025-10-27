// contexts/ChildrenContext.tsx
"use client";
import React, { createContext, useContext } from "react";
import { Child } from "../types/auth";
import { useHttp } from "./HttpContext";

interface ChildrenContextType {
  fetchMyChildren: () => Promise<Child[]>;
  addChild: (childData: Omit<Child, "id">) => Promise<Child>;
  updateChild: (id: number, childData: Partial<Child>) => Promise<Child>;
  deleteChild: (id: number) => Promise<void>;
  fetchTutorWithChildren: (tutorId: number) => Promise<any>; // para admin
}

const ChildrenContext = createContext<ChildrenContextType | undefined>(
  undefined
);

export function useChildren() {
  const context = useContext(ChildrenContext);
  if (!context) {
    throw new Error("useChildren must be used within a ChildrenProvider");
  }
  return context;
}

export function ChildrenProvider({ children }: { children: React.ReactNode }) {
  const http = useHttp();

  const fetchMyChildren = async (): Promise<Child[]> => {
    try {
      const res = await http.get("/api/children");
      return res.children; // el backend responde con { children }
    } catch (err: any) {
      if (err.message !== 'No token provided') {
        console.error("Error fetching children:", err);
      }
      return [];
    }
  };

  const addChild = async (childData: Omit<Child, "id">): Promise<Child> => {
    try {
      const newChild = await http.post("/api/addChild", childData);
      return newChild;
    } catch (err) {
      console.error("Error adding child:", err);
      throw err;
    }
  };

  const updateChild = async (
    id: number,
    childData: Partial<Child>
  ): Promise<Child> => {
    try {
      const updated = await http.put(`/api/updateChild/${id}`, childData);
      return updated;
    } catch (err) {
      console.error("Error updating child:", err);
      throw err;
    }
  };

  const deleteChild = async (id: number): Promise<void> => {
    try {
      await http.delete(`/api/deleteChild/${id}`);
    } catch (err) {
      console.error("Error deleting child:", err);
      throw err;
    }
  };

  const fetchTutorWithChildren = async (tutorId: number): Promise<any> => {
    try {
      return await http.get(`/api/admin/tutor/${tutorId}`);
    } catch (err) {
      console.error("Error fetching tutor with children:", err);
      throw err;
    }
  };

  return (
    <ChildrenContext.Provider
      value={{
        fetchMyChildren,
        addChild,
        updateChild,
        deleteChild,
        fetchTutorWithChildren,
      }}
    >
      {children}
    </ChildrenContext.Provider>
  );
}
