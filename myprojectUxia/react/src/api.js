import config from "./config";

/**
 * Servicio para centralizar todas las peticiones a la API.
 */
const apiService = {
    /**
     * Obtiene la lista de exposiciones.
     */
    async getExpos() {
        const res = await fetch(`${config.API_URL}api/expos`);
        if (!res.ok) throw new Error("Error fetching expos");
        return res.json();
    },

    /**
     * Obtiene los items de una exposición.
     */
    async getItems(expoId) {
        const res = await fetch(`${config.API_URL}api/items?expo_id=${expoId}`);
        if (!res.ok) throw new Error("Error fetching items");
        return res.json();
    },

    /**
     * Obtiene las imágenes de un item.
     */
    async getImatges(itemId) {
        const res = await fetch(`${config.API_URL}api/imatges?item_id=${itemId}`);
        if (!res.ok) throw new Error("Error fetching images");
        return res.json();
    },

    /**
     * Identifica un item mediante IA enviando una imagen.
     */
    async identifyItem(file) {
        const formData = new FormData();
        formData.append("imatge", file);

        const res = await fetch(`${config.API_URL}api/identify`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Error API (${res.status}): ${errorText.substring(0, 50)}`);
        }
        return res.json();
    }
};

export default apiService;
