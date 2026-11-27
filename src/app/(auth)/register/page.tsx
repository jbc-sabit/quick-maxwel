"use client";

import { useActionState, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, Lock, Mail, User, AtSign, Loader2, Sparkles, Layout } from "lucide-react";
import Link from "next/link";
import { TEMPLATES, TemplateId } from "@/lib/templates";
import { ROOT_DOMAIN } from "@/lib/site";

function RegisterForm() {
  const searchParams = useSearchParams();
  const templateParam = (searchParams.get("template") || "simple_professional") as TemplateId;
  const templateConfig = TEMPLATES[templateParam] || TEMPLATES.simple_professional;

  const [state, formAction, isPending] = useActionState(registerAction, undefined);
  const [handle, setHandle] = useState("");

  return (
    <Card className="bg-zinc-900/90 border-zinc-800 text-zinc-100 shadow-2xl backdrop-blur rounded-2xl overflow-hidden py-0 gap-0">
      <CardHeader className="px-8 pt-8 pb-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Instant Setup</span>
          </div>

          {templateParam && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-[11px] font-medium text-sky-400">
              <Layout className="h-3 w-3" />
              <span>Theme: {templateConfig.name}</span>
            </div>
          )}
        </div>

        <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-50">
          Create your portfolio
        </CardTitle>
        <CardDescription className="text-sm text-zinc-400 leading-relaxed">
          Claim your own subdomain and publish your multi-page showcase in seconds.
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <input type="hidden" name="templateId" value={templateParam} />

        <CardContent className="px-8 py-3 space-y-5">
          {state?.error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{state.error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Alex Morgan"
                required
                className="h-11 pl-10 pr-4 rounded-xl bg-zinc-950/80 border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-sky-500/40 focus-visible:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="handle" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Your Subdomain
              </Label>
              <span className="text-[11px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                {handle || "yourname"}.{ROOT_DOMAIN}
              </span>
            </div>
            <div className="relative">
              <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="handle"
                name="handle"
                type="text"
                placeholder="alexmorgan"
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                required
                className="h-11 pl-10 pr-4 rounded-xl bg-zinc-950/80 border-zinc-800 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-sky-500/40 focus-visible:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="alex@example.com"
                required
                className="h-11 pl-10 pr-4 rounded-xl bg-zinc-950/80 border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-sky-500/40 focus-visible:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 6 characters"
                required
                minLength={6}
                className="h-11 pl-10 pr-4 rounded-xl bg-zinc-950/80 border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-sky-500/40 focus-visible:border-sky-500"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-8 pt-4 pb-8 flex flex-col gap-4 bg-transparent border-t-0">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-sky-500 hover:bg-sky-400 text-black font-semibold h-11 text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-sky-500/10"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating your portfolio...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <p className="text-xs text-center text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-sky-400 hover:text-sky-300 hover:underline font-semibold transition-colors ml-1"
            >
              Sign In
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center text-zinc-500">Loading form...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
