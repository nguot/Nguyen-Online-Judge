import { Navigate, Route, Routes, useParams } from "react-router-dom";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProtectedRoutes from "./ProtectedRoutes";
import AdminRoutes from "./AdminRoutes";
import AdminPage from "../pages/AdminPage";

import AppLayout from "../components/AppLayout";

import ProblemListPage from "../pages/Sandbox/ProblemListPage";
import ProblemCreatePage from "../pages/Sandbox/ProblemCreatePage";
import ProblemDetailPage from "../pages/Sandbox/ProblemDetailPage";
import ProblemEditPage from "../pages/Sandbox/ProblemEditPage";
import SandboxProblemListPage from "../pages/Sandbox/SandboxProblemListPage";

// ✅ Contest pages
import ContestDraftListPage from "../pages/Sandbox/ContestDraftListPage";
import ContestDraftCreatePage from "../pages/Sandbox/ContestDraftCreatePage";
import ContestOfficialListPage from "../pages/Sandbox/ContestOfficialListPage";

// ✅ NEW: 2 separated detail pages
import DraftContestDetailPage from "../pages/Sandbox/DraftContestDetailPage";
import OfficialContestDetailPage from "../pages/Sandbox/OfficialContestDetailPage";

// ✅ Keep: ContestDetailPage becomes "wrapper/dispatcher" (auto detect & redirect)
import ContestDetailPage from "../pages/Sandbox/ContestDetailPage";

import ContestEditPage from "../pages/Sandbox/ContestEditPage";
import UserProfilePage from "../pages/UserProfilePage";

import GroupListPage from "../pages/GroupListPage";
import GroupDetailPage from "../pages/GroupDetailPage";
import ContestGroupDetailPage from "../pages/ContestGroupDetailPage";
import UsersListPage from "../pages/UsersListPage";

function RedirectSandboxProblem() {
  const { problemId } = useParams<{ problemId: string }>();
  return <Navigate to={problemId ? `/problems/${problemId}` : "/problems"} replace />;
}

function RedirectSandboxProblemEdit() {
  const { problemId } = useParams<{ problemId: string }>();
  return <Navigate to={problemId ? `/problems/${problemId}/edit` : "/problems"} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* public */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* protected */}
      <Route element={<ProtectedRoutes />}>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />

          {/* Codeforces-like */}
          <Route path="/problems" element={<ProblemListPage />} />
          <Route path="/problems/create" element={<ProblemCreatePage />} />
          <Route path="/problems/:problemId" element={<ProblemDetailPage />} />
          <Route path="/problems/:problemId/edit" element={<ProblemEditPage />} />

          {/* ✅ Contests */}
          <Route path="/contests/draft" element={<ContestDraftListPage />} />
          <Route path="/contests/draft/create" element={<ContestDraftCreatePage />} />
          <Route path="/contests/official" element={<ContestOfficialListPage />} />

          {/* ✅ NEW detail routes */}
          <Route path="/contests/draft/:contestId" element={<DraftContestDetailPage />} />
          <Route path="/contests/official/:contestId" element={<OfficialContestDetailPage />} />

          {/* {/* ✅ Backward-compat route:
              ContestDetailPage nên là wrapper: tự getContestDetail -> detect official -> Navigate sang 2 route trên */}
          <Route path="/contests/:contestId" element={<ContestDetailPage />} />

          {/* edit route giữ nguyên như cũ */}
          <Route path="/contests/:contestId/edit" element={<ContestEditPage />} />

          {/* ✅ sandbox */}
          <Route path="/sandbox" element={<SandboxProblemListPage />} />

          {/* backward-compat */}
          <Route path="/sandbox/problems" element={<Navigate to="/problems" replace />} />
          <Route path="/sandbox/problems/create" element={<Navigate to="/problems/create" replace />} />
          <Route path="/sandbox/problems/:problemId" element={<ProblemDetailPage />} />
          <Route path="/sandbox/problems/:problemId/edit" element={<ProblemEditPage />} />


          <Route path="/user/:username" element={<UserProfilePage />} />

          <Route path="/groups" element={<GroupListPage />} />
          <Route path="/groups/:groupId" element={<GroupDetailPage />} />
          {/* admin */}
          <Route element={<AdminRoutes />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="/groups/:groupId/contests/:contestId" element={<ContestGroupDetailPage />} />
          <Route path="/users" element={<UsersListPage />} />

        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
