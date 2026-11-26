import { query } from "../_generated/server";
import { getAuthenticatedUser } from "../lib/auth";

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx);
    const now = Date.now();

    const [
      users,
      scheduledMeetings,
      pendingActions,
      inProgressActions,
      completedActions,
      cancelledActions,
      activeAnnouncements,
      upcomingDeadlines,
    ] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("meetings")
        .withIndex("by_status", (q) => q.eq("status", "scheduled"))
        .collect(),
      ctx.db.query("actions")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect(),
      ctx.db.query("actions")
        .withIndex("by_status", (q) => q.eq("status", "in_progress"))
        .collect(),
      ctx.db.query("actions")
        .withIndex("by_status", (q) => q.eq("status", "completed"))
        .collect(),
      ctx.db.query("actions")
        .withIndex("by_status", (q) => q.eq("status", "cancelled"))
        .collect(),
      ctx.db.query("announcements")
        .withIndex("by_active_created_at", (q) => q.eq("isActive", true))
        .order("desc")
        .collect(),
      ctx.db.query("deadlines")
        .withIndex("by_status_due_at", (q) => q.eq("status", "upcoming"))
        .order("asc")
        .collect(),
    ]);

    const validAnnouncements = activeAnnouncements
      .filter((item) => item.expiresAt === undefined || item.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);

    const nextMeetings = scheduledMeetings
      .filter((item) => item.startTime >= now)
      .sort((a, b) => a.startTime - b.startTime);

    const futureDeadlines = upcomingDeadlines
      .filter((item) => item.dueAt >= now)
      .sort((a, b) => a.dueAt - b.dueAt);

    const overdue = upcomingDeadlines
      .filter((item) => item.dueAt < now)
      .sort((a, b) => a.dueAt - b.dueAt);

    return {
      generatedAt: now,
      users: {
        active: users.filter((item) => item.isActive).length,
        admins: users.filter((item) => item.isActive && item.role === "admin").length,
        staff: users.filter((item) => item.isActive && item.role === "staff").length,
      },
      meetings: {
        upcomingCount: nextMeetings.length,
        next: nextMeetings.slice(0, 5),
      },
      actions: {
        pending: pendingActions.length,
        inProgress: inProgressActions.length,
        completed: completedActions.length,
        cancelled: cancelledActions.length,
        total: pendingActions.length + inProgressActions.length +
          completedActions.length + cancelledActions.length,
      },
      announcements: {
        activeCount: validAnnouncements.length,
        latest: validAnnouncements.slice(0, 5),
      },
      deadlines: {
        upcomingCount: futureDeadlines.length,
        next: futureDeadlines.slice(0, 5),
        overdueCount: overdue.length,
        overdue: overdue.slice(0, 5),
      },
    };
  },
});

export const listActiveAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx);
    const now = Date.now();
    const items = await ctx.db.query("announcements")
      .withIndex("by_active_created_at", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();

    return items
      .filter((item) => item.expiresAt === undefined || item.expiresAt > now)
      .slice(0, 50);
  },
});

export const listUpcomingDeadlines = query({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx);
    const now = Date.now();
    const items = await ctx.db.query("deadlines")
      .withIndex("by_status_due_at", (q) => q.eq("status", "upcoming"))
      .order("asc")
      .collect();

    return items.filter((item) => item.dueAt >= now).slice(0, 50);
  },
});
