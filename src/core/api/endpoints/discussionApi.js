import { baseApi } from "../baseApi";

export const discussionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDiscussions: builder.query({
      query: (params = {}) => ({
        url: "/discussions",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((post) => ({
                type: "Discussions",
                id: post._id,
              })),
              { type: "Discussions", id: "LIST" },
            ]
          : [{ type: "Discussions", id: "LIST" }],
    }),

    createDiscussion: builder.mutation({
      query: (body) => ({
        url: "/discussions",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Discussions", id: "LIST" }],
    }),

    createPoll: builder.mutation({
      query: (body) => ({
        url: "/discussions/polls",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Discussions", id: "LIST" }],
    }),

    shareDiscussionLink: builder.mutation({
      query: (body) => ({
        url: "/discussions/links",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Discussions", id: "LIST" }],
    }),

    addDiscussionComment: builder.mutation({
      query: ({ id, body }) => ({
        url: `/discussions/${id}/comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Discussions", id },
        { type: "Discussions", id: "LIST" },
      ],
    }),

    votePoll: builder.mutation({
      query: ({ id, optionId }) => ({
        url: `/discussions/${id}/vote`,
        method: "POST",
        body: { optionId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Discussions", id },
        { type: "Discussions", id: "LIST" },
      ],
    }),

    toggleDiscussionLike: builder.mutation({
      query: (id) => ({
        url: `/discussions/${id}/like`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Discussions", id },
        { type: "Discussions", id: "LIST" },
      ],
    }),

    recordDiscussionShare: builder.mutation({
      query: (id) => ({
        url: `/discussions/${id}/share`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Discussions", id },
        { type: "Discussions", id: "LIST" },
      ],
    }),

    pinDiscussion: builder.mutation({
      query: ({ id, isPinned }) => ({
        url: `/discussions/${id}/pin`,
        method: "PATCH",
        body: { isPinned },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Discussions", id },
        { type: "Discussions", id: "LIST" },
      ],
    }),

    deleteDiscussion: builder.mutation({
      query: (id) => ({
        url: `/discussions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Discussions", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDiscussionsQuery,
  useCreateDiscussionMutation,
  useCreatePollMutation,
  useShareDiscussionLinkMutation,
  useAddDiscussionCommentMutation,
  useVotePollMutation,
  useToggleDiscussionLikeMutation,
  useRecordDiscussionShareMutation,
  usePinDiscussionMutation,
  useDeleteDiscussionMutation,
} = discussionApi;
