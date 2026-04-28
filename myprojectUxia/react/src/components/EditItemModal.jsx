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

    // Enviar IDs de imágenes existentes que se conservan (para eliminar las otras)
    imatgesExistents.forEach((img) => {
      if (img.id) {
        formData.append("imatges_conservadas_ids", img.id);
      }
    });

    // Si se agregan nuevas imágenes, enviar el índice de la destacada entre las nuevas
    if (nuevasImatges.length > 0) {
      formData.append("imatge_destacada_idx", imatgeDestacada || 0);
      nuevasImatges.forEach((img) => formData.append("imatges", img));
    } else if (imatgeDestacada !== undefined && imatges[imatgeDestacada]) {
      // Si no hay nuevas imágenes pero cambió la destacada, enviar la ID de la imagen
      if (imatges[imatgeDestacada].id) {
        formData.append("imatge_destacada_id", imatges[imatgeDestacada].id);
      } else {
        formData.append("imatge_destacada_idx", imatgeDestacada || 0);
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
