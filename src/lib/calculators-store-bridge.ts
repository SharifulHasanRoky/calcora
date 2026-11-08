/**
 * Bridge: re-exports calculator metadata + the global store from one module,
 * so components can import everything from a single path.
 */
export {
  CALCULATORS, CALC_BY_ID, CATEGORY_META, POPULAR_IDS, searchCalculators,
  type CalcCategory, type CalcMeta,
} from "@/lib/calculators";
export { useCalc, type HistoryEntry } from "@/lib/store";
