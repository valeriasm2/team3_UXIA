import ItemFormModal from "./ItemFormModal";

const EditItemModal = ({ item, onClose, onSuccess }) => {
  const handleSubmit = async ({ nom, descripcio, etiquetesIds, imatges }) => {
    const formData = new FormData();
    formData.append("nom", nom);
    formData.append("descripcio", descripcio);
    etiquetesIds.forEach((id) => formData.append("etiquetes_ids", id));
    imatges.forEach((img) => formData.append("imatges", img));

    const token = localStorage.getItem("adminToken");
    const res = await fetch(`/api/items/${item.id}`, {
      method: "PUT",
      headers: token ? { Authorization: `Token ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `Error ${res.status}`);
    }
    const updated = await res.json();
    onSuccess(updated, imatges.length > 0);
  };

  return (
    <ItemFormModal
      title="Editar Ítem"
      subtitle={item.nom}
      initialValues={{
        nom: item.nom,
        descripcio: item.descripcio,
        etiquetesIds: item.etiquetes?.map((e) => e.id) || [],
      }}
      onSubmit={handleSubmit}
      onClose={onClose}
      submitLabel="Guardar canvis"
    />
  );
};

export default EditItemModal;
