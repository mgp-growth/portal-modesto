"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Acesso negado.");
  }
  return profile;
}

// Cria um novo cliente (pasta). RLS já restringe a admin, mas checamos também.
export async function createClientAction(formData: FormData) {
  await assertAdmin();
  const nome = String(formData.get("nome") || "").trim();
  if (!nome) throw new Error("Nome obrigatório.");

  const slug =
    nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || null;

  const supabase = await createClient();
  const { error } = await supabase.from("clients").insert({ nome, slug });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/clients");
  revalidatePath("/admin");
}

// Cria um usuário de acesso para um cliente (usa service role -> bypassa RLS).
export async function createClientUserAction(formData: FormData) {
  await assertAdmin();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const client_id = String(formData.get("client_id") || "");
  const full_name = String(formData.get("full_name") || "").trim() || null;

  if (!email || !password || !client_id) {
    throw new Error("E-mail, senha e cliente são obrigatórios.");
  }

  const admin = createAdminClient();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    throw new Error(createErr?.message || "Falha ao criar usuário.");
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    role: "client",
    client_id,
    full_name,
  });
  if (profileErr) {
    // rollback do usuário órfão
    await admin.auth.admin.deleteUser(created.user.id);
    throw new Error(profileErr.message);
  }

  revalidatePath("/admin/clients");
}

// Sobe um HTML pro bucket privado e registra em documents.
export async function uploadDocumentAction(formData: FormData) {
  const admin = await assertAdmin();

  const client_id = String(formData.get("client_id") || "");
  const titulo = String(formData.get("titulo") || "").trim();
  const tipo = String(formData.get("tipo") || "");
  const file = formData.get("file") as File | null;

  if (!client_id || !titulo || !tipo || !file || file.size === 0) {
    throw new Error("Preencha todos os campos e selecione um arquivo.");
  }

  const supabase = await createClient();
  const id = crypto.randomUUID();
  const path = `${client_id}/${id}.html`;

  const { error: upErr } = await supabase.storage
    .from("documents")
    .upload(path, await file.arrayBuffer(), {
      contentType: "text/html",
      upsert: false,
    });
  if (upErr) throw new Error(upErr.message);

  const { error: insErr } = await supabase.from("documents").insert({
    id,
    client_id,
    titulo,
    tipo,
    storage_path: path,
    created_by: admin.id,
  });
  if (insErr) {
    await supabase.storage.from("documents").remove([path]);
    throw new Error(insErr.message);
  }

  revalidatePath("/admin/documents");
  revalidatePath("/admin");
}
