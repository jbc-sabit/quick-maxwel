import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { services } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Plus, Sparkles, Star, Trash2, Edit3, ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { deleteServiceAction, toggleServiceFeaturedAction } from "@/actions/services";

export default async function DashboardServicesPage() {
  const user = await requireAuth();

  const userServices = await db.query.services.findMany({
    where: eq(services.userId, user.id),
    orderBy: [asc(services.orderIndex)],
  });

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-50 flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-purple-400" />
            <span>Offered Services</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Offer architectural audits, engineering consulting, speaking, or custom freelance packages.
          </p>
        </div>

        <Button asChild className="h-11 px-5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-sm font-semibold transition-all shadow-lg shadow-sky-500/10">
          <Link href="/dashboard/services/new">
            <Plus className="h-4 w-4 mr-2" />
            <span>Add Service</span>
          </Link>
        </Button>
      </div>

      {/* List */}
      {userServices.length === 0 ? (
        <Card className="bg-zinc-900/40 border-zinc-800/80 rounded-2xl p-12 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center mx-auto text-zinc-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-zinc-100">No services created yet</h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
              Define the services or consulting you provide to prospective clients and teams.
            </p>
          </div>
          <Button asChild className="h-10 px-4 rounded-xl bg-sky-500 text-black font-semibold text-xs">
            <Link href="/dashboard/services/new">Add Your First Service</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userServices.map((service) => (
            <Card
              key={service.id}
              className="bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-6 py-5 gap-0 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {service.isFeatured && (
                      <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-xs px-2 py-0.5">
                        <Star className="h-3 w-3 mr-1 fill-amber-400" />
                        Featured
                      </Badge>
                    )}
                    <span className="text-xs font-semibold text-purple-400 capitalize">{service.pricingType}</span>
                  </div>
                  {service.price && (
                    <Badge variant="outline" className="text-sky-400 border-sky-500/30 text-xs font-mono">
                      {service.price}
                    </Badge>
                  )}
                </div>

                <h2 className="font-bold text-base sm:text-lg text-zinc-100">{service.title}</h2>

                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                  {service.shortDescription}
                </p>

                {service.deliverables && service.deliverables.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {service.deliverables.slice(0, 2).map((del) => (
                      <div key={del} className="flex items-center gap-1.5 text-xs text-zinc-300">
                        <CheckCircle2 className="h-3 w-3 text-sky-400 shrink-0" />
                        <span className="truncate">{del}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60">
                <form action={toggleServiceFeaturedAction.bind(null, service.id, service.isFeatured)}>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className={`h-8 px-2.5 rounded-lg text-xs border-zinc-800 hover:border-zinc-700 ${service.isFeatured ? "text-amber-400 bg-amber-500/10" : "text-zinc-400"}`}
                  >
                    <Star className={`h-3 w-3 mr-1 ${service.isFeatured ? "fill-amber-400" : ""}`} />
                    <span>{service.isFeatured ? "Unfeature" : "Feature"}</span>
                  </Button>
                </form>

                <div className="flex items-center gap-1.5">
                  <Button asChild variant="outline" size="sm" className="h-8 px-2.5 rounded-lg text-xs border-zinc-800 hover:border-zinc-700 text-zinc-300">
                    <Link href={`/${user.handle}/services/${service.slug}`} target="_blank">
                      <ExternalLink className="h-3 w-3 mr-1 text-zinc-400" />
                      <span>View</span>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" size="sm" className="h-8 px-2.5 rounded-lg text-xs border-zinc-800 hover:border-zinc-700 text-zinc-300">
                    <Link href={`/dashboard/services/${service.id}/edit`}>
                      <Edit3 className="h-3 w-3 mr-1 text-blue-400" />
                      <span>Edit</span>
                    </Link>
                  </Button>

                  <form action={deleteServiceAction.bind(null, service.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 rounded-lg text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete Service"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export const metadata: Metadata = { title: "Services" };
