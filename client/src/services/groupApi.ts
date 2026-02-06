// src/services/groupApi.ts
import { apiClient } from "./apiClient";
import type { PageRequestDto } from "../types/api";


export type GroupEntity = {
  groupId: string;
  groupName: string;
  description: string;
  avatar: string;
};

export type GroupMember = {
  userId: string;
  userName: string;
  role: string;
};

export type GroupDetail = GroupEntity & {
  members: GroupMember[];
};

export type InvitationEntity = {
  inviterId: string;
  groupId: string;
  groupName: string;
};

export type InviteActionStatus = "ACCEPTED" | "DECLINED";

export type InviteActionResult = {
  userId: string;
  inviterId: string;
  groupId: string;
  status: InviteActionStatus;
};

// post /create {groupName,description,avatar} => {groupId,groupName,description,avatar}
export function createGroup(input: Pick<GroupEntity, "groupName" | "description" | "avatar">) {
  return apiClient.post<GroupEntity>("/group/create", input);
}

// post /update {groupId,groupName,description,avatar} => {groupId,groupName,description,avatar}
export function updateGroup(input: GroupEntity) {
  return apiClient.post<GroupEntity>("/group/update", input);
}

// get /detail/{groupId} => {groupId,groupName,description,avatar,[{userId,userName,role}]}
export function getGroupDetail(groupId: string) {
  return apiClient.get<any>(`/group/detail/${groupId}`).then((raw) => {
    const { groupId, groupName, description, avatar, members, ...rest } = raw ?? {};
    const memberList: GroupMember[] =
      Array.isArray(members) ? members : Array.isArray(raw?.[0]) ? raw[0] : (raw?.users ?? []);
    return {
      groupId,
      groupName,
      description,
      avatar,
      members: memberList ?? [],
      ...rest,
    } as GroupDetail;
  });
}

// post /delete/{groupId} => {}
export function deleteGroup(groupId: string) {
  return apiClient.post<{}>(`/group/delete/${groupId}`);
}

// post /list PageRequest(prefix) => PageResult(groupId,groupName,description,avatar)
export function listGroups(req: PageRequestDto<{ prefix?: string }>) {
  return apiClient.postPage<GroupEntity, { prefix?: string }>("/group/list", req);
}

// post /invite {groupId,inviteeId} => {}
export function inviteToGroup(input: { groupId: string; inviteeId: string }) {
  return apiClient.post<{}>("/group/invite", input);
}

// post /invitation-list PageRequest(groupId,prefix) => PageResult(inviterId,groupId,groupName)
export function listInvitations(req: PageRequestDto<{ groupId?: string; prefix?: string }>) {
  return apiClient.postPage<InvitationEntity, { groupId?: string; prefix?: string }>(
    "/group/invitation-list",
    req
  );
}

// post /invite/action {inviterId,groupId,status (ACCEPTED or DECLINED)} => {userId,inviterId,groupId,status}
export function invitationAction(input: {
  inviterId: string;
  groupId: string;
  status: InviteActionStatus;
}) {
  return apiClient.post<InviteActionResult>("/group/invite/action", input);
}

// post /leave/{groupId} => {}
export function leaveGroup(groupId: string) {
  return apiClient.post<{}>(`/group/leave/${groupId}`);
}

// api/v1/contest/{contestId}/promote-to-group {groupId} => {1 string}
export function promoteContestToGroup(contestId: string, input: { groupId: string }) {
  return apiClient.post<string>(`/contest/${contestId}/promote-to-group`, input);
}
