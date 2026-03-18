import { useEffect, useState } from "react";
import { useStore } from "../../context/StoreContext";
import toast from "react-hot-toast";

export default function StoreProfile() {
  const { loading, fetchProfile, updateProfile, uploadImage } = useStore();
  const [form, setForm] = useState({
    business_name: "",
    description: "",
    logo_url: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const result = await fetchProfile();
      if (result.success && result.data) {
        setForm({
          business_name: result.data.business_name || "",
          description: result.data.description || "",
          logo_url: result.data.logo_url || "",
        });
      }
    };
    load();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadImage(file);
    setUploading(false);
    if (result.success) {
      setForm((prev) => ({ ...prev, logo_url: result.url }));
      toast.success("Logo subido exitosamente");
    } else {
      toast.error(result.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateProfile(form);
    if (result.success) {
      toast.success("Perfil de tienda actualizado");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Perfil de Tienda</h2>
      <p className="text-sm text-gray-500 mb-6">
        Esta información aparecerá junto a tus productos.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Negocio *
          </label>
          <input
            type="text"
            name="business_name"
            value={form.business_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
            placeholder="Ej: Dental Express Venezuela"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm resize-none"
            placeholder="Describe tu tienda y lo que ofreces..."
          />
        </div>

        {/* Logo: upload file OR paste URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo
          </label>

          {/* Preview */}
          {form.logo_url && (
            <div className="mb-3 flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden border bg-gray-100">
                <img
                  src={form.logo_url}
                  alt="Logo preview"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, logo_url: "" }))}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Quitar logo
              </button>
            </div>
          )}

          {/* Upload button */}
          <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary-400 hover:text-primary-600 transition cursor-pointer mr-2">
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
                Subiendo...
              </>
            ) : (
              <>📷 Subir imagen</>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <span className="text-xs text-gray-400">o pega una URL:</span>

          {/* URL input */}
          <input
            type="url"
            name="logo_url"
            value={form.logo_url}
            onChange={handleChange}
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
            placeholder="https://..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition disabled:opacity-50 text-sm"
        >
          {loading ? "Guardando..." : "Guardar Perfil"}
        </button>
      </form>
    </div>
  );
}
