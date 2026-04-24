import { useState, useEffect } from "react";
import apiService from "./api";

/**
 * Hook para manejar toda la lógica de datos de la App.
 * Extrae el estado y las funciones de carga de App.jsx para que sea más ligero.
 */
export const useAppData = () => {
    const [data, setData] = useState({ expos: [], expoActual: null, items: [], indexItem: 0 });
    const [modal, setModal] = useState({ item: null, images: [] });

    // FETCH EXPOSICIONS
    useEffect(() => {
        apiService.getExpos()
            .then((expos) => setData(prev => ({ ...prev, expos })))
            .catch((err) => console.error("Error expos:", err));
    }, []);

    // FETCH ITEMS QUAN CANVIA L'EXPO
    useEffect(() => {
        if (data.expoActual) {
            apiService.getItems(data.expoActual.id)
                .then((items) => setData(prev => ({ ...prev, items, indexItem: 0 })))
                .catch((err) => console.error("Error items:", err));
        }
    }, [data.expoActual]);

    const verDetalleItem = async (item) => {
        setModal(prev => ({ ...prev, item }));
        try {
            const images = await apiService.getImatges(item.id);
            setModal(prev => ({ ...prev, images }));
        } catch (err) {
            console.error("Error imatges:", err);
        }
    };

    const actions = {
        setExpoActual: (expo) => setData(prev => ({ ...prev, expoActual: expo })),
        setIndexItem: (idx) => setData(prev => ({ ...prev, indexItem: idx })),
        closeModal: () => setModal(prev => ({ ...prev, item: null })),
        verDetalleItem
    };

    return { data, modal, actions };
};
