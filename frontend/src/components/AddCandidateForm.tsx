import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddCandidateForm.css';

interface CandidateData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  educacion: string;
  experienciaLaboral: string;
}

const AddCandidateForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CandidateData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    educacion: '',
    experienciaLaboral: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExtensions = ['.pdf', '.docx'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setErrorMessage('Solo se permiten archivos PDF y DOCX');
        setSelectedFile(null);
        e.target.value = '';
        return;
      }
      
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('El archivo es demasiado grande. Máximo 5MB.');
        setSelectedFile(null);
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    const token = localStorage.getItem('token');
    
    try {
      const formDataToSend = new FormData();
      
      // Agregar datos del formulario
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      // Agregar archivo si existe
      if (selectedFile) {
        formDataToSend.append('archivo', selectedFile);
      }
      
      const response = await fetch('http://localhost:3010/candidates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      if (response.ok) {
        setSuccessMessage('¡Candidato añadido exitosamente!');
        setFormData({
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          direccion: '',
          educacion: '',
          experienciaLaboral: ''
        });
        setSelectedFile(null);
        // Limpiar el input de archivo
        const fileInput = document.getElementById('archivo') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Error al guardar el candidato.');
      }
    } catch (error) {
      setErrorMessage('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="form-page">
      <div className="form-container">
        <div className="form-header">
          <h1 className="form-title">Añadir Nuevo Candidato</h1>
          <p className="form-subtitle">Complete la información del candidato</p>
        </div>

        <form onSubmit={handleSubmit} className="candidate-form">
          {successMessage && <div className="form-success">{successMessage}</div>}
          {errorMessage && <div className="form-error">{errorMessage}</div>}

          <div className="form-section">
            <h2 className="section-title">Información Personal</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre" className="form-label">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="Ingrese el nombre"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="apellido" className="form-label">Apellido *</label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="Ingrese el apellido"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Correo Electrónico *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="ejemplo@correo.com"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefono" className="form-label">Teléfono *</label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="+34 123 456 789"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="direccion" className="form-label">Dirección *</label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                className="form-input"
                required
                placeholder="Calle, número, ciudad, código postal"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Información Profesional</h2>
            
            <div className="form-group">
              <label htmlFor="educacion" className="form-label">Educación *</label>
              <textarea
                id="educacion"
                name="educacion"
                value={formData.educacion}
                onChange={handleInputChange}
                className="form-textarea"
                required
                placeholder="Describa la formación académica del candidato..."
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="experienciaLaboral" className="form-label">Experiencia Laboral *</label>
              <textarea
                id="experienciaLaboral"
                name="experienciaLaboral"
                value={formData.experienciaLaboral}
                onChange={handleInputChange}
                className="form-textarea"
                required
                placeholder="Describa la experiencia laboral del candidato..."
                rows={6}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-section">
            <h2 className="section-title">Documento Adjunto</h2>
            
            <div className="form-group">
              <label htmlFor="archivo" className="form-label">CV o Documento (Opcional)</label>
              <input
                type="file"
                id="archivo"
                name="archivo"
                onChange={handleFileChange}
                className="form-file-input"
                accept=".pdf,.docx"
                disabled={loading}
              />
              <p className="file-info">
                Formatos permitidos: PDF, DOCX. Tamaño máximo: 5MB
              </p>
              {selectedFile && (
                <div className="file-selected">
                  <span className="file-name">📎 {selectedFile.name}</span>
                  <span className="file-size">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="btn btn-secondary" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Candidato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCandidateForm; 