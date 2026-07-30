import api from "./api";
export const createDispute=async(data)=>{var r=await api.post("/disputes",data);return r.data;};
export const getMyDisputes=async()=>{var r=await api.get("/disputes/my");return r.data;};
export const getDisputeById=async(id)=>{var r=await api.get("/disputes/"+id);return r.data;};
export const updateDispute=async(id,data)=>{var r=await api.put("/disputes/"+id,data);return r.data;};
export const deleteDispute=async(id)=>{var r=await api.delete("/disputes/"+id);return r.data;};
export const getAllDisputes=async(p={})=>{var r=await api.get("/admin/disputes",{params:p});return r.data;};
export const updateDisputeStatus=async(id,data)=>{var r=await api.patch("/admin/disputes/"+id+"/status",data);return r.data;};