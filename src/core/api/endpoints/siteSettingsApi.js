import { baseApi } from "../baseApi";

export const siteSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSiteSettings: builder.query({
      query: () => "/site-settings",
      providesTags: ["SiteSettings"],
    }),

    getPolicy: builder.query({
      query: (type) => `/site-settings/policies/${type}`,
      providesTags: ["SiteSettings"],
    }),

    getAdminSiteSettings: builder.query({
      query: () => "/admin/site-settings",
      providesTags: ["SiteSettings"],
    }),

    updateAdminSiteSettings: builder.mutation({
      query: (body) => ({
        url: "/admin/site-settings",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["SiteSettings"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSiteSettingsQuery,
  useGetPolicyQuery,
  useGetAdminSiteSettingsQuery,
  useUpdateAdminSiteSettingsMutation,
} = siteSettingsApi;
