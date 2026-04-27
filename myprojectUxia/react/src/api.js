import config from "./config";

const API_BASE_URL = config.API_URL;

export const identifyItem = async (file) => {
    const formData = new FormData();
    formData.append("imatge", file);

    const res = await fetch(`${API_BASE_URL}api/identify`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error API (${res.status}): ${errorText.substring(0, 50)}`);
    }
    return res.json();
};

export const getExpos = async () => {
    const res = await fetch(`${API_BASE_URL}api/expos`);
    if (!res.ok) throw new Error("Error carregant exposicions");
    return res.json();
};

export const getItems = async (expoId) => {
    const res = await fetch(`${API_BASE_URL}api/items?expo_id=${expoId}`);
    if (!res.ok) throw new Error("Error carregant ítems");
    return res.json();
};

export const getItemImages = async (itemId) => {
    const res = await fetch(`${API_BASE_URL}api/imatges?item_id=${itemId}`);
    if (!res.ok) throw new Error("Error carregant imatges");
    return res.json();
};