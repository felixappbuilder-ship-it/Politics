import { query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthenticatedUser } from "../lib/auth";

export const listWards = query({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx);

    const [wards, centres] = await Promise.all([
      ctx.db.query("wards").withIndex("by_name").collect(),
      ctx.db.query("registrationCentres").collect(),
    ]);

    const centresByWard = new Map<string, typeof centres>();
    for (const centre of centres) {
      const key = String(centre.wardId);
      const existing = centresByWard.get(key) ?? [];
      existing.push(centre);
      centresByWard.set(key, existing);
    }

    const sortedWards = wards.sort((a, b) => a.name.localeCompare(b.name));

    return {
      summary: {
        wardCount: wards.length,
        registeredVoters: wards.reduce((sum, ward) => sum + ward.registeredVoters, 0),
        pollingStations: wards.reduce((sum, ward) => sum + ward.pollingStations, 0),
        registrationCentreCount: centres.length,
      },
      wards: sortedWards.map((ward) => {
        const wardCentres = centresByWard.get(String(ward._id)) ?? [];
        return {
          ...ward,
          registrationCentreCount: wardCentres.length,
          centreRegisteredVoters: wardCentres.reduce(
            (sum, centre) => sum + centre.registeredVoters,
            0,
          ),
          centrePollingStations: wardCentres.reduce(
            (sum, centre) => sum + centre.pollingStations,
            0,
          ),
        };
      }),
    };
  },
});

export const getWard = query({
  args: {
    wardId: v.id("wards"),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedUser(ctx);

    const ward = await ctx.db.get(args.wardId);
    if (!ward) {
      return null;
    }

    const centres = await ctx.db
      .query("registrationCentres")
      .withIndex("by_ward_id", (q) => q.eq("wardId", args.wardId))
      .collect();

    centres.sort((a, b) => a.name.localeCompare(b.name));

    return {
      ...ward,
      registrationCentreCount: centres.length,
      centreRegisteredVoters: centres.reduce(
        (sum, centre) => sum + centre.registeredVoters,
        0,
      ),
      centrePollingStations: centres.reduce(
        (sum, centre) => sum + centre.pollingStations,
        0,
      ),
      registrationCentres: centres,
    };
  },
});

export const getWardTotals = query({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx);

    const wards = await ctx.db.query("wards").collect();
    const centres = await ctx.db.query("registrationCentres").collect();

    return {
      wardCount: wards.length,
      registeredVoters: wards.reduce((sum, ward) => sum + ward.registeredVoters, 0),
      pollingStations: wards.reduce((sum, ward) => sum + ward.pollingStations, 0),
      registrationCentreCount: centres.length,
      registrationCentreRegisteredVoters: centres.reduce(
        (sum, centre) => sum + centre.registeredVoters,
        0,
      ),
      registrationCentrePollingStations: centres.reduce(
        (sum, centre) => sum + centre.pollingStations,
        0,
      ),
    };
  },
});
