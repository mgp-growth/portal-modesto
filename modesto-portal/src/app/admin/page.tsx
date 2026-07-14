import { redirect } from "next/navigation";

// Escopo: pastas e entregas. O admin entra direto em Clientes.
export default function AdminHome() {
  redirect("/admin/clients");
}
