import type { PoolWithRelations } from "./services";

export type SerializedPoolChild = {
  id: string;
  firstName: string;
  lastName: string;
  schoolId: string | null;
};

export type SerializedPoolAssistant = {
  id: string;
  name: string;
  email: string;
};

export type SerializedPool = {
  id: string;
  name: string;
  school: { id: string; name: string };
  costBearer: { id: string; name: string };
  children: SerializedPoolChild[];
  assistants: SerializedPoolAssistant[];
  childCount: number;
  assistantCount: number;
};

export function serializePool(p: PoolWithRelations): SerializedPool {
  return {
    id: p.id,
    name: p.name,
    school: { id: p.school.id, name: p.school.name },
    costBearer: { id: p.kostentraeger.id, name: p.kostentraeger.name },
    children: p.children.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      schoolId: c.schoolId,
    })),
    assistants: p.assistants.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
    })),
    childCount: p._count.children,
    assistantCount: p._count.assistants,
  };
}
