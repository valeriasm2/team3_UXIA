import ItemFormModal from "./ItemFormModal";

const EditItemModal = ({ item, onClose, onSuccess }) => {
  const token = sessionStorage.getItem("adminToken");

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

    const imatgesExistents = imatges.filter((img) => !(img instanceof File));
    const nuevasImatges = imatges.filter((img) => img instanceof File);

    // IDs de imágenes existentes a conservar (las no enviadas se eliminarán en el backend)
    imatgesExistents.forEach((img) => {
      if (img.id) formData.append("imatges_conservadas_ids", img.id);
    });

    // Nuevas imágenes
    nuevasImatges.forEach((img) => formData.append("imatges", img));

    // Imagen destacada: puede ser una existente (por id) o una nueva (por índice entre las nuevas)
    const featuredImg = imatges[imatgeDestacada];
    if (featuredImg) {
      if (!(featuredImg instanceof File) && featuredImg.id) {
        formData.append("imatge_destacada_id", featuredImg.id);
      } else if (featuredImg instanceof File) {
        const newIdx = nuevasImatges.indexOf(featuredImg);
        formData.append("imatge_destacada_idx", newIdx >= 0 ? newIdx : 0);
      }
    }

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

  const handleDelete = async () => {
    if (
      !window.confirm(
        "N'estàs segur que vols eliminar aquest ítem completament?",
      )
    )
      return;
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      if (!res.ok) throw new Error("Error en eliminar");
      onSuccess({ id: item.id, deleted: true }, false);
    } catch (err) {
      alert(err.message);
    }
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
        imatgeDestacada: highlightedIdx > -1 ? highlightedIdx : 0,
      }}
      onSubmit={handleSubmit}
      onClose={onClose}
      onDelete={handleDelete}
      submitLabel="Guardar canvis"
    />
  );
};

export default EditItemModal;
