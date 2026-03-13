import { api as index } from "..";

const api = index.injectEndpoints({
    endpoints: (build) => ({
        getVideos: build.query<
            VIDEO.GetVideoListResponse,
            VIDEO.GetVideoListRequest 
        >({
            query: (params) => ({
                url: `video`,
                method: "GET",
                params, 
            }),
            providesTags: ["video"],
        }),

        getVideosDetail: build.query<
            VIDEO.GetVideoDetailResponse, 
            VIDEO.GetVideoDetailRequest 
        >({
            query: (id) => ({
                url: `video/${id}`,
                method: "GET",
            }),
            providesTags: ["video"],
        }),

    }),
});

export const { useGetVideosQuery, useGetVideosDetailQuery } = api;
