export interface DbWorkspace {
  id: string;
  name: string;
  type: "personal" | "business";
  created_at: string;
}

export interface DbWorkspaceMember {
  id?: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  display_name: string | null;
  created_at: string;
}
