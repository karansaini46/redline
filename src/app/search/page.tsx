import { ClauseSearch } from "@/components/ClauseSearch";

export default function SearchPage() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-2xl font-bold text-center mb-8">
        Search Contract Clauses
      </h1>
      <ClauseSearch />
    </div>
  );
}
