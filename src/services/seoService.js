import api from "../api/axios.js";

export const getSEOPlans = async () => {
  const response = await api.get("/seo/plans");
  return response.data;
};

export const createSEOPlan = async (data) => {
  const response = await api.post("/seo/plans", data);
  return response.data;
};

export const updateSEOPlan = async (id, data) => {
  const response = await api.put(`/seo/plans/${id}`, data);
  return response.data;
};

export const toggleSEOPlan = async (id) => {
  const response = await api.patch(`/seo/plans/${id}/toggle`);
  return response.data;
};

export const getAllSEO = async (params = {}) => {
  const response = await api.get("/seo", {
    params,
  });

  return response.data;
};

export const getSEOById = async (id) => {
  const response = await api.get(`/seo/${id}`);
  return response.data;
};

export const getClientSEO = async (clientId) => {
  const response = await api.get(`/seo/client/${clientId}`);
  return response.data;
};

export const assignSEO = async (data) => {
  const response = await api.post("/seo/assign", data);
  return response.data;
};

export const addMonthlyTracking = async (id, data) => {
  const response = await api.post(`/seo/${id}/monthly`, data);
  return response.data;
};

export const updateMonthlyTracking = async (
  id,
  trackingId,
  data
) => {
  const response = await api.put(
    `/seo/${id}/monthly/${trackingId}`,
    data
  );

  return response.data;
};

export const deleteMonthlyTracking = async (
  id,
  trackingId
) => {
  const response = await api.delete(
    `/seo/${id}/monthly/${trackingId}`
  );

  return response.data;
};

export const updateSEOStatus = async (id, status) => {
  const response = await api.patch(
    `/seo/${id}/status`,
    { status }
  );

  return response.data;
};

export const addDailyTracking = async (
  id,
  data
) => {
  const response = await api.post(
    `/seo/${id}/daily`,
    data
  );

  return response.data;
};


export const getDailyTracking = async (
  id
) => {
  const response = await api.get(
    `/seo/${id}/daily`
  );

  return response.data;
};


export const updateDailyTracking = async (
  id,
  trackingId,
  data
) => {
  const response = await api.put(
    `/seo/${id}/daily/${trackingId}`,
    data
  );

  return response.data;
};


export const deleteDailyTracking = async (
  id,
  trackingId
) => {
  const response = await api.delete(
    `/seo/${id}/daily/${trackingId}`
  );

  return response.data;
};

export const deleteSEO = async (id) => {
  const response = await api.delete(`/seo/${id}`);
  return response.data;
};