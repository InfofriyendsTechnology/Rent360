import prisma from "./prisma";

export interface CollectionLimitStatus {
  allowed: boolean;
  maxItems: number;
  currentItems: number;
  planName: string;
  message?: string;
}

/**
 * Checks if a store can add more items based on their active subscription plan.
 * Returns max items, current count, and whether addition is permitted.
 */
export const checkStoreCollectionLimit = async (
  storeId: string
): Promise<CollectionLimitStatus> => {
  try {
    // 1. Get active store subscription with plan
    const activeSub = await prisma.storeSubscription.findFirst({
      where: {
        storeId,
        status: "ACTIVE",
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 2. Count current product items in store
    const currentItems = await prisma.productItem.count({
      where: { storeId },
    });

    // Default fallback limits if no specific limit parsed
    let maxItems = 100; // Default Starter Tier limit
    let planName = activeSub?.plan?.name || "STARTER";

    if (activeSub?.plan) {
      const plan = activeSub.plan;
      planName = plan.name;
      const upperName = plan.name.toUpperCase();

      if (upperName.includes("ENTERPRISE") || upperName.includes("PRO")) {
        maxItems = 10000; // Practically unlimited
      } else if (upperName.includes("GROWTH")) {
        maxItems = 500;
      } else if (upperName.includes("STARTER")) {
        maxItems = 100;
      }

      // Check features array for explicit limits like "Up to X Collection Items"
      if (Array.isArray(plan.features)) {
        for (const feat of plan.features) {
          if (typeof feat === "string") {
            const match = feat.match(/Up to (\d+) Collection Items/i);
            if (match && match[1]) {
              maxItems = parseInt(match[1], 10);
              break;
            } else if (feat.toLowerCase().includes("unlimited")) {
              maxItems = 999999;
              break;
            }
          }
        }
      }
    }

    const allowed = currentItems < maxItems;

    return {
      allowed,
      maxItems,
      currentItems,
      planName,
      message: allowed
        ? undefined
        : `Your ${planName} plan limit of ${maxItems} items has been reached (${currentItems} items currently). Please upgrade your subscription plan to add more items.`,
    };
  } catch (error) {
    console.error("Error checking store collection limit:", error);
    // Allow gracefully on query error so business operations don't halt
    return {
      allowed: true,
      maxItems: 500,
      currentItems: 0,
      planName: "ACTIVE",
    };
  }
};
