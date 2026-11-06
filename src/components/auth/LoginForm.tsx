import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LockKeyhole, Mail, Loader2 } from "lucide-react";
import { useAuthActions } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const INITIAL_ADMIN_EMAIL = "contato@closetfesta.com.br";

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { login } = useAuthActions();
  const [mode, setMode] = useState<"login" | "initial" | "recover">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "initial") {
        if (password.length < 12 || password !== confirmPassword) {
          throw new Error("Use pelo menos 12 caracteres e confirme a mesma senha.");
        }
        const { error: signupError } = await supabase.auth.signUp({
          email: INITIAL_ADMIN_EMAIL,
          password,
          options: { data: { full_name: "Administrador Closet Festa" } },
        });
        if (signupError) throw signupError;
        setPassword("");
        setConfirmPassword("");
        setEmail(INITIAL_ADMIN_EMAIL);
        setMode("login");
        setNotice("Cadastro enviado. Verifique a caixa de entrada da loja, confirme o endereço de e-mail e depois entre com a senha cadastrada.");
      } else if (mode === "recover") {
        if (!email.includes("@")) throw new Error("Informe um e-mail válido.");
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
        if (resetError) throw resetError;
        setMode("login");
        setNotice("Se o e-mail estiver cadastrado, o Supabase enviará as instruções de recuperação.");
      } else {
        if (!email.includes("@")) throw new Error("Entre usando o e-mail cadastrado no Supabase.");
        const success = await login(email.trim().toLowerCase(), password);
        if (!success) throw new Error("Acesso não autorizado. Confira seu e-mail, senha e permissão de funcionário.");
        onLoginSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a operação.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-marsala-50 via-neutral-50 to-marsala-100 p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="rounded-t-xl bg-gradient-to-r from-marsala-700 to-marsala-900 p-7 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/15">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl text-white">Closet Festa</CardTitle>
          <p className="text-sm text-white/80">Sistema administrativo e frente de caixa</p>
        </CardHeader>
        <CardContent className="space-y-5 p-6">
          <h2 className="text-lg font-semibold">
            {mode === "initial" ? "Primeiro acesso administrativo" : mode === "recover" ? "Recuperar senha" : "Acesso da equipe"}
          </h2>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {notice && <Alert><AlertDescription>{notice}</AlertDescription></Alert>}
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">E-mail</Label>
              {mode === "initial" ? (
                <Input id="admin-email" type="email" value={INITIAL_ADMIN_EMAIL} readOnly autoComplete="email" />
              ) : (
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="admin-email" type="email" className="pl-9" required autoComplete="email"
                    value={email} onChange={event => setEmail(event.target.value)} placeholder="seuemail@exemplo.com" />
                </div>
              )}
            </div>
            {mode !== "recover" && (
              <div className="space-y-2">
                <Label htmlFor="admin-password">Senha</Label>
                <Input id="admin-password" type="password" required autoComplete={mode === "initial" ? "new-password" : "current-password"}
                  minLength={mode === "initial" ? 12 : undefined}
                  value={password} onChange={event => setPassword(event.target.value)} />
              </div>
            )}
            {mode === "initial" && (
              <div className="space-y-2">
                <Label htmlFor="admin-confirm-password">Confirmar senha</Label>
                <Input id="admin-confirm-password" type="password" required minLength={12} autoComplete="new-password"
                  value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Apenas o e-mail empresarial confirmado pode ativar o primeiro administrador. Não há senhas de demonstração.
                </p>
              </div>
            )}
            <Button type="submit" disabled={busy} className="w-full bg-marsala-700 text-white hover:bg-marsala-800">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "initial" ? "Solicitar primeiro acesso" : mode === "recover" ? "Enviar recuperação" : "Entrar no sistema"}
            </Button>
          </form>
          <div className="flex flex-wrap justify-center gap-3 border-t pt-4 text-xs">
            {mode !== "login" ? (
              <button type="button" className="text-marsala-700 underline" onClick={() => { setMode("login"); setError(""); setNotice(""); }}>
                Voltar ao login
              </button>
            ) : (
              <>
                <button type="button" className="text-marsala-700 underline" onClick={() => { setMode("recover"); setError(""); setNotice(""); }}>
                  Esqueci minha senha
                </button>
                <button type="button" className="text-marsala-700 underline" onClick={() => { setMode("initial"); setError(""); setNotice(""); }}>
                  Ativar primeiro administrador
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
