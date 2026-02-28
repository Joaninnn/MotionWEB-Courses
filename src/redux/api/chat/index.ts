// src/redux/api/chat/index.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import {
  Group,
  GroupDetail,
  MessagesResponse,
  ChatItem,
  CreateGroupRequest,
} from './types';

const chatBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_CHAT_API,
  prepareHeaders: (headers) => {
    const token = Cookies.get('access_token');
    
    console.log("🔍 [CHAT_API] Access token:", token ? 'exists' : 'missing');
    console.log("🔍 [CHAT_API] Token length:", token?.length || 0);
    console.log("🔍 [CHAT_API] Token preview:", token?.substring(0, 20) + '...');
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      console.log("🔍 [CHAT_API] Authorization header set");
    }
    return headers;
  },
});

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: chatBaseQuery,
  tagTypes: ['Group', 'Message', 'Chat'],
  endpoints: (builder) => ({
    // Groups
    getMyGroups: builder.query<Group[], void>({
      query: () => '/groups',
      providesTags: ['Group'],
    }),
    
    getGroupDetail: builder.query<Group, number>({
      query: (groupId) => `/groups/${groupId}`,
      providesTags: ['Group'],
    }),
    
    getGroupDetailFull: builder.query<GroupDetail, number>({
      query: (groupId) => `/groups/${groupId}/detail`,
      providesTags: ['Group', 'Message'],
    }),
    
    createGroup: builder.mutation<Group, CreateGroupRequest>({
      query: (data) => ({
        url: '/groups',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Group'],
    }),
    
    addGroupMembers: builder.mutation<string, { groupId: number; userIds: number[] }>({
      query: ({ groupId, userIds }) => ({
        url: `/groups/${groupId}/members`,
        method: 'POST',
        body: { user_ids: userIds },
      }),
      invalidatesTags: ['Group'],
    }),
    
    removeGroupMember: builder.mutation<string, { groupId: number; userId: number }>({
      query: ({ groupId, userId }) => ({
        url: `/groups/${groupId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Group'],
    }),
    
    // Messages
    getMessages: builder.query<MessagesResponse, { groupId: number; limit?: number; beforeId?: number }>({
      query: ({ groupId, limit = 50, beforeId }) => ({
        url: `/groups/${groupId}/messages`,
        params: { limit, before_id: beforeId },
      }),
      providesTags: ['Message'],
    }),
    
    sendMessage: builder.mutation<string, { groupId: number; text?: string; file?: File }>({
      query: ({ groupId, text, file }) => {
        const formData = new FormData();
        
        if (text) {
          formData.append('text', text);
        }
        
        if (file) {
          formData.append('file', file);
        }
        
        return {
          url: `/groups/${groupId}/messages`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Message'],
    }),
    
    editMessage: builder.mutation<string, { messageId: number; text: string }>({
      query: ({ messageId, text }) => ({
        url: `/messages/${messageId}`,
        method: 'PATCH',
        body: { text },
      }),
      invalidatesTags: ['Message'],
    }),
    
    deleteMessage: builder.mutation<string, number>({
      query: (messageId) => ({
        url: `/messages/${messageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Message'],
    }),
    
    // Chats
    getMyChats: builder.query<ChatItem[], void>({
      query: () => '/chats/my',
      providesTags: ['Chat'],
    }),
    
    markAsRead: builder.mutation<string, { groupId: number; messageId: number }>({
      query: ({ groupId, messageId }) => ({
        url: `/chats/${groupId}/read`,
        method: 'POST',
        params: { message_id: messageId },
      }),
      invalidatesTags: ['Chat'],
    }),
    
    // Dialogs
    getOrCreateDialog: builder.mutation<string, number>({
      query: (otherUserId) => ({
        url: `/dialogs/${otherUserId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Chat', 'Group'],
    }),
    
    // Test endpoint
    testMe: builder.query<string, void>({
      query: () => '/test/me',
    }),
  }),
});

export const {
  useGetMyGroupsQuery,
  useGetGroupDetailQuery,
  useGetGroupDetailFullQuery,
  useCreateGroupMutation,
  useAddGroupMembersMutation,
  useRemoveGroupMemberMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useEditMessageMutation,
  useDeleteMessageMutation,
  useGetMyChatsQuery,
  useMarkAsReadMutation,
  useGetOrCreateDialogMutation,
  useTestMeQuery,
} = chatApi;
