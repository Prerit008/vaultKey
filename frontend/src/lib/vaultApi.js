import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export async function fetchVaultStatus() {
  const r = await axios.get(`${API}/vault/status`);
  return r.data;
}

export async function fetchVaultBlob() {
  const r = await axios.get(`${API}/vault`);
  return r.data;
}

export async function saveVaultBlob(blob) {
  const r = await axios.put(`${API}/vault`, blob);
  return r.data;
}

export async function destroyVault() {
  const r = await axios.delete(`${API}/vault`);
  return r.data;
}