import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Inbox, Mail, CheckCircle, Clock, Trash2, MailOpen, User } from "lucide-react";
import { markContactReadAction, deleteContactAction } from "@/actions/inbox";

export default async function DashboardInboxPage() {
  const user = await requireAuth();

  const messages = await db.query.contacts.findMany({
    where: eq(contacts.userId, user.id),
    orderBy: [desc(contacts.createdAt)],
  });

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-50 flex items-center gap-2.5">
            <Inbox className="h-7 w-7 text-sky-400" />
            <span>Inquiries & Messages</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Incoming inquiries submitted through your portfolio contact form.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <Badge variant="outline" className="h-9 px-3.5 rounded-xl border-sky-500/30 bg-sky-500/10 text-sky-400 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-sky-400 mr-2 animate-pulse" />
              {unreadCount} Unread {unreadCount === 1 ? "Message" : "Messages"}
            </Badge>
          ) : (
            <Badge variant="outline" className="h-9 px-3.5 rounded-xl border-zinc-800 text-zinc-400 text-xs font-medium">
              All caught up
            </Badge>
          )}
        </div>
      </div>

      {/* Messages List */}
      {messages.length === 0 ? (
        <Card className="bg-zinc-900/40 border-zinc-800/80 rounded-2xl p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-400">
            <Mail className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-zinc-100">Inbox is empty</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
              When recruiters, clients, or collaborators send messages through your contact form, they will appear right here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => {
            const formattedDate = new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(msg.createdAt));

            return (
              <Card
                key={msg.id}
                className={`bg-zinc-900/60 border-zinc-800/80 rounded-2xl p-6 py-5 gap-0 transition-all space-y-4 ${
                  !msg.isRead ? "ring-1 ring-sky-500/20 bg-zinc-900/80" : ""
                }`}
              >
                {/* Top Row: Sender Info & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-zinc-800/90 flex items-center justify-center text-zinc-300 font-bold shrink-0 text-sm">
                      {msg.senderName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-100">{msg.senderName}</span>
                        {!msg.isRead && (
                          <Badge className="bg-sky-500 text-black font-semibold text-[10px] px-2 py-0.5 rounded-full">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <a
                        href={`mailto:${msg.senderEmail}?subject=Re: ${encodeURIComponent(msg.subject || "Your Inquiry")}`}
                        className="text-xs text-zinc-400 hover:text-sky-400 transition-colors"
                      >
                        {msg.senderEmail}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-zinc-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formattedDate}</span>
                  </div>
                </div>

                {/* Subject & Message Content */}
                <div className="space-y-2 pt-2">
                  {msg.subject && (
                    <h3 className="font-semibold text-sm sm:text-base text-zinc-200">
                      {msg.subject}
                    </h3>
                  )}
                  <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.message}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
                  <a
                    href={`mailto:${msg.senderEmail}?subject=Re: ${encodeURIComponent(msg.subject || "Your Inquiry")}`}
                    className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Reply via Email</span>
                  </a>

                  <div className="flex items-center gap-2">
                    <form action={markContactReadAction.bind(null, msg.id, !msg.isRead)}>
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-lg text-xs border-zinc-800 hover:border-zinc-700 text-zinc-300"
                      >
                        {msg.isRead ? (
                          <>
                            <Mail className="h-3 w-3 mr-1.5 text-zinc-400" />
                            <span>Mark Unread</span>
                          </>
                        ) : (
                          <>
                            <MailOpen className="h-3 w-3 mr-1.5 text-sky-400" />
                            <span>Mark Read</span>
                          </>
                        )}
                      </Button>
                    </form>

                    <form action={deleteContactAction.bind(null, msg.id)}>
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 rounded-lg text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                        title="Delete Message"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const metadata: Metadata = { title: "Inquiries" };
