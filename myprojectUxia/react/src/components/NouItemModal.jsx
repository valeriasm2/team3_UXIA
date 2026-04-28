import ItemFormModal from "./ItemFormModal";

const NouItemModal = ({ expo, onClose, onSuccess }) => {
  const handleSubmit = async ({
    nom,
    descripcio,
    etiquetesIds,
    imatges,
    imatgeDestacada,
  }) => {
    const formData = new FormData();
    formData.append("nom", nom);
    formData.append("descripcio", descripcio);
    formData.append("expo_id", expo.id);
    formData.append("imatge_destacada_idx", imatgeDestacada || 0);
    etiquetesIds.forEach((id) => formData.append("etiquetes_ids", id));
    imatges.forEach((img) => formData.append("imatges", img));

    const token = localStorage.getItem("adminToken");
    const res = await fetch("/api/items", {
      method: "POST",
      headers: token ? { Authorization: `Token ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `Error ${res.status}`);
    }
    const item = await res.json();
    onSuccess(item, imatges.length > 0);
  };

  return (
    <ItemFormModal
      title="+ Nou Ítem"
      subtitle={`Expo: ${expo.nom}`}
      onSubmit={handleSubmit}
      onClose={onClose}
      submitLabel="Crear Ítem"
    />
  );
};

export default NouItemModal;
