import ItemFormModal from "./ItemFormModal";

const EditItemModal = ({ item, onClose, onSuccess }) => {
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
    etiquetesIds.forEach((id) => formData.append("etiquetes_ids", id));

    // Filtrar imágenes existentes y nuevas
    const imatgesExistents = imatges.filter((img) => !(img instanceof File));
    const nuevasImatges = imatges.filter((img) => img instanceof File);

    // Enviar IDs de imágenes existentes que se conservan como JSON string
    if (imatgesExistents.length > 0) {
      const ids = imatgesExistents.map((img) => img.id).filter(Boolean);
      formData.append("imatges_conservadas_ids", JSON.stringify(ids));
    }

    // Determinar la imagen destacada
    // Si hay nuevas imágenes, usar el índice entre las nuevas
    if (nuevasImatges.length > 0) {
      formData.append("imatge_destacada_idx", imatgeDestacada || 0);
      nuevasImatges.forEach((img) => formData.append("imatges", img));
    } else {
      // Si no hay nuevas imágenes, usar el ID de la imagen existente
      const imgDestacada = imatgesExistents[imatgeDestacada];
      if (imgDestacada && imgDestacada.id) {
        formData.append("imatge_destacada_id", imgDestacada.id);
      }
    }

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
    onSuccess(updated, nuevasImatges.length > 0);
    onClose(); // Cerrar modal después de guardar exitosamente
  };

  // Preparar valores iniciales con imágenes existentes
  const existingImages = (item.imatges || []).map((img) => ({
    ...img,
    preview: img.imatge,
  }));

  const highlightedIdx =
    item.imatges?.findIndex((img) => img.es_destacada) || 0;

  return (
    <ItemFormModal
      title="Editar Ítem"
      subtitle={item.nom}
      initialValues={{
        nom: item.nom,
        descripcio: item.descripcio,
        etiquetesIds: item.etiquetes?.map((e) => e.id) || [],
        imatges: existingImages,
        previews: existingImages.map((img) => img.preview),
        imatgeDestacada: highlightedIdx,
      }}
      onSubmit={handleSubmit}
      onClose={onClose}
      submitLabel="Guardar canvis"
    />
  );
};

export default EditItemModal;
