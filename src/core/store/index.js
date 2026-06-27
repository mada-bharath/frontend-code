import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../api/baseApi";

// 🔥 Dummy reducer (required)
const dummyReducer = (state = {}) => state;

export const store = configureStore({
  reducer: {
    dummy: dummyReducer,          // ✅ REQUIRED
    [baseApi.reducerPath]: baseApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});