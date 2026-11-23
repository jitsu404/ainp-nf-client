import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export const DEFAULT_CROPPING_SYSTEMS = [
  { id: "650000000000000000000001", code: "CS-RW", name: "Rice – Wheat" },
  { id: "650000000000000000000002", code: "CS-MW", name: "Maize – Wheat" },
  { id: "650000000000000000000003", code: "CS-CW", name: "Cotton – Wheat" },
  { id: "650000000000000000000004", code: "CS-SW", name: "Soybean – Wheat" },
  { id: "650000000000000000000005", code: "CS-RM", name: "Rice – Mustard" },
  { id: "650000000000000000000006", code: "CS-MM", name: "Maize – Mustard" },
  { id: "650000000000000000000007", code: "CS-RP", name: "Rice – Potato" },
  {
    id: "650000000000000000000008",
    code: "CS-PG",
    name: "Pigeonpea – Green Gram",
  },
];

export function useCroppingSystems() {
  const query = useQuery({
    queryKey: ["cropping-systems"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/cropping-systems");
        return Array.isArray(res.data) && res.data.length
          ? res.data
          : DEFAULT_CROPPING_SYSTEMS;
      } catch {
        return DEFAULT_CROPPING_SYSTEMS;
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  const list = query.data || DEFAULT_CROPPING_SYSTEMS;
  const nameOf = (idOrCode) => {
    if (!idOrCode) return "";
    const item = list.find(
      (c) => c.id === idOrCode || c._id === idOrCode || c.code === idOrCode,
    );
    return item?.name || "";
  };

  return {
    ...query,
    systems: list,
    options: list.map((c) => [c.id || c._id, `${c.name} (${c.code})`]),
    nameOf,
  };
}
