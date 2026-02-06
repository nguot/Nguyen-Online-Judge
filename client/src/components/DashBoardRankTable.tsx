import { useMemo } from "react";
import type { DashboardItem } from "../services/dashboardApi";

type Props = {
    items: DashboardItem[];
    problemLabelMap: Map<string, string>;
};

export default function DashboardRankTable({ items,problemLabelMap }: Props) {
    const problemIds = useMemo(() => {
        const set = new Set<string>();
        items.forEach(u =>
            u.solvedProblems.forEach(p => set.add(p.problemId))
        );
        return Array.from(set);
    }, [items]);
    return (
        <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                    <tr style={{ background: "#f3f4f6" }}>
                        <Th>#</Th>
                        <Th>User</Th>

                        {problemIds.map((pid) => (
                            <Th key={pid}>
                                {problemLabelMap.get(pid) ?? pid}
                            </Th>
                        ))}


                        <Th>Solved</Th>
                        <Th>Penalty</Th>
                    </tr>
                </thead>

                <tbody>
                    {items.map(user => {
                        const solvedMap = new Map(
                            user.solvedProblems.map(p => [p.problemId, p])
                        );

                        const solvedCount = user.solvedProblems.filter(p => p.score > 0).length;

                        return (
                            <tr key={user.user_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                <Td bold>{user.rank}</Td>
                                <Td>{user.user_name}</Td>

                                {problemIds.map(pid => {
                                    const p = solvedMap.get(pid);

                                    if (!p) return <Td key={pid}>-</Td>;


                                    if (p.score > 0)
                                        return (
                                            <Td key={pid} style={{ color: "#15803d", fontWeight: 700 }}>
                                                {p.score}
                                            </Td>
                                        );

                                    return (
                                        <Td key={pid} style={{ color: "#b91c1c" }}>
                                            0
                                        </Td>
                                    );
                                })}

                                <Td>{solvedCount}</Td>
                                <Td>{user.penalty}</Td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function Th({ children }: { children: React.ReactNode }) {
    return (
        <th
            style={{
                padding: "10px 8px",
                textAlign: "left",
                borderBottom: "2px solid #d1d5db",
            }}
        >
            {children}
        </th>
    );
}

function Td({
    children,
    bold,
    style,
}: {
    children: React.ReactNode;
    bold?: boolean;
    style?: React.CSSProperties;
}) {
    return (
        <td
            style={{
                padding: "8px",
                fontWeight: bold ? 700 : 400,
                ...style,
            }}
        >
            {children}
        </td>
    );
}
