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
}