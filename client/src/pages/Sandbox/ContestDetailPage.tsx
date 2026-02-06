import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import type { ContestDetail } from "../../types/contest";
import { getContestDetail } from "../../services/contestApi";

function detectIsOfficial(contest?: ContestDetail | null): boolean {
  return (contest?.contestType ?? "DRAFT") === "OFFICIAL";
}


export default function ContestDetailPage() {
  const { contestId } = useParams<{ contestId: string }>();
  const idNum = Number(contestId);

  const [loading, setLoading] = useState(true);
  const [isOfficial, setIsOfficial] = useState<boolean | null>(null);

  useEffect(() => {
    if (!Number.isFinite(idNum)) return;

    (async () => {
      setLoading(true);
      try {
        const res = await getContestDetail(idNum);
        setIsOfficial(detectIsOfficial(res));
      } catch {
        setIsOfficial(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [idNum]);

  if (!Number.isFinite(idNum)) return <div className="cf-page">Invalid contestId</div>;
  if (loading) return <div className="cf-page">Loading...</div>;
  if (isOfficial == null) return <div className="cf-page">Not found</div>;

  return (
    <Navigate
      to={isOfficial ? `/contests/official/${idNum}` : `/contests/draft/${idNum}`}
      replace
    />
  );
}
